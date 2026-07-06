"use client";

import { useEffect, useState } from "react";
import { ListTodo, Trash2, Plus, Check } from "lucide-react";
import clsx from "clsx";
import { Card } from "./Card";
import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";
import { useRealtimeRefresh } from "@/lib/useRealtimeRefresh";
import { todayISO } from "@/lib/date";
import type { DailyTodo } from "@/lib/types";

export function TodoListCard() {
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTask, setNewTask] = useState("");

  const today = todayISO();

  async function load() {
    const data = await apiGet<DailyTodo[]>(`/api/daily-todos?date=${today}`);
    setTodos(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useRealtimeRefresh(["daily_todos"], load);

  async function toggle(id: string) {
    const wasCompleted = todos.find((t) => t.id === id)?.completed ?? false;

    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !wasCompleted } : t)));

    try {
      await apiPut("/api/daily-todos", { id, completed: !wasCompleted });
    } catch {
      setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: wasCompleted } : t)));
    }
  }

  async function addTodo() {
    if (!newTask.trim()) return;
    const task = newTask.trim();
    setNewTask("");
    setAdding(false);
    const created = await apiPost<DailyTodo>("/api/daily-todos", { task, date: today });
    setTodos((prev) => [...prev, created]);
  }

  async function removeTodo(id: string) {
    const removedIndex = todos.findIndex((t) => t.id === id);
    const removed = todos[removedIndex];
    if (!removed) return;

    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await apiDelete(`/api/daily-todos?id=${id}`);
    } catch {
      setTodos((prev) => {
        const next = [...prev];
        next.splice(Math.min(removedIndex, next.length), 0, removed);
        return next;
      });
    }
  }

  const completedCount = todos.filter((t) => t.completed).length;
  const allDone = todos.length > 0 && completedCount === todos.length;

  return (
    <Card
      title="Today's Tasks"
      icon={<ListTodo size={18} className="text-blue-500" />}
      actions={
        <button
          onClick={() => setAdding((v) => !v)}
          className="flex items-center gap-1 rounded-md bg-blue-100 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
        >
          <Plus size={14} /> Add task
        </button>
      }
    >
      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : (
        <>
          {todos.length > 0 && (
            <span
              className={clsx(
                "mb-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                allDone ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              )}
            >
              {completedCount}/{todos.length} tasks done
            </span>
          )}

          {todos.length === 0 && !adding ? (
            <p className="text-sm text-gray-400">No tasks for today. Add one to get started.</p>
          ) : (
            <ul
              className={clsx(
                "space-y-2 rounded-md",
                allDone && "bg-green-50 p-2"
              )}
            >
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50"
                >
                  <button
                    onClick={() => toggle(todo.id)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={clsx(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        todo.completed ? "border-blue-500 bg-blue-500 text-white" : "border-gray-300"
                      )}
                    >
                      {todo.completed && <Check size={14} />}
                    </span>
                    <span
                      className={clsx(
                        "text-sm",
                        todo.completed ? "text-gray-400 line-through" : "text-gray-800"
                      )}
                    >
                      {todo.task}
                    </span>
                  </button>
                  <button
                    onClick={() => removeTodo(todo.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {adding && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Task"
            className="flex-1 rounded-md border border-gray-200 px-2 py-1.5 text-sm"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
          />
          <button
            onClick={addTodo}
            className="rounded-md bg-blue-100 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-200"
          >
            Add
          </button>
        </div>
      )}
    </Card>
  );
}
