import Pagination from "@/components/Pagination";
import { getContestData } from "@/lib/data";

// 辅助函数：根据状态返回单元格样式
const getCellColor = (status: string) => {
  switch (status) {
    case "first":
      return "bg-[#1b5e20] text-white"; // 深绿 - 一血
    case "ac":
      return "bg-[#4caf50] text-white"; // 浅绿 - AC
    case "wa":
      return "bg-[#d32f2f] text-white"; // 红色 - WA (未通过)
    case "pending":
      return "bg-[#1976d2] text-white"; // 蓝色 - Pending (可选)
    default:
      return "";
  }
};

interface Props {
  searchParams: {
    page?: number;
  };
  params: {
    contestId: string;
  };
}

const Allteams = Array.from({ length: 100 }).map((_, i) => ({
  rank: 1 + i,
  name: "team" + 2472 + i,
  uni: "浙江省绍兴市第一中学",
  menber: "杨铧12、张三22、三三三三",
  solved: 10,
  time: "20:03:18",
  probs: [
    { t: "03:30:12", s: "ac", tries: -2 },
    { t: "00:17:55", s: "ac" },
    { t: "00:12:37", s: "first", tries: -1 },
    { t: "00:27:04", s: "ac", tries: -1 },
    { t: "01:08:22", s: "ac", tries: -2 },
    { t: "01:45:09", s: "ac" },
    { t: "02:27:33", s: "ac" },
    { t: "02:05:09", s: "ac" },
    { t: "03:57:52", s: "ac" },
    { t: "02:11:25", s: "ac" },
  ],
}));

export default async function Rank({ params, searchParams }: Props) {
  const contestId = (await params).contestId;
  const page = (await searchParams).page;
  const contestInfo = await getContestData(contestId);

  const currentPage = page || 1;
  const pageSize = 50;

  const startIndex = (currentPage - 1) * pageSize;
  const teams = Allteams.slice(startIndex, startIndex + pageSize);
  // 模拟榜单数据
  const myTeam = {
    rank: 652,
    name: "team1711",
    menber: "杨铧、张三、三三三三",
    uni: "西华师范大学",
    solved: 4,
    time: "10:44:53",
    probs: [
      null,
      { t: "00:23:19", s: "ac" },
      { t: "01:54:09", s: "ac", tries: -8 },
      { t: "00:38:52", s: "ac", tries: -5 },
      { t: "02:48:33", s: "ac", tries: -2 },
      null,
      null,
      null,
      null,
      null,
    ],
  };

  return (
    <div className="bg-white min-w-7xl max-w-7xl shadow-sm border border-gray-100 rounded-sm p-6">
      <div className="flex justify-between items-center border-b mb-2 pb-4">
        <h2 className="text-2xl font-serif font-bold text-gray-800 pl-2 ">
          Rank
        </h2>
        <div className="flex gap-2">
          {/* 模拟搜索框 */}
          <input
            type="text"
            placeholder="Search team..."
            className="border text-sm px-2 py-1"
          />
        </div>
      </div>

      {contestInfo.status === "Pending" ? (
        <div className="text-center py-10 text-gray-500">
          The contest has not started yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="text-gray-700 bg-white border-b-2 border-gray-400 h-10 text-base font-serif font-bold">
                <th className="w-12">Rank</th>
                <th className="w-52">Author</th>
                <th className="w-12 font-bold">Solved</th>
                <th className="w-20">Penalty</th>
                {/* 动态生成题目 Header */}
                {Array.from({ length: 10 }).map((_, i) => (
                  <th key={i} className="min-w-17.5 font-bold text-gray-600">
                    <a href="#">
                      {String.fromCharCode(65 + i)}
                      <br />
                      <span className="text-[12px] font-normal text-gray-600">
                        289/895
                      </span>
                    </a>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="font-[Menlo] h-16 bg-sky-200">
                <td className="text-gray-900 text-base font-serif">
                  {myTeam.rank}
                </td>
                <td className="">
                  <div className="flex flex-col items-center max-h-full">
                    <div className="font-bold text-blue-900 truncate max-w-37.5">
                      {myTeam.name}
                    </div>
                    <div className="text-gray-900 truncate max-w-37.5">
                      {myTeam.menber}
                    </div>
                    <div className="text-gray-900 truncate max-w-37.5">
                      {myTeam.uni}
                    </div>
                  </div>
                </td>
                <td className="font-bold text-base text-gray-800">
                  {myTeam.solved}
                </td>
                <td className="text-gray-600 text-sm">{myTeam.time}</td>

                {/* 题目列渲染逻辑 */}
                {myTeam.probs.map((prob, idx) => {
                  if (!prob) return <td key={idx}></td>;

                  return (
                    <td
                      key={idx}
                      className={`p-1 border border-white ${getCellColor(
                        prob.s
                      )}`}
                    >
                      <div className="flex flex-col justify-center h-full text-xs">
                        {prob.s !== "wa" && (
                          <span className="font-bold">{prob.t}</span>
                        )}
                        {prob.tries && (
                          <span className="text-[12px]">({prob.tries})</span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
              {teams.map((team) => (
                <tr
                  key={team.rank}
                  className={"font-[Menlo] h-16 even:bg-[#eef5fc] odd:bg-white"}
                >
                  <td className="text-gray-900 text-base font-serif">
                    {team.rank}
                  </td>
                  <td className="">
                    <div className="flex flex-col items-center max-h-full">
                      <div className="font-bold text-blue-900 truncate max-w-37.5">
                        {team.name}
                      </div>
                      <div className="text-gray-900 truncate max-w-37.5">
                        {team.menber}
                      </div>
                      <div className="text-gray-900 truncate max-w-37.5">
                        {team.uni}
                      </div>
                    </div>
                  </td>
                  <td className="font-bold text-base text-gray-800">
                    {team.solved}
                  </td>
                  <td className="text-gray-600 text-sm">{team.time}</td>

                  {/* 题目列渲染逻辑 */}
                  {team.probs.map((prob, idx) => {
                    if (!prob) return <td key={idx}></td>;

                    return (
                      <td
                        key={idx}
                        className={`p-1 border border-white ${getCellColor(
                          prob.s
                        )}`}
                      >
                        <div className="flex flex-col justify-center h-full text-xs">
                          {prob.s !== "wa" && (
                            <span className="font-bold">{prob.t}</span>
                          )}
                          {prob.tries && (
                            <span className="text-[12px]">({prob.tries})</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 分页组件放在左下角 */}
      <div className="mt-6">
        <Pagination totalItems={Allteams.length} pageSize={pageSize} />
      </div>
    </div>
  );
}
