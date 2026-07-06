import type { ActivityLevel } from "./types";

const ACTIVITY_ADJUSTMENT_ML: Record<ActivityLevel, number> = {
  sedentary: 0,
  light: 200,
  moderate: 500,
  intense: 1000,
};

const ML_PER_KG = 35;

// Used until weight is set, so the water card has a sane goal (matches the
// previous hardcoded 8 cups x 250ml default).
export const DEFAULT_DAILY_WATER_ML = 2000;

export function calculateDailyWaterMl(
  weightKg: number | null,
  activityLevel: ActivityLevel
): number {
  if (!weightKg || weightKg <= 0) return DEFAULT_DAILY_WATER_ML;
  return weightKg * ML_PER_KG + ACTIVITY_ADJUSTMENT_ML[activityLevel];
}
