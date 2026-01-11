import VerdictBadge from "@/components/VerdictBadge";
import { getGlobalSubmissions } from "./actions";
import Pagination from "@/components/Pagination";
import Link from "next/link";
import RejudgeButton from "@/components/admin/RejudgeButton";

export default async function GlobalSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;
  const pageSize = 15;

  const { submissions, total } = await getGlobalSubmissions(
    currentPage,
    pageSize
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Global Submissions
      </h1>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b uppercase text-xs">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">When</th>
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Problem</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Time/Mem</th>
                <th className="px-6 py-3">Lang</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Setting</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {submissions.map((sub) => {
                // 判断是谁提交的
                const submitter = sub.user?.username
                  ? `User: ${sub.user.username}`
                  : sub.globalUser?.username
                  ? `Admin: ${sub.globalUser.username}`
                  : "Unknown";

                const fromContest = sub.contest
                  ? `(Contest #${sub.contest.id})`
                  : "(Problem Bank)";

                return (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-xs">
                      {sub.id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {submitter}
                      </div>
                      <div className="text-xs text-gray-400">{fromContest}</div>
                    </td>
                    <td className="px-6 py-4 text-blue-600">
                      <Link href={`/admin/problems/${sub.problemId}/test`}>
                        {sub.problem.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <VerdictBadge status={sub.verdict} />
                    </td>
                    <td className="px-6 py-4">
                      {sub.timeUsed !== null ? `${sub.timeUsed}ms` : "-"} /{" "}
                      {sub.memoryUsed !== null ? `${sub.memoryUsed}KB` : "-"}
                    </td>
                    <td className="px-6 py-4">{sub.language}</td>
                    <td className="px-6 py-4">
                      {sub.contest ? "Contest Source" : "Admin Test"}
                    </td>
                    <td className="px-6 py-4">
                      <RejudgeButton submissionId={sub.id} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 分页组件 */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Pagination totalItems={total} pageSize={pageSize} />
        </div>
      </div>
    </div>
  );
}
