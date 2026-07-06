"use client";

import { useEffect, useState } from "react";
import { Droplet, Pencil, RotateCcw, Settings } from "lucide-react";
import clsx from "clsx";
import { Card } from "./Card";
import { PersonalInfoModal } from "./PersonalInfoModal";
import { apiGet, apiPost } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { todayISO } from "@/lib/date";
import { calculateDailyWaterMl } from "@/lib/hydration";
import type { PersonalInfo, WaterLog } from "@/lib/types";

const DEFAULT_PERSONAL_INFO: PersonalInfo = {
  id: null,
  weight_kg: null,
  height_cm: null,
  age: null,
  activity_level: "moderate",
  created_at: null,
  updated_at: null,
};

export function WaterCard({ onChange }: { onChange?: (cups: number, goal: number) => void }) {
  const [log, setLog] = useState<WaterLog | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(DEFAULT_PERSONAL_INFO);
  const [loading, setLoading] = useState(true);
  const [editingSize, setEditingSize] = useState(false);
  const [sizeInput, setSizeInput] = useState("250");
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);

  const today = todayISO();

  async function load() {
    const [waterData, personalData] = await Promise.all([
      apiGet<WaterLog>(`/api/water-logs?date=${today}`),
      apiGet<PersonalInfo>("/api/personal-info"),
    ]);
    setLog(waterData);
    setPersonalInfo(personalData);
    setSizeInput(String(waterData.cup_size_ml));
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeRefresh(["water_logs", "personal_info"], load);

  const dailyWaterMl = calculateDailyWaterMl(personalInfo.weight_kg, personalInfo.activity_level);
  const goalCups = log ? Math.max(1, Math.ceil(dailyWaterMl / log.cup_size_ml)) : 0;

  // Derived from current `log`, so the Header badge tracks every optimistic
  // update (and revert) automatically instead of each handler reporting it.
  useEffect(() => {
    if (log) onChange?.(log.cups, goalCups);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [log, goalCups]);

  async function setCups(cups: number) {
    if (!log) return;
    const target = Math.max(0, cups);
    const previous = log;
    setLog({ ...log, cups: target });

    try {
      const data = await apiPost<WaterLog>("/api/water-logs", { date: today, cups: target });
      setLog(data);
    } catch {
      setLog(previous);
    }
  }

  async function saveCupSize() {
    const size = parseInt(sizeInput, 10);
    setEditingSize(false);
    if (Number.isNaN(size) || size <= 0 || !log) return;

    const previous = log;
    setLog({ ...log, cup_size_ml: size });

    try {
      const data = await apiPost<WaterLog>("/api/water-logs", {
        date: today,
        cup_size_ml: size,
      });
      setLog(data);
    } catch {
      setLog(previous);
      setSizeInput(String(previous.cup_size_ml));
    }
  }

  if (loading || !log) {
    return (
      <Card title="Water" icon={<Droplet size={18} className="text-blue-500" />}>
        <p className="text-sm text-gray-400">Loading…</p>
      </Card>
    );
  }

  return (
    <Card
      title="Water"
      icon={<Droplet size={18} className="text-blue-500" />}
      actions={
        <>
          <button
            onClick={() => setShowPersonalInfo(true)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
            aria-label="Edit personal info"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={() => setCups(0)}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-100"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </>
      }
    >
      <p className="mb-4 text-3xl font-bold text-gray-900">
        {log.cups}
        <span className="text-lg font-normal text-gray-400">/{goalCups} cups</span>
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: goalCups }).map((_, i) => {
          const filled = i < log.cups;
          return (
            <button
              key={i}
              onClick={() => setCups(filled && i === log.cups - 1 ? i : i + 1)}
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-md border transition-colors",
                filled
                  ? "border-blue-200 bg-blue-100 text-blue-600"
                  : "border-gray-200 bg-gray-50 text-gray-300 hover:border-blue-200"
              )}
              aria-label={`Cup ${i + 1}`}
            >
              <Droplet size={18} fill={filled ? "currentColor" : "none"} />
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setCups(log.cups + 1)}
          className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
        >
          + Add cup
        </button>

        {editingSize ? (
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <input
              type="number"
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              className="w-16 rounded-md border border-gray-200 px-2 py-1"
              autoFocus
            />
            <span>ml</span>
            <button
              onClick={saveCupSize}
              className="rounded-md px-2 py-1 font-medium text-blue-700 hover:bg-blue-50"
            >
              Save
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditingSize(true)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
          >
            <Pencil size={12} />
            {log.cup_size_ml}ml / cup
          </button>
        )}
      </div>

      {showPersonalInfo && (
        <PersonalInfoModal
          personalInfo={personalInfo}
          onClose={() => setShowPersonalInfo(false)}
          onSaved={load}
        />
      )}
    </Card>
  );
}
