import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { NextResponse } from "next/server";
import {
  canViewSubmissionTestDetails,
  hideSubmissionProgress,
} from "@/lib/submission-visibility";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next.js 15 写法
) {
  const { id } = await params;
  const canViewTestDetails = await canViewSubmissionTestDetails(id);

  const cached = await redis.get(`submission:${id}:progress`);

  if (cached) {
    const progress = JSON.parse(cached);
    // 如果 Redis 里显示还没结束，直接返回 Redis 的数据
    if (!progress.finished) {
      const response = {
        verdict: progress.verdict,
        passedTests: progress.passedTests,
        totalTests: progress.totalTests,
        // 下面这些字段 Redis 里可能没有，如果需要显示时间内存，得在 updateProgress 里加上
        timeUsed: 0,
        memoryUsed: 0,
      };

      return NextResponse.json(
        canViewTestDetails ? response : hideSubmissionProgress(response),
      );
    }
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    select: {
      verdict: true,
      passedTests: true,
      totalTests: true,
      timeUsed: true,
      memoryUsed: true,
    },
  });

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(
    canViewTestDetails ? submission : hideSubmissionProgress(submission),
  );
}
