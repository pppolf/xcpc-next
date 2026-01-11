"use server";

import { prisma } from "@/lib/prisma";
import { judgeSubmission } from "@/lib/judge";
import { revalidatePath } from "next/cache";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";
import { Verdict } from "@/lib/generated/prisma/enums";

export async function getGlobalSubmissions(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      skip,
      take: pageSize,
      orderBy: { submittedAt: "desc" },
      include: {
        user: { select: { username: true } }, // 选手信息
        globalUser: { select: { username: true } }, // 管理员信息
        problem: { select: { title: true } }, // 题目信息
        contest: { select: { title: true, id: true } }, // 比赛信息
      },
    }),
    prisma.submission.count(),
  ]);

  return { submissions, total };
}

export async function rejudgeSubmission(submissionId: string) {
  // 1. 权限验证
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) throw new Error("Unauthorized");

  const payload = await verifyAuth(token);
  if (!payload.isGlobalAdmin) throw new Error("Permission denied");

  // 2. 重置提交状态
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      verdict: Verdict.PENDING,
      timeUsed: 0,
      memoryUsed: 0,
      errorMessage: null,
      passedTests: 0,
      totalTests: 0,
    },
  });

  // 3. 异步触发判题 (不 await，避免阻塞前端响应)
  judgeSubmission(submissionId).catch(console.error);

  // 4. 刷新页面
  revalidatePath("/admin/submissions");
}
