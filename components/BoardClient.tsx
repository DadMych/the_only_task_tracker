"use client";

import { useCallback, useState } from "react";
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

  const tasksByStatus = STATUS_ORDER.reduce(
    (acc, status) => {
      acc[status] = tasks.filter((t) => t.status === status);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>
  );

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-[1400px] mx-auto">
      <Header user={user} />
      <StatsBar stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        <div>
          <NewTaskForm onCreated={refresh} />

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
