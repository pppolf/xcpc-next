import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import mime from "mime"; // 需要安装 npm install mime @types/mime

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> },
) {
  const { id, filename } = await params;

  // 安全检查：防止 ../ 路径遍历
  if (filename.includes("..")) {
    return new NextResponse("Invalid filename", { status: 400 });
  }

  const filePath = path.join(
    process.cwd(),
    "uploads",
    "problems",
    id,
    "assets",
    filename,
  );

  try {
    const fileBuffer = await fs.readFile(filePath);
    const mimeType = mime.getType(filePath) || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (e) {
    console.log(e);
    return new NextResponse("File not found", { status: 404 });
  }
}
