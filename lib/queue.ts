import { Queue } from "bullmq";
import { redis } from "./redis";

// 定义判题任务队列
export const judgeQueue = new Queue("judge-queue", {
  connection: redis, // 或者使用单独的 connection 配置
});
