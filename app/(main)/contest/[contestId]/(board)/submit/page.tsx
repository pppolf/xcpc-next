"use client"; // 使用客户端组件以便处理表单状态

import { useState } from "react";
import { useSearchParams } from "next/navigation"; // 用于获取 ?problem=xxx
import ProblemInfoCard from "@/components/ProblemInfoCard";
import * as React from "react";
import { useRouter } from "next/navigation";
import CodeEditor from "@/components/CodeEditor";

// 模拟数据 (实际应从 API 获取)
const mockProblemInfo = {
  timeLimit: 1000,
  memoryLimit: 32768,
  submissions: 1240,
  accepted: 890,
};

const LANGUAGES = [
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "pypy3", label: "PyPy3" },
];

interface Props {
  params: React.Usable<{
    contestId: string;
  }>;
}

export default function SubmitPage({ params }: Props) {
  const searchParams = useSearchParams();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const problemId = searchParams.get("problem") || "1001"; // 默认值或错误处理
  const router = useRouter();
  const { contestId } = React.use<{ contestId: string }>(params);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Submitting Code...\nProblem: ${problemId}\nLang: ${language}\nLength: ${code.length}`
    );
    // 这里对接后端 API 提交代码

    router.push(`/contest/${contestId}/status`);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* 左侧：复用之前的信息卡片 */}
      <aside>
        <ProblemInfoCard
          contestId={contestId}
          problemId={problemId}
          info={mockProblemInfo}
          type="submit"
        />
      </aside>

      {/* 右侧：提交区域 */}
      <main className="flex-1 w-full min-w-0">
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6">
          <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 border-b pb-4">
            Submit Solution
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 语言选择栏 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 max-w-xs"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 代码编辑框 */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Source Code
              </label>
              <div className="relative">
                <CodeEditor
                  value={code}
                  language={language}
                  onChange={setCode}
                  height="500px"
                />
                {/* <textarea 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full h-125 p-4 text-sm font-mono text-gray-900 bg-gray-50 rounded-sm border border-gray-300 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                  placeholder=""
                  spellCheck={false}
                ></textarea> */}

                {/* 右下角字数统计 */}
                <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                  {code.length} chars
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-sm text-sm px-8 py-3 shadow-md transition-colors"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => setCode("")}
                className="text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium rounded-sm text-sm px-6 py-3 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
