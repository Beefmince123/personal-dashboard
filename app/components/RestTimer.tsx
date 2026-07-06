"use client";

import { useEffect, useState } from "react";
import { Pause, Play, SkipForward } from "lucide-react";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface RestTimerProps {
  seconds: number;
  onComplete: () => void;
  onSkip: () => void;
}

/** Countdown for rest periods between sets/exercises. Auto-fires onComplete
 * at zero; onSkip lets the user cut rest short. */
export function RestTimer({ seconds, onComplete, onSkip }: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(true);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const pct = seconds > 0 ? Math.max(0, Math.min(100, (remaining / seconds) * 100)) : 0;

  return (
    <div className="rounded-md bg-blue-50 p-4 text-center">
      <p className="mb-2 text-sm font-medium text-blue-700">Rest</p>
      <p className="mb-3 font-mono text-4xl font-bold tabular-nums text-blue-900">
        {formatTime(remaining)}
      </p>
      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? "Pause" : "Resume"}
        </button>
        <button
          onClick={onSkip}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-blue-100"
        >
          <SkipForward size={14} />
          Skip
        </button>
      </div>
    </div>
  );
}
