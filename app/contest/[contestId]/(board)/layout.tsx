import { getContestData } from "@/lib/data"; // 引入上面的模拟函数

interface Props {
  children: React.ReactNode;
  params: {
    contestId: string;
  }
}

export default async function ContestLayout({
  children,
  params,
}: Props) {
  // 1. 获取当前比赛数据
  // 注意：Next.js 会自动并行处理 Layout 和 Page 的数据请求
  const {contestId} = await params
  const contest = await getContestData(contestId);

  return (
    <div className="space-y-6">
      {contest.status === "Pending" ? (
        <div className="text-center py-10 text-gray-500">
          The contest has not started yet.
        </div>
      ) : (
      <div className="bg-white min-w-300 shadow-sm border border-gray-100 rounded-sm p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 mb-2">
              {contest.title}
            </h1>
            <div className="flex gap-4 text-sm text-gray-500">
              <span>ID: <span className="font-mono text-gray-700">{contest.id}</span></span>
              <span>Type: <span className="font-bold text-blue-700">{contest.isPrivate ? 'Private' : 'Public'}</span></span>
              <span>Status: <span className="font-bold text-red-600">{contest.status}</span></span>
            </div>
          </div>
          
          <div className="text-right">
             <div className="text-xs text-gray-400 uppercase">Ends At</div>
             <div className="text-gray-800 font-mono">{contest.endTime}</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 h-1.5 mt-6 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-1.5 w-full" style={{ width: '100%' }}></div>
        </div>
      </div>

      )}
      <div className="min-h-125">
        {children}
      </div>
    </div>
  );
}