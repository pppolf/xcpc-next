"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { rejudgeProblem } from "./actions"; // 确保这里能导入 rejudgeProblem 或者将其通过 props 传递

export default function RejudgeButton({ problemId }: { problemId: number }) {
  const handleRejudge = async () => {
    if (
      !confirm(
        `Are you sure you want to rejudge ALL submissions for problem #${problemId}?`
      )
    ) {
      return;
    }
    await rejudgeProblem(problemId);
  };

  return (
    <button
      onClick={handleRejudge}
      className="text-green-600 hover:text-green-800 cursor-pointer"
      title="Rejudge All Submissions"
      type="button"
    >
      <ArrowPathIcon className="w-5 h-5" />
    </button>
  );
}
