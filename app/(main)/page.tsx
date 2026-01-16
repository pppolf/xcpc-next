import { ContestStatus, ContestType } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { JsonValue } from "@prisma/client/runtime/client";
import Link from "next/link";
import { getCurrentUser, UserJwtPayload } from "@/lib/auth";
import { redirect } from "next/navigation";

export type ContestConfig = {
  medal: {
    mode: "ratio" | "fixed";
    gold: number;
    silver: number;
    bronze: number;
  };
  frozenDuration: number;
  unfreezeDelay: number;
};

export interface Contest {
  id: number;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  type: ContestType;
  password: string | null;
  status: ContestStatus;
  config: ContestConfig | null | JsonValue;
  createdAt: Date;
  updatedAt: Date;
}

export default async function ContestList() {
  // 权限校验：检查当前用户是否为全局管理员
  const currentUser = await getCurrentUser();

  // 如果用户未登录或不是全局管理员，重定向到用户所在的比赛
  if (
    currentUser &&
    typeof currentUser !== "string" &&
    !(currentUser as UserJwtPayload).isGlobalAdmin
  ) {
    if ((currentUser as UserJwtPayload).contestId) {
      redirect(`/contest/${(currentUser as UserJwtPayload).contestId}`);
    }
  }

  const contests: Contest[] = await prisma.contest.findMany({
    orderBy: { id: "desc" },
  });

  return (
    <div className="bg-white shadow-sm border border-gray-100 rounded-sm p-6 mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-serif font-bold text-gray-800">
          Contest List
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 w-24 text-center">比赛ID</th>
              <th className="px-6 py-3">标题</th>
              <th className="px-6 py-3 w-32">比赛状态</th>
              <th className="px-6 py-3 w-32">比赛类型</th>
              <th className="px-6 py-3 w-48">开始时间</th>
              <th className="px-6 py-3 w-48">结束时间</th>
              <th className="px-6 py-3 w-48">封榜时间</th>
              <th className="px-6 py-3 w-30">比赛持续时间</th>
            </tr>
          </thead>
          <tbody>
            {contests.map((contest) => (
              <tr
                key={contest.id}
                className="bg-white border-b hover:bg-blue-50 transition-colors"
              >
                <td className="px-6 py-4 font-bold text-gray-900 text-center">
                  {contest.id}
                </td>
                <td className="px-6 py-4">
                  {/* 点击标题跳转到具体比赛的登录页 */}
                  <Link
                    href={`/contest/${contest.id}`}
                    className="text-blue-600 hover:underline font-medium text-base"
                  >
                    {contest.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-medium 
                    ${
                      contest.status === ContestStatus.RUNNING
                        ? "bg-green-100 text-green-800"
                        : contest.status === ContestStatus.ENDED
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {contest.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {contest.type === ContestType.PRIVATE ? (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      🔒 Private
                    </span>
                  ) : (
                    <span className="text-green-600">Public</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {contest.startTime.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {contest.endTime.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  {(contest.config as ContestConfig)?.frozenDuration
                    ? `结束前 ${
                        (contest.config as ContestConfig)?.frozenDuration
                      } 分钟`
                    : "未封榜"}
                </td>
                <td className="px-6 py-4">
                  {(
                    (contest.endTime.getTime() - contest.startTime.getTime()) /
                    1000 /
                    3600
                  ).toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
