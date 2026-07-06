import { Droplet, ListChecks, Flame } from "lucide-react";
import { formatLongDate } from "@/lib/date";

interface HeaderProps {
  waterCups: number;
  waterGoalCups: number;
  habitsCompleted: number;
  habitsTotal: number;
  devotionalStreak: number;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-gray-800">
      {icon}
      {label}
    </span>
  );
}

export function Header({
  waterCups,
  waterGoalCups,
  habitsCompleted,
  habitsTotal,
  devotionalStreak,
}: HeaderProps) {
  const today = formatLongDate(new Date());

  return (
    <header className="col-span-full rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-500">{today}</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{greeting()}, Daniel</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge
            icon={<Droplet size={14} />}
            label={`Water: ${waterCups}/${waterGoalCups}`}
          />
          <Badge
            icon={<ListChecks size={14} />}
            label={`Habits: ${habitsCompleted}/${habitsTotal}`}
          />
          <Badge icon={<Flame size={14} />} label={`Streak: ${devotionalStreak}d`} />
        </div>
      </div>
    </header>
  );
}
