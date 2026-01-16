"use client";

import { TrashIcon } from "@heroicons/react/24/outline";
import { deleteProblem } from "./actions";

export default function RejudgeButton({ problemId }: { problemId: number }) {
  const handleRejudge = async () => {
    if (
      !confirm(`Are you sure you want to DELETE this problem #${problemId}?`)
    ) {
      return;
    }
    await deleteProblem(problemId);
  };

  return (
    <button
      onClick={handleRejudge}
      className="text-red-400 hover:text-red-600 cursor-pointer"
      title="Delete Problem"
      type="button"
    >
      <TrashIcon className="w-5 h-5" />
    </button>
  );
}
