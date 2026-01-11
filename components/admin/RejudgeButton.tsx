"use client";

import { useTransition } from "react";
import { rejudgeSubmission } from "@/app/admin/submissions/actions";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export default function RejudgeButton({
  submissionId,
}: {
  submissionId: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRejudge = () => {
    if (!confirm("Are you sure you want to rejudge this submission?")) return;

    startTransition(async () => {
      try {
        await rejudgeSubmission(submissionId);
        // 成功后通常页面会自动刷新 (因为有 revalidatePath)
      } catch (error) {
        alert("Failed to rejudge");
        console.error(error);
      }
    });
  };

  return (
    <button
      onClick={handleRejudge}
      disabled={isPending}
      className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed p-1 rounded hover:bg-blue-50 transition-colors"
      title="ReJudge"
    >
      <ArrowPathIcon className={`w-5 h-5 ${isPending ? "animate-spin" : ""}`} />
    </button>
  );
}
