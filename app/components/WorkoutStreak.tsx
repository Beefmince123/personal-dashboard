import { Flame } from "lucide-react";

export function WorkoutStreak({ streak }: { streak: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-sm font-medium text-orange-600">
      <Flame size={14} />
      {streak} day{streak === 1 ? "" : "s"} streak
    </span>
  );
}
