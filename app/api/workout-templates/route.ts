import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { TemplateExercise, WorkoutTemplateWithExercises } from "@/lib/types";

function sortExercises(template: WorkoutTemplateWithExercises) {
  return {
    ...template,
    exercises: [...template.exercises].sort(
      (a: TemplateExercise, b: TemplateExercise) => a.order_index - b.order_index
    ),
  };
}

export async function GET() {
  const { data, error } = await supabase
    .from("workout_templates")
    .select("*, exercises:template_exercises(*)")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []).map(sortExercises) });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, description, exercises } = body;

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const { data: template, error } = await supabase
    .from("workout_templates")
    .insert({ name, description: description ?? null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(exercises) && exercises.length > 0) {
    const rows = exercises.map((ex, index: number) => ({
      template_id: template.id,
      exercise_name: ex.exercise_name,
      sets: ex.sets ?? null,
      reps: ex.reps ?? null,
      weight_kg: ex.weight_kg ?? null,
      is_bodyweight: ex.is_bodyweight ?? false,
      is_timed: ex.is_timed ?? false,
      duration_seconds: ex.duration_seconds ?? null,
      rest_seconds: ex.rest_seconds ?? null,
      section: ex.section ?? null,
      include_in_quick: ex.include_in_quick ?? true,
      order_index: ex.order_index ?? index,
    }));
    const { error: exError } = await supabase.from("template_exercises").insert(rows);
    if (exError) {
      return NextResponse.json({ error: exError.message }, { status: 500 });
    }
  }

  const { data: full } = await supabase
    .from("workout_templates")
    .select("*, exercises:template_exercises(*)")
    .eq("id", template.id)
    .single();

  return NextResponse.json({ data: sortExercises(full) }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, description, exercises } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;

  const { error } = await supabase.from("workout_templates").update(updates).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (Array.isArray(exercises)) {
    const { error: delError } = await supabase
      .from("template_exercises")
      .delete()
      .eq("template_id", id);
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }
    if (exercises.length > 0) {
      const rows = exercises.map((ex, index: number) => ({
        template_id: id,
        exercise_name: ex.exercise_name,
        sets: ex.sets ?? null,
        reps: ex.reps ?? null,
        weight_kg: ex.weight_kg ?? null,
        is_bodyweight: ex.is_bodyweight ?? false,
        is_timed: ex.is_timed ?? false,
        duration_seconds: ex.duration_seconds ?? null,
        rest_seconds: ex.rest_seconds ?? null,
        section: ex.section ?? null,
        include_in_quick: ex.include_in_quick ?? true,
        order_index: ex.order_index ?? index,
      }));
      const { error: insError } = await supabase.from("template_exercises").insert(rows);
      if (insError) {
        return NextResponse.json({ error: insError.message }, { status: 500 });
      }
    }
  }

  const { data: full, error: fetchError } = await supabase
    .from("workout_templates")
    .select("*, exercises:template_exercises(*)")
    .eq("id", id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ data: sortExercises(full) });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { error } = await supabase.from("workout_templates").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
