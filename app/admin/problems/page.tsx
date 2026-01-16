import Link from "next/link";
import { getProblems } from "./actions";
import {
  PencilSquareIcon,
  ServerStackIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import Pagination from "@/components/Pagination";
import RejudgeButton from "./RejudgeProblemButton";
import DeleteProblemButton from "./DeleteProblemButton";

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Number((await searchParams).page) || 1;
  const { problems, total } = await getProblems(page);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Problem Bank</h1>
        <Link
          href="/admin/problems/create"
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          + Create Problem
        </Link>
      </div>

      <div className="bg-white shadow rounded overflow-hidden">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-bold border-b">
            <tr>
              <th className="px-6 py-3 w-20">ID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3 w-48">Type</th>
              <th className="px-6 py-3 w-48">Updated At</th>
              <th className="px-6 py-3 w-32 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {problems.map((problem) => (
              <tr key={problem.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono">#{problem.id}</td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link
                    href={`/admin/problems/${problem.id}/test`}
                    className="cursor-pointer"
                    title="Test Problem"
                  >
                    {problem.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      problem.type === "spj"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {problem.type}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {new Date(problem.updatedAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 flex justify-center items-center gap-3">
                  <Link
                    href={`/admin/problems/${problem.id}/test`}
                    className="text-orange-500 hover:text-orange-700"
                    title="Test Problem"
                  >
                    <BeakerIcon className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/admin/problems/${problem.id}/data`}
                    className="text-purple-600 hover:text-purple-800"
                    title="Manage Data & Config"
                  >
                    <ServerStackIcon className="w-5 h-5" />
                  </Link>
                  <Link
                    href={`/admin/problems/${problem.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </Link>
                  <RejudgeButton problemId={problem.id} />
                  <DeleteProblemButton problemId={problem.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination totalItems={total} />
      </div>
    </div>
  );
}
