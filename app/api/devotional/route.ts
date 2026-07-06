import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { isoDaysAgo, todayISO } from "@/lib/date";

export async function GET() {
  const { data, error } = await supabase
    .from("devotional")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// Body is either { quote, reference } to edit the devotional content, or
// { complete: true } to mark today's devotional done and advance the streak.
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { quote, reference, complete } = body;

  const { data: current, error: fetchError } = await supabase
    .from("devotional")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!current) {
    return NextResponse.json({ error: "devotional row not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (quote !== undefined) updates.quote = quote;
  if (reference !== undefined) updates.reference = reference;

  if (complete) {
    const today = todayISO();
    const yesterday = isoDaysAgo(1, today);

    if (current.last_completed_date === today) {
      return NextResponse.json({ data: current });
    }

    updates.streak_count =
      current.last_completed_date === yesterday ? current.streak_count + 1 : 1;
    updates.last_completed_date = today;
  }

  const { data, error } = await supabase
    .from("devotional")
    .update(updates)
    .eq("id", current.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
