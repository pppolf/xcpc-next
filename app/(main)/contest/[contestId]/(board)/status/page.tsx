import Link from "next/link";
import Pagination from "@/components/Pagination";
import {
  ContestRole,
  ContestStatus,
  Verdict,
} from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma/client";
import VerdictCell from "@/components/VerdictCell";
import StatusControls from "./StatusControls";
import SearchAndFilter from "./SearchAndFilter";
import { verifyAuth } from "@/lib/auth";
import { cookies } from "next/headers";

interface Props {
  searchParams: Promise<{
    page?: string;
    userId?: string;
    problem?: string;
    language?: string;
    verdict?: Verdict;
    userSearch?: string;
    viewAll?: string;
  }>;
  params: Promise<{
    contestId: string;
  }>;
}

export default async function Status({ params, searchParams }: Props) {
  const { contestId } = await params;
  const {
    page = "1",
    userId,
    problem,
    language,
    verdict,
    userSearch,
    viewAll = "false",
  } = await searchParams;

  const currentPage = parseInt(page as string) || 1;
  const pageSize = 15;
  const cid = parseInt(contestId);

  // 1. 获取比赛信息
  const contestInfo = await prisma.contest.findUnique({
    where: { id: cid },
    select: {
      status: true,
    },
  });

  if (!contestInfo) {
    return (
      <div className="text-center py-10 text-gray-500">Contest not found.</div>
    );
  }

  // 2. 获取当前用户信息
  const cookieStore = await cookies();
  const token = cookieStore.get("user_token")?.value;
  const payload = token ? await verifyAuth(token) : null;

  // 3. 获取当前用户在比赛中的角色
  let currentUser = null;
  if (payload?.userId) {
    currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        role: true,
        contestId: true,
      },
    });
  }

  // 4. 权限校验逻辑
  const isAdmin =
    currentUser &&
    currentUser.contestId === cid &&
    (currentUser.role === ContestRole.ADMIN ||
      currentUser.role === ContestRole.JUDGE);

  const isContestEnded = contestInfo.status === ContestStatus.ENDED;
  const canViewAll = isContestEnded || isAdmin || false;
  const canSearch = isContestEnded || isAdmin || false;

  // 用户选择查看所有提交且有权限
  const userWantsViewAll = viewAll === "true";
  const shouldViewAll = userWantsViewAll && canViewAll;

  const finalUserId = shouldViewAll ? userId : currentUser?.id;

  // 构建查询条件
  const where: Prisma.SubmissionWhereInput = {
    contestId: cid,
  };

  if (finalUserId) {
    where.userId = finalUserId;
  }

  // 问题筛选
  if (problem) {
    const contestProblem = await prisma.contestProblem.findFirst({
      where: {
        contestId: cid,
        displayId: problem,
      },
    });
    if (contestProblem) {
      where.problemId = contestProblem.problemId;
    }
  }

  // 语言筛选
  if (language) {
    where.language = language;
  }

  // 判题结果筛选
  if (verdict) {
    where.verdict = verdict;
  }

  // 用户搜索（模糊匹配用户名或displayName）
  if (userSearch && canSearch) {
    where.user = {
      OR: [
        {
          username: {
            contains: userSearch,
            mode: "insensitive",
          },
        },
        {
          displayName: {
            contains: userSearch,
            mode: "insensitive",
          },
        },
      ],
    };
  }

  const [totalCount, submissions, allProblems, allLanguages, allVerdicts] =
    await Promise.all([
      prisma.submission.count({ where }),
      prisma.submission.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
            },
          },
          problem: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          submittedAt: "desc",
        },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      }),
      // 获取所有问题用于筛选
      prisma.contestProblem.findMany({
        where: { contestId: cid },
        select: {
          displayId: true,
          problemId: true,
        },
      }),
      // 获取所有语言
      prisma.submission
        .findMany({
          where: { contestId: cid },
          select: { language: true },
          distinct: ["language"],
        })
        .then((results) => results.map((r) => r.language)),
      // 获取所有判题结果
      prisma.submission
        .findMany({
          where: { contestId: cid },
          select: { verdict: true },
          distinct: ["verdict"],
        })
        .then((results) => results.map((r) => r.verdict)),
    ]);

  const problemIdMap = new Map(
    allProblems.map((cp) => [cp.problemId, cp.displayId])
  );

  const statusLabel =
    !shouldViewAll && currentUser
      ? "(Your Submissions)"
      : isContestEnded
      ? "(Contest Ended - All Submissions Visible)"
      : "";

  return (
    <div className="bg-white min-w-7xl max-w-7xl shadow-sm border border-gray-100 rounded-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold text-gray-800">
          Status <span className="text-sm text-gray-500">{statusLabel}</span>
        </h2>
        <div className="flex items-center gap-4">
          <SearchAndFilter
            canSearch={canSearch}
            problems={allProblems}
            languages={allLanguages}
            verdicts={allVerdicts}
          />
          {currentUser && <StatusControls canViewAll={canViewAll} />}
        </div>
      </div>

      {contestInfo.status === ContestStatus.PENDING ? (
        <div className="text-center py-10 text-gray-500">
          The contest has not started yet.
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          {shouldViewAll
            ? "No submissions yet."
            : "You have no submissions yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-center">
            <thead className="text-base font-serif text-gray-800 bg-white border-b border-gray-400 border-t-2 font-bold">
              <tr>
                <th scope="col" className="px-6 py-2">
                  Run ID
                </th>
                <th scope="col" className="px-6 py-2">
                  Submit Time
                </th>
                <th scope="col" className="px-6 py-2">
                  User
                </th>
                <th scope="col" className="px-6 py-2">
                  Problem
                </th>
                <th scope="col" className="px-6 py-2">
                  Time
                </th>
                <th scope="col" className="px-6 py-2">
                  Memory
                </th>
                <th scope="col" className="px-6 py-2">
                  Language
                </th>
                <th scope="col" className="px-6 py-2">
                  Judge Status
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((submission) => {
                const problemDisplayId =
                  problemIdMap.get(submission.problemId) || "?";
                const submitTime = new Date(
                  submission.submittedAt
                ).toLocaleString("zh-CN");

                return (
                  <tr
                    key={submission.id}
                    className="odd:bg-white even:bg-[#e7f3ff] border-b border-gray-100 hover:bg-blue-50 transition-colors h-10 text-[18px] text-center font-[Menlo] text-gray-700"
                  >
                    <td className="px-6 py-2">{submission.displayId}</td>
                    <td className="px-6 py-2 text-sm">{submitTime}</td>
                    <td className="px-6 py-2 text-gray-900">
                      {submission.user?.displayName ||
                        submission.user?.username ||
                        "Unknown"}
                    </td>
                    <td className="px-6 py-2 text-gray-900">
                      <Link
                        href={`/contest/${contestId}/problems/${problemDisplayId}`}
                        className="text-blue-500 hover:underline hover:text-blue-800"
                      >
                        {problemDisplayId}
                      </Link>
                    </td>
                    <td className="px-6 py-2">
                      {submission.timeUsed !== null
                        ? `${submission.timeUsed} ms`
                        : "-"}
                    </td>
                    <td className="px-6 py-2">
                      {submission.memoryUsed !== null
                        ? `${submission.memoryUsed} KB`
                        : "-"}
                    </td>
                    <td className="px-6 py-2">
                      <Link
                        href={`/contest/${contestId}/status/${submission.displayId}`}
                        className="text-blue-500 hover:underline hover:text-blue-800"
                      >
                        {submission.language}
                      </Link>
                    </td>
                    <td className="px-6 py-2">
                      <VerdictCell submission={submission} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页组件 */}
      <div className="mt-6">
        <Pagination totalItems={totalCount} pageSize={pageSize} />
      </div>
    </div>
  );
}
