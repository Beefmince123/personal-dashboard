"use client";

import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { apiPost, apiPut } from "@/lib/api";
import type { WorkoutTemplateWithExercises } from "@/lib/types";

interface ExerciseDraft {
  exercise_name: string;
  sets: string;
  reps: string;
  weight_kg: string;
  is_bodyweight: boolean;
  is_timed: boolean;
  duration_seconds: string;
  rest_seconds: string;
}

const emptyExercise: ExerciseDraft = {
  exercise_name: "",
  sets: "",
  reps: "",
  weight_kg: "",
  is_bodyweight: false,
  is_timed: false,
  duration_seconds: "",
  rest_seconds: "60",
};

interface WorkoutTemplateEditorProps {
  existing?: WorkoutTemplateWithExercises;
  onClose: () => void;
  onSaved: () => void;
}

export function WorkoutTemplateEditor({
  existing,
  onClose,
  onSaved,
}: WorkoutTemplateEditorProps) {
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [exercises, setExercises] = useState<ExerciseDraft[]>(
    existing && existing.exercises.length > 0
      ? existing.exercises.map((ex) => ({
          exercise_name: ex.exercise_name,
          sets: ex.sets != null ? String(ex.sets) : "",
          reps: ex.reps != null ? String(ex.reps) : "",
          weight_kg: ex.weight_kg != null ? String(ex.weight_kg) : "",
          is_bodyweight: ex.is_bodyweight,
          is_timed: ex.is_timed,
          duration_seconds: ex.duration_seconds != null ? String(ex.duration_seconds) : "",
          rest_seconds: ex.rest_seconds != null ? String(ex.rest_seconds) : "60",
        }))
      : [{ ...emptyExercise }]
  );
  const [saving, setSaving] = useState(false);

  function updateExercise(index: number, patch: Partial<ExerciseDraft>) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)));
  }

  function addExercise() {
    setExercises((prev) => [...prev, { ...emptyExercise }]);
  }

  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      exercises: exercises
        .filter((ex) => ex.exercise_name.trim())
        .map((ex, index) => ({
          exercise_name: ex.exercise_name.trim(),
          sets: ex.sets ? parseInt(ex.sets, 10) : null,
          reps: !ex.is_timed && ex.reps ? parseInt(ex.reps, 10) : null,
          weight_kg: !ex.is_bodyweight && ex.weight_kg ? parseFloat(ex.weight_kg) : null,
          is_bodyweight: ex.is_bodyweight,
          is_timed: ex.is_timed,
          duration_seconds:
            ex.is_timed && ex.duration_seconds ? parseInt(ex.duration_seconds, 10) : null,
          rest_seconds: ex.rest_seconds ? parseInt(ex.rest_seconds, 10) : null,
          order_index: index,
        })),
    };

    try {
      if (existing) {
        await apiPut("/api/workout-templates", { id: existing.id, ...payload });
      } else {
        await apiPost("/api/workout-templates", payload);
      }
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {existing ? "Edit template" : "New template"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="mb-4 space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Push"
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Chest, shoulders, triceps"
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Exercises</label>
          <div className="space-y-3">
            {exercises.map((ex, index) => (
              <div key={index} className="rounded-md border border-gray-100 p-2">
                <div className="mb-2 flex items-center gap-2">
                  <input
                    value={ex.exercise_name}
                    onChange={(e) => updateExercise(index, { exercise_name: e.target.value })}
                    placeholder="Exercise name"
                    className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  <button
                    onClick={() => removeExercise(index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    value={ex.sets}
                    onChange={(e) => updateExercise(index, { sets: e.target.value })}
                    type="number"
                    placeholder="Sets"
                    className="w-16 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  {!ex.is_timed && (
                    <input
                      value={ex.reps}
                      onChange={(e) => updateExercise(index, { reps: e.target.value })}
                      type="number"
                      placeholder="Reps"
                      className="w-16 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  )}
                  {!ex.is_bodyweight && (
                    <input
                      value={ex.weight_kg}
                      onChange={(e) => updateExercise(index, { weight_kg: e.target.value })}
                      type="number"
                      placeholder="kg"
                      className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  )}
                  {ex.is_timed && (
                    <input
                      value={ex.duration_seconds}
                      onChange={(e) =>
                        updateExercise(index, { duration_seconds: e.target.value })
                      }
                      type="number"
                      placeholder="Seconds"
                      className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                    />
                  )}
                  <input
                    value={ex.rest_seconds}
                    onChange={(e) => updateExercise(index, { rest_seconds: e.target.value })}
                    type="number"
                    placeholder="Rest (s)"
                    className="w-20 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={ex.is_bodyweight}
                      onChange={(e) =>
                        updateExercise(index, { is_bodyweight: e.target.checked })
                      }
                    />
                    Bodyweight
                  </label>
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={ex.is_timed}
                      onChange={(e) => updateExercise(index, { is_timed: e.target.checked })}
                    />
                    Timed
                  </label>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={addExercise}
            className="mt-2 flex items-center gap-1 text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            <Plus size={14} /> Add exercise
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save template"}
          </button>
        </div>
      </div>
    </div>
  );
}
