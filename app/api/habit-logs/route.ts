import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/date";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayISO();

  const { data, error } = await supabase.from("habit_logs").select("*").eq("date", date);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// Toggles completion for a habit on a given date: creates the log if it doesn't
// exist, removes it if it does (so "completed" == "a log row exists").
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { habit_id, date = todayISO() } = body;

  if (!habit_id) {
    return NextResponse.json({ error: "habit_id is required" }, { status: 400 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("habit_logs")
    .select("id")
    .eq("habit_id", habit_id)
    .eq("date", date)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (existing) {
    const { error } = await supabase.from("habit_logs").delete().eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ data: { habit_id, date, completed: false } });
  }

  const { error } = await supabase
    .from("habit_logs")
    .insert({ habit_id, date, completed: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { habit_id, date, completed: true } }, { status: 201 });
}
