"use client";

import { useState, useEffect } from "react";
import { Verdict } from "@/lib/generated/prisma/enums";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

// 复用你的配置表
const VERDICT_CONFIG: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { text: string; color: string; icon?: any }
> = {
  [Verdict.PENDING]: { text: "Pending", color: "text-gray-500" },
  [Verdict.JUDGING]: { text: "Judging", color: "text-blue-600" },
  [Verdict.ACCEPTED]: {
    text: "Accepted",
    color: "text-green-600 font-bold",
    icon: CheckCircleIcon,
  },
  [Verdict.WRONG_ANSWER]: {
    text: "Wrong Answer",
    color: "text-red-600 font-bold",
    icon: XCircleIcon,
  },
  [Verdict.TIME_LIMIT_EXCEEDED]: {
    text: "Time Limit Exceeded",
    color: "text-orange-600 font-bold",
    icon: ClockIcon,
  },
  [Verdict.MEMORY_LIMIT_EXCEEDED]: {
    text: "Memory Limit Exceeded",
    color: "text-orange-600 font-bold",
    icon: ExclamationCircleIcon,
  },
  [Verdict.RUNTIME_ERROR]: {
    text: "Runtime Error",
    color: "text-purple-600 font-bold",
    icon: ExclamationCircleIcon,
  },
  [Verdict.COMPILE_ERROR]: {
    text: "Compile Error",
    color: "text-yellow-600 font-bold",
    icon: ExclamationCircleIcon,
  },
  [Verdict.PRESENTATION_ERROR]: {
    text: "Presentation Error",
    color: "text-orange-500 font-bold",
    icon: ExclamationCircleIcon,
  },
  [Verdict.SYSTEM_ERROR]: {
    text: "System Error",
    color: "text-gray-900 font-bold",
    icon: ExclamationCircleIcon,
  },
};

interface LiveVerdictProps {
  submissionId: string;
  initialStatus: string;
  initialPassed?: number;
  initialTotal?: number;
}

export default function LiveVerdict({
  submissionId,
  initialStatus,
  initialPassed = 0,
  initialTotal = 0,
}: LiveVerdictProps) {
  const [status, setStatus] = useState(initialStatus);
  const [passed, setPassed] = useState(initialPassed);
  const [, setTotal] = useState(initialTotal);
  const router = useRouter();

  useEffect(() => {
    // 只有在 PENDING 或 JUDGING 状态下才轮询
    if (status !== Verdict.PENDING && status !== Verdict.JUDGING) return;
    let isMounted = true;
    // eslint-disable-next-line prefer-const
    let interval: NodeJS.Timeout;
    // --- 核心逻辑：定义轮询函数 ---
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/submission/${submissionId}`);
        if (!res.ok) return;

        const data = await res.json();

        if (isMounted) {
          setStatus(data.verdict);
          setPassed(data.passedTests);
          setTotal(data.totalTests);

          // 如果判题结束，停止轮询
          if (
            data.verdict !== Verdict.PENDING &&
            data.verdict !== Verdict.JUDGING
          ) {
            clearInterval(interval);
            router.refresh();
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    };
    // 1. 挂载后立即执行一次！不要等 setInterval 的第一秒
    fetchData();

    // 2. 然后再开启定时器
    interval = setInterval(fetchData, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router, status, submissionId]);

  // --- 渲染逻辑 ---

  const config = VERDICT_CONFIG[status] || {
    text: status,
    color: "text-gray-400",
  };
  const isLoading = status === Verdict.PENDING || status === Verdict.JUDGING;
  const Icon = config.icon;

  // 动态生成文本：如果是 Judging，显示进度
  let displayText = config.text;
  if (status === Verdict.JUDGING) {
    displayText = `Running on test ${passed + 1} ...`;
  } else if (status === Verdict.WRONG_ANSWER) {
    displayText = `${VERDICT_CONFIG[Verdict.WRONG_ANSWER].text} on test ${passed + 1}`;
  } else if (status === Verdict.TIME_LIMIT_EXCEEDED) {
    displayText = `${VERDICT_CONFIG[Verdict.TIME_LIMIT_EXCEEDED].text} on test ${passed + 1}`;
  } else if (status === Verdict.MEMORY_LIMIT_EXCEEDED) {
    displayText = `${VERDICT_CONFIG[Verdict.MEMORY_LIMIT_EXCEEDED].text} on test ${passed + 1}`;
  } else if (status === Verdict.PRESENTATION_ERROR) {
    displayText = `${VERDICT_CONFIG[Verdict.PRESENTATION_ERROR].text} on test ${passed + 1}`
  } else if (status === Verdict.RUNTIME_ERROR) {
    displayText = `${VERDICT_CONFIG[Verdict.RUNTIME_ERROR].text} on test ${passed + 1}`
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${config.color} text-sm whitespace-nowrap`}
    >
      {/* 1. Loading 动画 */}
      {isLoading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}

      {/* 2. 静态图标 */}
      {!isLoading && Icon && <Icon className="w-4 h-4" />}

      {/* 3. 动态文本 */}
      <span>{displayText}</span>
    </span>
  );
}
