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
  /** Shown above the clock — "Rest" between sets, or "Hold" for a timed stretch. */
  label?: string;
  /** false requires an explicit tap to start (used for mobility holds, where
   * the point is to start the countdown only once you're actually in the
   * position); true (the default) keeps rest-between-sets starting immediately. */
  autoStart?: boolean;
}

/** Countdown for rest periods (or timed holds). Auto-fires onComplete at
 * zero; onSkip lets the user cut it short. */
export function RestTimer({
  seconds,
  onComplete,
  onSkip,
  label = "Rest",
  autoStart = true,
}: RestTimerProps) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const [started, setStarted] = useState(autoStart);

  useEffect(() => {
    setRemaining(seconds);
    setRunning(autoStart);
    setStarted(autoStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <p className="mb-2 text-sm font-medium text-blue-700">{label}</p>
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
        {!started ? (
          <button
            onClick={() => {
              setStarted(true);
              setRunning(true);
            }}
            className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
          >
            <Play size={14} />
            Start
          </button>
        ) : (
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex items-center gap-1 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? "Pause" : "Resume"}
          </button>
        )}
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
