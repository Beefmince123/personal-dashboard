"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  History as HistoryIcon,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import clsx from "clsx";
import { Card } from "./Card";
import { WorkoutStreak } from "./WorkoutStreak";
import { CompletionCheckbox } from "./CompletionCheckbox";
import { ActiveWorkout } from "./ActiveWorkout";
import { WorkoutHistory } from "./WorkoutHistory";
import { apiGet, apiPost } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { isoDaysAgo, todayISO, computeStreak } from "@/lib/date";
import type { CompletedWorkout, TemplateExercise, WorkoutTemplateWithExercises } from "@/lib/types";

type Variant = "full" | "quick";

// Rough per-rep time, used only to estimate the routine's total length.
const SECONDS_PER_REP = 3;
const DEFAULT_HOLD_SECONDS = 30;

function estimateSeconds(ex: TemplateExercise) {
  const perSet = ex.is_timed
    ? (ex.duration_seconds ?? DEFAULT_HOLD_SECONDS)
    : (ex.reps ?? 8) * SECONDS_PER_REP;
  return perSet * (ex.sets ?? 1);
}

function formatExerciseMeta(ex: TemplateExercise) {
  const unit = ex.is_timed ? `${ex.duration_seconds ?? "?"}s` : `${ex.reps ?? "?"} reps`;
  return ex.sets && ex.sets > 1 ? `${ex.sets} × ${unit}` : unit;
}

export function MobilityCard() {
  const [template, setTemplate] = useState<WorkoutTemplateWithExercises | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [completedToday, setCompletedToday] = useState<CompletedWorkout | null>(null);
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [variant, setVariant] = useState<Variant>("full");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const today = todayISO();

  async function load() {
    const templates = await apiGet<WorkoutTemplateWithExercises[]>("/api/workout-templates");
    const mobility = templates.find((t) => t.name === "Mobility") ?? null;
    setTemplate(mobility);
    setNotFound(!mobility);

    if (mobility) {
      const history = await apiGet<CompletedWorkout[]>(
        `/api/completed-workouts?from=${isoDaysAgo(60)}&to=${today}`
      );
      const mine = history.filter((w) => w.template_id === mobility.id);
      setCompletedToday(mine.find((w) => w.date === today) ?? null);
      setCompletedDates(Array.from(new Set(mine.map((w) => w.date))));
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scoped to this one template rather than the combined streak on the main
  // Workout card — mobility runs alongside PPL/Muay Thai, not merged with it.
  useRealtimeRefresh(["workout_templates", "template_exercises", "completed_workouts"], load);

  const streak = computeStreak(completedDates, today);

  const exercises = useMemo(() => {
    if (!template) return [];
    const all = [...template.exercises].sort((a, b) => a.order_index - b.order_index);
    return variant === "quick" ? all.filter((ex) => ex.include_in_quick) : all;
  }, [template, variant]);

  const sections = useMemo(() => {
    const order: string[] = [];
    const bySection = new Map<string, TemplateExercise[]>();
    for (const ex of exercises) {
      const key = ex.section ?? "Exercises";
      if (!bySection.has(key)) {
        bySection.set(key, []);
        order.push(key);
      }
      bySection.get(key)!.push(ex);
    }
    return order.map((name) => ({ name, exercises: bySection.get(name)! }));
  }, [exercises]);

  const totalMinutes = Math.max(
    1,
    Math.round(exercises.reduce((sum, ex) => sum + estimateSeconds(ex), 0) / 60)
  );

  function toggleSection(name: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function handleMarkDone() {
    if (!template || completedToday) return;
    const previousCompleted = completedToday;
    const previousDates = completedDates;
    const notes = variant === "quick" ? "Quick version" : null;

    const optimistic: CompletedWorkout = {
      id: `optimistic-${Date.now()}`,
      template_id: template.id,
      date: today,
      duration_minutes: null,
      notes,
      created_at: new Date().toISOString(),
    };
    setCompletedToday(optimistic);
    setCompletedDates((prev) => (prev.includes(today) ? prev : [...prev, today]));

    try {
      const data = await apiPost<CompletedWorkout>("/api/completed-workouts", {
        template_id: template.id,
        date: today,
        notes,
      });
      setCompletedToday(data);
    } catch {
      setCompletedToday(previousCompleted);
      setCompletedDates(previousDates);
    }
  }

  const activeTemplate = template ? { ...template, exercises } : null;

  return (
    <Card
      title="Mobility"
      icon={<Activity size={18} className="text-blue-500" />}
      actions={
        template ? (
          <button
            onClick={() => setShowHistory(true)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Mobility history"
          >
            <HistoryIcon size={16} />
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : notFound || !template ? (
        <p className="text-sm text-gray-400">
          Run the latest supabase/schema.sql to set up your Mobility routine.
        </p>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <WorkoutStreak streak={streak} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">~{totalMinutes} min</span>
              <div className="flex rounded-md border border-gray-200 p-0.5 text-xs">
                {(["full", "quick"] as Variant[]).map((v) => (
                  <button
                    key={v}
                    onClick={() => setVariant(v)}
                    className={clsx(
                      "rounded px-2 py-1 font-medium capitalize",
                      variant === v ? "bg-blue-100 text-blue-700" : "text-gray-500"
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mb-3 space-y-1.5">
            {sections.map((section) => {
              const expanded = expandedSections.has(section.name);
              return (
                <div key={section.name} className="rounded-md border border-gray-100">
                  <button
                    onClick={() => toggleSection(section.name)}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-gray-700"
                  >
                    {section.name}
                    {expanded ? (
                      <ChevronUp size={14} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-400" />
                    )}
                  </button>
                  {expanded && (
                    <ul className="space-y-1 border-t border-gray-100 px-3 py-2 text-sm text-gray-600">
                      {section.exercises.map((ex) => (
                        <li key={ex.id} className="flex items-center justify-between gap-2">
                          <span>{ex.exercise_name}</span>
                          <span className="shrink-0 text-xs text-gray-400">
                            {formatExerciseMeta(ex)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {completedToday ? (
            <p className="text-sm font-medium text-blue-700">Mobility completed today ✓</p>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                onClick={() => setShowActiveWorkout(true)}
                className="flex items-center justify-center gap-1.5 rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
              >
                <Play size={14} /> Start Routine
              </button>
              <div className="flex-1">
                <CompletionCheckbox
                  label="Mark today's mobility done"
                  completedToday={!!completedToday}
                  onCheck={handleMarkDone}
                />
              </div>
            </div>
          )}
        </>
      )}

      {showActiveWorkout && activeTemplate && (
        <ActiveWorkout
          template={activeTemplate}
          onClose={() => setShowActiveWorkout(false)}
          onFinished={load}
        />
      )}

      {showHistory && <WorkoutHistory onClose={() => setShowHistory(false)} />}
    </Card>
  );
}
