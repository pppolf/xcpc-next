import Link from "next/link";
import { getContests } from "./contests/actions"; // 引入刚才写好的获取比赛 Action
import { PlusIcon, TrophyIcon } from "@heroicons/react/24/outline";

export default async function AdminDashboard() {
  // 获取最新的 5 场比赛显示在仪表盘
  const { contests } = await getContests(1, 5);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Administrator.</p>
        </div>

        {/* 【修正 1】这里改成 Link 跳转到创建页面 */}
        <Link
          href="/admin/contests/create"
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg shadow-sm hover:bg-blue-700 transition-colors font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          Create New Contest
        </Link>
      </div>

      {/* 统计卡片 (示例) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-bold uppercase mb-2">
            Total Contests
          </div>
          <div className="text-3xl font-extrabold text-gray-800">
            {contests.length}
          </div>
        </div>
        {/* ... 其他统计卡片 ... */}
      </div>

      <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <div className="font-bold text-gray-700 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-gray-400" />
            Recent Contests
          </div>
          <Link
            href="/admin/contests"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            View All
          </Link>
        </div>

        {contests.length === 0 ? (
          <div className="p-8 text-center text-gray-400 italic">
            No contests found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {contests.map((c) => (
              <li
                key={c.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center hover:bg-gray-50 transition-colors gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-400 font-mono text-sm">
                      #{c.id}
                    </span>
                    <span className="font-bold text-gray-900">{c.title}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                        c.status === "RUNNING"
                          ? "bg-green-100 text-green-700"
                          : c.status === "ENDED"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-yellow-50 text-yellow-700"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-4">
                    <span>{new Date(c.startTime).toLocaleString()}</span>
                    <span>•</span>
                    <span>{c.type}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  {/* 【修正 2】修正跳转链接为 contests (复数) */}
                  <Link
                    href={`/admin/contests/${c.id}/problems`}
                    className="text-xs font-bold border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm bg-gray-50"
                  >
                    Manage Problems
                  </Link>
                  <Link
                    href={`/admin/contests/${c.id}/users`}
                    className="text-xs font-bold border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-white hover:border-purple-500 hover:text-purple-600 transition-all shadow-sm bg-gray-50"
                  >
                    Users
                  </Link>
                  <Link
                    href={`/admin/contests/${c.id}/edit`}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 px-2 py-1.5"
                  >
                    Settings
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
