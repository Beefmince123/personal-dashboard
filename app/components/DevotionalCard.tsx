"use client";

import { useEffect, useState } from "react";
import { BookOpen, Pencil, Check, Flame } from "lucide-react";
import { Card } from "./Card";
import { apiGet, apiPost } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { todayISO } from "@/lib/date";
import type { Devotional } from "@/lib/types";

export function DevotionalCard({ onChange }: { onChange?: (streak: number) => void }) {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [quoteDraft, setQuoteDraft] = useState("");
  const [refDraft, setRefDraft] = useState("");

  async function load() {
    const data = await apiGet<Devotional | null>("/api/devotional");
    setDevotional(data);
    setLoading(false);
    if (data) onChange?.(data.streak_count);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeRefresh(["devotional"], load);

  async function markComplete() {
    const data = await apiPost<Devotional>("/api/devotional", { complete: true });
    setDevotional(data);
    onChange?.(data.streak_count);
  }

  function startEdit() {
    if (!devotional) return;
    setQuoteDraft(devotional.quote);
    setRefDraft(devotional.reference ?? "");
    setEditing(true);
  }

  async function saveEdit() {
    const data = await apiPost<Devotional>("/api/devotional", {
      quote: quoteDraft,
      reference: refDraft,
    });
    setDevotional(data);
    setEditing(false);
  }

  const completedToday = devotional?.last_completed_date === todayISO();

  return (
    <Card
      title="Devotional"
      dark
      icon={<BookOpen size={18} />}
      actions={
        !editing && (
          <button onClick={startEdit} className="text-gray-400 hover:text-white">
            <Pencil size={14} />
          </button>
        )
      }
    >
      {loading || !devotional ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : editing ? (
        <div className="space-y-2">
          <textarea
            value={quoteDraft}
            onChange={(e) => setQuoteDraft(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-white"
          />
          <input
            value={refDraft}
            onChange={(e) => setRefDraft(e.target.value)}
            placeholder="Reference"
            className="w-full rounded-md border border-gray-600 bg-gray-700 px-2 py-1.5 text-sm text-white"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(false)}
              className="rounded-md px-3 py-1.5 text-sm text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div>
          <blockquote className="text-base italic leading-relaxed text-gray-100">
            &ldquo;{devotional.quote}&rdquo;
          </blockquote>
          <p className="mt-2 text-sm text-gray-400">{devotional.reference}</p>

          <div className="mt-6 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-orange-400">
              <Flame size={14} />
              {devotional.streak_count} day{devotional.streak_count === 1 ? "" : "s"} devotional streak
            </span>
            <button
              onClick={markComplete}
              disabled={completedToday}
              className="flex items-center gap-1.5 rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
            >
              <Check size={14} />
              {completedToday ? "Completed today" : "Mark complete"}
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
