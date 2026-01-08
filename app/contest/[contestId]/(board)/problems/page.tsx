import { CheckIcon } from "@heroicons/react/24/solid"; // 需要安装: npm install @heroicons/react
import { getContestData } from "@/lib/data";
import Link from "next/link";

interface Props {
  params: {
    contestId: string;
  }
}

export default async function Problems({ params }: Props) {
  const contestId = (await params).contestId;
  const contestInfo = await getContestData(contestId);
  // 模拟数据
  const problems = [
    {
      id: 1001,
      title: "学位运算导致的",
      accepted: 289,
      submitted: 895,
      status: "unsolved",
    },
    {
      id: 1002,
      title: "学历史导致的",
      accepted: 2213,
      submitted: 3251,
      status: "solved",
    },
    {
      id: 1003,
      title: "学数数导致的",
      accepted: 1611,
      submitted: 6868,
      status: "solved",
    },
    {
      id: 1004,
      title: "学 DP 导致的",
      accepted: 1897,
      submitted: 9236,
      status: "solved",
    },
    {
      id: 1005,
      title: "学几何导致的",
      accepted: 1478,
      submitted: 5252,
      status: "solved",
    },
    {
      id: 1006,
      title: "学位运算导致的",
      accepted: 289,
      submitted: 895,
      status: "unsolved",
    },
    {
      id: 1007,
      title: "学历史导致的",
      accepted: 2213,
      submitted: 3251,
      status: "solved",
    },
    {
      id: 1008,
      title: "学数数导致的",
      accepted: 1611,
      submitted: 6868,
      status: "solved",
    },
    {
      id: 1009,
      title: "学 DP 导致的",
      accepted: 1897,
      submitted: 9236,
      status: "solved",
    },
    {
      id: 1010,
      title: "学几何导致的",
      accepted: 1478,
      submitted: 5252,
      status: "solved",
    },
    {
      id: 1011,
      title: "学位运算导致的",
      accepted: 289,
      submitted: 895,
      status: "unsolved",
    },
    {
      id: 1012,
      title: "学历史导致的",
      accepted: 2213,
      submitted: 3251,
      status: "solved",
    },
    {
      id: 1013,
      title: "学数数导致的",
      accepted: 1611,
      submitted: 6868,
      status: "solved",
    },
    {
      id: 1014,
      title: "学 DP 导致的",
      accepted: 1897,
      submitted: 9236,
      status: "solved",
    },
    {
      id: 1015,
      title: "学几何导致的",
      accepted: 1478,
      submitted: 5252,
      status: "solved",
    },
  ];

  return (
    <div className="bg-white min-w-6xl shadow-sm border border-gray-100 rounded-sm p-6">
      <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 pl-2">
        Problems
      </h2>
      {contestInfo.status === "Pending" ? (
        <div className="text-center py-10 text-gray-500">
          The contest has not started yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-serif text-left text-gray-600">
            <thead className="text-lg text-gray-700 bg-white border-b border-gray-400 border-t">
              <tr>
                <th scope="col" className="px-6 py-2 w-16">
                  Solved
                </th>
                <th scope="col" className="px-6 py-2 w-42">
                  Problem ID
                </th>
                <th scope="col" className="px-6 py-2">
                  Title
                </th>
                <th scope="col" className="px-6 py-2 w-80">Ratio (Accepted / Submitted)</th>
              </tr>
            </thead>
            <tbody>
              {problems.map((prob, index) => (
                <tr
                  key={prob.id}
                  className="odd:bg-white even:bg-[#f4f7fa] border-b border-gray-300 hover:bg-blue-50 transition-colors h-10 text-base"
                >
                  <td className="px-6 py-2">
                    {prob.status === "solved" && (
                      <CheckIcon className="h-5 w-5 text-green-600" />
                    )}
                  </td>
                  <td className="px-6 py-2 text-gray-900">
                    {String.fromCharCode(index + 65)}
                  </td>
                  <td className="px-6 py-2">
                    <Link
                      href={`/contest/${contestId}/problems/${String.fromCharCode(index + 65)}`}
                      className="text-blue-600 hover:underline hover:text-blue-800"
                    >
                      {prob.title}
                    </Link>
                  </td>
                  <td className="px-6 py-2 text-left">
                    {((prob.accepted / prob.submitted) * 100).toFixed(2)}% (
                    {prob.accepted}/{prob.submitted})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
