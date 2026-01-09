'use server';

import { prisma } from "@/lib/prisma";

export async function getGlobalSubmissions(page = 1, pageSize = 20) {
  const skip = (page - 1) * pageSize;

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      skip,
      take: pageSize,
      orderBy: { submittedAt: 'desc' },
      include: {
        user: { select: { username: true } },       // 选手信息
        globalUser: { select: { username: true } }, // 管理员信息
        problem: { select: { title: true } },       // 题目信息
        contest: { select: { title: true, id: true } } // 比赛信息
      }
    }),
    prisma.submission.count(),
  ]);

  return { submissions, total };
}