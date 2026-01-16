"use server";

import { ContestConfig } from "@/app/(main)/page";
import { verifyAuth } from "@/lib/auth";
import { ContestRole, Verdict } from "@/lib/generated/prisma/client";
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
    include: {
      contest: true,
    },
  });

  if (!contestProblem) {
    throw new Error("Problem not found in this contest");
  }

  const contest = contestProblem.contest;

  // === 新增逻辑开始 ===
  const now = new Date();
  const config = contest.config as ContestConfig;
  const isEnded = now > contest.endTime;

  // 计算封榜开始时间
  let isFrozen = false;
  if (config && config.frozenDuration) {
    const freezeTime = new Date(
      contest.endTime.getTime() - config.frozenDuration * 60 * 1000
    );
    // 如果当前时间已过封榜线，即为封榜状态（无论是否比赛结束，直到管理员修改配置解榜）
    isFrozen = now >= freezeTime;
  }

  // 校验：比赛结束 && 封榜期间 && 非全局管理员/比赛管理员 -> 禁止提交
  // (防止用户在封榜未揭晓前通过 Upsolving 试探结果)
  const isAdmin =
    payload?.role === ContestRole.ADMIN ||
    payload?.role === ContestRole.JUDGE ||
    payload?.isGlobalAdmin;
  console.log(isEnded, isFrozen, isAdmin);
  if (isEnded && isFrozen && !isAdmin) {
    throw new Error(
      "禁止提交：比赛已结束且处于封榜期间，请等待解榜后再尝试提交。"
    );
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
