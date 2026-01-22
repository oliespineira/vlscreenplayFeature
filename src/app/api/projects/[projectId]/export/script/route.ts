import { NextResponse } from "next/server";
import { ensureUser } from "@/lib/auth/ensureUser";
import { requireProjectOwnerForApi } from "@/lib/auth/ownership";
import { prisma } from "@/lib/db/prisma";
import { fountainToPdf } from "@/lib/export/fountainToPdf";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await ensureUser();
    const { projectId } = await params;
    await requireProjectOwnerForApi(projectId, user.id);

    const body = await request.json();
    const scriptId = body.scriptId;
    const format = body.format || "pdf"; // "pdf" or "fountain"

    if (!scriptId || typeof scriptId !== "string") {
      return NextResponse.json(
        { error: "scriptId is required" },
        { status: 400 }
      );
    }

    // Verify script belongs to project
    const script = await prisma.script.findFirst({
      where: {
        id: scriptId,
        projectId,
      },
    });

    if (!script) {
      return NextResponse.json(
        { error: "Script not found or does not belong to this project" },
        { status: 404 }
      );
    }

    // Export as PDF
    if (format === "pdf") {
      const pdfBuffer = await fountainToPdf(script.fountain, script.title);
      const filename = `${script.title.replace(/[^a-z0-9]/gi, "_")}.pdf`;

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    // Export as Fountain file
    return new NextResponse(script.fountain, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${script.title.replace(/[^a-z0-9]/gi, "_")}.fountain"`,
      },
    });
  } catch (error) {
    console.error("Error exporting script:", error);
    if (error instanceof Error && error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: "Failed to export script" },
      { status: 500 }
    );
  }
}
