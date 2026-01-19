"use server";

import { getCurrentSuper, getCurrentUser, UserJwtPayload } from "@/lib/auth";
import { Prisma } from "@/lib/generated/prisma/client";
import { ContestRole, Verdict } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 判断权限辅助函数
async function checkPermission() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user as UserJwtPayload;
}

export async function generateBalloons(contestId: number) {
  const user = await checkPermission();
  if (!user) return;

  const acSubmissions = await prisma.submission.findMany({
    where: { contestId, verdict: Verdict.ACCEPTED },
    select: { id: true, userId: true, problemId: true },
  });

  let count = 0;
  for (const sub of acSubmissions) {
    const exists = await prisma.balloon.findUnique({
      where: { submissionId: sub.id },
    });
    if (exists) continue;

    const previousBalloon = await prisma.balloon.findFirst({
      where: {
        contestId,
        submission: { userId: sub.userId, problemId: sub.problemId },
      },
    });

    if (previousBalloon) continue;

    await prisma.balloon.create({
      data: { contestId, submissionId: sub.id, status: "PENDING" },
    });
    count++;
  }

  if (count > 0) revalidatePath(`/contest/${contestId}/balloon`);
}

export async function getBalloonData(contestId: number) {
  const user = await getCurrentUser();
  const superAdmin = await getCurrentSuper();
  if (!user && !superAdmin) return { balloons: [], runners: [], role: null };

  const role = (user as UserJwtPayload)?.role;
  // 定义谁是管理者 (Master)，谁是跑腿 (Runner)
  // 假设 ADMIN 和 JUDGE 是 Master，其他人是 Runner
  const isMaster =
    role === ContestRole.ADMIN ||
    role === ContestRole.JUDGE ||
    (superAdmin as UserJwtPayload)?.isGlobalAdmin;

  const whereCondition: Prisma.BalloonWhereInput = { contestId };

  // 如果不是 Master，只能看分给自己的任务
  if (!isMaster) {
    whereCondition.assignedToId = (user as UserJwtPayload)?.userId;
    // 志愿者通常只需要看未完成的，或者页面上分开展示
    // whereCondition.status = "ASSIGNED";
  }

  const balloons = await prisma.balloon.findMany({
    where: whereCondition,
    include: {
      submission: {
        include: {
          user: true,
          problem: { select: { id: true } },
        },
      },
      assignedTo: { select: { displayName: true, username: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // 获取该比赛所有可能的志愿者列表 (Master 用)
  // 简单起见，列出所有非 ADMIN 用户，或者你需要一个专门的 UserContest 表来查
  type Runner = {
    id: string;
    displayName: string | null;
    username: string;
  }
  let runners: Runner[] = [];
  if (isMaster) {
    runners = await prisma.user.findMany({
      where: { role: { equals: ContestRole.BALLOON } }, // 示例过滤
      select: { id: true, displayName: true, username: true },
    });
  }

  return {
    balloons,
    runners,
    isMaster,
    currentUserId:
      (user as UserJwtPayload)?.userId ||
      (superAdmin as UserJwtPayload)?.userId,
  };
}

export async function assignBalloon(
  contestId: number,
  balloonId: number,
  runnerId: string
) {
  await prisma.balloon.update({
    where: { id: balloonId },
    data: { assignedToId: runnerId, status: "ASSIGNED" },
  });
  revalidatePath(`/contest/${contestId}/balloon`);
}

export async function completeBalloon(contestId: number, balloonId: number) {
  await prisma.balloon.update({
    where: { id: balloonId },
    data: { status: "COMPLETED" },
  });
  revalidatePath(`/contest/${contestId}/balloon`);
}
