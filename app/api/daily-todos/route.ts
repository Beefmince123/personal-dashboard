import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { todayISO } from "@/lib/date";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") ?? todayISO();

  const { data, error } = await supabase
    .from("daily_todos")
    .select("*")
    .eq("date", date)
    .order("order_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { task, date = todayISO() } = body;

  if (!task) {
    return NextResponse.json({ error: "task is required" }, { status: 400 });
  }

  const { count, error: countError } = await supabase
    .from("daily_todos")
    .select("id", { count: "exact", head: true })
    .eq("date", date);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("daily_todos")
    .insert({ task, date, order_index: count ?? 0 })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, task, completed, order_index } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (task !== undefined) updates.task = task;
  if (completed !== undefined) updates.completed = completed;
  if (order_index !== undefined) updates.order_index = order_index;

  const { data, error } = await supabase
    .from("daily_todos")
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

  const { error } = await supabase.from("daily_todos").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
