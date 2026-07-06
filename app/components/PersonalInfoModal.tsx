"use client";

import { useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { apiPut } from "@/lib/api";
import type { ActivityLevel, PersonalInfo } from "@/lib/types";

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "intense", label: "Intense" },
];

interface PersonalInfoModalProps {
  personalInfo: PersonalInfo;
  onClose: () => void;
  onSaved: () => void;
}

export function PersonalInfoModal({ personalInfo, onClose, onSaved }: PersonalInfoModalProps) {
  const [weightKg, setWeightKg] = useState(
    personalInfo.weight_kg != null ? String(personalInfo.weight_kg) : ""
  );
  const [heightCm, setHeightCm] = useState(
    personalInfo.height_cm != null ? String(personalInfo.height_cm) : ""
  );
  const [age, setAge] = useState(personalInfo.age != null ? String(personalInfo.age) : "");
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    personalInfo.activity_level
  );
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await apiPut("/api/personal-info", {
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        height_cm: heightCm ? parseInt(heightCm, 10) : null,
        age: age ? parseInt(age, 10) : null,
        activity_level: activityLevel,
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Personal info</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Weight (kg)</label>
            <input
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              type="number"
              min="0"
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              placeholder="70"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Height (cm)</label>
            <input
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              type="number"
              min="0"
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              placeholder="175"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Age</label>
            <input
              value={age}
              onChange={(e) => setAge(e.target.value)}
              type="number"
              min="0"
              className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-sm"
              placeholder="30"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Activity level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setActivityLevel(level.value)}
                  className={clsx(
                    "rounded-md border px-2 py-2 text-sm font-medium transition-colors",
                    activityLevel === level.value
                      ? "border-blue-400 bg-blue-100 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-200 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
