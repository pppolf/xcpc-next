import "dotenv/config";
import { Worker } from "bullmq";
import { judgeSubmission } from "./lib/judge";
import { redis } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { ContestStatus } from "./lib/generated/prisma/enums";
// import * as dotenv from "dotenv";

// 加载环境变量
// dotenv.config();

console.log("🚀 Judge Worker Started...");
console.log("DB URL Check:", process.env.DATABASE_URL ? "Loaded" : "Missing"); // 调试用

const worker = new Worker(
  "judge-queue",
  async (job) => {
    console.log(
      `Processing job ${job.id}: submission ${job.data.submissionId}`
    );

    await judgeSubmission(job.data.submissionId);

    console.log(`Job ${job.id} finished.`);
  },
  {
    connection: redis, // 复用连接
    concurrency: Number(process.env.JUDGE_CONCURRENCY || 1), // 【并发控制】同时判 4 个题，根据你服务器 CPU 核心数调整
  }
);

worker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

async function updateContestStatus() {
  const now = new Date();

  try {
    // 1. 检查并更新：PENDING -> RUNNING
    // 条件：状态是 PENDING 且 当前时间 >= 开始时间
    const startResult = await prisma.contest.updateMany({
      where: {
        status: ContestStatus.PENDING,
        startTime: { lte: now }, // lte: less than or equal to (<=)
      },
      data: {
        status: ContestStatus.RUNNING,
      },
    });

    if (startResult.count > 0) {
      console.log(`[Scheduler] 🚀 Started ${startResult.count} contests.`);
    }

    // 2. 检查并更新：RUNNING -> ENDED
    // 条件：状态是 RUNNING 且 当前时间 >= 结束时间
    const endResult = await prisma.contest.updateMany({
      where: {
        status: ContestStatus.RUNNING,
        endTime: { lte: now },
      },
      data: {
        status: ContestStatus.ENDED,
      },
    });

    if (endResult.count > 0) {
      console.log(`[Scheduler] 🏁 Ended ${endResult.count} contests.`);
    }
  } catch (error) {
    console.error("[Scheduler] Error updating contest status:", error);
  }
}

setInterval(updateContestStatus, 1000);

updateContestStatus();
