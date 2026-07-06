"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type {
  TaskCategory,
  TaskImportance,
  TaskSite,
  TaskUrgency,
} from "@/lib/types";
import {
  CATEGORY_LABELS,
  IMPORTANCE_LABELS,
  SITE_LABELS,
  TASK_CATEGORIES,
  TASK_SITES,
  URGENCY_LABELS,
} from "@/lib/types";

interface NewTaskFormProps {
  onCreated: () => void;
}

const IMPORTANCE_COLORS: Record<TaskImportance, string> = {
  green: "bg-emerald-500",
  yellow: "bg-amber-400",
  red: "bg-red-500",
};

export function NewTaskForm({ onCreated }: NewTaskFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TaskCategory>("other");
  const [urgency, setUrgency] = useState<TaskUrgency>("not_urgent");
  const [importance, setImportance] = useState<TaskImportance>("yellow");
  const [site, setSite] = useState<TaskSite>("fofgod.com");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          urgency,
          importance,
          site,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setCategory("other");
        setUrgency("not_urgent");
        setImportance("yellow");
        setSite("fofgod.com");
        setOpen(false);
        onCreated();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary w-full mb-4"
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
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        New task
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-xl p-4 mb-4 animate-slide-up space-y-4"
    >
      <input
        autoFocus
        className="input-field"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="input-field resize-none h-20"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Field label="Site">
        <select
          className="input-field"
          value={site}
          onChange={(e) => setSite(e.target.value as TaskSite)}
        >
          {TASK_SITES.map((s) => (
            <option key={s} value={s}>
              {SITE_LABELS[s]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Category">
        <div className="flex flex-wrap gap-2">
          {TASK_CATEGORIES.map((c) => (
            <Chip
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
              label={CATEGORY_LABELS[c]}
            />
          ))}
        </div>
      </Field>

      <Field label="Urgency">
        <div className="flex gap-2">
          {(Object.keys(URGENCY_LABELS) as TaskUrgency[]).map((u) => (
            <Chip
              key={u}
              active={urgency === u}
              onClick={() => setUrgency(u)}
              label={URGENCY_LABELS[u]}
              urgent={u === "urgent"}
            />
          ))}
        </div>
      </Field>

      <Field label="Importance">
        <div className="flex gap-2">
          {(Object.keys(IMPORTANCE_LABELS) as TaskImportance[]).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setImportance(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-all",
                importance === i
                  ? "bg-white/10 ring-1 ring-white/20"
                  : "hover:bg-white/5 text-zinc-500"
              )}
            >
              <span
                className={cn("w-2.5 h-2.5 rounded-full", IMPORTANCE_COLORS[i])}
              />
              {IMPORTANCE_LABELS[i]}
            </button>
          ))}
        </div>
      </Field>

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1" disabled={loading}>
          {loading ? "Saving..." : "Create"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
        {label}
      </span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  label,
  urgent,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  urgent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-2.5 py-1 rounded-md text-xs transition-all",
        active
          ? urgent
            ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/30"
            : "bg-accent/20 text-accent-muted ring-1 ring-accent/30"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
      )}
    >
      {label}
    </button>
  );
}
