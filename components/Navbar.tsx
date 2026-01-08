'use client'; // 必须标记为客户端组件

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  
  // 模拟管理员权限 (实际项目中应从用户状态管理库或 Session 中获取)
  const isAdmin = true; 

  // 核心逻辑：检测当前 URL 是否包含 /contest/[id]
  // 正则匹配：以 /contest/ 开头，后面跟着数字
  const match = pathname.match(/^\/contest\/(\d+)/);
  const contestId = match ? match[1] : null;

  // 辅助函数：生成当前比赛上下文的链接
  const getContestLink = (subPath: string) => `/contest/${contestId}${subPath}`;

  // 辅助函数：判断链接是否激活（用于高亮样式）
  const isActive = (path: string) => pathname === path;
  const linkClass = (path: string) => 
    `px-3 py-2 font-bold transition-colors ${
      isActive(path) ? 'text-blue-700' : 'text-gray-900 hover:text-blue-700'
    }`;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky  top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex space-x-4 font-serif items-center text-xl">
            {/* 1. 全局导航：所有人都看得到 */}
            <Link href="/" className="text-gray-900 font-bold px-3 py-2">
              Home
            </Link>

            {/* 2. 比赛上下文导航：只有在比赛内才显示 */}
            {contestId && (
              <>
                <span className="text-gray-300">|</span> {/* 分隔符 */}
                
                <Link href={getContestLink('')} className={linkClass(`/contest/${contestId}`)}>
                  Contest Home
                </Link>
                <Link href={getContestLink('/problems')} className={linkClass(`/contest/${contestId}/problems`)}>
                  Problems
                </Link>
                <Link href={getContestLink('/status')} className={linkClass(`/contest/${contestId}/status`)}>
                  Status
                </Link>
                <Link href={getContestLink('/rank')} className={linkClass(`/contest/${contestId}/rank`)}>
                  Rank
                </Link>
                <Link href={getContestLink('/clarifications')} className={linkClass(`/contest/${contestId}/clarifications`)}>
                  Clarifications
                </Link>
              </>
            )}

            {/* 3. 管理员导航：只有管理员看得到 */}
            {isAdmin && (
              <>
                 <span className="text-gray-300">|</span>
                 <Link href="/admin" className="text-red-600 hover:text-red-800 px-3 py-2 text-xl font-bold flex items-center gap-1">
                   Admin Panel
                 </Link>
              </>
            )}
          </div>

          <div className="flex items-center">
            {/* 右侧用户状态 */}
            <span className="text-gray-700 text-sm cursor-pointer hover:text-blue-600 font-medium">
              team1711 ▼
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}