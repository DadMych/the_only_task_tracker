"use client";

import { cn } from "@/lib/utils";
import type { Task, TaskImportance } from "@/lib/types";
import {
  CATEGORY_LABELS,
  SITE_LABELS,
} from "@/lib/types";
import { formatRelative } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

interface TaskCardOverlayProps {
  task: Task;
}

const IMPORTANCE_DOT: Record<TaskImportance, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { task, status: task.status },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => {
        if (!isDragging) onClick();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      role="button"
      tabIndex={0}
      className={cn(
        "w-full text-left rounded-lg p-3.5 touch-none select-none",
        "bg-surface-overlay/60 border border-white/[0.04]",
        "hover:border-accent/20 hover:bg-surface-overlay",
        "transition-[border-color,background-color,box-shadow,opacity] duration-200 group",
        "cursor-grab active:cursor-grabbing",
        task.urgency === "urgent" && "border-red-500/20",
        isDragging && "opacity-35 ring-1 ring-accent/20"
      )}
    >
      <TaskCardContent task={task} />
    </div>
  );
}

export function TaskCardOverlay({ task }: TaskCardOverlayProps) {
  return (
    <div
      className={cn(
        "w-full text-left rounded-lg p-3.5 select-none",
        "bg-surface-overlay border border-white/[0.08]",
        "shadow-2xl shadow-black/40 ring-2 ring-accent/30 scale-[1.02] cursor-grabbing",
        task.urgency === "urgent" && "border-red-500/20"
      )}
    >
      <TaskCardContent task={task} />
    </div>
  );
}

function TaskCardContent({ task }: { task: Task }) {
  return (
    <>
      <div className="flex items-start gap-2 mb-2">
        <span
          className={cn(
            "mt-1.5 w-2 h-2 rounded-full shrink-0",
            IMPORTANCE_DOT[task.importance]
          )}
        />
        <h3 className="text-sm font-medium text-zinc-100 leading-snug group-hover:text-white flex-1">
          {task.title}
        </h3>
        {task.urgency === "urgent" && (
          <span className="text-[10px] text-red-400 font-medium shrink-0">
            ⚡
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2 ml-4">
        <Tag>{SITE_LABELS[task.site]}</Tag>
        <Tag>{CATEGORY_LABELS[task.category]}</Tag>
      </div>

      {task.description && (
        <p className="text-xs text-zinc-500 line-clamp-2 mb-2 ml-4">
          {task.description}
        </p>
      )}

      <p className="text-[11px] text-zinc-600 ml-4">
        {formatRelative(task.updated_at)}
      </p>
    </>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-zinc-400">
      {children}
    </span>
  );
}
