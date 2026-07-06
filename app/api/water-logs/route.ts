import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/date";

const DEFAULT_CUP_SIZE_ML = 250;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayISO();

  const { data, error } = await supabase
    .from("water_logs")
    .select("*")
    .eq("date", date)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data ?? {
      id: null,
      date,
      cups: 0,
      cup_size_ml: DEFAULT_CUP_SIZE_ML,
      updated_at: null,
    },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { date = todayISO(), cups, cup_size_ml } = body;

  const { data, error } = await supabase
    .from("water_logs")
    .upsert(
      {
        date,
        ...(cups !== undefined ? { cups } : {}),
        ...(cup_size_ml !== undefined ? { cup_size_ml } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "date" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { date = todayISO(), cups, cup_size_ml } = body;

  const updates: Record<string, unknown> = { date, updated_at: new Date().toISOString() };
  if (cups !== undefined) updates.cups = cups;
  if (cup_size_ml !== undefined) updates.cup_size_ml = cup_size_ml;

  const { data, error } = await supabase
    .from("water_logs")
    .upsert(updates, { onConflict: "date" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
