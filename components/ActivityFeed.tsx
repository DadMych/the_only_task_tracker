import { formatRelative } from "@/lib/utils";
import type { Activity } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

interface ActivityFeedProps {
  activity: Activity[];
}

const ACTION_LABELS: Record<string, string> = {
  created: "created",
  updated: "updated",
  deleted: "deleted",
  commented: "commented on",
};

export function ActivityFeed({ activity }: ActivityFeedProps) {
  if (activity.length === 0) {
    return (
      <div className="glass rounded-xl p-5 animate-slide-up">
        <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
          Activity
        </h2>
        <p className="text-sm text-zinc-500 text-center py-4">
          No activity yet
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-5 animate-slide-up">
      <h2 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
        Activity
      </h2>
      <ul className="space-y-3 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
        {activity.map((item) => (
          <li key={item.id} className="group">
            <div className="flex gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent/60 shrink-0 group-first:bg-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-300 leading-snug">
                  <span className="text-zinc-500">
                    {ROLE_LABELS[item.actor]}
                  </span>{" "}
                  {ACTION_LABELS[item.action] ?? item.action}{" "}
                  <span className="text-zinc-100 font-medium">
                    &ldquo;{item.task_title}&rdquo;
                  </span>
                </p>
                {item.details && (
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {item.details}
                  </p>
                )}
                <p className="text-[11px] text-zinc-600 mt-1">
                  {formatRelative(item.created_at)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
