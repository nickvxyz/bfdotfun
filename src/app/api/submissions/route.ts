import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { IS_DEV_MODE } from "@/lib/dev";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// In-memory store for dev mode — starts empty, persists within server session
export const devSubmissions: Array<{
  id: string;
  submitter_id: string;
  kg_total: number;
  usdc_amount: number;
  tx_hash: string;
  submission_type: string;
  group_id: string | null;
  created_at: string;
}> = [];

export async function GET() {
  if (IS_DEV_MODE) {
    return NextResponse.json({ submissions: devSubmissions });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("submitter_id", session.userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ submissions: data });
}

export async function POST(request: NextRequest) {
  if (IS_DEV_MODE) {
    const body = await request.json();
    const submission = {
      id: `s-${Date.now()}`,
      submitter_id: "dev-user-001",
      kg_total: body.kg_total,
      usdc_amount: body.kg_total * (body.submission_type === "retrospective" ? 0.5 : 1.0),
      tx_hash: body.tx_hash || `0xdev${Date.now()}`,
      submission_type: body.submission_type,
      group_id: null,
      created_at: new Date().toISOString(),
    };
    devSubmissions.push(submission);

    // Mark burn units as submitted if individual submission
    if (body.submission_type === "individual" && body.burn_unit_ids?.length) {
      const { devBurnUnits } = await import("@/app/api/weight-entries/route");
      for (const unit of devBurnUnits) {
        if (body.burn_unit_ids.includes(unit.id)) {
          unit.status = "submitted_individual";
        }
      }
    }

    return NextResponse.json({
      submission,
      has_used_retrospective: body.submission_type === "retrospective",
    });
  }

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tx_hash, kg_total, submission_type, burn_unit_ids } = await request.json();

  if (!tx_hash || !kg_total || !submission_type) {
    return NextResponse.json(
      { error: "Missing tx_hash, kg_total, or submission_type" },
      { status: 400 },
    );
  }

  if (!["individual", "retrospective"].includes(submission_type)) {
    return NextResponse.json({ error: "Invalid submission_type" }, { status: 400 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  // Block individual submissions for team members
  if (submission_type === "individual") {
    const { data: submitter } = await supabase
      .from("users")
      .select("group_id")
      .eq("id", session.userId)
      .maybeSingle();

    if (submitter?.group_id) {
      return NextResponse.json(
        { error: "Team members cannot submit individually. Your burns are submitted through your team." },
        { status: 403 },
      );
    }
  }

  // Idempotent: check for existing submission with same tx_hash
  const { data: existing } = await supabase
    .from("submissions")
    .select("*")
    .eq("tx_hash", tx_hash)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ submission: existing });
  }

  // Verify transaction on-chain (skipped in demo mode)
  if (!IS_DEMO) {
    try {
      const { baseClient } = await import("@/lib/viem");
      const { BURNFAT_TREASURY_ABI } = await import("@/lib/contracts/BurnFatTreasury");

      const receipt = await baseClient.getTransactionReceipt({
        hash: tx_hash as `0x${string}`,
      });

      if (receipt.status !== "success") {
        return NextResponse.json({ error: "Transaction failed on-chain" }, { status: 400 });
      }

      // Parse BurnSubmitted event from logs
      const { parseEventLogs } = await import("viem");
      const burnEvents = parseEventLogs({
        abi: BURNFAT_TREASURY_ABI,
        eventName: "BurnSubmitted",
        logs: receipt.logs,
      });

      if (burnEvents.length === 0) {
        return NextResponse.json({ error: "No BurnSubmitted event found" }, { status: 400 });
      }

      const event = burnEvents[0];
      const onChainKg = Number(event.args.kgAmount);
      const onChainUsdc = Number(event.args.usdcAmount);

      if (onChainKg !== kg_total) {
        return NextResponse.json(
          { error: `On-chain kg (${onChainKg}) doesn't match submitted kg (${kg_total})` },
          { status: 400 },
        );
      }

      // Calculate expected USDC amount (6 decimals)
      const pricePerKg = submission_type === "retrospective" ? 500_000 : 1_000_000;
      const expectedUsdc = kg_total * pricePerKg;

      if (onChainUsdc !== expectedUsdc) {
        return NextResponse.json(
          { error: "USDC amount mismatch" },
          { status: 400 },
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Verification failed";
      return NextResponse.json({ error: `TX verification failed: ${message}` }, { status: 400 });
    }
  }

  // Insert submission (trigger auto-increments global_counter)
  const usdcAmount = kg_total * (submission_type === "retrospective" ? 0.5 : 1.0);

  const { data: submission, error: insertError } = await supabase
    .from("submissions")
    .insert({
      submitter_id: session.userId,
      kg_total,
      usdc_amount: usdcAmount,
      tx_hash,
      submission_type,
    })
    .select()
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      // Duplicate tx_hash — race condition, fetch existing
      const { data: dup } = await supabase
        .from("submissions")
        .select("*")
        .eq("tx_hash", tx_hash)
        .maybeSingle();
      if (!dup) return NextResponse.json({ error: "Submission not found" }, { status: 500 });
      return NextResponse.json({ submission: dup });
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // If individual submission, update burn_unit statuses
  if (submission_type === "individual" && burn_unit_ids?.length) {
    await supabase
      .from("burn_units")
      .update({ status: "submitted_individual", submission_id: submission.id })
      .in("id", burn_unit_ids)
      .eq("user_id", session.userId);
  }

  // If retrospective, mark user as having used it
  if (submission_type === "retrospective") {
    await supabase
      .from("users")
      .update({ has_used_retrospective: true })
      .eq("id", session.userId);
  }

  // Activity feed — best-effort
  try {
    await supabase.from("activity_feed").insert({
      user_id: session.userId,
      type: "fat_burned",
      payload: { kg_total, submission_type },
    });
  } catch { /* non-blocking */ }

  // Record referral reward — best-effort
  try {
    const { data: referral } = await supabase
      .from("referrals")
      .select("referrer_id")
      .eq("referee_id", session.userId)
      .maybeSingle();

    if (referral?.referrer_id) {
      await supabase.from("referral_rewards").insert({
        referrer_id: referral.referrer_id,
        reward_usdc: Math.floor((usdcAmount * 1_000_000) / 3) / 1_000_000,
        status: "paid",
        submission_id: submission.id,
      });
    }
  } catch { /* non-blocking */ }

  return NextResponse.json({ submission });
}
