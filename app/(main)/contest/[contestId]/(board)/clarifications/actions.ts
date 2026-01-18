"use server";

import { getCurrentSuper, getCurrentUser, UserJwtPayload } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { ContestRole, ClariCategory } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 获取列表数据
export async function getClarificationData(
  contestId: number,
  page: number = 1
) {
  const user = await getCurrentUser();
  const admin = await getCurrentSuper();
  const userId = (user as UserJwtPayload)?.userId;
  const userRole = (user as UserJwtPayload)?.role;
  const isAdmin =
    userRole === ContestRole.ADMIN ||
    userRole === ContestRole.JUDGE ||
    (admin as UserJwtPayload)?.isGlobalAdmin;

  // 1. 获取公告 (或者裁判公开的问答)
  const notifications = await prisma.clarification.findMany({
    where: {
      contestId,
      isPublic: true, // 关键：只看公开的
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { replies: true } },
    },
  });

  // 2. 获取针对该用户的私有提问 (管理员看所有非公开的)
  const whereCondition: Prisma.ClarificationWhereInput = {
    contestId,
    isPublic: false,
  };

  if (!isAdmin) {
    if (!userId) {
      // 未登录只能看公开的(上面已经取了)，这里私有的不给看
      whereCondition.userId = "-1";
    } else {
      whereCondition.userId = userId;
    }
  }

  const pageSize = 15;
  const skip = (page - 1) * pageSize;

  const clarifications = await prisma.clarification.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
    include: {
      user: {
        select: { username: true, displayName: true },
      },
      _count: { select: { replies: true } },
    },
  });

  const total = await prisma.clarification.count({ where: whereCondition });

  // 获取题目列表用于提问下拉框
  const problems = await prisma.contestProblem.findMany({
    where: { contestId },
    select: { displayId: true, problemId: true },
    orderBy: { displayId: "asc" },
  });

  return { notifications, clarifications, total, problems, isAdmin, userId };
}

// 获取详情
export async function getClarificationDetail(
  contestId: number,
  clariId: number
) {
  const user = await getCurrentUser();
  const admin = await getCurrentSuper();
  const userId = (user as UserJwtPayload)?.userId;
  const userRole = (user as UserJwtPayload)?.role;
  const isAdmin =
    userRole === ContestRole.ADMIN ||
    userRole === ContestRole.JUDGE ||
    (admin as UserJwtPayload)?.isGlobalAdmin;

  const thread = await prisma.clarification.findUnique({
    where: { id: clariId },
    include: {
      user: { select: { username: true, displayName: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          user: { select: { username: true, displayName: true, role: true } },
        },
      },
    },
  });

  if (!thread) return null;

  // 权限检查：如果是私有提问，且不是作者也不是管理员，禁止访问
  if (!thread.isPublic && !isAdmin && thread.userId !== userId) {
    return null;
  }

  return { thread, isAdmin, currentUserId: userId };
}

// 提交新提问 (选手)
export async function submitQuestion(formData: FormData) {
  const contestId = Number(formData.get("contestId"));
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const displayId = formData.get("displayId") as string; // 'A', 'B' or 'General'

  const user = await getCurrentUser();
  if (!user || !content || !title) return;

  // 根据 displayId 找 problemId
  let problemId = null;
  if (displayId && displayId !== "General") {
    const cp = await prisma.contestProblem.findUnique({
      where: {
        contestId_displayId: { contestId, displayId },
      },
    });
    problemId = cp?.problemId;
  }

  await prisma.clarification.create({
    data: {
      contestId,
      userId: (user as UserJwtPayload).userId,
      title,
      content,
      displayId: displayId === "General" ? null : displayId,
      problemId: problemId,
      category: ClariCategory.QUESTION,
      isPublic: false,
    },
  });

  revalidatePath(`/contest/${contestId}/clarifications`);
}

// 提交回复（通用）
export async function submitReply(formData: FormData) {
  const contestId = formData.get("contestId") as string;
  const clariId = Number(formData.get("clariId"));
  const content = formData.get("content") as string;
  const user = await getCurrentUser();

  if (!user || !content) return;

  await prisma.reply.create({
    data: {
      clarificationId: clariId,
      userId: (user as UserJwtPayload).userId,
      content,
    },
  });

  revalidatePath(`/contest/${contestId}/clarifications/${clariId}`);
}

// 管理员发布公告 Action
export async function publishAnnouncement(formData: FormData) {
  const contestId = Number(formData.get("contestId"));
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const user = await getCurrentUser();

  if (!user) return;

  // 严格权限校验
  const role = (user as UserJwtPayload)?.role;
  if (role !== ContestRole.ADMIN && role !== ContestRole.JUDGE) return;

  await prisma.clarification.create({
    data: {
      contestId,
      userId: (user as UserJwtPayload).userId,
      title,
      content,
      category: ClariCategory.NOTICE,
      isPublic: true,
    },
  });

  redirect(`/contest/${contestId}/clarifications`);
}

// 切换公开/私有状态
export async function toggleClarificationVisibility(
  contestId: number,
  clariId: number,
  currentStatus: boolean
) {
  const user = await getCurrentUser();
  const role = (user as UserJwtPayload)?.role;
  if (role !== ContestRole.ADMIN && role !== ContestRole.JUDGE) return;

  await prisma.clarification.update({
    where: { id: clariId },
    data: { isPublic: !currentStatus },
  });

  // 刷新详情页和列表页
  revalidatePath(`/contest/${contestId}/clarifications`);
  revalidatePath(`/contest/${contestId}/clarifications/${clariId}`);
}
