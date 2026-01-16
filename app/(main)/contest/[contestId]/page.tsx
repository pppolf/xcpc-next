// app/contest/[contestId]/page.tsx

import { verifyAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { loginContestUser } from "./actions";

interface Props {
  params: Promise<{
    contestId: string;
  }>;
}

export default async function ContestLogin({ params }: Props) {
  const contestId = (await params).contestId;
  const id = Number(contestId);

  const contest = await prisma.contest.findUnique({
    where: { id },
  });

  if (!contest) notFound();

  // 检查是否已登录
  const cookieStore = await cookies();
  const user_token = cookieStore.get("user_token")?.value;
  const auth_token = cookieStore.get("auth_token")?.value;
  let user;
  let super_admin;
  if (user_token) {
    const payload = await verifyAuth(user_token);
    if (!payload || !payload.userId) throw new Error("Invalid Token");
    const username = payload.username;
    user = await prisma.user.findFirst({
      where: {
        username,
        contestId: id,
      },
    });
  }
  if (auth_token) {
    const payload = await verifyAuth(auth_token);
    if (!payload || !payload.userId) throw new Error("Invalid Token");
    super_admin = payload.username;
  }

  return (
    <div className="flex flex-col md:flex-row gap-12 mt-10">
      {/* 左侧：显示当前 Contest ID 对应的比赛信息 */}
      <div className="flex-1 space-y-8 min-w-3xl">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6">
            {contest?.title}
          </h1>
          <div className="w-16 h-1 bg-blue-300 mb-8"></div>

          {/* <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm mb-6">
            <strong>Note:</strong> {contest?.description}
          </div> */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <p className="font-bold text-gray-500 mb-1">Contest Time</p>
              <p className="text-gray-900">
                {contest?.startTime.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-500 mb-1">Contest Type</p>
              <p className="text-gray-900 font-medium">{contest?.type}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 mb-1">Contest Status</p>
              <p className="text-gray-900 font-bold">{contest?.status}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 mb-1">Current Contest ID</p>
              <p className="text-gray-900 font-mono text-lg">{contest?.id}</p>
            </div>
          </div>

          <div className="w-full h-0.5 bg-sky-200 my-8"></div>

          <article className="prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-pre:bg-gray-100 prose-pre:text-gray-800">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {contest.description}
            </ReactMarkdown>
          </article>
        </div>
      </div>

      {/* 右侧：登录框 */}
      <div className="w-full min-h-40 md:w-100">
        {!user_token && !auth_token ? (
          <div className="bg-white p-8 shadow-sm border border-gray-100 rounded-sm">
            <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6 border-b pb-4">
              Sign In
            </h2>
            <form
              action={async (fromData: FormData) => {
                "use server";
                await loginContestUser(id, fromData);
              }}
              className="space-y-5"
            >
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  placeholder="Username"
                  defaultValue=""
                  name="username"
                  className="w-full bg-blue-50/30 border border-blue-200 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-600 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Password"
                  defaultValue=""
                  name="password"
                  className="w-full bg-blue-50/30 border border-blue-200 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                />
              </div>
              <p className="text-xs text-gray-500 text-center">
                Signing in to Contest{" "}
                <span className="font-bold text-gray-800">{contestId}</span>
              </p>
              <button
                type="submit"
                className="w-full text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-sm text-sm px-5 py-3 shadow-md cursor-pointer"
              >
                Sign In
              </button>
            </form>
          </div>
        ) : auth_token ? (
          <div className="bg-linear-to-br from-purple-50 to-indigo-50 p-8 shadow-lg border border-purple-100 rounded-lg">
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-purple-100 rounded-full mb-4">
                <svg
                  className="w-12 h-12 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                超级管理员
              </h2>
              <div className="w-16 h-1 bg-purple-400 mx-auto mb-4"></div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-center space-x-3">
                <div className="w-10 h-10 bg-linear-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {super_admin?.charAt(0).toUpperCase()}
                </div>
                <div className="text-xl font-semibold text-gray-800">
                  {super_admin}
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="text-center text-sm text-gray-500">
                  拥有完全访问权限
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 shadow-lg border border-blue-100 rounded-lg">
            <div className="text-center mb-6">
              <div className="inline-block p-3 bg-blue-100 rounded-full mb-4">
                <svg
                  className="w-12 h-12 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                参赛信息
              </h2>
              <div className="w-16 h-1 bg-blue-400 mx-auto mb-4"></div>
            </div>

            <div className="space-y-4">
              {/* 队伍名称 */}
              <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      队伍名称
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {user?.displayName || "未设置"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 队员信息 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      队员
                    </p>
                    <p className="text-sm text-gray-800">
                      {user?.members || "未设置"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 学校信息 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-start">
                  <div className="shrink-0">
                    <svg
                      className="w-5 h-5 text-gray-600 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      组织
                    </p>
                    <p className="text-sm text-gray-800">
                      {user?.school || "未设置"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 座位和角色 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      座位号
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {user?.seat || "-"}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      角色
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {user?.role || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* 教练信息 */}
              {user?.coach && (
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <svg
                        className="w-5 h-5 text-amber-600 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                        指导教练
                      </p>
                      <p className="text-sm font-medium text-amber-900">
                        {user.coach}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
