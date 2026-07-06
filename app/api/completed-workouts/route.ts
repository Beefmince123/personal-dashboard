import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isoDaysAgo, todayISO } from "@/lib/date";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  let query = supabase
    .from("completed_workouts")
    .select("*, template:workout_templates(*), exercises:completed_exercises(*)")
    .order("date", { ascending: false });

  if (date) {
    query = query.eq("date", date);
  } else {
    const from = searchParams.get("from") ?? isoDaysAgo(29);
    const to = searchParams.get("to") ?? todayISO();
    query = query.gte("date", from).lte("date", to);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// Body: { template_id, date, duration_minutes?, notes?, exercises? }.
// Called both to start a session (no duration/exercises yet, filled in later
// via PUT/completed-exercises) and to log a one-shot session (e.g. Muay Thai).
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { template_id, date = todayISO(), duration_minutes, notes, exercises } = body;

  const { data: workout, error } = await supabase
    .from("completed_workouts")
    .insert({
      template_id: template_id ?? null,
      date,
      duration_minutes: duration_minutes ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(exercises) && exercises.length > 0) {
    const rows = exercises.map((ex) => ({
      completed_workout_id: workout.id,
      exercise_name: ex.exercise_name,
      sets_completed: ex.sets_completed ?? null,
      reps_completed: ex.reps_completed ?? null,
      weight_used_kg: ex.weight_used_kg ?? null,
      duration_seconds: ex.duration_seconds ?? null,
      rest_seconds: ex.rest_seconds ?? null,
      notes: ex.notes ?? null,
    }));
    const { error: exError } = await supabase.from("completed_exercises").insert(rows);
    if (exError) {
      return NextResponse.json({ error: exError.message }, { status: 500 });
    }
  }

  const { data: full } = await supabase
    .from("completed_workouts")
    .select("*, template:workout_templates(*), exercises:completed_exercises(*)")
    .eq("id", workout.id)
    .single();

  return NextResponse.json({ data: full }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, duration_minutes, notes } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (duration_minutes !== undefined) updates.duration_minutes = duration_minutes;
  if (notes !== undefined) updates.notes = notes;

  const { data, error } = await supabase
    .from("completed_workouts")
    .update(updates)
    .eq("id", id)
    .select("*, template:workout_templates(*), exercises:completed_exercises(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// completed_exercises has an on-delete-cascade FK to completed_workouts, so
// deleting the workout row also removes its logged exercises.
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("completed_workouts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
