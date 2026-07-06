## Personal Dashboard

A daily dashboard for workouts, water intake, habits, a daily to-do list, and
a devotional streak, backed by Supabase (no auth — a single shared dataset
via the public anon client).

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a Supabase project, then run [`supabase/schema.sql`](supabase/schema.sql)
   in the Supabase SQL editor to create the tables, RLS policies, and a seed
   devotional row. If you have an older copy of this project's database, note
   that this script **drops** the old free-form `workouts`/`workout_exercises`
   tables in favor of the template/schedule/completed-workout system described
   below, and drops the old `goals` table in favor of `daily_todos` — back up
   anything you want to keep first.
3. Copy `.env.local.example` to `.env.local` and fill in your project's URL and
   anon key (Project Settings → API):
   ```bash
   cp .env.local.example .env.local
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```

### Deploying to Vercel

Push this repo to GitHub and import it in Vercel, or run `vercel`. Add
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment
variables in the Vercel project settings — the build succeeds without them
(falls back to a placeholder client), but API routes need real credentials to
read/write data at runtime.

### Structure

- `app/api/*` — route handlers backing each card (workout-templates,
  template-exercises, workout-schedule, completed-workouts,
  completed-exercises, water-logs, habits, habit-logs, daily-todos,
  devotional, personal-info).
- `app/components/*` — dashboard cards and modals.
- `lib/supabase.ts` — public Supabase client.
- `lib/types.ts` — shared row types.
- `supabase/schema.sql` — table definitions and RLS policies.

### Workout system

Workouts are template-based, similar to Hevy:

- **Templates** (`workout_templates` + `template_exercises`) are reusable
  routines like "Push" or "Muay Thai", each with an ordered exercise list
  (sets/reps/weight, or bodyweight, or timed).
- **Schedule** (`workout_schedule`) assigns one template per day of the week;
  the dashboard looks up today's day of week to show "Today's Workout".
- **Completed workouts** (`completed_workouts` + `completed_exercises`) are
  logged sessions, created when you start a workout and filled in as you go.
  Workout streak = consecutive days with a completed workout, any template.
- Manage templates and the weekly schedule from the settings icon on the
  Workout card; view past sessions and per-exercise progress graphs from the
  history icon.
