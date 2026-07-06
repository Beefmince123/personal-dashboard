"use client";

import { Check } from "lucide-react";
import clsx from "clsx";

interface MuayThaiCheckboxProps {
  completedToday: boolean;
  onCheck: () => void;
}

// Purely presentational — the parent owns the optimistic update and the API
// call, since it's the one holding the completed-today state and streak.
// No delete endpoint on completed-workouts, so — like the devotional "mark
// complete" button — this only supports checking in, not undoing it.
export function MuayThaiCheckbox({ completedToday, onCheck }: MuayThaiCheckboxProps) {
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
        disabled={completedToday}
        onChange={() => {
          if (!completedToday) onCheck();
        }}
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
