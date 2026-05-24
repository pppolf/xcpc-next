"use client";

import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { rejudgeProblem } from "./actions"; // 确保这里能导入 rejudgeProblem 或者将其通过 props 传递
import { useState } from "react";
import ConfirmModal from "@/components/admin/ConfirmModal";
import { toast } from "sonner";

export default function RejudgeButton({ problemId }: { problemId: number }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleRejudge = () => {
    setIsConfirmOpen(true);
  };

  const confirmRejudge = async () => {
    setIsConfirmOpen(false);
    const result = await rejudgeProblem(problemId);

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    toast.success(`Queued ${result?.queued ?? 0} non-AC submissions`);
  };

  return (
    <>
      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Rejudge Problem"
        message={`Rejudge all non-AC submissions for problem #${problemId}? Accepted submissions will be kept untouched.`}
        confirmText="Rejudge Non-AC"
        onConfirm={confirmRejudge}
        onCancel={() => setIsConfirmOpen(false)}
      />
      <button
        onClick={handleRejudge}
        className="text-green-600 hover:text-green-800 cursor-pointer"
        title="Rejudge Non-AC Submissions"
        type="button"
      >
        <ArrowPathIcon className="w-5 h-5" />
      </button>
    </>
  );
}
