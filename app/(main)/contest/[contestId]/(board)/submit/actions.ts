"use server";

import { verifyAuth } from "@/lib/auth";
import { Verdict } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { judgeQueue } from "@/lib/queue";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// 提交代码
export async function submitCode(
  contestId: number,
  problemDisplayId: string,
  language: string,
  code: string
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  if (!token) throw new Error("Unauthorized");

  // 解析 Token 获取当前用户 ID
  const payload = await verifyAuth(token);
  if (!payload || !payload.userId) throw new Error("Invalid Token");

  const userId = payload.userId;

  const contestProblem = await prisma.contestProblem.findFirst({
    where: {
      contestId,
      displayId: problemDisplayId,
    },
  });

  if (!contestProblem) {
    throw new Error("Problem not found in this contest");
  }

  // 使用事务处理 displayId 自增，防止并发冲突
  // 1. 查找当前比赛最大的 displayId
  const submission = await prisma.$transaction(async (tx) => {
    const lastSubmission = await tx.submission.findFirst({
      where: { contestId },
      orderBy: { displayId: "desc" },
      select: { displayId: true },
    });

    const nextId = (lastSubmission?.displayId || 0) + 1;

    // 2. 创建提交
    return await tx.submission.create({
      data: {
        displayId: nextId,
        code,
        language,
        contestId,
        problemId: contestProblem.problemId,
        userId,
        verdict: Verdict.PENDING,
        codeLength: code.length,
      },
    });
  });
  await judgeQueue.add("judge", {
    submissionId: submission.id,
  });

  redirect(`/contest/${contestId}/status`);
}
