"use client";

import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface Props {
  contestId: number;
}

export default function ExportRankResultsButton({ contestId }: Props) {
  return (
    <a
      href={`/api/contests/${contestId}/rank-export`}
      className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors shadow-sm"
      title="Export final results Excel"
    >
      <ArrowDownTrayIcon className="w-4 h-4" />
      Results Excel
    </a>
  );
}
