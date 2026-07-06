"use client";

import { useEffect, useState } from "react";
import { X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { apiGet } from "@/lib/api";
import { isoDaysAgo, todayISO } from "@/lib/date";
import { ExerciseProgressGraph } from "./ExerciseProgressGraph";
import type { CompletedWorkoutWithExercises } from "@/lib/types";

export function WorkoutHistory({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<CompletedWorkoutWithExercises[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const from = isoDaysAgo(89);
      const data = await apiGet<CompletedWorkoutWithExercises[]>(
        `/api/completed-workouts?from=${from}&to=${todayISO()}`
      );
      setHistory(data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Workout history</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400">No workouts completed yet.</p>
        ) : (
          <>
            <div className="mb-6 rounded-md bg-gray-50 p-4">
              <ExerciseProgressGraph history={history} />
            </div>

            <ul className="space-y-2">
              {history.map((workout) => {
                const expanded = expandedId === workout.id;
                return (
                  <li key={workout.id} className="rounded-md border border-gray-100">
                    <button
                      onClick={() => setExpandedId(expanded ? null : workout.id)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {workout.template?.name ?? "Workout"} — {workout.date}
                        </p>
                        <p className="flex items-center gap-1 text-xs text-gray-400">
                          {workout.duration_minutes != null && (
                            <span className="flex items-center gap-1">
                              <Clock size={12} /> {workout.duration_minutes} min
                            </span>
                          )}
                          {workout.exercises.length > 0 &&
                            ` · ${workout.exercises.length} exercises`}
                        </p>
                      </div>
                      {expanded ? (
                        <ChevronUp size={16} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </button>
                    {expanded && (
                      <div className="border-t border-gray-100 px-3 py-2">
                        {workout.exercises.length === 0 ? (
                          <p className="text-sm text-gray-400">No exercises logged.</p>
                        ) : (
                          <ul className="space-y-1 text-sm text-gray-600">
                            {workout.exercises.map((ex) => (
                              <li key={ex.id}>
                                {ex.exercise_name}
                                {ex.sets_completed
                                  ? ` — ${ex.sets_completed}x${ex.reps_completed ?? "?"}`
                                  : ""}
                                {ex.weight_used_kg ? ` @ ${ex.weight_used_kg}kg` : ""}
                                {ex.duration_seconds ? ` (${ex.duration_seconds}s)` : ""}
                              </li>
                            ))}
                          </ul>
                        )}
                        {workout.notes && (
                          <p className="mt-2 text-sm italic text-gray-500">{workout.notes}</p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
