"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { CompletedWorkoutWithExercises } from "@/lib/types";

export function ExerciseProgressGraph({ history }: { history: CompletedWorkoutWithExercises[] }) {
  const exerciseNames = useMemo(() => {
    const names = new Set<string>();
    for (const workout of history) {
      for (const ex of workout.exercises) names.add(ex.exercise_name);
    }
    return Array.from(names).sort();
  }, [history]);

  const [selected, setSelected] = useState<string>(exerciseNames[0] ?? "");
  const activeSelection = exerciseNames.includes(selected) ? selected : exerciseNames[0] ?? "";

  const chartData = useMemo(() => {
    if (!activeSelection) return [];
    return history
      .flatMap((workout) =>
        workout.exercises
          .filter((ex) => ex.exercise_name === activeSelection)
          .map((ex) => ({
            date: workout.date,
            weight: ex.weight_used_kg ?? 0,
            reps: ex.reps_completed ?? 0,
          }))
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [history, activeSelection]);

  if (exerciseNames.length === 0) {
    return <p className="text-sm text-gray-400">Complete a workout to start tracking progress.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <TrendingUp size={14} className="text-blue-500" />
          Progress
        </span>
        <select
          value={activeSelection}
          onChange={(e) => setSelected(e.target.value)}
          className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-700"
        >
          {exerciseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {chartData.length < 2 ? (
        <p className="text-sm text-gray-400">Log this exercise a few more times to see a trend.</p>
      ) : (
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Weight (kg)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
