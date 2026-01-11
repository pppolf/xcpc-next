"use client";

import { useTransition } from "react";
import { rejudgeSubmission } from "@/app/admin/submissions/actions";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";

export default function RejudgeButton({
  submissionId,
}: {
  submissionId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRejudge = async () => {
    if (!confirm("Are you sure you want to rejudge this submission?")) return;
    startTransition(async () => {
      try {
        // 调用 Server Action
        await rejudgeSubmission(submissionId);

        // 强制刷新当前路由
        router.refresh();
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
