"use client";

import { useEffect, useState } from "react";
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

function motivationalMessage(hour: number) {
  if (hour < 6) return "Sweet dreams";
  if (hour < 9) return "Good morning, let's go!";
  if (hour < 12) return "You got this!";
  if (hour < 15) return "Keep pushing!";
  if (hour < 18) return "Almost there!";
  if (hour < 21) return "Finish strong!";
  return "Rest well";
}

function dayProgressPercent(date: Date) {
  const secondsSinceMidnight = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
  return (secondsSinceMidnight / 86400) * 100;
}

function Badge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-gray-800">
      {icon}
      {label}
    </span>
  );
}

const RING_SIZE = 64;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function DayProgressRing({ percent }: { percent: number }) {
  const offset = RING_CIRCUMFERENCE * (1 - percent / 100);

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
      <svg width={RING_SIZE} height={RING_SIZE} className="-rotate-90">
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RING_RADIUS}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-gray-700">{Math.round(percent)}%</span>
    </div>
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

  // Starts null so the very first client render matches the server-rendered
  // HTML exactly (both show the 0%/blank fallback below); the effect then
  // fills in the real, continuously-updating value — avoiding a hydration
  // mismatch on a value that changes every second (unlike the twice-a-day
  // `greeting()` bucket above, which is low-risk enough to compute directly).
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const percent = now ? dayProgressPercent(now) : 0;
  const motivational = now ? motivationalMessage(now.getHours()) : "";

  return (
    <header className="col-span-full rounded-lg bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-sm text-gray-500">{today}</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{greeting()}, Daniel</h1>
          </div>
          <div className="flex items-center gap-3 border-l border-gray-100 pl-4">
            <DayProgressRing percent={percent} />
            <div className="leading-tight">
              <p className="text-xs font-medium text-gray-500">
                {Math.round(percent)}% of day complete
              </p>
              <p className="text-sm font-semibold text-blue-600">{motivational}</p>
            </div>
          </div>
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
