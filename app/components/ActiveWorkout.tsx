"use client";

import { useEffect, useState } from "react";
import { X, Check, Timer, SkipForward } from "lucide-react";
import { apiPost, apiPut } from "@/lib/api";
import { todayISO } from "@/lib/date";
import { ExerciseTimer } from "./ExerciseTimer";
import { RestTimer } from "./RestTimer";
import type { WorkoutTemplateWithExercises } from "@/lib/types";

interface ActiveWorkoutProps {
  template: WorkoutTemplateWithExercises;
  onClose: () => void;
  onFinished: () => void;
}

export function ActiveWorkout({ template, onClose, onFinished }: ActiveWorkoutProps) {
  const exercises = template.exercises;
  const [startedAt] = useState(() => Date.now());
  const [completedWorkoutId, setCompletedWorkoutId] = useState<string | null>(null);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [showRest, setShowRest] = useState(false);
  const [timedSeconds, setTimedSeconds] = useState(0);
  const [finished, setFinished] = useState(exercises.length === 0);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function start() {
      const workout = await apiPost<{ id: string }>("/api/completed-workouts", {
        template_id: template.id,
        date: todayISO(),
      });
      setCompletedWorkoutId(workout.id);
    }
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exercise = exercises[exerciseIndex];
  const nextExercise = exercises[exerciseIndex + 1];
  const totalSets = exercise?.sets ?? 1;

  async function logExercise() {
    if (!completedWorkoutId || !exercise) return;
    await apiPost("/api/completed-exercises", {
      completed_workout_id: completedWorkoutId,
      exercise_name: exercise.exercise_name,
      sets_completed: exercise.sets ?? currentSet,
      reps_completed: exercise.is_timed ? null : exercise.reps,
      weight_used_kg: exercise.is_bodyweight ? null : exercise.weight_kg,
      duration_seconds: exercise.is_timed ? timedSeconds : exercise.duration_seconds,
      rest_seconds: exercise.rest_seconds,
    });
  }

  function advance() {
    setCurrentSet(1);
    setTimedSeconds(0);
    setShowRest(false);
    if (exerciseIndex + 1 < exercises.length) {
      setExerciseIndex((i) => i + 1);
    } else {
      setFinished(true);
    }
  }

  function handleSetCompleted() {
    if (currentSet < totalSets) {
      setCurrentSet((s) => s + 1);
      return;
    }
    // Advance immediately; the log write happens in the background so the
    // UI doesn't wait on the network between exercises.
    logExercise().catch((err) => console.error("Failed to log exercise", err));
    advance();
  }

  function handleSkipExercise() {
    advance();
  }

  async function handleFinishWorkout() {
    if (!completedWorkoutId) return;
    setSaving(true);
    try {
      const durationMinutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000));
      await apiPut("/api/completed-workouts", {
        id: completedWorkoutId,
        duration_minutes: durationMinutes,
        notes: notes.trim() || null,
      });
      onFinished();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900 text-white">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3 sm:px-8">
        <div>
          <p className="text-sm text-gray-400">{template.name}</p>
          {!finished && exercise && (
            <p className="text-xs text-gray-500">
              Exercise {exerciseIndex + 1} of {exercises.length}
            </p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X size={22} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 sm:px-8">
        {finished ? (
          <div className="w-full max-w-sm space-y-4 text-center">
            <h2 className="text-2xl font-bold">Workout complete 💪</h2>
            <p className="text-sm text-gray-400">Add any notes before you save it.</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="How did it feel?"
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500"
            />
            <button
              onClick={handleFinishWorkout}
              disabled={saving || !completedWorkoutId}
              className="w-full rounded-md bg-blue-100 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-200 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save workout"}
            </button>
          </div>
        ) : exercise ? (
          <>
            <div className="text-center">
              <h2 className="text-3xl font-bold">{exercise.exercise_name}</h2>
              <p className="mt-2 text-gray-400">
                Set {currentSet} of {totalSets}
                {!exercise.is_timed && exercise.reps ? ` — ${exercise.reps} reps` : ""}
                {!exercise.is_bodyweight && exercise.weight_kg
                  ? ` @ ${exercise.weight_kg}kg`
                  : exercise.is_bodyweight
                    ? " — bodyweight"
                    : ""}
                {exercise.is_timed && exercise.duration_seconds
                  ? ` — ${exercise.duration_seconds}s target`
                  : ""}
              </p>
            </div>

            {exercise.is_timed && <ExerciseTimer onTick={setTimedSeconds} />}

            {showRest ? (
              <RestTimer
                seconds={exercise.rest_seconds ?? 60}
                onComplete={() => setShowRest(false)}
                onSkip={() => setShowRest(false)}
              />
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleSetCompleted}
                  className="flex items-center gap-2 rounded-md bg-blue-100 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-200"
                >
                  <Check size={16} /> Set completed
                </button>
                <button
                  onClick={() => setShowRest(true)}
                  className="flex items-center gap-2 rounded-md bg-gray-800 px-5 py-3 text-sm font-medium text-gray-200 hover:bg-gray-700"
                >
                  <Timer size={16} /> Start rest timer
                </button>
                <button
                  onClick={handleSkipExercise}
                  className="flex items-center gap-2 rounded-md px-5 py-3 text-sm font-medium text-gray-400 hover:bg-gray-800"
                >
                  <SkipForward size={16} /> Skip exercise
                </button>
              </div>
            )}

            {nextExercise && (
              <p className="text-sm text-gray-500">Next: {nextExercise.exercise_name}</p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
