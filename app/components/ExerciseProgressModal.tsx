"use client";

import { useEffect, useState } from "react";
import { TrendingUp, X } from "lucide-react";
import { apiGet } from "@/lib/api";
import { isoDaysAgo, todayISO } from "@/lib/date";
import { ExerciseProgressGraph } from "./ExerciseProgressGraph";
import type { CompletedWorkoutWithExercises } from "@/lib/types";

export function ExerciseProgressModal({ onClose }: { onClose: () => void }) {
  const [history, setHistory] = useState<CompletedWorkoutWithExercises[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // isoDaysAgo(3650) ~= 10 years back, a stand-in for "all-time" since the
      // completed-workouts route only accepts an explicit from/to range.
      const from = isoDaysAgo(3650);
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
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <TrendingUp size={18} className="text-blue-500" />
            Exercise Progress
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading…</p>
        ) : (
          <ExerciseProgressGraph history={history} />
        )}
      </div>
    </div>
  );
}
