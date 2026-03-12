import { NextResponse } from "next/server";
import { IS_DEV_MODE } from "@/lib/dev";

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET() {
  // Dev mode: return mock feed data
  if (IS_DEV_MODE || IS_DEMO) {
    const { devSubmissions } = await import("@/app/api/submissions/route");

    const mockFeed = devSubmissions.map((sub) => ({
      id: `sub-${sub.id}`,
      display_name: "Dev User",
      wallet_address: "0xd3v0000000000000000000000000000000000001",
      kg_total: sub.kg_total,
      submission_type: sub.submission_type,
      created_at: sub.created_at,
      type: "burned" as const,
    }));

    return NextResponse.json({ feed: mockFeed });
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const supabase = createAdminClient();

    // Query activity_feed joined with users
    const { data: activities, error } = await supabase
      .from("activity_feed")
      .select("id, user_id, type, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!activities || activities.length === 0) {
      return NextResponse.json({ feed: [] });
    }

    // Get unique user IDs
    const userIds = [...new Set(activities.map((a) => a.user_id).filter(Boolean))];

    const { data: users } = await supabase
      .from("users")
      .select("id, display_name, wallet_address")
      .in("id", userIds);

    const userMap = new Map(
      (users || []).map((u) => [u.id, u]),
    );

    // Map activity types to feed format
    const feed = activities.map((activity) => {
      const user = userMap.get(activity.user_id);
      const payload = (activity.payload || {}) as Record<string, unknown>;

      let type: "burned" | "joined" = "joined";
      let kg_total: number | null = null;
      let submission_type: string | null = null;

      if (activity.type === "fat_burned") {
        type = "burned";
        kg_total = (payload.kg_total as number) ?? null;
        submission_type = (payload.submission_type as string) ?? null;
      } else if (activity.type === "weight_logged") {
        type = "burned";
        kg_total = (payload.delta_kg as number) ?? null;
        submission_type = "weight_logged";
      } else if (activity.type === "profile_saved") {
        type = "joined";
      }

      return {
        id: activity.id,
        display_name: user?.display_name ?? null,
        wallet_address: user?.wallet_address ?? "",
        kg_total,
        submission_type,
        created_at: activity.created_at,
        type,
      };
    });

    return NextResponse.json({ feed });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
