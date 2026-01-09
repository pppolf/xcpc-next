import Link from "next/link";

export default function AdminDashboard() {
  const contests = [
    { id: 1001, title: "2025“钉耙编程”暑期联赛（2）", count: 12 }, // count = 题目数量
    { id: 1002, title: "2026 XCPC 寒假集训排位赛", count: 0 },
  ];

  return (
    <div className="mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
          + Create New Contest
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 font-bold bg-gray-50">
          Manage Contests
        </div>
        <ul>
          {contests.map((c) => (
            <li
              key={c.id}
              className="border-b last:border-0 px-6 py-4 flex justify-between items-center hover:bg-gray-50"
            >
              <div>
                <span className="text-gray-500 font-mono mr-3">#{c.id}</span>
                <span className="font-medium text-gray-900">{c.title}</span>
                <span className="ml-3 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                  {c.count} Problems
                </span>
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/admin/contest/${c.id}/problems`}
                  className="text-sm border border-blue-600 text-blue-600 px-3 py-1 rounded hover:bg-blue-50"
                >
                  Manage Problems
                </Link>
                <button className="text-sm text-gray-600 hover:text-gray-900 px-2">
                  Settings
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
