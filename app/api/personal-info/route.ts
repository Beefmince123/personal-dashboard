import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import type { PersonalInfo } from "@/lib/types";

const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  id: null,
  weight_kg: null,
  height_cm: null,
  age: null,
  activity_level: "moderate",
  created_at: null,
  updated_at: null,
};

export async function GET() {
  const { data, error } = await supabase
    .from("personal_info")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? DEFAULT_PERSONAL_INFO });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { weight_kg, height_cm, age, activity_level } = body;

  const { data: current, error: fetchError } = await supabase
    .from("personal_info")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const fields: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (weight_kg !== undefined) fields.weight_kg = weight_kg;
  if (height_cm !== undefined) fields.height_cm = height_cm;
  if (age !== undefined) fields.age = age;
  if (activity_level !== undefined) fields.activity_level = activity_level;

  const query = current
    ? supabase.from("personal_info").update(fields).eq("id", current.id)
    : supabase.from("personal_info").insert(fields);

  const { data, error } = await query.select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
