"use client";

import { useState } from "react";
import { unfreezeContest } from "./actions";
import { useRouter } from "next/navigation";
import { Contest } from "@/lib/generated/prisma/client";
import { ContestConfig } from "@/app/(main)/page";

export default function UnfreezeButton({ contest }: { contest: Contest }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleUnfreeze = async () => {
    if (!confirm("Are you sure you want to unfreeze the scoreboard?")) return;

    setLoading(true);
    try {
      const res = await unfreezeContest(contest.id);
      if (res.success) {
        alert("Board unfrozen successfully!");
        router.refresh();
      } else {
        alert(res.error || "Failed to unfreeze");
      }
    } catch (e) {
      console.log(e);
      alert("Error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUnfreeze}
      disabled={loading || (contest.config as ContestConfig)?.frozenDuration === 0}
      className="ml-4 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded shadow transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer"
    >
      {loading ? "Processing..." : "🔓 Unfreeze Board"}
    </button>
  );
}
