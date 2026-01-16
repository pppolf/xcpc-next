import Link from "next/link";

interface ProblemInfoProps {
  contestId: string;
  problemId: string;
  info: {
    timeLimit: number;
    memoryLimit: number;
    submissions: number;
    accepted: number;
  };
  type?: "problem" | "submit";
  isAdmin?: boolean;
}

export default function ProblemInfoCard({
  contestId,
  problemId,
  info,
  type = "problem",
  isAdmin = false,
}: ProblemInfoProps) {
  const memoryLimit = info.memoryLimit * 1024;
  return (
    <div className="bg-white border border-gray-200 shadow-sm rounded-sm overflow-hidden w-full lg:w-72 shrink-0">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-700">Information</h3>
      </div>
      <ul className="text-sm divide-y divide-gray-100 font-serif">
        <li className="px-4 py-3 flex justify-between">
          <span className="text-gray-500">Problem Id</span>
          <span className="font-mono font-bold text-gray-800">{problemId}</span>
        </li>
        <li className="px-4 py-3">
          <div className="text-gray-500 mb-1">Time Limit (Java / Others)</div>
          <div className="font-bold text-gray-800 text-lg">
            {2 * info.timeLimit} / {info.timeLimit} MS
          </div>
        </li>
        <li className="px-4 py-3">
          <div className="text-gray-500 mb-1">Memory Limit (Java / Others)</div>
          <div className="font-bold text-gray-800 text-lg">
            {2 * memoryLimit} / {memoryLimit} K
          </div>
        </li>
        <li className="px-4 py-3 flex justify-between">
          <span className="text-gray-500">Accepted</span>
          <span className="text-green-600 font-bold">{info.accepted}</span>
        </li>
        <li className="px-4 py-3 flex justify-between">
          <span className="text-gray-500">Submissions</span>
          <span className="text-gray-800">{info.submissions}</span>
        </li>
      </ul>

      {/* 操作按钮区 */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2 font-serif">
        {/* 🔘 动态按钮逻辑 */}
        {type === "problem" ? (
          // 情况 A: 在题目页 -> 显示 "Submit" 按钮，去往提交页
          isAdmin ? (
            <button
              disabled
              className="w-full bg-gray-400 text-white text-center py-2 rounded-sm font-bold shadow-sm cursor-not-allowed opacity-60"
              title="Cannot submit"
            >
              Submit
            </button>
          ) : (
            <Link
              href={`/contest/${contestId}/submit?problem=${problemId}`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-sm font-bold shadow-sm transition-colors"
            >
              Submit
            </Link>
          )
        ) : (
          // 情况 B: 在提交页 -> 显示 "< Problem" 按钮，回题目页(
          <Link
            href={`/contest/${contestId}/problems/${problemId}`}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-sm font-bold shadow-sm transition-colors"
          >
            &lt; &nbsp; Problem
          </Link>
        )}

        {/* 第二个按钮：始终显示 Submissions */}
        <Link
          href={`/contest/${contestId}/status?problem=${problemId}`}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-center py-2 rounded-sm font-medium transition-colors"
        >
          Submissions
        </Link>
      </div>
    </div>
  );
}
