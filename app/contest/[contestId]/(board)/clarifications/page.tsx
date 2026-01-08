import Link from "next/link";
import Pagination from '@/components/Pagination';

// 模拟数据：管理员通知
const notifications = Array.from({ length: 0}).map((_, i) => ({
  id: 101 + i,
  title: "1002 数据已更新，深感抱歉",
  time: "23:22:47, Mar 10",
  replies: 1,
}))

// 模拟数据：选手提问
const clarifications = Array.from({ length: 0 }).map((_, i) => ({
  id: 200 + i,
  title: `测试分页数据 - 第 ${i + 1} 条提问`,
  author: `team${1000 + i}`,
  time: "12:00:00, Mar 9",
  replies: i % 5
}));

interface Props {
    searchParams: {
        page?: number;
    },
    params: {
        contestId: string;
    }
}

const TableHeader = ({ hasAuthor = false }) => (
  <thead className="text-base font-bold text-gray-800 bg-white border-y-2 border-gray-200 font-serif">
    <tr>
      <th className="px-6 py-3 text-left">Title</th>
      {hasAuthor && <th className="px-6 py-3 w-32 text-left">Author</th>}
      <th className="px-6 py-3 w-48 text-left">Activity</th>
      <th className="px-6 py-3 w-20 text-left">Replies</th>
    </tr>
  </thead>
);

export default async function Clarifications({ params, searchParams }: Props) {
  const { contestId } = await params;
  const { page } = await searchParams;

  // 1. 获取当前页码
  const currentPage = page || 1;
  const pageSize = 10;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  const currentClarifications = clarifications.slice(startIndex, endIndex);

  return (
    <div className="space-y-8">
      {/* --- Section 1: Notifications --- */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-sm p-6">
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 pl-2">
          Notifications
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <TableHeader />
            <tbody>
              {notifications.map((note) => (
                <tr
                  key={note.id}
                  className="bg-[#eef2f7] border-b border-gray-100 hover:bg-blue-100 transition-colors odd:bg-white even:bg-blue-50/30 text-lg"
                >
                  <td className="px-6 py-3 font-medium">
                    <Link
                      href={`/contest/${contestId}/clarifications/${note.id}`}
                      className="text-blue-600 hover:underline hover:text-blue-800"
                    >
                      {note.title}
                    </Link>
                  </td>
                  <td className="px-6 py-3">{note.time}</td>
                  <td className="px-6 py-3">{note.replies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Section 2: Clarifications --- */}
      <div className="bg-white shadow-sm rounded-sm p-6">
        <div className="flex justify-between items-center mb-4 pb-2">
          <h2 className="text-2xl font-serif font-bold text-gray-900 pl-2">
            Clarifications
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-600">
            <TableHeader hasAuthor={true} />
            <tbody>
              {currentClarifications.map((clari) => (
                <tr key={clari.id} className="bg-white border-b border-gray-100 hover:bg-blue-50 transition-colors odd:bg-blue-50/20 text-lg">
                  <td className="px-6 py-3 font-medium">
                    <Link href={`/contest/${contestId}/clarifications/${clari.id}`} className="text-blue-600 hover:underline hover:text-blue-800">
                      {clari.title}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-gray-500">{clari.author}</td>
                  <td className="px-6 py-3">{clari.time}</td>
                  <td className="px-6 py-3">{clari.replies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <Pagination 
            totalItems={clarifications.length} 
            pageSize={pageSize} 
          />
        </div>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-8">
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 pl-2">
          Question
        </h2>
        <div className="h-px bg-gray-300 w-full mb-6"></div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 pl-2 font-serif">
              Content
            </label>
            <textarea
              rows={4}
              className="w-full bg-[#eef2f7] border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-colors hover:bg-white"
              placeholder="Type your clarification here..."
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button className="bg-blue-600 text-white px-4 py-2 text-sm font-bold rounded-sm hover:bg-blue-700 shadow-sm transition-colors">
            Ask Question
          </button>
          </div>
        </form>
      </div>
    </div>
  );
}
