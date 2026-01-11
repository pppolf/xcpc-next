"use server";

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/auth"; // 使用你之前封装的 auth 验证
import { revalidatePath } from "next/cache";
import { judgeSubmission } from "@/lib/judge";
import { Verdict } from "@/lib/generated/prisma/enums";

export async function adminSubmit(
  problemId: number,
  code: string,
  language: string
) {
  // 1. 身份验证 (确保是 Admin)
  const token = (await cookies()).get("auth_token")?.value;
  if (!token) throw new Error("Unauthorized");

  const payload = await verifyAuth(token);
  if (!payload.isGlobalAdmin)
    throw new Error("Only admin can perform this action");

  // 2. 查找 Admin 的数据库 ID
  // 注意：Token 里存的是 userId，对于 Admin 来说就是 global_users 表的 ID
  const adminId = payload.userId;

  // 3. 创建提交记录
  const submission = await prisma.submission.create({
    data: {
      displayId: -1,
      globalUserId: adminId, // 关联到 Admin
      problemId: problemId,
      language: language,
      code: code,
      codeLength: code.length,
      verdict: Verdict.PENDING, // 待评测
    },
  });

  // TODO: 这里应该调用判题机 (RabbitMQ / HTTP)
  try {
    judgeSubmission(submission.id);
  } catch (e) {
    console.log(e);
  }

  revalidatePath(`/admin/submissions`);
  return { success: true, submissionId: submission.id };
}

export async function getProblemDetail(id: number) {
  return await prisma.problem.findUnique({ where: { id } });
}
