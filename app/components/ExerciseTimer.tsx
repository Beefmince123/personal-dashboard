"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface ExerciseTimerProps {
  onTick?: (seconds: number) => void;
}

/** Count-up stopwatch for timed exercises (planks, holds, etc). Exposes the
 * elapsed seconds to the parent on every tick so it can be logged when the
 * set is marked complete. */
export function ExerciseTimer({ onTick }: ExerciseTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        onTick?.(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-3xl font-bold tabular-nums text-gray-900">
        {formatTime(seconds)}
      </span>
      <button
        onClick={() => setRunning((r) => !r)}
        className="rounded-md bg-blue-100 p-2 text-blue-700 hover:bg-blue-200"
        aria-label={running ? "Pause" : "Start"}
      >
        {running ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button
        onClick={() => {
          setSeconds(0);
          setRunning(false);
        }}
        className="rounded-md p-2 text-gray-400 hover:bg-gray-100"
        aria-label="Reset"
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}
