"use client"; // 必须标记为客户端组件

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminLoginModal from "./AdminLoginModal";
import { ContestRole } from "@/lib/generated/prisma/enums";
import { HomeIcon, LanguageIcon } from "@heroicons/react/24/outline";
import { useLanguage } from "@/context/LanguageContext";

export default function Navbar() {
  const [clickCount, setClickCount] = useState(0);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { user, logout, revalidate } = useAuth();
  const { dict, toggleLanguage, lang } = useLanguage();
  const isAdmin = user?.isGlobalAdmin;

  useEffect(() => {
    if (searchParams.get("login") === "true") {
      revalidate?.();
    }
  }, [searchParams, revalidate]);

  useEffect(() => {
    const closeMenu = () => setShowUserMenu(false);
    if (showUserMenu) {
      document.addEventListener("click", closeMenu);
    }
    return () => document.removeEventListener("click", closeMenu);
  }, [showUserMenu]);

  const handleUserMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUserMenu(!showUserMenu);
  };

  const match = pathname.match(/^\/contest\/(\d+)/);
  const contestId = match ? match[1] : null;

  const getContestLink = (subPath: string) => `/contest/${contestId}${subPath}`;

  const isActive = (path: string) => {
    if (path === `/contest/${contestId}`) {
      return pathname === `/contest/${contestId}`;
    }
    if (pathname === path) return true;
    return pathname.startsWith(path + "/");
  };

  // 修改 linkClass，允许传入额外的 className
  const linkClass = (path: string, extraClass: string = "") =>
    `px-3 py-2 font-bold transition-colors whitespace-nowrap ${
      isActive(path) ? "text-blue-700" : "text-gray-900 hover:text-blue-700"
    } ${extraClass}`;

  useEffect(() => {
    if (clickCount === 0) return;
    const timer = setTimeout(() => setClickCount(0), 2000);
    return () => clearTimeout(timer);
  }, [clickCount]);

  const handleNavClick = (e: React.MouseEvent) => {
    if (user) return;
    const target = e.target as HTMLElement;
    // console.log(target);
    if (target.tagName === "NAV" || target?.className?.includes("max-w-7xl")) {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount === 3) {
        setShowAdminLogin(true);
        setClickCount(0);
      }
    }
  };

  const isContestAdmin =
    isAdmin ||
    user?.role === ContestRole.ADMIN ||
    user?.role === ContestRole.JUDGE ||
    user?.role === ContestRole.BALLOON;

  return (
    <>
      <nav
        onClick={handleNavClick}
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 font-serif text-xl">
            {/* 左侧导航区：使用 overflow-x-auto 防止小屏幕溢出难看，隐藏滚动条 */}
            <div className="flex items-center overflow-x-auto no-scrollbar mask-gradient-right">
              {/* 1. 全局导航 (移动端隐藏文字Home，或者只留图标，这里暂时先留着但设为 hidden sm:block 如果太挤的话，或者保持原样) */}
              <Link
                href="/"
                className="text-gray-900 font-bold px-3 py-2 shrink-0"
              >
                {/* 移动端显示图标 (md:hidden 表示在中等屏幕以上隐藏) */}
                <HomeIcon className="w-6 h-6 md:hidden" />

                {/* 桌面端显示文字 (hidden md:block 表示默认隐藏，中等屏幕以上显示) */}
                <span className="hidden md:block">{dict.nav.home}</span>
              </Link>

              {/* 2. 比赛上下文导航 */}
              {contestId && (
                <>
                  <span className="text-gray-300 shrink-0">|</span>

                  {/* Contest Home: 始终显示 */}
                  <Link
                    href={getContestLink("")}
                    className={linkClass(`/contest/${contestId}`, "shrink-0")}
                  >
                    {dict.nav.contest}
                  </Link>

                  {/* 常规比赛功能：移动端隐藏 (hidden)，桌面端显示 (md:block) */}
                  <Link
                    href={getContestLink("/problems")}
                    className={linkClass(
                      `/contest/${contestId}/problems`,
                      "hidden md:block",
                    )}
                  >
                    {dict.nav.problems}
                  </Link>
                  <Link
                    href={getContestLink("/status")}
                    className={linkClass(
                      `/contest/${contestId}/status`,
                      "hidden md:block",
                    )}
                  >
                    {dict.nav.status}
                  </Link>
                  <Link
                    href={getContestLink("/rank")}
                    className={linkClass(
                      `/contest/${contestId}/rank`,
                      "hidden md:block",
                    )}
                  >
                    {dict.nav.rank}
                  </Link>
                  <Link
                    href={getContestLink("/clarifications")}
                    className={linkClass(
                      `/contest/${contestId}/clarifications`,
                      "hidden md:block",
                    )}
                  >
                    {dict.nav.clarifications}
                  </Link>
                </>
              )}

              {/* 2.5 气球管理：始终显示 (如果是管理员) */}
              {contestId && isContestAdmin && (
                <>
                  {/* 在移动端，如果中间隐藏了，这里加个竖线分隔符更好看 */}
                  <span className="text-gray-300 shrink-0 hidden md:inline">
                    |
                  </span>
                  {/* 移动端直接紧跟 Contest Home，或者加个小分隔 */}
                  <span className="text-gray-300 shrink-0 md:hidden">|</span>

                  <Link
                    href={getContestLink("/balloon")}
                    className={linkClass(
                      `/contest/${contestId}/balloon`,
                      "text-orange-600 hover:text-orange-800 shrink-0", // 给气球一个醒目的颜色
                    )}
                  >
                    🎈 {dict.nav.balloon}
                  </Link>
                </>
              )}

              {/* 3. 后台 Panel：仅桌面显示 */}
              {isAdmin && (
                <>
                  <span className="text-gray-300 shrink-0 hidden md:inline">
                    |
                  </span>
                  <Link
                    href="/admin"
                    className="text-red-600 hover:text-red-800 px-3 py-2 text-xl font-bold gap-1 hidden md:flex items-center shrink-0"
                  >
                    {dict.nav.adminPanel}
                  </Link>
                </>
              )}
            </div>

            {/* 右侧用户区 */}
            <div className="flex space-x-4 text-lg items-center gap-4 shrink-0 pl-2 bg-linear-to-l from-white via-white to-transparent">
              {/* 切换语言按钮 */}
              <button
                onClick={toggleLanguage}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
                title="Switch Language"
              >
                <div className="flex items-center text-sm font-bold gap-1">
                  <LanguageIcon className="w-5 h-5" />
                  <span>{lang === "zh" ? "中" : "EN"}</span>
                </div>
              </button>
              {user ? (
                // 登录后显示
                <div className="relative">
                  <button
                    onClick={handleUserMenuClick} // 改为点击触发
                    className="text-gray-700 font-bold flex items-center gap-1 max-w-30 sm:max-w-none truncate focus:outline-none cursor-pointer"
                  >
                    {user.isGlobalAdmin && (
                      <span className="text-red-600 hidden sm:inline">
                        [{dict.nav.superAdmin}]
                      </span>
                    )}
                    <span className="truncate">{user.username}</span>
                    <span
                      className="text-xs transition-transform duration-200"
                      style={{
                        transform: showUserMenu
                          ? "rotate(180deg)"
                          : "rotate(0)",
                      }}
                    >
                      ▼
                    </span>
                  </button>

                  {/* 下拉登出菜单 */}
                  {/* 移除了 group-hover:block，改用状态控制显示 */}
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-gray-200 shadow-lg rounded-sm z-50">
                      <button
                        onClick={logout}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer active:bg-gray-200"
                      >
                        {dict.nav.logout}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        </div>
      </nav>

      {showAdminLogin && (
        <AdminLoginModal onClose={() => setShowAdminLogin(false)} />
      )}
    </>
  );
}
