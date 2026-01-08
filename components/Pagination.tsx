'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface PaginationProps {
  totalItems: number;
  pageSize?: number;
  className?: string;
}

export default function Pagination({ totalItems, pageSize = 20, className = "" }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // 从 URL 获取当前页码，默认为 1
  const currentPage = Number(searchParams.get('page')) || 1;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Requirement: 如果没有到达最大限度（只有1页），不展示
  if (totalPages <= 1) return null;

  // 生成页码数组的逻辑 (处理 ...)
  const generatePagination = () => {
    const pages = [];
    if (totalPages <= 7) {
      // 如果总页数少，全部显示
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      // 复杂的省略号逻辑
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pages = generatePagination();

  // 处理跳转
  const handlePageChange = (page: number | string) => {
    if (typeof page === 'string') return; // 点击了 ...
    if (page < 1 || page > totalPages) return;

    // 保留现有的其他查询参数 (比如 filter, search)，只更新 page
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  // 基础按钮样式
  const baseClass = "relative inline-flex items-center px-4 py-2 text-sm font-medium border border-blue-200 transition-colors focus:z-10 cursor-pointer ";
  // 普通状态
  const normalClass = "bg-white text-blue-600 hover:bg-blue-50 cursor-pointer ";
  // 激活状态
  const activeClass = "z-10 bg-blue-600 text-white border-blue-600 cursor-pointer ";
  // 禁用状态
  const disabledClass = "bg-gray-50 text-gray-300 cursor-not-allowed cursor-pointer ";

  return (
    <div className={`flex items-center justify-start ${className}`}>
      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
        
        {/* Previous Button */}
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${baseClass} rounded-l-md ${currentPage === 1 ? disabledClass : normalClass}`}
        >
          <span className="sr-only">Previous</span>
          <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
        </button>

        {/* Page Numbers */}
        {pages.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handlePageChange(p)}
            disabled={p === '...'}
            className={`${baseClass} ${
              p === currentPage 
                ? activeClass 
                : p === '...' 
                  ? "bg-white text-gray-700 cursor-default border-blue-200 hover:bg-white" // 省略号样式
                  : normalClass
            }`}
          >
            {p}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${baseClass} rounded-r-md ${currentPage === totalPages ? disabledClass : normalClass}`}
        >
          <span className="sr-only">Next</span>
          <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </nav>
    </div>
  );
}