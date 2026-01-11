import { Verdict } from "@/lib/generated/prisma/enums";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

// 映射表：将数据库的枚举值映射为前端显示的文字和样式
const VERDICT_CONFIG: Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { text: string; color: string; icon?: any }
> = {
  // --- 等待/评测中 (带动画) ---
  [Verdict.PENDING]: { text: "Pending", color: "text-gray-500" },
  [Verdict.JUDGING]: { text: "Judging", color: "text-blue-600" },

  // --- 最终状态 ---
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

export default function VerdictBadge({ status }: { status: string }) {
  // 默认配置 (防止未知状态报错)
  const config = VERDICT_CONFIG[status] || {
    text: status,
    color: "text-gray-400",
  };

  // 判断是否需要 Loading 动画
  const isLoading = status === "PENDING" || status === "JUDGING";
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${config.color} text-sm`}
    >
      {/* 1. Loading 状态显示旋转图标 */}
      {isLoading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}

      {/* 2. 完成状态显示静态图标 (可选，不想要图标可以删掉这行) */}
      {!isLoading && Icon && <Icon className="w-4 h-4" />}

      {/* 3. 文字 */}
      <span>{config.text}</span>
    </span>
  );
}
