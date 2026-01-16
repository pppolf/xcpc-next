"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useRef, useEffect } from "react";

interface RankSearchProps {
  schools: string[];
  categories: string[];
}

export default function RankSearch({ schools, categories }: RankSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(
    searchParams.get("teamName") || ""
  );
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTeamName = searchParams.get("teamName") || "";
  const currentSchool = searchParams.get("school") || "";
  const currentCategory = searchParams.get("category") || "";

  const categoryMap: Record<string, string> = {
    0: "正式队伍",
    1: "打星队伍",
    2: "女生队伍",
  };

  // 防抖搜索队伍名
  const handleTeamNameChange = (value: string) => {
    setInputValue(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (value) {
        params.set("teamName", value);
      } else {
        params.delete("teamName");
      }
      params.set("page", "1");
      router.push(`?${params.toString()}`);
    }, 500);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const hasActiveFilters = currentTeamName || currentSchool || currentCategory;

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // 同步 URL 参数到输入框
  useEffect(() => {
    setInputValue(currentTeamName);
  }, [currentTeamName]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-2 text-sm font-medium rounded-sm border transition-colors ${
          hasActiveFilters
            ? "bg-blue-100 border-blue-300 text-blue-700"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        }`}
      >
        Search {hasActiveFilters && "✓"}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-sm shadow-lg z-10 p-4 space-y-4">
          {/* 队伍名搜索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => handleTeamNameChange(e.target.value)}
              placeholder="Search team name..."
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 学校筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              School
            </label>
            <select
              value={currentSchool}
              onChange={(e) => handleFilterChange("school", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Schools</option>
              {schools.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* 队伍类型筛选 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={currentCategory}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryMap[c] || c}
                </option>
              ))}
            </select>
          </div>

          {/* 重置按钮 */}
          {hasActiveFilters && (
            <button
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete("teamName");
                params.delete("school");
                params.delete("category");
                params.set("page", "1");
                router.push(`?${params.toString()}`);
              }}
              className="w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-sm hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
