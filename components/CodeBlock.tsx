'use client'; // 必须标记为客户端组件

import { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface CodeBlockProps {
  code: string;
}

export default function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      
      // 2秒后恢复图标状态
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="relative group">
      {/* 复制按钮：
         - 默认透明或浅色
         - group-hover:block 可以实现只有鼠标悬停时才显示按钮（可选，这里我做成了常驻但半透明）
      */}
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-white border border-gray-200 shadow-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 z-10 cursor-pointer"
        title="Copy to clipboard"
      >
        {copied ? (
          <CheckIcon className="w-4 h-4 text-green-600" />
        ) : (
          <ClipboardDocumentIcon className="w-4 h-4" />
        )}
      </button>

      {/* 代码显示区域 - 保持你喜欢的样式 */}
      <pre className="block bg-[#f5f5f5] p-3 rounded-sm border border-gray-300 text-gray-800 font-mono text-sm overflow-x-auto whitespace-pre pr-10">
        {code}
      </pre>
    </div>
  );
}