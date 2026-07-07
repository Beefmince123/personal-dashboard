import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get("template_id");

  if (!templateId) {
    return NextResponse.json({ error: "template_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("template_exercises")
    .select("*")
    .eq("template_id", templateId)
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    template_id,
    exercise_name,
    sets,
    reps,
    weight_kg,
    is_bodyweight,
    is_timed,
    duration_seconds,
    rest_seconds,
    section,
    include_in_quick,
    order_index,
  } = body;

  if (!template_id || !exercise_name) {
    return NextResponse.json(
      { error: "template_id and exercise_name are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("template_exercises")
    .insert({
      template_id,
      exercise_name,
      sets: sets ?? null,
      reps: reps ?? null,
      weight_kg: weight_kg ?? null,
      is_bodyweight: is_bodyweight ?? false,
      is_timed: is_timed ?? false,
      duration_seconds: duration_seconds ?? null,
      rest_seconds: rest_seconds ?? null,
      section: section ?? null,
      include_in_quick: include_in_quick ?? true,
      order_index: order_index ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const {
    id,
    exercise_name,
    sets,
    reps,
    weight_kg,
    is_bodyweight,
    is_timed,
    duration_seconds,
    rest_seconds,
    section,
    include_in_quick,
    order_index,
  } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (exercise_name !== undefined) updates.exercise_name = exercise_name;
  if (sets !== undefined) updates.sets = sets;
  if (reps !== undefined) updates.reps = reps;
  if (weight_kg !== undefined) updates.weight_kg = weight_kg;
  if (is_bodyweight !== undefined) updates.is_bodyweight = is_bodyweight;
  if (is_timed !== undefined) updates.is_timed = is_timed;
  if (duration_seconds !== undefined) updates.duration_seconds = duration_seconds;
  if (rest_seconds !== undefined) updates.rest_seconds = rest_seconds;
  if (section !== undefined) updates.section = section;
  if (include_in_quick !== undefined) updates.include_in_quick = include_in_quick;
  if (order_index !== undefined) updates.order_index = order_index;

  const { data, error } = await supabase
    .from("template_exercises")
    .update(updates)
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

  const { error } = await supabase.from("template_exercises").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
