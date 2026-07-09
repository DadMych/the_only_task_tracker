"use client";

import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { TaskCard } from "./TaskCard";
import { useDroppable } from "@dnd-kit/core";

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  backlog: "border-status-backlog/30",
  in_progress: "border-status-progress/30",
  review: "border-status-review/30",
  done: "border-status-done/30",
};

const COLUMN_DOT: Record<TaskStatus, string> = {
  backlog: "bg-status-backlog",
  in_progress: "bg-status-progress",
  review: "bg-status-review",
  done: "bg-status-done",
};

export function KanbanColumn({
  status,
  tasks,
  onTaskClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border-t-2 min-h-[240px]",
        "bg-surface-raised/40 transition-colors duration-200",
        COLUMN_ACCENT[status],
        isOver && "bg-accent/5 ring-1 ring-accent/20"
      )}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <span className={cn("w-2 h-2 rounded-full", COLUMN_DOT[status])} />
        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {STATUS_LABELS[status]}
        </h2>
        <span className="ml-auto text-xs text-zinc-600 tabular-nums">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 px-2 pb-2 min-h-[180px] rounded-lg transition-colors duration-200",
          isOver && "bg-accent/[0.03]"
        )}
      >
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}

        {tasks.length === 0 && (
          <p
            className={cn(
              "text-xs text-center py-8 rounded-lg border border-dashed transition-colors duration-200",
              isOver
                ? "text-accent-muted border-accent/30 bg-accent/5"
                : "text-zinc-600 border-white/[0.04]"
            )}
          >
            {isOver ? "Drop here" : "Empty"}
          </p>
        )}
      </div>
    </div>
  );
}
