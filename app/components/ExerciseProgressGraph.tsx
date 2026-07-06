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
import clsx from "clsx";
import type { CompletedWorkoutWithExercises } from "@/lib/types";

type Metric = "weight" | "reps";

interface ExerciseEntry {
  date: string;
  reps: number | null;
  weight: number | null;
  duration: number | null;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round((values.reduce((sum, v) => sum + v, 0) / values.length) * 10) / 10;
}

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

  const entries = useMemo<ExerciseEntry[]>(() => {
    if (!activeSelection) return [];
    return history
      .flatMap((workout) =>
        workout.exercises
          .filter((ex) => ex.exercise_name === activeSelection)
          .map((ex) => ({
            date: workout.date,
            reps: ex.reps_completed,
            weight: ex.weight_used_kg,
            duration: ex.duration_seconds,
          }))
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [history, activeSelection]);

  const hasWeightData = entries.some((e) => e.weight != null);
  const hasRepsData = entries.some((e) => e.reps != null);

  const [metric, setMetric] = useState<Metric>(hasWeightData ? "weight" : "reps");
  const activeMetric: Metric = metric === "weight" && !hasWeightData ? "reps" : metric;

  const chartData = entries
    .map((e) => ({ date: e.date, value: activeMetric === "weight" ? e.weight : e.reps }))
    .filter((d): d is { date: string; value: number } => d.value != null);

  const stats = useMemo(() => {
    const reps = entries.map((e) => e.reps).filter((v): v is number => v != null);
    const weights = entries.map((e) => e.weight).filter((v): v is number => v != null);
    const durations = entries.map((e) => e.duration).filter((v): v is number => v != null);

    const highestReps = reps.length ? Math.max(...reps) : null;
    const averageReps = average(reps);
    const totalSessions = entries.length;

    let pr: string | null = null;
    if (weights.length) pr = `${Math.max(...weights)} kg`;
    else if (durations.length) pr = `${Math.max(...durations)}s`;
    else if (reps.length) pr = `${Math.max(...reps)} reps`;

    return { highestReps, averageReps, totalSessions, pr };
  }, [entries]);

  if (exerciseNames.length === 0) {
    return <p className="text-sm text-gray-400">Complete a workout to start tracking progress.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <TrendingUp size={14} className="text-blue-500" />
          Progress
        </span>
        <div className="flex items-center gap-2">
          {hasWeightData && hasRepsData && (
            <div className="flex rounded-md border border-gray-200 p-0.5 text-xs">
              {(["weight", "reps"] as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={clsx(
                    "rounded px-2 py-1 font-medium capitalize",
                    activeMetric === m ? "bg-blue-100 text-blue-700" : "text-gray-500"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
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
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name={activeMetric === "weight" ? "Weight (kg)" : "Reps"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-md bg-gray-50 p-2 text-center">
          <p className="text-lg font-bold text-gray-900">{stats.highestReps ?? "—"}</p>
          <p className="text-xs text-gray-400">Highest reps</p>
        </div>
        <div className="rounded-md bg-gray-50 p-2 text-center">
          <p className="text-lg font-bold text-gray-900">{stats.averageReps ?? "—"}</p>
          <p className="text-xs text-gray-400">Average reps</p>
        </div>
        <div className="rounded-md bg-gray-50 p-2 text-center">
          <p className="text-lg font-bold text-gray-900">{stats.pr ?? "—"}</p>
          <p className="text-xs text-gray-400">Personal record</p>
        </div>
        <div className="rounded-md bg-gray-50 p-2 text-center">
          <p className="text-lg font-bold text-gray-900">{stats.totalSessions}</p>
          <p className="text-xs text-gray-400">Total sessions</p>
        </div>
      </div>
    </div>
  );
}
