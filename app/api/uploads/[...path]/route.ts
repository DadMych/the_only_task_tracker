import { NextResponse } from "next/server";
import fs from "fs";
import { localUploadPath } from "@/lib/storage";

interface Context {
  params: Promise<{ path: string[] }>;
}

export async function GET(_request: Request, { params }: Context) {
  const { path } = await params;
  if (path.length !== 2) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [taskId, filename] = path;
  const filePath = localUploadPath(taskId, filename);
  if (!filePath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const mime = mimeFromFilename(filename);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

function mimeFromFilename(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}
