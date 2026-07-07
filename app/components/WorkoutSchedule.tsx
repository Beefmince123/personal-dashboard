"use client";

import { useEffect, useState } from "react";
import {
  Dumbbell,
  Plus,
  Settings,
  History as HistoryIcon,
  TrendingUp,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Card } from "./Card";
import { WorkoutStreak } from "./WorkoutStreak";
import { CompletionCheckbox } from "./CompletionCheckbox";
import { ActiveWorkout } from "./ActiveWorkout";
import { WorkoutTemplateEditor } from "./WorkoutTemplateEditor";
import { WorkoutHistory } from "./WorkoutHistory";
import { ExerciseProgressModal } from "./ExerciseProgressModal";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { isoDaysAgo, todayDayOfWeek, todayISO, computeStreak } from "@/lib/date";
import {
  DAYS_OF_WEEK,
  type CompletedWorkout,
  type WorkoutScheduleWithTemplate,
  type WorkoutTemplateWithExercises,
} from "@/lib/types";

export function WorkoutSchedule() {
  const [todaySchedule, setTodaySchedule] = useState<WorkoutScheduleWithTemplate | null>(null);
  const [completedToday, setCompletedToday] = useState<CompletedWorkout | null>(null);
  // Kept as raw dates (not a precomputed number) so an optimistic check-in can
  // just add today's date and get a correct streak via computeStreak, instead
  // of guessing at +1/-1 arithmetic.
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [templates, setTemplates] = useState<WorkoutTemplateWithExercises[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<WorkoutScheduleWithTemplate[]>([]);

  const [showActiveWorkout, setShowActiveWorkout] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<
    WorkoutTemplateWithExercises | "new" | null
  >(null);

  const today = todayISO();
  const todayName = todayDayOfWeek();

  async function load() {
    const [scheduleData, completedData, streakRangeData] = await Promise.all([
      apiGet<WorkoutScheduleWithTemplate | null>(`/api/workout-schedule?day=${todayName}`),
      apiGet<CompletedWorkout[]>(`/api/completed-workouts?date=${today}`),
      apiGet<CompletedWorkout[]>(
        `/api/completed-workouts?from=${isoDaysAgo(60)}&to=${today}`
      ),
    ]);
    setTodaySchedule(scheduleData);
    setCompletedToday(completedData[0] ?? null);
    setCompletedDates(Array.from(new Set(streakRangeData.map((w) => w.date))));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeRefresh(
    ["workout_schedule", "completed_workouts", "workout_templates", "template_exercises"],
    load
  );

  async function loadManageData() {
    const [templateData, weekData] = await Promise.all([
      apiGet<WorkoutTemplateWithExercises[]>("/api/workout-templates"),
      apiGet<WorkoutScheduleWithTemplate[]>("/api/workout-schedule"),
    ]);
    setTemplates(templateData);
    setWeekSchedule(weekData);
  }

  function openManage() {
    setShowManage(true);
    loadManageData();
  }

  async function assignTemplate(day: string, templateId: string) {
    if (templateId) {
      await apiPost("/api/workout-schedule", { day_of_week: day, template_id: templateId });
    } else {
      await apiDelete(`/api/workout-schedule?day=${day}`);
    }
    loadManageData();
    load();
  }

  async function deleteTemplate(id: string) {
    await apiDelete(`/api/workout-templates?id=${id}`);
    loadManageData();
    load();
  }

  const template = todaySchedule?.template ?? null;
  const isMuayThai = template?.name === "Muay Thai";
  const sortedExercises = template
    ? [...template.exercises].sort((a, b) => a.order_index - b.order_index)
    : [];
  const streak = computeStreak(completedDates, today);

  async function handleMuayThaiComplete() {
    if (!template || completedToday) return;

    const previousCompleted = completedToday;
    const previousDates = completedDates;
    const optimisticWorkout: CompletedWorkout = {
      id: `optimistic-${Date.now()}`,
      template_id: template.id,
      date: today,
      duration_minutes: null,
      notes: null,
      created_at: new Date().toISOString(),
    };
    setCompletedToday(optimisticWorkout);
    setCompletedDates((prev) => (prev.includes(today) ? prev : [...prev, today]));

    try {
      const data = await apiPost<CompletedWorkout>("/api/completed-workouts", {
        template_id: template.id,
        date: today,
      });
      setCompletedToday(data);
    } catch {
      setCompletedToday(previousCompleted);
      setCompletedDates(previousDates);
    }
  }

  return (
    <Card
      title="Workout"
      icon={<Dumbbell size={18} className="text-blue-500" />}
      actions={
        <>
          <button
            onClick={() => setShowProgress(true)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Exercise progress"
          >
            <TrendingUp size={16} />
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Workout history"
          >
            <HistoryIcon size={16} />
          </button>
          <button
            onClick={openManage}
            className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Manage templates and schedule"
          >
            <Settings size={16} />
          </button>
        </>
      }
    >
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="mb-3">
            <WorkoutStreak streak={streak} />
          </div>

          {template ? (
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-sm font-semibold text-blue-800">
                Today&apos;s Workout: {template.name}
              </p>
              {template.description && (
                <p className="mt-0.5 text-xs text-blue-600">{template.description}</p>
              )}
              {sortedExercises.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-sm text-gray-600">
                  {sortedExercises.map((ex) => (
                    <li key={ex.id}>
                      {ex.exercise_name}
                      {ex.sets
                        ? ` — ${ex.sets}x${
                            ex.is_timed ? `${ex.duration_seconds ?? "?"}s` : ex.reps ?? "?"
                          }`
                        : ""}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-3">
                {completedToday ? (
                  <p className="text-sm font-medium text-blue-700">Workout completed today ✓</p>
                ) : isMuayThai ? (
                  <CompletionCheckbox
                    label="Attended class today"
                    completedToday={!!completedToday}
                    onCheck={handleMuayThaiComplete}
                  />
                ) : (
                  <button
                    onClick={() => setShowActiveWorkout(true)}
                    className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
                  >
                    Start Workout
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-400">
              No workout scheduled for {todayName}. Rest day — or assign one via the settings
              icon.
            </p>
          )}
        </>
      )}

      {showActiveWorkout && template && (
        <ActiveWorkout
          template={template}
          onClose={() => setShowActiveWorkout(false)}
          onFinished={load}
        />
      )}

      {showHistory && <WorkoutHistory onClose={() => setShowHistory(false)} />}

      {showProgress && <ExerciseProgressModal onClose={() => setShowProgress(false)} />}

      {editingTemplate && (
        <WorkoutTemplateEditor
          existing={editingTemplate === "new" ? undefined : editingTemplate}
          onClose={() => setEditingTemplate(null)}
          onSaved={() => {
            loadManageData();
            load();
          }}
        />
      )}

      {showManage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Manage workouts</h2>
              <button
                onClick={() => setShowManage(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-6">
              <h3 className="mb-2 text-sm font-medium text-gray-700">Weekly schedule</h3>
              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => {
                  const entry = weekSchedule.find((s) => s.day_of_week === day);
                  return (
                    <div key={day} className="flex items-center justify-between gap-2">
                      <span className="w-24 text-sm text-gray-600">{day}</span>
                      <select
                        value={entry?.template_id ?? ""}
                        onChange={(e) => assignTemplate(day, e.target.value)}
                        className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-sm"
                      >
                        <option value="">Rest day</option>
                        {templates.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Templates</h3>
                <button
                  onClick={() => setEditingTemplate("new")}
                  className="flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
                >
                  <Plus size={14} /> New template
                </button>
              </div>
              {templates.length === 0 ? (
                <p className="text-sm text-gray-400">No templates yet.</p>
              ) : (
                <ul className="space-y-1">
                  {templates.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50"
                    >
                      <span className="text-sm text-gray-700">{t.name}</span>
                      <div className="flex items-center gap-2 text-gray-400">
                        <button
                          onClick={() => setEditingTemplate(t)}
                          className="hover:text-gray-700"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          className="hover:text-red-500"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
