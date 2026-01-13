import Link from "next/link";
import { getContests } from "./actions";
import Pagination from "@/components/Pagination";
import {
  PlusIcon,
  UserGroupIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default async function AdminContestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 15;

  const { contests, total } = await getContests(currentPage, pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Contest Management</h1>
        <Link
          href="/admin/contests/create"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Contest
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b uppercase text-xs">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Start Time</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Stats</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {contests.map((contest) => {
                const durationHours = (
                  (contest.endTime.getTime() - contest.startTime.getTime()) /
                  1000 /
                  3600
                ).toFixed(1);

                // 计算状态颜色
                let statusColor = "bg-gray-100 text-gray-800";
                if (contest.status === "RUNNING")
                  statusColor = "bg-green-100 text-green-800";
                if (contest.status === "ENDED")
                  statusColor = "bg-red-100 text-red-800";

                return (
                  <tr key={contest.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">
                      {contest.id}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {contest.title}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}`}
                      >
                        {contest.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs border ${
                          contest.type === "PUBLIC"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-yellow-200 bg-yellow-50 text-yellow-700"
                        }`}
                      >
                        {contest.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {new Date(contest.startTime).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{durationHours} h</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3 text-gray-400">
                        <span
                          className="flex items-center gap-1"
                          title="Problems"
                        >
                          <DocumentTextIcon className="w-4 h-4" />{" "}
                          {contest._count.problems}
                        </span>
                        <span className="flex items-center gap-1" title="Teams">
                          <UserGroupIcon className="w-4 h-4" />{" "}
                          {contest._count.users}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <Link
                          href={`/admin/contests/${contest.id}/problems`}
                          className="text-xs font-bold border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm bg-gray-50"
                        >
                          Manage Problems
                        </Link>
                        <Link
                          href={`/admin/contests/${contest.id}/users`}
                          className="text-xs font-bold border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-white hover:border-purple-500 hover:text-purple-600 transition-all shadow-sm bg-gray-50"
                        >
                          Users
                        </Link>
                        <Link
                          href={`/admin/contests/${contest.id}/edit`}
                          className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1.5"
                        >
                          Settings
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {contests.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-400 italic"
                  >
                    No contests found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Pagination totalItems={total} pageSize={pageSize} />
        </div>
      </div>
    </div>
  );
}
