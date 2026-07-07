"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn, formatRelative } from "@/lib/utils";
import type { TaskImage } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

interface TaskScreenshotsProps {
  taskId: string;
}

export function TaskScreenshots({ taskId }: TaskScreenshotsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<TaskImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<TaskImage | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks/${taskId}/images`);
    if (res.ok) {
      const data = await res.json();
      setImages(data.images);
    }
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/tasks/${taskId}/images`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      await load();
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    if (!confirm("Delete this screenshot?")) return;
    await fetch(`/api/tasks/${taskId}/images?imageId=${imageId}`, {
      method: "DELETE",
    });
    setPreview(null);
    await load();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <>
      <div className="mt-6 pt-5 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs text-zinc-500 uppercase tracking-wider">
            Screenshots
          </h3>
          <button
            type="button"
            className="btn-ghost text-xs !py-1"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? "Uploading..." : "+ Upload"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={onFileChange}
          />
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn(
            "rounded-xl border border-dashed border-white/10 p-3",
            "hover:border-accent/30 transition-colors"
          )}
        >
          {loading ? (
            <p className="text-sm text-zinc-500 text-center py-6">Loading...</p>
          ) : images.length === 0 ? (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-full py-8 text-center text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Drop a screenshot here or click Upload
              <span className="block text-[11px] text-zinc-600 mt-1">
                PNG, JPEG, WebP, GIF · max 5 MB
              </span>
            </button>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-video rounded-lg overflow-hidden bg-surface-overlay border border-white/5"
                >
                  <button
                    type="button"
                    className="absolute inset-0"
                    onClick={() => setPreview(image)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.filename}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(image.id)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-md bg-black/70 px-2 py-0.5 text-[10px] text-red-300 hover:text-red-200"
                  >
                    Delete
                  </button>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5">
                    <p className="text-[10px] text-zinc-300 truncate">
                      {image.filename}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {ROLE_LABELS[image.uploaded_by]} ·{" "}
                      {formatRelative(image.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 mt-2 text-center">{error}</p>
          )}
        </div>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-10 right-0 btn-ghost text-zinc-400"
            >
              Close
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.url}
              alt={preview.filename}
              className="max-h-[85vh] w-full object-contain rounded-lg"
            />
            <p className="text-center text-sm text-zinc-400 mt-3">
              {preview.filename}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
