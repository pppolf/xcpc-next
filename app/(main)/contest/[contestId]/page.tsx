// app/contest/[id]/page.tsx

import { getContestData } from "@/lib/data";

interface Props {
  params : {
    contestId: string;
  }
}

export default async function ContestLogin({
  params,
}: Props) {
  // 在真实开发中，这里需要根据 params.id 去后端 fetch 比赛的详细信息
  const contestId = (await params).contestId;
  const contest = await getContestData(contestId);

  return (
    <div className="flex flex-col md:flex-row gap-12 mt-10">
      {/* 左侧：显示当前 Contest ID 对应的比赛信息 */}
      <div className="flex-1 space-y-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900 leading-tight mb-6">
            {contest.title}
          </h1>
          <div className="w-16 h-1 bg-blue-300 mb-8"></div>

          <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 text-sm mb-6">
            <strong>Note:</strong> {contest.content}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <p className="font-bold text-gray-500 mb-1">Contest Time</p>
              <p className="text-gray-900">{contest.startTime}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 mb-1">Contest Type</p>
              <p className="text-gray-900 font-medium">{contest.isPrivate ? 'Private' : 'Public'}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 mb-1">Contest Status</p>
              <p className="text-gray-900 font-bold">{contest.status}</p>
            </div>
            <div>
              <p className="font-bold text-gray-500 mb-1">Current Contest ID</p>
              <p className="text-gray-900 font-mono text-lg">{contest.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：登录框 */}
      <div className="w-full md:w-100">
        <div className="bg-white p-8 shadow-sm border border-gray-100 rounded-sm">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-6 border-b pb-4">
            Sign In
          </h2>
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Username
              </label>
              <input
                type="text"
                defaultValue="team1711"
                className="w-full bg-blue-50/30 border border-blue-200 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">
                Password
              </label>
              <input
                type="password"
                defaultValue="......"
                className="w-full bg-blue-50/30 border border-blue-200 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block p-2.5"
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              Signing in to Contest{" "}
              <span className="font-bold text-gray-800">{contestId}</span>
            </p>
            <button
              type="button"
              className="w-full text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-sm text-sm px-5 py-3 shadow-md"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
