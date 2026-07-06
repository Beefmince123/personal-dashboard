-- Personal Dashboard schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Tables are open to the anon/public role since this app has no auth.

create extension if not exists "pgcrypto";

-- WORKOUTS -------------------------------------------------------------
-- Replaces the old free-form workouts/workout_exercises tables with a
-- template + schedule + completed-session model (Hevy-style):
--   workout_templates   -- reusable routines, e.g. "Push", "Muay Thai"
--   template_exercises  -- the exercise list within a template
--   workout_schedule    -- which template runs on which day of the week
--   completed_workouts  -- a logged session of a template on a given date
--   completed_exercises -- per-exercise results within a completed session
-- If you have an existing project with the old tables, this drops them —
-- back up any logged workout history you want to keep before running this.
drop table if exists workout_exercises cascade;
drop table if exists workouts cascade;

create table if not exists workout_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references workout_templates (id) on delete cascade,
  exercise_name text not null,
  sets int,
  reps int,
  weight_kg numeric,
  is_bodyweight boolean not null default false,
  is_timed boolean not null default false,
  duration_seconds int,
  rest_seconds int,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists template_exercises_template_id_idx on template_exercises (template_id);

create table if not exists workout_schedule (
  id uuid primary key default gen_random_uuid(),
  day_of_week text not null unique check (
    day_of_week in ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
  ),
  template_id uuid not null references workout_templates (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists completed_workouts (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references workout_templates (id) on delete set null,
  date date not null,
  duration_minutes int,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists completed_workouts_date_idx on completed_workouts (date);

create table if not exists completed_exercises (
  id uuid primary key default gen_random_uuid(),
  completed_workout_id uuid not null references completed_workouts (id) on delete cascade,
  exercise_name text not null,
  sets_completed int,
  reps_completed int,
  weight_used_kg numeric,
  duration_seconds int,
  rest_seconds int,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists completed_exercises_workout_id_idx on completed_exercises (completed_workout_id);

-- WATER ------------------------------------------------------------------
create table if not exists water_logs (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  cups int not null default 0,
  cup_size_ml int not null default 250,
  updated_at timestamptz not null default now()
);

-- HABITS -------------------------------------------------------------------
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references habits (id) on delete cascade,
  date date not null,
  completed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);
create index if not exists habit_logs_date_idx on habit_logs (date);

-- GOALS ----------------------------------------------------------------------
create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  target numeric not null default 0,
  current numeric not null default 0,
  unit text,
  created_at timestamptz not null default now()
);

-- DEVOTIONAL -------------------------------------------------------------------
-- Single-row table holding the current quote/reference and streak state.
create table if not exists devotional (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  reference text,
  streak_count int not null default 0,
  last_completed_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into devotional (quote, reference, streak_count)
select 'Trust in the Lord with all your heart, and do not lean on your own understanding.', 'Proverbs 3:5', 0
where not exists (select 1 from devotional);

-- PERSONAL INFO -------------------------------------------------------------------
-- Single-row table (like devotional) used to compute the daily water goal.
create table if not exists personal_info (
  id uuid primary key default gen_random_uuid(),
  weight_kg numeric,
  height_cm int,
  age int,
  activity_level text not null default 'moderate'
    check (activity_level in ('sedentary', 'light', 'moderate', 'intense')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ROW LEVEL SECURITY -------------------------------------------------------------
-- App has no auth layer, so RLS is enabled with permissive policies for the anon key.
alter table workout_templates enable row level security;
alter table template_exercises enable row level security;
alter table workout_schedule enable row level security;
alter table completed_workouts enable row level security;
alter table completed_exercises enable row level security;
alter table water_logs enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table goals enable row level security;
alter table devotional enable row level security;
alter table personal_info enable row level security;

drop policy if exists "public access" on workout_templates;
create policy "public access" on workout_templates for all using (true) with check (true);

drop policy if exists "public access" on template_exercises;
create policy "public access" on template_exercises for all using (true) with check (true);

drop policy if exists "public access" on workout_schedule;
create policy "public access" on workout_schedule for all using (true) with check (true);

drop policy if exists "public access" on completed_workouts;
create policy "public access" on completed_workouts for all using (true) with check (true);

drop policy if exists "public access" on completed_exercises;
create policy "public access" on completed_exercises for all using (true) with check (true);

drop policy if exists "public access" on water_logs;
create policy "public access" on water_logs for all using (true) with check (true);

drop policy if exists "public access" on habits;
create policy "public access" on habits for all using (true) with check (true);

drop policy if exists "public access" on habit_logs;
create policy "public access" on habit_logs for all using (true) with check (true);

drop policy if exists "public access" on goals;
create policy "public access" on goals for all using (true) with check (true);

drop policy if exists "public access" on devotional;
create policy "public access" on devotional for all using (true) with check (true);

drop policy if exists "public access" on personal_info;
create policy "public access" on personal_info for all using (true) with check (true);
