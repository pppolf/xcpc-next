"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { adminSubmit } from "./actions";
import { PlayIcon, CheckCircleIcon } from "@heroicons/react/24/solid";
import CodeBlock from "@/components/CodeBlock";
import CodeEditor from "@/components/CodeEditor";

// 提取公共样式：标题样式 (蓝色竖线)
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-3 font-serif tracking-wide">
    {children}
  </h3>
);

interface Section {
  title: string;
  content: string;
}

interface Sample {
  input: string;
  output: string;
}

interface ProblemDetail {
  id: number;
  title: string;
  defaultTimeLimit: number;
  defaultMemoryLimit: number;
  sections: Section[];
  samples: Sample[];
  hint: string;
}

export default function TestInterface({ problem }: { problem: ProblemDetail }) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!code.trim()) return alert("Code cannot be empty");
    setIsSubmitting(true);
    try {
      const res = await adminSubmit(problem.id, code, language);
      if (res.success) {
        setLastId(res.submissionId);
        alert("Submitted successfully! ID: " + res.submissionId);
      }
    } catch (e) {
      alert("Submission failed: " + e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col lg:flex-row gap-4">
      {/* --- 左侧：题目预览区 (50%) --- */}
      <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-y-auto p-6">
        <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center border-b pb-4">
          {problem.title}
        </h1>

        <div className="space-y-8">
          {/* 1. 渲染常规文本段落 (Description, Input, Output) */}
          {problem.sections.map((section: Section, index: number) => (
            <div key={`section-${index}`}>
              <SectionTitle>{section.title}</SectionTitle>
              <article className="prose prose-sm md:prose-base max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-pre:bg-gray-100 prose-pre:text-gray-800">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {section.content}
                </ReactMarkdown>
              </article>
            </div>
          ))}
          {/* 2. 渲染样例数组 */}
          {problem.samples.map((sample: Sample, index: number) => {
            // 如果只有一组样例，标题不显示序号；如果有多组，显示 1, 2, 3...
            const suffix = problem.samples.length > 1 ? ` ${index + 1}` : "";

            return (
              <div key={`sample-${index}`} className="grid grid-cols-1 gap-6">
                <div>
                  <SectionTitle>Sample Input{suffix}</SectionTitle>
                  <CodeBlock code={sample.input} />
                </div>
                <div>
                  <SectionTitle>Sample Output{suffix}</SectionTitle>
                  <CodeBlock code={sample.output} />
                </div>
              </div>
            );
          })}
          {/* 3. 渲染 Hint (如果有) */}
          {problem.hint && (
            <div>
              <SectionTitle>Hint</SectionTitle>
              <article className="prose prose-sm md:prose-base max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {problem.hint}
                </ReactMarkdown>
              </article>
            </div>
          )}
        </div>
      </div>

      {/* --- 右侧：代码编辑区 (50%) --- */}
      <div className="flex-1 h-full flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="bg-gray-50 border-b px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700">Code Editor</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-sm border-gray-300 rounded shadow-sm py-1 px-2"
            >
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
              <option value="pypy3">PyPy3</option>
            </select>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              "Submitting..."
            ) : (
              <>
                <PlayIcon className="w-4 h-4" /> Submit
              </>
            )}
          </button>
        </div>

        {/* min-h-0 对于 flex 容器内的 Monaco 很重要 */}
        <div className="h-full">
          <CodeEditor
            value={code}
            language={language}
            onChange={setCode}
            height="100%"
          />
        </div>

        {lastId && (
          <div className="bg-green-50 text-green-700 text-xs px-4 py-2 border-t border-green-100 flex items-center">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Last Submission: {lastId} (Check Global Submissions for result)
          </div>
        )}
      </div>
    </div>
  );
}
