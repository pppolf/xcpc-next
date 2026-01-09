import { getContestData } from "@/lib/data";
import Link from "next/link";
import Pagination from "@/components/Pagination";

interface Props {
  searchParams: {
    page?: number;
  };
  params: {
    contestId: string;
  };
}

const renderStatus = (status: string) => {
  if (status === "Compilation Error")
    return (
      <a href="#" className="text-blue-500 hover:underline ">
        Compilation Error
      </a>
    );
  if (status === "Accepted")
    return <span className="text-green-500 ">Accepted</span>;
  return <span className="text-red-500">{status}</span>;
};

const submissions = Array.from({ length: 500 }).map((_, i) => ({
  id: 1 + i,
  time: "2025-03-14 15:01:17",
  pid: String.fromCharCode(65 + (i % 10)),
  execTime: 281 + i,
  execMemory: 3492 + i,
  language: "C++",
  status: i % 3 === 0 ? "Accepted" : "Wrong Answer",
}));

export default async function Status({ params, searchParams }: Props) {
  const { contestId } = await params;
  const { page } = await searchParams;

  const contestInfo = await getContestData(contestId);

  const currentPage = page || 1;
  const pageSize = 15; // Status 通常一页显示多一点

  const startIndex = (currentPage - 1) * pageSize;
  const submission = submissions.slice(startIndex, startIndex + pageSize);

  // const submission = [
  //   {
  //     id: 1,
  //     time: "2025-03-14 15:01:17",
  //     pid: "A",
  //     execTime: 281,
  //     execMemory: 3492,
  //     language: "C++",
  //     status: "Wrong Answer",
  //   },
  //   {
  //     id: 2,
  //     time: "2025-03-14 15:02:17",
  //     pid: "E",
  //     execTime: 281,
  //     execMemory: 3492,
  //     language: "C++",
  //     status: "Accepted",
  //   },
  //   {
  //     id: 3,
  //     time: "2025-03-14 15:11:17",
  //     pid: "B",
  //     execTime: 281,
  //     execMemory: 3492,
  //     language: "C",
  //     status: "Compilation Error",
  //   },
  //   {
  //     id: 4,
  //     time: "2025-03-14 15:31:17",
  //     pid: "D",
  //     execTime: 281,
  //     execMemory: 3492,
  //     language: "PyPy3",
  //     status: "Time Limit Exceeded",
  //   },
  //   {
  //     id: 5,
  //     time: "2025-03-14 15:41:17",
  //     pid: "C",
  //     execTime: 281,
  //     execMemory: 3492,
  //     language: "Java",
  //     status: "Accepted",
  //   },
  // ];

  return (
    <div className="bg-white min-w-6xl shadow-sm border border-gray-100 rounded-sm p-6">
      <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 pl-2">
        Status
      </h2>
      {contestInfo.status === "Pending" ? (
        <div className="text-center py-10 text-gray-500">
          The contest has not started yet.
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
                  Problem ID
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
              {submission.map((prob) => (
                <tr
                  key={prob.id}
                  className="odd:bg-white even:bg-[#e7f3ff] border-b border-gray-100 hover:bg-blue-50 transition-colors h-10 text-[18px] text-center font-[Menlo] text-gray-700"
                >
                  <td className="px-6 py-2">{prob.id}</td>
                  <td className="px-6 py-2">{prob.time}</td>
                  <td className="px-6 py-2 text-gray-900">
                    <Link
                      href={`/contest/${contestId}/problems/${prob.pid}`}
                      className="text-blue-500 hover:underline hover:text-blue-800"
                    >
                      {prob.pid}
                    </Link>
                  </td>
                  <td className="px-6 py-2">{prob.execTime} MS</td>
                  <td className="px-6 py-2">{prob.execMemory} K</td>
                  <td className="px-6 py-2">
                    <a
                      href="#"
                      className="text-blue-500 hover:underline hover:text-blue-800"
                    >
                      {prob.language}
                    </a>
                  </td>
                  <td className="px-6 py-2">{renderStatus(prob.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* 分页组件放在左下角 */}
      <div className="mt-6">
        <Pagination totalItems={submissions.length} pageSize={pageSize} />
      </div>
    </div>
  );
}
