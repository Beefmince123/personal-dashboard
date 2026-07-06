import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("day");

  if (day) {
    const { data, error } = await supabase
      .from("workout_schedule")
      .select("*, template:workout_templates(*, exercises:template_exercises(*))")
      .eq("day_of_week", day)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  }

  const { data, error } = await supabase
    .from("workout_schedule")
    .select("*, template:workout_templates(*, exercises:template_exercises(*))");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// Upserts by day_of_week (unique) — the natural way to reschedule a day: just
// POST the new template_id and it replaces whatever was there.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { day_of_week, template_id } = body;

  if (!day_of_week || !template_id) {
    return NextResponse.json(
      { error: "day_of_week and template_id are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("workout_schedule")
    .upsert({ day_of_week, template_id }, { onConflict: "day_of_week" })
    .select("*, template:workout_templates(*, exercises:template_exercises(*))")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, template_id } = body;

  if (!id || !template_id) {
    return NextResponse.json({ error: "id and template_id are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("workout_schedule")
    .update({ template_id })
    .eq("id", id)
    .select("*, template:workout_templates(*, exercises:template_exercises(*))")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// Clears a day back to a rest day. Accepts either ?day= or ?id=.
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("day");
  const id = searchParams.get("id");

  if (!day && !id) {
    return NextResponse.json({ error: "day or id is required" }, { status: 400 });
  }

  const query = supabase.from("workout_schedule").delete();
  const { error } = day ? await query.eq("day_of_week", day) : await query.eq("id", id!);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
