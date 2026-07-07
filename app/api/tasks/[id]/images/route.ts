import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import {
  addTaskImage,
  deleteTaskImage,
  getTask,
  getTaskImages,
} from "@/lib/db";
import { removeStoredImage, storeImage, validateImage } from "@/lib/storage";

interface Context {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const task = await getTask(id);
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const images = await getTaskImages(id);
  return NextResponse.json({ images });
}

export async function POST(request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const task = await getTask(id);
  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File required" }, { status: 400 });
  }

  const validationError = validateImage(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const stored = await storeImage(id, file);
  const image = await addTaskImage(
    id,
    stored.url,
    stored.filename,
    stored.mimeType,
    user.role
  );

  if (!image) {
    await removeStoredImage(stored.url);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ image }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Context) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const imageId = searchParams.get("imageId");

  if (!imageId) {
    return NextResponse.json({ error: "imageId required" }, { status: 400 });
  }

  const result = await deleteTaskImage(imageId, user.role);
  if (!result.ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (result.image.task_id !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await removeStoredImage(result.image.url);
  return NextResponse.json({ ok: true });
}
