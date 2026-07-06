import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

interface StatsBarProps {
  stats: Record<TaskStatus, number>;
}

const STAT_COLORS: Record<TaskStatus, string> = {
  backlog: "bg-status-backlog",
  in_progress: "bg-status-progress",
  review: "bg-status-review",
  done: "bg-status-done",
};

export function StatsBar({ stats }: StatsBarProps) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div className="glass rounded-xl p-4 mb-6 animate-slide-up">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-zinc-500 uppercase tracking-wider">
          Overview
        </span>
        <span className="text-xs text-zinc-400">
          {total} {total === 1 ? "task" : "tasks"}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
          <div key={status} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <span
                className={cn("w-2 h-2 rounded-full", STAT_COLORS[status])}
              />
              <span className="text-2xl font-semibold tabular-nums">
                {stats[status]}
              </span>
            </div>
            <span className="text-[11px] text-zinc-500">
              {STATUS_LABELS[status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
