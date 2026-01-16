import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis"; // 【新增】引入 redis
import { NextRequest } from "next/server";
import { Verdict } from "@/lib/generated/prisma/enums";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const submissionId = (await params).id;
  const encoder = new TextEncoder();

  const redisKey = `submission:${submissionId}:progress`;

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: {
        verdict: Verdict;
        passedTests: number;
        totalTests: number;
      }) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      let lastKnownVerdict: Verdict | null = null;
      let lastKnownPassed: number = -1;

      const checkStatus = async () => {
        try {
          const freshSub = await prisma.submission.findUnique({
            where: { id: submissionId },
            select: {
              verdict: true,
              passedTests: true,
              totalTests: true,
            },
          });

          if (!freshSub) return true;

          if (freshSub.verdict === Verdict.JUDGING) {
            const redisDataStr = await redis.get(redisKey);
            if (redisDataStr) {
              try {
                // 解析 JSON: { verdict, passedTests, totalTests, finished }
                const redisData = JSON.parse(redisDataStr as string);

                // 使用 Redis 中的实时数据覆盖 DB 数据
                if (typeof redisData.passedTests === "number") {
                  freshSub.passedTests = redisData.passedTests;
                }
                if (typeof redisData.totalTests === "number") {
                  freshSub.totalTests = redisData.totalTests;
                }
              } catch (e) {
                console.error("Failed to parse redis progress json", e);
              }
            }
          }

          // 3. 对比是否有变化
          if (
            freshSub.verdict !== lastKnownVerdict ||
            freshSub.passedTests !== lastKnownPassed
          ) {
            sendEvent(freshSub);
            lastKnownVerdict = freshSub.verdict;
            lastKnownPassed = freshSub.passedTests;
          }

          // 4. 判断是否结束
          if (
            freshSub.verdict !== Verdict.PENDING &&
            freshSub.verdict !== Verdict.JUDGING
          ) {
            return true; // 结束
          }
          return false; // 继续
        } catch (error) {
          console.error("SSE Error:", error);
          return true;
        }
      };

      // 立即执行一次
      const shouldStop = await checkStatus();
      if (shouldStop) {
        controller.close();
        return;
      }

      // 循环轮询 (同时查 DB 和 Redis)
      const interval = setInterval(async () => {
        const stop = await checkStatus();
        if (stop) {
          clearInterval(interval);
          controller.close();
        }
      }, 200);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
