"use client";

import { useCallback, useEffect, useState } from "react";
import { cn, formatRelative } from "@/lib/utils";
import type { Comment, CommentNode, Role, SessionUser } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

interface TaskCommentsProps {
  taskId: string;
  user: SessionUser;
}

function buildTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  for (const c of comments) {
    nodes.set(c.id, { ...c, replies: [] });
  }

  for (const c of comments) {
    const node = nodes.get(c.id)!;
    if (c.parent_id) {
      nodes.get(c.parent_id)?.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export function TaskComments({ taskId, user }: TaskCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({ owner: "", boss: "" });
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveComment(text: string, parentId?: string) {
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, parent_id: parentId }),
      });
      if (res.ok) {
        setReplyTo(null);
        setReplyText("");
        await load();
      }
    } finally {
      setSaving(false);
    }
  }

  const tree = buildTree(comments);
  const ownerThreads = tree.filter((c) => c.author === "owner");
  const bossThreads = tree.filter((c) => c.author === "boss");

  return (
    <div className="mt-6 pt-5 border-t border-white/5">
      <h3 className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
        Comments
      </h3>

      {loading ? (
        <p className="text-sm text-zinc-500 text-center py-4">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CommentColumn
            role="owner"
            label={ROLE_LABELS.owner}
            threads={ownerThreads}
            currentRole={user.role}
            draft={drafts.owner}
            onDraftChange={(v) => setDrafts((d) => ({ ...d, owner: v }))}
            onSave={() => {
              saveComment(drafts.owner).then(() =>
                setDrafts((d) => ({ ...d, owner: "" }))
              );
            }}
            saving={saving}
            replyTo={replyTo}
            replyText={replyText}
            onReply={(id) => {
              setReplyTo(id);
              setReplyText("");
            }}
            onCancelReply={() => {
              setReplyTo(null);
              setReplyText("");
            }}
            onReplyTextChange={setReplyText}
            onSaveReply={() => saveComment(replyText, replyTo ?? undefined)}
          />
          <CommentColumn
            role="boss"
            label={ROLE_LABELS.boss}
            threads={bossThreads}
            currentRole={user.role}
            draft={drafts.boss}
            onDraftChange={(v) => setDrafts((d) => ({ ...d, boss: v }))}
            onSave={() => {
              saveComment(drafts.boss).then(() =>
                setDrafts((d) => ({ ...d, boss: "" }))
              );
            }}
            saving={saving}
            replyTo={replyTo}
            replyText={replyText}
            onReply={(id) => {
              setReplyTo(id);
              setReplyText("");
            }}
            onCancelReply={() => {
              setReplyTo(null);
              setReplyText("");
            }}
            onReplyTextChange={setReplyText}
            onSaveReply={() => saveComment(replyText, replyTo ?? undefined)}
          />
        </div>
      )}
    </div>
  );
}

function CommentColumn({
  role,
  label,
  threads,
  currentRole,
  draft,
  onDraftChange,
  onSave,
  saving,
  replyTo,
  replyText,
  onReply,
  onCancelReply,
  onReplyTextChange,
  onSaveReply,
}: {
  role: Role;
  label: string;
  threads: CommentNode[];
  currentRole: Role;
  draft: string;
  onDraftChange: (v: string) => void;
  onSave: () => void;
  saving: boolean;
  replyTo: string | null;
  replyText: string;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onReplyTextChange: (v: string) => void;
  onSaveReply: () => void;
}) {
  const isOwnColumn = currentRole === role;

  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        role === "owner"
          ? "border-accent/20 bg-accent/5"
          : "border-amber-500/20 bg-amber-500/5"
      )}
    >
      <p className="text-xs font-medium text-zinc-400 mb-3">{label}</p>

      {isOwnColumn && (
        <div className="mb-4 space-y-2">
          <textarea
            className="input-field resize-none h-20 text-sm"
            placeholder="Write a comment..."
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary text-xs py-1.5 px-3"
            disabled={saving || !draft.trim()}
            onClick={onSave}
          >
            Save comment
          </button>
        </div>
      )}

      {threads.length === 0 ? (
        <p className="text-xs text-zinc-600 py-2">No comments yet</p>
      ) : (
        <ul className="space-y-3">
          {threads.map((node) => (
            <CommentThread
              key={node.id}
              node={node}
              replyTo={replyTo}
              replyText={replyText}
              saving={saving}
              onReply={onReply}
              onCancelReply={onCancelReply}
              onReplyTextChange={onReplyTextChange}
              onSaveReply={onSaveReply}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CommentThread({
  node,
  depth = 0,
  replyTo,
  replyText,
  saving,
  onReply,
  onCancelReply,
  onReplyTextChange,
  onSaveReply,
}: {
  node: CommentNode;
  depth?: number;
  replyTo: string | null;
  replyText: string;
  saving: boolean;
  onReply: (id: string) => void;
  onCancelReply: () => void;
  onReplyTextChange: (v: string) => void;
  onSaveReply: () => void;
}) {
  const isReplying = replyTo === node.id;

  return (
    <li className={cn(depth > 0 && "ml-4 pl-3 border-l border-white/10")}>
      <div className="rounded-lg bg-surface-overlay/60 p-3">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span
            className={cn(
              "text-[11px] font-medium",
              node.author === "owner" ? "text-accent-muted" : "text-amber-400/80"
            )}
          >
            {ROLE_LABELS[node.author]}
          </span>
          <span className="text-[10px] text-zinc-600">
            {formatRelative(node.created_at)}
          </span>
        </div>
        <p className="text-sm text-zinc-200 leading-snug whitespace-pre-wrap">
          {node.body}
        </p>
        {!isReplying ? (
          <button
            type="button"
            className="btn-ghost text-[11px] !px-0 mt-2 text-zinc-500"
            onClick={() => onReply(node.id)}
          >
            Reply
          </button>
        ) : (
          <div className="mt-3 space-y-2">
            <textarea
              autoFocus
              className="input-field resize-none h-16 text-sm"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => onReplyTextChange(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="btn-primary text-xs py-1 px-2.5"
                disabled={saving || !replyText.trim()}
                onClick={onSaveReply}
              >
                Save reply
              </button>
              <button
                type="button"
                className="btn-ghost text-xs py-1 px-2"
                onClick={onCancelReply}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {node.replies.length > 0 && (
        <ul className="mt-2 space-y-2">
          {node.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              node={reply}
              depth={depth + 1}
              replyTo={replyTo}
              replyText={replyText}
              saving={saving}
              onReply={onReply}
              onCancelReply={onCancelReply}
              onReplyTextChange={onReplyTextChange}
              onSaveReply={onSaveReply}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
