"use client";

import { useEffect, useState } from "react";
import { Target, Pencil, Trash2, Plus } from "lucide-react";
import { Card } from "./Card";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import type { Goal } from "@/lib/types";

interface GoalDraft {
  title: string;
  target: string;
  current: string;
  unit: string;
}

const emptyDraft: GoalDraft = { title: "", target: "", current: "0", unit: "" };

export function GoalsCard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<GoalDraft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<GoalDraft>(emptyDraft);

  async function load() {
    const data = await apiGet<Goal[]>("/api/goals");
    setGoals(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useRealtimeRefresh(["goals"], load);

  async function addGoal() {
    if (!draft.title.trim()) return;
    await apiPost("/api/goals", {
      title: draft.title.trim(),
      target: parseFloat(draft.target) || 0,
      current: parseFloat(draft.current) || 0,
      unit: draft.unit.trim() || null,
    });
    setDraft(emptyDraft);
    setAdding(false);
    load();
  }

  function startEdit(goal: Goal) {
    setEditingId(goal.id);
    setEditDraft({
      title: goal.title,
      target: String(goal.target),
      current: String(goal.current),
      unit: goal.unit ?? "",
    });
  }

  async function saveEdit(id: string) {
    await apiPut("/api/goals", {
      id,
      title: editDraft.title.trim(),
      target: parseFloat(editDraft.target) || 0,
      current: parseFloat(editDraft.current) || 0,
      unit: editDraft.unit.trim() || null,
    });
    setEditingId(null);
    load();
  }

  async function removeGoal(id: string) {
    await apiDelete(`/api/goals?id=${id}`);
    load();
  }

  return (
    <Card
      title="Goals"
      icon={<Target size={18} className="text-blue-500" />}
      actions={
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
        >
          <Plus size={14} /> Add goal
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : goals.length === 0 && !adding ? (
        <p className="text-sm text-gray-400">No goals yet. Add one to track progress.</p>
      ) : (
        <ul className="space-y-4">
          {goals.map((goal) => {
            const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
            return (
              <li key={goal.id}>
                {editingId === goal.id ? (
                  <div className="space-y-2 rounded-md bg-gray-50 p-2">
                    <input
                      value={editDraft.title}
                      onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                      className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm"
                      placeholder="Title"
                    />
                    <div className="flex gap-2">
                      <input
                        value={editDraft.current}
                        onChange={(e) => setEditDraft({ ...editDraft, current: e.target.value })}
                        type="number"
                        className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm"
                        placeholder="Current"
                      />
                      <input
                        value={editDraft.target}
                        onChange={(e) => setEditDraft({ ...editDraft, target: e.target.value })}
                        type="number"
                        className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm"
                        placeholder="Target"
                      />
                      <input
                        value={editDraft.unit}
                        onChange={(e) => setEditDraft({ ...editDraft, unit: e.target.value })}
                        className="w-20 rounded-md border border-gray-200 px-2 py-1 text-sm"
                        placeholder="Unit"
                      />
                      <button
                        onClick={() => saveEdit(goal.id)}
                        className="rounded-md px-2 text-sm font-medium text-blue-700"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">{goal.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {goal.current}
                          {goal.unit ? ` ${goal.unit}` : ""} / {goal.target}
                          {goal.unit ? ` ${goal.unit}` : ""}
                        </span>
                        <button
                          onClick={() => startEdit(goal)}
                          className="text-gray-400 hover:text-gray-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => removeGoal(goal.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-blue-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <div className="mt-3 space-y-2 rounded-md bg-gray-50 p-2">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="Goal title"
            className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            autoFocus
          />
          <div className="flex gap-2">
            <input
              value={draft.current}
              onChange={(e) => setDraft({ ...draft, current: e.target.value })}
              type="number"
              placeholder="Current"
              className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            />
            <input
              value={draft.target}
              onChange={(e) => setDraft({ ...draft, target: e.target.value })}
              type="number"
              placeholder="Target"
              className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            />
            <input
              value={draft.unit}
              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
              placeholder="Unit"
              className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            />
            <button
              onClick={addGoal}
              className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
