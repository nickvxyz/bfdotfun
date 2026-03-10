import { NextResponse } from "next/server";

import { IS_DEV_MODE } from "@/lib/dev";

export async function GET() {
  if (IS_DEV_MODE) {
    const { devBurnUnits } = await import("@/app/api/weight-entries/route");
    const { devSubmissions } = await import("@/app/api/submissions/route");

    const submittedKg = devBurnUnits
      .filter((u) => u.status !== "unsubmitted")
      .reduce((sum, u) => sum + u.kg_amount, 0);

    const retroKg = devSubmissions
      .filter((s) => s.submission_type === "retrospective")
      .reduce((sum, s) => sum + Number(s.kg_total), 0);

    return NextResponse.json({
      total_kg: submittedKg + retroKg,
      total_submissions: devSubmissions.length,
    });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("global_counter")
    .select("total_kg, total_submissions")
    .single();

  if (error) {
    return NextResponse.json({ total_kg: 0, total_submissions: 0 });
  }

  return NextResponse.json(data);
}
