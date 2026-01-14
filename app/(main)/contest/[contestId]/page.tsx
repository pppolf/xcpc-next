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
          <div className="flex h-full justify-center flex-col">
            <h1 className="text-center text-4xl font-serif text-gray-500">
              Hello SuperAdmin
            </h1>
            <div className="w-full h-1 bg-blue-300 mt-4 mb-8"></div>
            <div className="flex flex-col items-center">
              <div className="mt-1 text-2xl font-serif">{super_admin}</div>
            </div>
          </div>
        ) : (
          <div className="flex h-full justify-center flex-col">
            <h1 className="text-center text-4xl font-serif text-gray-500">
              Hello Contestants
            </h1>
            <div className="w-full h-1 bg-blue-300 mt-4 mb-8"></div>
            <div className="flex flex-col items-start">
              <div className="mt-1 text-2xl font-serif">
                队伍: {user?.displayName}
              </div>
              <div className="mt-1 text-2xl font-serif">
                队员: {user?.members}
              </div>
              <div className="mt-1 text-2xl font-serif">
                组织: {user?.school}
              </div>
              <div className="mt-1 text-2xl font-serif">座位: {user?.seat}</div>
              <div className="mt-1 text-2xl font-serif">
                教练: {user?.coach}
              </div>
              <div className="mt-1 text-2xl font-serif">角色: {user?.role}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
