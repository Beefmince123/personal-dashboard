"use client";

import { useState } from "react";
import { Header } from "./components/Header";
import { WorkoutSchedule } from "./components/WorkoutSchedule";
import { WaterCard } from "./components/WaterCard";
import { TodoListCard } from "./components/TodoListCard";
import { HabitsCard } from "./components/HabitsCard";
import { DevotionalCard } from "./components/DevotionalCard";

export default function Home() {
  const [water, setWater] = useState({ cups: 0, goal: 8 });
  const [habits, setHabits] = useState({ completed: 0, total: 0 });
  const [devotionalStreak, setDevotionalStreak] = useState(0);

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-4 p-4 sm:p-6 lg:grid-cols-2">
      <Header
        waterCups={water.cups}
        waterGoalCups={water.goal}
        habitsCompleted={habits.completed}
        habitsTotal={habits.total}
        devotionalStreak={devotionalStreak}
      />

      <WorkoutSchedule />
      <WaterCard onChange={(cups, goal) => setWater({ cups, goal })} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-3">
        <TodoListCard />
        <HabitsCard onChange={(completed, total) => setHabits({ completed, total })} />
        <DevotionalCard onChange={setDevotionalStreak} />
      </div>
    </main>
  );
}
