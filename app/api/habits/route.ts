import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { computeStreak, todayISO } from "@/lib/date";
import type { HabitWithStatus } from "@/lib/types";

export async function GET() {
  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!habits || habits.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("habit_id, date")
    .in(
      "habit_id",
      habits.map((h) => h.id)
    )
    .eq("completed", true);

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 });
  }

  const today = todayISO();
  const logsByHabit = new Map<string, string[]>();
  for (const log of logs ?? []) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log.date);
    logsByHabit.set(log.habit_id, list);
  }

  const data: HabitWithStatus[] = habits.map((habit) => {
    const dates = logsByHabit.get(habit.id) ?? [];
    return {
      ...habit,
      completed_today: dates.includes(today),
      streak: computeStreak(dates, today),
    };
  });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data, error } = await supabase.from("habits").insert({ name }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name } = body;

  if (!id || !name) {
    return NextResponse.json({ error: "id and name are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("habits")
    .update({ name })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("habits").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
