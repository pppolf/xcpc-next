import { Worker } from "bullmq";
import { judgeSubmission } from "./lib/judge";
import { redis } from "./lib/redis";
import * as dotenv from "dotenv";

// 加载环境变量
dotenv.config();

console.log("🚀 Judge Worker Started...");

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
    concurrency: Number(process.env.JUDGE_CONCURRENCY), // 【并发控制】同时判 4 个题，根据你服务器 CPU 核心数调整
  }
);

worker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});

worker.on("failed", (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});
