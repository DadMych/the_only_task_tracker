"use client";

import { useCallback, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type {
  Activity,
  SessionUser,
  Task,
  TaskStatus,
} from "@/lib/types";
import { STATUS_ORDER } from "@/lib/types";
import { Header } from "./Header";
import { StatsBar } from "./StatsBar";
import { NewTaskForm } from "./NewTaskForm";
import { KanbanColumn } from "./KanbanColumn";
import { ActivityFeed } from "./ActivityFeed";
import { TaskModal } from "./TaskModal";
import { TaskCard, TaskCardOverlay } from "./TaskCard";

interface BoardClientProps {
  initialTasks: Task[];
  initialActivity: Activity[];
  stats: Record<TaskStatus, number>;
  user: SessionUser;
}

export function BoardClient({
  initialTasks,
  initialActivity,
  stats: initialStats,
  user,
}: BoardClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activity, setActivity] = useState(initialActivity);
  const [stats, setStats] = useState(initialStats);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    })
  );

  const refreshActivity = useCallback(async () => {
    const res = await fetch("/api/activity");
    if (res.ok) {
      const data = await res.json();
      setActivity(data.activity);
    }
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks);
      setActivity(data.activity);
      setStats(data.stats);

      if (selectedTask) {
        const updated = data.tasks.find((t: Task) => t.id === selectedTask.id);
        setSelectedTask(updated ?? null);
      }
    }
  }, [selectedTask]);

  const moveTask = useCallback(
    (taskId: string, fromStatus: TaskStatus, toStatus: TaskStatus) => {
      if (fromStatus === toStatus) return;

      const updatedAt = new Date().toISOString();

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: toStatus, updated_at: updatedAt }
            : t
        )
      );
      setStats((prev) => ({
        ...prev,
        [fromStatus]: Math.max(0, prev[fromStatus] - 1),
        [toStatus]: prev[toStatus] + 1,
      }));
      setSelectedTask((prev) =>
        prev?.id === taskId
          ? { ...prev, status: toStatus, updated_at: updatedAt }
          : prev
      );
      setSyncError(null);

      void (async () => {
        try {
          const res = await fetch("/api/tasks", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: taskId, status: toStatus }),
          });

          if (!res.ok) throw new Error("Failed to save");

          void refreshActivity();
        } catch {
          setTasks((prev) =>
            prev.map((t) =>
              t.id === taskId
                ? { ...t, status: fromStatus, updated_at: t.updated_at }
                : t
            )
          );
          setStats((prev) => ({
            ...prev,
            [fromStatus]: prev[fromStatus] + 1,
            [toStatus]: Math.max(0, prev[toStatus] - 1),
          }));
          setSelectedTask((prev) =>
            prev?.id === taskId ? { ...prev, status: fromStatus } : prev
          );
          setSyncError("Could not save move — reverted");
          window.setTimeout(() => setSyncError(null), 4000);
        }
      })();
    },
    [refreshActivity]
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const toStatus = over.id as TaskStatus;
    if (!STATUS_ORDER.includes(toStatus)) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === toStatus) return;

    moveTask(taskId, task.status, toStatus);
  }

  function handleDragCancel() {
    setActiveId(null);
  }

  const tasksByStatus = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  const activeTask = activeId
    ? tasks.find((task) => task.id === activeId)
    : null;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-[1400px] mx-auto">
      <Header user={user} />
      <StatsBar stats={stats} />

      {syncError && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {syncError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div>
          <NewTaskForm onCreated={refresh} />

          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {STATUS_ORDER.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  tasks={tasksByStatus[status]}
                  onTaskClick={setSelectedTask}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 180, easing: "ease-out" }}>
              {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
            </DragOverlay>
          </DndContext>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <ActivityFeed activity={activity} />
        </aside>
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          user={user}
          onClose={() => setSelectedTask(null)}
          onUpdate={refresh}
        />
      )}
    </main>
  );
}
