import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSuper, UserJwtPayload } from "@/lib/auth";
import { promises as fs } from "fs";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "problems");

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await getCurrentSuper();
    if (!admin || !(admin as UserJwtPayload).isGlobalAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contestId = parseInt((await params).id, 10);
    if (isNaN(contestId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // 1. 获取比赛的所有题目ID
    const contestProblems = await prisma.contestProblem.findMany({
      where: { contestId },
      orderBy: { problemId: "asc" },
      select: { problemId: true },
    });

    const ids = contestProblems.map((cp) => cp.problemId);
    if (ids.length < 2) {
      return NextResponse.json({ message: "Not enough problems to reverse" });
    }

    // 2. 计算需要交换的对
    const swaps: [number, number][] = [];
    let left = 0;
    let right = ids.length - 1;
    while (left < right) {
      swaps.push([ids[left], ids[right]]);
      left++;
      right--;
    }

    // 3. 执行交换
    const results = [];
    for (const [idA, idB] of swaps) {
      try {
        await swapProblemIds(idA, idB);
        results.push(`Swapped ${idA} <-> ${idB}`);
      } catch (e) {
        console.error(`Failed to swap ${idA} <-> ${idB}`, e);
        results.push(`Failed ${idA} <-> ${idB}: ${(e as Error).message}`);
        // 中断，避免部分交换导致更乱
        break; 
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function swapProblemIds(idA: number, idB: number) {
  const tempId = 900000000 + idA; // 使用一个极大的临时ID

  // 1. A -> Temp
  await prisma.$executeRaw`UPDATE "problems" SET id = ${tempId} WHERE id = ${idA}`;
  await renameProblemFolder(idA, tempId);

  // 2. B -> A
  await prisma.$executeRaw`UPDATE "problems" SET id = ${idA} WHERE id = ${idB}`;
  await renameProblemFolder(idB, idA);

  // 3. Temp -> B
  await prisma.$executeRaw`UPDATE "problems" SET id = ${idB} WHERE id = ${tempId}`;
  await renameProblemFolder(tempId, idB);
}

async function renameProblemFolder(oldId: number, newId: number) {
  const oldPath = path.join(UPLOAD_ROOT, oldId.toString());
  const newPath = path.join(UPLOAD_ROOT, newId.toString());

  try {
    await fs.rename(oldPath, newPath);
  } catch (e) {
    // 文件夹可能不存在，忽略
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") {
      console.warn(`Warning: Failed to rename folder ${oldId} -> ${newId}`, e);
    }
  }
}
