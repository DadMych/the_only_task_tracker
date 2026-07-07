"use client";

import { cn } from "@/lib/utils";
import type {
  Task,
  TaskCategory,
  TaskImportance,
  TaskSite,
  TaskStatus,
  TaskUrgency,
} from "@/lib/types";
import {
  CATEGORY_LABELS,
  IMPORTANCE_LABELS,
  SITE_LABELS,
  STATUS_LABELS,
  TASK_CATEGORIES,
  TASK_SITES,
  URGENCY_LABELS,
} from "@/lib/types";
import type { SessionUser } from "@/lib/types";
import { TaskComments } from "./TaskComments";
import { TaskScreenshots } from "./TaskScreenshots";

interface TaskModalProps {
  task: Task;
  user: SessionUser;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "text-status-backlog",
  in_progress: "text-status-progress",
  review: "text-status-review",
  done: "text-status-done",
};

const IMPORTANCE_COLORS: Record<TaskImportance, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

export function TaskModal({ task, user, onClose, onUpdate }: TaskModalProps) {
  async function patch(updates: Partial<Task>) {
    await fetch("/api/tasks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: task.id, ...updates }),
    });
    onUpdate();
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks?id=${task.id}`, { method: "DELETE" });
    onClose();
    onUpdate();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      <div
        className="relative glass rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn-ghost !p-1.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <input
          className="input-field text-base font-medium mb-4 pr-10"
          defaultValue={task.title}
          onBlur={(e) => {
            if (e.target.value.trim() && e.target.value !== task.title) {
              patch({ title: e.target.value.trim() });
            }
          }}
        />

        <textarea
          className="input-field resize-none h-28 mb-5"
          placeholder="Add a description..."
          defaultValue={task.description}
          onBlur={(e) => {
            if (e.target.value !== task.description) {
              patch({ description: e.target.value });
            }
          }}
        />

        <div className="space-y-4">
          <SelectField
            label="Site"
            value={task.site}
            options={TASK_SITES.map((s) => ({
              value: s,
              label: SITE_LABELS[s],
            }))}
            onChange={(v) => patch({ site: v as TaskSite })}
          />

          <ChipField
            label="Category"
            value={task.category}
            options={TASK_CATEGORIES.map((c) => ({
              value: c,
              label: CATEGORY_LABELS[c],
            }))}
            onChange={(v) => patch({ category: v as TaskCategory })}
          />

          <ChipField
            label="Urgency"
            value={task.urgency}
            options={(Object.keys(URGENCY_LABELS) as TaskUrgency[]).map(
              (u) => ({ value: u, label: URGENCY_LABELS[u] })
            )}
            onChange={(v) => patch({ urgency: v as TaskUrgency })}
            urgentValue="urgent"
          />

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              Importance
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(IMPORTANCE_LABELS) as TaskImportance[]).map((i) => (
                <button
                  key={i}
                  onClick={() => patch({ importance: i })}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    task.importance === i
                      ? "bg-white/10 ring-1 ring-white/20"
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  )}
                >
                  <span
                    className={cn(
                      "w-2.5 h-2.5 rounded-full",
                      IMPORTANCE_COLORS[i]
                    )}
                  />
                  {IMPORTANCE_LABELS[i]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => patch({ status: s })}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    task.status === s
                      ? "bg-accent/20 ring-1 ring-accent/30 " + STATUS_COLORS[s]
                      : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  )}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <TaskScreenshots taskId={task.id} />
        <TaskComments taskId={task.id} user={user} />

        <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
          <span className="text-[11px] text-zinc-600 font-mono">
            {task.id.slice(0, 8)}
          </span>
          <button
            onClick={handleDelete}
            className="btn-ghost text-red-400/70 hover:text-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <select
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ChipField({
  label,
  value,
  options,
  onChange,
  urgentValue,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  urgentValue?: string;
}) {
  return (
    <div>
      <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              value === o.value
                ? o.value === urgentValue
                  ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
                  : "bg-accent/20 text-accent-muted ring-1 ring-accent/30"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
