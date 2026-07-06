"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { apiPost } from "@/lib/api";
import { todayISO } from "@/lib/date";

interface MuayThaiCheckboxProps {
  templateId: string;
  completedToday: boolean;
  onComplete: () => void;
}

// No delete endpoint on completed-workouts, so — like the devotional "mark
// complete" button — this only supports checking in, not undoing it.
export function MuayThaiCheckbox({ templateId, completedToday, onComplete }: MuayThaiCheckboxProps) {
  const [saving, setSaving] = useState(false);

  async function markAttended() {
    if (completedToday || saving) return;
    setSaving(true);
    try {
      await apiPost("/api/completed-workouts", {
        template_id: templateId,
        date: todayISO(),
      });
      onComplete();
    } finally {
      setSaving(false);
    }
  }

  return (
    <label
      className={clsx(
        "flex items-center gap-3 rounded-md p-3 transition-colors",
        completedToday ? "bg-blue-50" : "cursor-pointer bg-gray-50 hover:bg-gray-100"
      )}
    >
      <span
        className={clsx(
          "flex h-5 w-5 items-center justify-center rounded-md border",
          completedToday ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"
        )}
      >
        {completedToday && <Check size={14} />}
      </span>
      <input
        type="checkbox"
        checked={completedToday}
        disabled={completedToday || saving}
        onChange={markAttended}
        className="sr-only"
      />
      <span
        className={clsx(
          "text-sm font-medium",
          completedToday ? "text-blue-700" : "text-gray-700"
        )}
      >
        Attended class today
      </span>
    </label>
  );
}
