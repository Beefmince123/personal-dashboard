"use client";

import { useEffect, useState } from "react";
import { ListChecks, Pencil, Trash2, Flame, Plus, Check } from "lucide-react";
import clsx from "clsx";
import { Card } from "./Card";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import type { HabitWithStatus } from "@/lib/types";

export function HabitsCard({
  onChange,
}: {
  onChange?: (completed: number, total: number) => void;
}) {
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  async function load() {
    const data = await apiGet<HabitWithStatus[]>("/api/habits");
    setHabits(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  useRealtimeRefresh(["habits", "habit_logs"], load);

  // Derived from whatever `habits` currently holds, so every optimistic
  // update (toggle, delete, revert) is reflected in the Header badge instantly
  // without each handler having to remember to report it.
  useEffect(() => {
    onChange?.(habits.filter((h) => h.completed_today).length, habits.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  async function toggle(habitId: string) {
    const wasCompleted = habits.find((h) => h.id === habitId)?.completed_today ?? false;

    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, completed_today: !wasCompleted } : h))
    );

    try {
      await apiPost("/api/habit-logs", { habit_id: habitId });
    } catch {
      setHabits((prev) =>
        prev.map((h) => (h.id === habitId ? { ...h, completed_today: wasCompleted } : h))
      );
    }
  }

  async function addHabit() {
    if (!newName.trim()) return;
    await apiPost("/api/habits", { name: newName.trim() });
    setNewName("");
    setAdding(false);
    load();
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return;
    await apiPut("/api/habits", { id, name: editName.trim() });
    setEditingId(null);
    load();
  }

  async function removeHabit(id: string) {
    const removedIndex = habits.findIndex((h) => h.id === id);
    const removed = habits[removedIndex];
    if (!removed) return;

    setHabits((prev) => prev.filter((h) => h.id !== id));

    try {
      await apiDelete(`/api/habits?id=${id}`);
    } catch {
      setHabits((prev) => {
        const next = [...prev];
        next.splice(Math.min(removedIndex, next.length), 0, removed);
        return next;
      });
    }
  }

  return (
    <Card
      title="Habits"
      icon={<ListChecks size={18} className="text-blue-500" />}
      actions={
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
        >
          <Plus size={14} /> Add habit
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : habits.length === 0 && !adding ? (
        <p className="text-sm text-gray-400">No habits yet. Add one to get started.</p>
      ) : (
        <ul className="space-y-2">
          {habits.map((habit) => (
            <li
              key={habit.id}
              className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50"
            >
              {editingId === habit.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm"
                    autoFocus
                  />
                  <button
                    onClick={() => saveEdit(habit.id)}
                    className="text-sm font-medium text-blue-700"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => toggle(habit.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={clsx(
                        "flex h-5 w-5 items-center justify-center rounded-md border",
                        habit.completed_today
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-gray-300"
                      )}
                    >
                      {habit.completed_today && <Check size={14} />}
                    </span>
                    <span
                      className={clsx(
                        "text-sm",
                        habit.completed_today ? "text-gray-400 line-through" : "text-gray-800"
                      )}
                    >
                      {habit.name}
                    </span>
                  </button>
                  <div className="flex items-center gap-2 text-gray-400">
                    {habit.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-xs font-medium text-orange-500">
                        <Flame size={12} />
                        {habit.streak}d
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setEditingId(habit.id);
                        setEditName(habit.name);
                      }}
                      className="hover:text-gray-700"
                    >
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => removeHabit(habit.id)} className="hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Habit name"
            className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && addHabit()}
          />
          <button
            onClick={addHabit}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Add
          </button>
        </div>
      )}
    </Card>
  );
}
