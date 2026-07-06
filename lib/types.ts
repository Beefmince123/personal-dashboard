export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateExercise {
  id: string;
  template_id: string;
  exercise_name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  is_bodyweight: boolean;
  is_timed: boolean;
  duration_seconds: number | null;
  rest_seconds: number | null;
  order_index: number;
  created_at: string;
}

export interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  exercises: TemplateExercise[];
}

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export interface WorkoutScheduleEntry {
  id: string;
  day_of_week: DayOfWeek;
  template_id: string;
  created_at: string;
}

export interface WorkoutScheduleWithTemplate extends WorkoutScheduleEntry {
  template: WorkoutTemplateWithExercises | null;
}

export interface CompletedWorkout {
  id: string;
  template_id: string | null;
  date: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface CompletedExercise {
  id: string;
  completed_workout_id: string;
  exercise_name: string;
  sets_completed: number | null;
  reps_completed: number | null;
  weight_used_kg: number | null;
  duration_seconds: number | null;
  rest_seconds: number | null;
  notes: string | null;
  created_at: string;
}

export interface CompletedWorkoutWithExercises extends CompletedWorkout {
  template: WorkoutTemplate | null;
  exercises: CompletedExercise[];
}

export interface WaterLog {
  id: string;
  date: string;
  cups: number;
  cup_size_ml: number;
  updated_at: string;
}

export interface Habit {
  id: string;
  name: string;
  created_at: string;
}

export interface HabitWithStatus extends Habit {
  completed_today: boolean;
  streak: number;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
  created_at: string;
}

export interface DailyTodo {
  id: string;
  date: string;
  task: string;
  completed: boolean;
  order_index: number;
  created_at: string;
}

export interface Devotional {
  id: string;
  quote: string;
  reference: string | null;
  streak_count: number;
  last_completed_date: string | null;
  updated_at: string;
}

export type ActivityLevel = "sedentary" | "light" | "moderate" | "intense";

export interface PersonalInfo {
  id: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  activity_level: ActivityLevel;
  created_at: string | null;
  updated_at: string | null;
}
