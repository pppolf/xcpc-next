import { prisma } from "@/lib/prisma";
import {
  generateBalloons,
  getBalloonData,
  assignBalloon,
  completeBalloon,
} from "./actions";
import {
  UserCircleIcon,
  CheckCircleIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { QRCodeSVG } from "qrcode.react";
import { getDictionary } from "@/lib/get-dictionary";

interface Props {
  params: Promise<{ contestId: string }>;
}

export default async function BalloonPage({ params }: Props) {
  const { contestId } = await params;
  const cid = Number(contestId);

  // 尝试生成新气球任务
  await generateBalloons(cid);
  const { balloons, runners, isMaster, currentUserId } = await getBalloonData(
    cid
  );

  const pending = balloons.filter((b) => b.status === "PENDING");
  const assigned = balloons.filter((b) => b.status === "ASSIGNED");
  const completed = balloons.filter((b) => b.status === "COMPLETED");

  // 构建让志愿者扫码登录的 URL
  // 这里假设你的登录页是 /login，为了方便志愿者，可以带上 contest redirect 参数
  // 实际生产中可能需要一个专门的 token 或者 invite link，这里用简化版链接
  // 因为无法在 Server Component 获取 window.location，这里硬编码或用环境变量
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const loginUrl = `${baseUrl}/login?redirect=/contest/${cid}/balloon`;

  const contestProblem = await prisma.contestProblem.findMany({
    where: {
      contestId: cid,
    },
    select: {
      problemId: true,
      displayId: true,
      color: true,
    },
  });
  type problemInfo = {
    displayId: string;
    color: string | null;
  };
  const problemMap: Record<number, problemInfo> = {};
  contestProblem.forEach((cp) => {
    problemMap[cp.problemId] = {
      displayId: cp.displayId,
      color: cp.color,
    };
  });

  const dict = await getDictionary();

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2 font-serif">
          🎈 {dict.balloon.title}
        </h1>

        {/* 只给 Master 显示二维码及刷新按钮 */}
        {isMaster && (
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-gray-500 uppercase">
                Volunteer Login
              </p>
              <p className="text-xs text-gray-400">
                Scan to access mobile view
              </p>
            </div>
            <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded overflow-hidden">
              {/* 悬浮放大二维码 */}
              <div className="group">
                <QrCodeIcon className="w-6 h-6 text-gray-600 cursor-pointer" />
                <div className="fixed top-8 right-0 w-48 bg-white p-4 shadow-xl border rounded hidden group-hover:block z-50 text-center">
                  <QRCodeSVG value={loginUrl} size={160} className="mx-auto" />
                  <p className="text-[10px] text-gray-400 mt-2 break-all">
                    {loginUrl}
                  </p>
                </div>
              </div>
            </div>
            <form action={generateBalloons.bind(null, cid)}>
              <button className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded hover:bg-blue-700 transition">
                Refresh
              </button>
            </form>
          </div>
        )}
      </div>

      {/* --- Master View: 派单界面 --- */}
      {isMaster && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Pool */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between">
              <h2 className="font-bold text-orange-800">
                1. Task Pool ({pending.length})
              </h2>
            </div>
            <div className="p-4 space-y-3 max-h-125 overflow-y-auto">
              {pending.map((b) => (
                <div
                  key={b.id}
                  className="p-4 border border-gray-100 rounded-md bg-white hover:border-orange-200 transition shadow-sm"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-black text-xl text-gray-800">
                      Problem {problemMap[b.submission.problem.id].displayId}
                    </span>
                    <span className="text-sm font-medium text-gray-600">
                      <span className="text-sm pr-2">
                        {b.submission.user?.seat}
                      </span>
                      {b.submission.user?.displayName}
                    </span>
                  </div>
                  <form
                    action={async (formData) => {
                      "use server";
                      const rid = formData.get("runnerId") as string;
                      if (rid) await assignBalloon(cid, b.id, rid);
                    }}
                    className="flex gap-2 mt-3"
                  >
                    <select
                      name="runnerId"
                      className="flex-1 text-sm bg-gray-50 border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="">Select Runner...</option>
                      {runners.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.displayName || r.username}
                        </option>
                      ))}
                    </select>
                    <button className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-bold">
                      Assign
                    </button>
                  </form>
                </div>
              ))}
              {pending.length === 0 && (
                <p className="text-center text-gray-400 py-8 text-sm">
                  All clear! No pending balloons.
                </p>
              )}
            </div>
          </div>

          {/* Running */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-100">
              <h2 className="font-bold text-blue-800">
                2. In Progress ({assigned.length})
              </h2>
            </div>
            <div className="p-4 space-y-3 max-h-125 overflow-y-auto">
              {assigned.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-md shadow-sm"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800 w-8">
                        P-{problemMap[b.submission.problem.id].displayId}
                      </span>
                      <span className="text-gray-400">|</span>
                      <span className="text-sm text-gray-600 truncate max-w-37.5">
                        {b.submission.user?.displayName}
                        <span className="pl-2">{b.submission.user?.seat}</span>
                      </span>
                    </div>
                  </div>
                  <div className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                    <UserCircleIcon className="w-3 h-3" />
                    {b.assignedTo?.displayName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- Volunteer View (Mobile Friendly) --- */}
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 px-1">
        {isMaster ? (
          <span className="text-gray-400">Recently Completed Log</span>
        ) : (
          <span className="text-green-600">My Tasks to Deliver</span>
        )}
      </h2>

      {!isMaster &&
      assigned.filter((b) => b.assignedToId === currentUserId).length === 0 ? (
        <div className="bg-green-50 rounded-xl p-8 text-center border-2 border-dashed border-green-200">
          <p className="text-green-800 font-bold text-lg">You are ready!</p>
          <p className="text-green-600 text-sm mt-1">
            Wait for the Balloon Master to assign you tasks.
          </p>
          <form action={generateBalloons.bind(null, cid)} className="mt-6">
            <button className="text-blue-600 underline text-sm">
              Refresh manually
            </button>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 待完成的任务 - 大卡片 */}
          {!isMaster &&
            assigned
              .filter((b) => b.assignedToId === currentUserId)
              .map((b) => (
                <div
                  key={b.id}
                  className="bg-white border-2 border-blue-600 rounded-xl p-6 shadow-xl relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    DELIVER NOW
                  </div>
                  <div className="text-5xl font-black text-gray-900 mb-2">
                    <div className="flex justify-between items-center">
                      {problemMap[b.submission.problem.id].displayId}
                      <div
                        className="flex items-center gap-2 text-2xl"
                        style={{
                          color: `${problemMap[b.submission.problem.id].color}`,
                        }}
                      >
                        {problemMap[b.submission.problem.id].color}
                        <svg
                          viewBox="0 0 512 512"
                          width="26"
                          height="26"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fill={
                              problemMap[b.submission.problem.id].color ||
                              "#6b7280"
                            }
                            d="M391 307.27c32.75-46.35 46.59-101.63 39-155.68C416.47 55.59 327.38-11.54 231.38 2S68.24 104.53 81.73 200.53c7.57 53.89 36.12 103.16 80.37 138.74c26.91 21.64 57.59 36.1 86.05 41.33l-8.36 45.23a8 8 0 0 0 9 9.38L279 431c15.9 35.87 41.65 60.48 78.41 75l14.88 5.88l11.77-29.75l-14.88-5.89c-26.35-10.42-44.48-26.16-57-49.92l21.84-3.07a8 8 0 0 0 6.05-11.49l-20.49-41.16c25.98-12.87 51.49-35.18 71.42-63.33m-160.82 15.66c-41.26-16.32-76.3-52.7-91.45-94.94l-5.4-15.06l30.12-10.8l5.4 15.06c14.5 40.44 47.27 65.77 73.1 76l14.88 5.88l-11.77 29.76Z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-700 mb-8 border-l-4 border-gray-300 pl-3">
                    {b.submission.user?.displayName}
                    <span className="text-base pl-2 text-gray-500">
                      {b.submission.user?.seat}
                    </span>
                  </div>

                  <form
                    action={completeBalloon.bind(null, cid, b.id)}
                    className="w-full"
                  >
                    <button className="w-full bg-green-500 hover:bg-green-600 active:scale-95 text-white font-bold py-4 rounded-lg shadow-md transition-all flex items-center justify-center gap-2 text-lg">
                      <CheckCircleIcon className="w-6 h-6" />
                      DONE
                    </button>
                  </form>
                </div>
              ))}

          {/* 已完成的任务 - 灰色小卡片 (所有人可见历史) */}
          {completed.slice(0, 10).map((b) => (
            <div
              key={b.id}
              className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-70"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-gray-500">
                  Problem {problemMap[b.submission.problem.id].displayId}
                </span>
                <span className="text-xs text-green-600 border border-green-200 px-1 py-0.5 rounded font-mono">
                  DELIVERED
                </span>
              </div>
              <div className="text-sm text-gray-400">
                {b.submission.user?.displayName}
                <span className="text-base pl-2">
                  {b.submission.user?.seat}
                </span>
              </div>
              {isMaster && (
                <div className="text-xs text-gray-300 mt-2 text-right">
                  By {b.assignedTo?.displayName}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
