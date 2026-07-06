import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const workoutId = searchParams.get("workout_id");

  if (!workoutId) {
    return NextResponse.json({ error: "workout_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("completed_exercises")
    .select("*")
    .eq("completed_workout_id", workoutId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    completed_workout_id,
    exercise_name,
    sets_completed,
    reps_completed,
    weight_used_kg,
    duration_seconds,
    rest_seconds,
    notes,
  } = body;

  if (!completed_workout_id || !exercise_name) {
    return NextResponse.json(
      { error: "completed_workout_id and exercise_name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("completed_exercises")
    .insert({
      completed_workout_id,
      exercise_name,
      sets_completed: sets_completed ?? null,
      reps_completed: reps_completed ?? null,
      weight_used_kg: weight_used_kg ?? null,
      duration_seconds: duration_seconds ?? null,
      rest_seconds: rest_seconds ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
