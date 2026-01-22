import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await ensureUser();

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    
    if (!isImage && !isVideo) {
      return NextResponse.json(
        { error: "File must be an image or video" },
        { status: 400 }
      );
    }

    // Validate file size (10MB for images, 50MB for videos)
    const maxSize = isImage ? 10 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File must be less than ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Convert to base64 for storage (temporary solution - should use Vercel Blob in production)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // For images, we could generate a thumbnail, but for now just return the same URL
    const thumbUrl = isImage ? dataUrl : "";

    return NextResponse.json({
      url: dataUrl,
      thumbUrl,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
