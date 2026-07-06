import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";
import { TaskCard } from "./TaskCard";

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

export function KanbanColumn({ status, tasks, onTaskClick }: KanbanColumnProps) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border-t-2 min-h-[200px]",
        "bg-surface-raised/40",
        COLUMN_ACCENT[status]
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

      <div className="flex-1 space-y-2 px-2 pb-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
        ))}

        {tasks.length === 0 && (
          <p className="text-xs text-zinc-600 text-center py-8">Empty</p>
        )}
      </div>
    </div>
  );
}
