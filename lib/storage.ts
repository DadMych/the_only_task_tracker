import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export function validateImage(file: File): string | null {
  if (!ALLOWED.has(file.type)) {
    return "Only PNG, JPEG, WebP, and GIF images are allowed";
  }
  if (file.size > MAX_BYTES) {
    return "Image must be 5 MB or smaller";
  }
  return null;
}

export async function storeImage(
  taskId: string,
  file: File
): Promise<{ url: string; filename: string; mimeType: string }> {
  const ext = extensionForMime(file.type);
  const filename = `${uuidv4()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`tasks/${taskId}/${filename}`, buffer, {
      access: "public",
      contentType: file.type,
      token,
    });
    return { url: blob.url, filename: file.name, mimeType: file.type };
  }

  const dir = path.join(UPLOAD_DIR, taskId);
  fs.mkdirSync(dir, { recursive: true });
  const storedName = filename;
  fs.writeFileSync(path.join(dir, storedName), buffer);

  return {
    url: `/api/uploads/${taskId}/${storedName}`,
    filename: file.name,
    mimeType: file.type,
  };
}

export async function removeStoredImage(url: string): Promise<void> {
  if (url.startsWith("/api/uploads/")) {
    const relative = url.replace("/api/uploads/", "");
    const filePath = path.join(UPLOAD_DIR, relative);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (token && url.includes("blob.vercel-storage.com")) {
    const { del } = await import("@vercel/blob");
    await del(url, { token });
  }
}

function extensionForMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return ".png";
    case "image/jpeg":
      return ".jpg";
    case "image/webp":
      return ".webp";
    case "image/gif":
      return ".gif";
    default:
      return ".bin";
  }
}

export function localUploadPath(taskId: string, filename: string): string | null {
  const filePath = path.join(UPLOAD_DIR, taskId, filename);
  if (!fs.existsSync(filePath)) return null;
  return filePath;
}

export const IMAGE_MIME_TYPES = ALLOWED;
