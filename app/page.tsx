import Link from "next/link";

// 模拟比赛数据
const contests = [
  { id: 1001, title: '2025“钉耙编程”中国大学生算法设计暑期联赛（2）', status: 'Ended', type: 'Private', start: '2025-07-21 12:00:00', duration: '5h' },
  { id: 1002, title: '2026 XCPC 寒假集训排位赛 (1)', status: 'Running', type: 'Public', start: '2026-01-07 14:00:00', duration: '5h' },
  { id: 1003, title: '2026 新生选拔赛', status: 'Pending', type: 'Private', start: '2026-02-01 09:00:00', duration: '4h' },
];

export default function ContestList() {
  return (
    <div className="bg-white shadow-sm border border-gray-100 rounded-sm p-6 mt-6">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-serif font-bold text-gray-800">Contest List</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 w-20">CID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3 w-32">Status</th>
              <th className="px-6 py-3 w-32">Type</th>
              <th className="px-6 py-3 w-48">Start Time</th>
              <th className="px-6 py-3 w-24">Duration</th>
            </tr>
          </thead>
          <tbody>
            {contests.map((contest) => (
              <tr key={contest.id} className="bg-white border-b hover:bg-blue-50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{contest.id}</td>
                <td className="px-6 py-4">
                  {/* 点击标题跳转到具体比赛的登录页 */}
                  <Link href={`/contest/${contest.id}`} className="text-blue-600 hover:underline font-medium text-base">
                    {contest.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded text-xs font-medium 
                    ${contest.status === 'Running' ? 'bg-green-100 text-green-800' : 
                      contest.status === 'Ended' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                    {contest.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {contest.type === 'Private' ? (
                    <span className="text-red-600 font-bold flex items-center gap-1">
                      🔒 Private
                    </span>
                  ) : (
                    <span className="text-green-600">Public</span>
                  )}
                </td>
                <td className="px-6 py-4">{contest.start}</td>
                <td className="px-6 py-4">{contest.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}