import { CheckIcon } from "@heroicons/react/24/solid"; // 需要安装: npm install @heroicons/react
import Link from "next/link";
import { ContestStatus, Verdict } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, UserJwtPayload } from "@/lib/auth";

interface Props {
  params: Promise<{
    contestId: string;
  }>;
}

export default async function Problems({ params }: Props) {
  const contestId = Number((await params).contestId);
  // const contestInfo = await getContestData(contestId);
  const contestInfo = await prisma.contest.findUnique({
    where: {
      id: contestId,
    },
  });
  const contestProblem = await prisma.contestProblem.findMany({
    where: {
      contestId: contestId,
    },
    orderBy: {
      displayId: "asc",
    },
    include: {
      problem: true,
    },
  });

  const totalStats = await prisma.submission.groupBy({
    by: ["problemId"],
    where: { contestId: contestId },
    _count: { _all: true },
  });

  const acStats = await prisma.submission.groupBy({
    by: ["problemId"],
    where: {
      contestId: contestId,
      verdict: Verdict.ACCEPTED,
    },
    _count: { _all: true },
  });
  const totalMap = new Map(totalStats.map((s) => [s.problemId, s._count._all]));
  const acMap = new Map(acStats.map((s) => [s.problemId, s._count._all]));
  const user = await getCurrentUser();
  const userStats = await prisma.submission.findMany({
    where: {
      userId: (user as UserJwtPayload)?.userId,
      contestId: contestId,
      verdict: Verdict.ACCEPTED,
    },
  });
  const statsMap = new Map(userStats.map((s) => [s.problemId, 1]));

  return (
    <div className="bg-white min-w-7xl max-w-7xl shadow-sm border border-gray-100 rounded-sm p-6">
      <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 pl-2">
        Problems
      </h2>
      {contestInfo?.status === ContestStatus.PENDING ? (
        <div className="text-center py-10 text-gray-500">
          The contest has not started yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-serif text-left text-gray-600">
            <thead className="text-lg text-gray-700 bg-white border-b border-gray-400 border-t">
              <tr>
                <th scope="col" className="px-6 py-2 w-16">
                  Solved
                </th>
                <th scope="col" className="px-6 py-2 w-42">
                  Problem ID
                </th>
                <th scope="col" className="px-6 py-2">
                  Title
                </th>
                <th scope="col" className="px-6 py-2 w-80">
                  Ratio (Accepted / Submitted)
                </th>
              </tr>
            </thead>
            <tbody>
              {contestProblem.map((prob) => {
                const acceptedCount = acMap.get(prob.problemId) || 0;
                const totalCount = totalMap.get(prob.problemId) || 0;
                const rate =
                  totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;
                return (
                  <tr
                    key={prob.id}
                    className="odd:bg-white even:bg-[#f4f7fa] border-b border-gray-300 hover:bg-blue-50 transition-colors h-10 text-base"
                  >
                    <td className="px-6 py-2">
                      {(statsMap.get(prob.problemId) || 0) !== 0 && (
                        <CheckIcon className="h-5 w-5 text-green-600" />
                      )}
                    </td>
                    <td className="px-6 py-2 text-gray-900">
                      {prob.displayId}
                    </td>
                    <td className="px-6 py-2">
                      <Link
                        href={`/contest/${contestId}/problems/${prob.displayId}`}
                        className="text-blue-600 hover:underline hover:text-blue-800"
                      >
                        {prob.problem.title}
                      </Link>
                    </td>
                    <td className="px-6 py-2 text-left">
                      {rate.toFixed(2)}% ({acceptedCount}/{totalCount})
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
