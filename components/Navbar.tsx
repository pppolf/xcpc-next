"use client"; // 必须标记为客户端组件

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminLoginModal from "./AdminLoginModal";

export default function Navbar() {
  const [clickCount, setClickCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, logout, revalidate } = useAuth();
  const isAdmin = user?.isGlobalAdmin;

  // 当路径变化时，重新验证用户信息
  useEffect(() => {
    if (searchParams.get("login") === "true") {
      revalidate?.();
    }
  }, [searchParams, revalidate]);

  // 核心逻辑：检测当前 URL 是否包含 /contest/[id]
  const match = pathname.match(/^\/contest\/(\d+)/);
  const contestId = match ? match[1] : null;

  // 辅助函数：生成当前比赛上下文的链接
  const getContestLink = (subPath: string) => `/contest/${contestId}${subPath}`;

  // 辅助函数：判断链接是否激活（用于高亮样式）
  const isActive = (path: string) => {
    if (path === `/contest/${contestId}`) {
      return pathname === `/contest/${contestId}`;
    }
    if (pathname === path) return true;
    return pathname.startsWith(path + "/");
  };

  const linkClass = (path: string) =>
    `px-3 py-2 font-bold transition-colors ${
      isActive(path) ? "text-blue-700" : "text-gray-900 hover:text-blue-700"
    }`;

  useEffect(() => {
    if (clickCount === 0) return;
    const timer = setTimeout(() => setClickCount(0), 2000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  // 只在空白处点击时触发计数，不影响链接点击
  const handleNavClick = (e: React.MouseEvent) => {
    // 如果已登录或点击的是链接/按钮，不触发计数
    if (user) return;

    const target = e.target as HTMLElement;
    // 检查是否点击在 nav 的空白处（不是链接、按钮等）
    if (target.tagName === "NAV" || target.className.includes("max-w-7xl")) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 3) {
        setShowAdminLogin(true);
        setClickCount(0);
      }
    }
  };

  return (
    <>
      <nav
        onClick={handleNavClick}
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 font-serif text-xl">
            <div className="flex space-x-4 items-center">
              {/* 1. 全局导航 */}
              <Link href="/" className="text-gray-900 font-bold px-3 py-2">
                Home
              </Link>

              {/* 2. 比赛上下文导航 */}
              {contestId && (
                <>
                  <span className="text-gray-300">|</span>
                  <Link
                    href={getContestLink("")}
                    className={linkClass(`/contest/${contestId}`)}
                  >
                    Contest Home
                  </Link>
                  <Link
                    href={getContestLink("/problems")}
                    className={linkClass(`/contest/${contestId}/problems`)}
                  >
                    Problems
                  </Link>
                  <Link
                    href={getContestLink("/status")}
                    className={linkClass(`/contest/${contestId}/status`)}
                  >
                    Status
                  </Link>
                  <Link
                    href={getContestLink("/rank")}
                    className={linkClass(`/contest/${contestId}/rank`)}
                  >
                    Rank
                  </Link>
                  <Link
                    href={getContestLink("/clarifications")}
                    className={linkClass(
                      `/contest/${contestId}/clarifications`
                    )}
                  >
                    Clarifications
                  </Link>
                </>
              )}

              {/* 3. 管理员导航 */}
              {isAdmin && (
                <>
                  <span className="text-gray-300">|</span>
                  <Link
                    href="/admin"
                    className="text-red-600 hover:text-red-800 px-3 py-2 text-xl font-bold flex items-center gap-1"
                  >
                    Admin Panel
                  </Link>
                </>
              )}
            </div>

            <div className="flex space-x-4 text-lg items-center gap-4">
              {user ? (
                // 登录后显示
                <div className="relative group">
                  <button className="text-gray-700 font-bold flex items-center gap-1">
                    {user.isGlobalAdmin && (
                      <span className="text-red-600">[Admin]</span>
                    )}
                    {user.username} ▼
                  </button>
                  {/* 下拉登出菜单 */}
                  <div className="absolute right-0 top-full pt-2 w-32 bg-white border border-gray-200 shadow-lg rounded-sm hidden group-hover:block">
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                // 未登录时：空白
                <></>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 超管登录弹窗 */}
      {showAdminLogin && (
        <AdminLoginModal onClose={() => setShowAdminLogin(false)} />
      )}
    </>
  );
}
