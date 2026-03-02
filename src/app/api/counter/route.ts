import { NextResponse } from "next/server";

const IS_DEV = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "your-anon-key-here" ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET() {
  if (IS_DEV) {
    return NextResponse.json({ total_kg: 1247.3, total_submissions: 342 });
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("global_counter")
    .select("total_kg, total_submissions")
    .single();

  if (error) {
    return NextResponse.json({ total_kg: 0, total_submissions: 0 });
  }

  return NextResponse.json(data);
}
