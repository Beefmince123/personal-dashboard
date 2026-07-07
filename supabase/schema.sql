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
  -- Sub-heading for grouping exercises within a template (e.g. mobility's
  -- Warm-Up/Dynamic Mobility/Static Stretching/Finisher). Null for templates
  -- that don't group exercises (existing PPL templates render as a flat list).
  section text,
  -- Whether this exercise is part of a template's shorter "quick" variant.
  -- Defaults to true so existing exercises are unaffected.
  include_in_quick boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists template_exercises_template_id_idx on template_exercises (template_id);
alter table template_exercises add column if not exists section text;
alter table template_exercises add column if not exists include_in_quick boolean not null default true;

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

-- MOBILITY ROUTINE SEED ---------------------------------------------------
-- Seeds a "Mobility" template (a daily flow, not tied to any day_of_week —
-- it's meant to run alongside whatever's scheduled, so it deliberately
-- isn't wired into workout_schedule, which only allows one template per
-- day). Grouped into sections; a handful of exercises are excluded from
-- the "quick" variant (chest stretch + finisher). Safe to re-run: skips if
-- a "Mobility" template already exists.
do $$
declare
  v_template_id uuid;
begin
  if not exists (select 1 from workout_templates where name = 'Mobility') then
    insert into workout_templates (name, description)
    values ('Mobility', 'Daily 10-15 minute mobility flow')
    returning id into v_template_id;

    insert into template_exercises
      (template_id, section, exercise_name, sets, reps, is_bodyweight, is_timed, duration_seconds, include_in_quick, order_index)
    values
      (v_template_id, 'Warm-Up', 'Cat-cow flows', 1, 10, true, false, null, true, 0),
      (v_template_id, 'Warm-Up', 'Arm circles (forward & back)', 2, 10, true, false, null, true, 1),
      (v_template_id, 'Warm-Up', 'Bodyweight squats', 1, 10, true, false, null, true, 2),

      (v_template_id, 'Dynamic Mobility', 'Shoulder dislocates (band/broomstick)', 1, 10, true, false, null, true, 3),
      (v_template_id, 'Dynamic Mobility', 'Thread-the-needle rotations (each side)', 2, 5, true, false, null, true, 4),
      (v_template_id, 'Dynamic Mobility', 'World''s greatest stretch (each side)', 2, 3, true, false, null, true, 5),
      (v_template_id, 'Dynamic Mobility', '90/90 hip flows (each direction, each side)', 4, 5, true, false, null, true, 6),
      (v_template_id, 'Dynamic Mobility', 'Deep lunge, hip flexor emphasis (each side)', 2, null, true, true, 20, true, 7),
      (v_template_id, 'Dynamic Mobility', 'Downward dog', 1, null, true, true, 30, true, 8),

      (v_template_id, 'Static Stretching', 'Pigeon pose (each side)', 2, null, true, true, 60, true, 9),
      (v_template_id, 'Static Stretching', 'Sleeper stretch (each side)', 2, null, true, true, 45, true, 10),
      (v_template_id, 'Static Stretching', 'Chest doorway/wall stretch (each side)', 2, null, true, true, 45, false, 11),
      (v_template_id, 'Static Stretching', 'Child''s pose', 1, null, true, true, 45, true, 12),

      (v_template_id, 'Finisher', 'Dead-hang (20-30 sec)', 1, null, true, true, 25, false, 13),
      (v_template_id, 'Finisher', 'Supine spinal twist (each side)', 2, null, true, true, 15, false, 14);
  end if;
end $$;

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

-- DAILY TODOS -------------------------------------------------------------------
-- Replaces the old free-form goals table with a per-day checklist.
-- If you have an existing project with the old goals table, this drops it —
-- back up anything you want to keep before running this.
drop table if exists goals cascade;

create table if not exists daily_todos (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  task text not null,
  completed boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists daily_todos_date_idx on daily_todos (date);

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
alter table daily_todos enable row level security;
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

drop policy if exists "public access" on daily_todos;
create policy "public access" on daily_todos for all using (true) with check (true);

drop policy if exists "public access" on devotional;
create policy "public access" on devotional for all using (true) with check (true);

drop policy if exists "public access" on personal_info;
create policy "public access" on personal_info for all using (true) with check (true);
