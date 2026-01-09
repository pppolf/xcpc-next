import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import Link from "next/link";
import CodeBlock from '@/components/CodeBlock';
import ProblemInfoCard from '@/components/ProblemInfoCard';

// 模拟数据库中的题目数据结构 (分块存储)
const mockProblem = {
  id: 1001,
  title: "A + B Problem",
  info: {
    timeLimit: 1000,
    memoryLimit: 32768,
    submissions: 1240,
    accepted: 890,
    specialJudge: false,
  },
  // 题目描述分块，模拟数据库存储字段
  sections: [
    {
      title: "Problem Description",
      content:
        "Calculate $A + B$. \n\nThis is a standard test problem for **XCPC** systems.",
    },
    {
      title: "Input",
      content:
        "Input contains an integer $T$ in the first line, denoting the number of test cases.\nEach test case contains two integers $A$ and $B$.",
    },
    {
      title: "Output",
      content: "For each test case, output the sum of $A$ and $B$ in one line.",
    },
  ],
  // 2. 样例数组 (支持多组)
  samples: [
    {
      input: "2\n1 2\n3 4",
      output: "3\n7",
    },
    {
      input: "1\n5 5", // 第二组样例（如果有）
      output: "10",
    },
  ],

  // 3. 提示 (Markdown)
  hint: "Hint: Use `long long` for 64-bit integers.",
};

interface Props {
  params: {
    contestId: string;
    problemId: string;
  };
}
// 提取公共样式：标题样式 (蓝色竖线)
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-3 font-serif tracking-wide">
    {children}
  </h3>
);

export default async function ProblemDetail({ params }: Props) {
  // 实际开发中：const problem = await fetchProblem(params.contestId, params.problemId);
  const problem = mockProblem;
  const { contestId, problemId } = await params;


  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* --- 左侧：题目基本信息卡片 --- */}
      <aside className="w-full lg:w-72 shrink-0 space-y-4">
        <ProblemInfoCard 
          contestId={contestId} 
          problemId={problemId} 
          info={problem.info}
          type="problem"
        />
      </aside>

      {/* --- 右侧：题目详细描述 (Markdown 渲染) --- */}
      <main className="flex-1 w-full min-w-0">
        {" "}
        {/* min-w-0 防止 flex 子元素溢出 */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6 lg:p-10">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center border-b pb-4">
            {problem.title}
          </h1>

          <div className="space-y-8">
            {/* 1. 渲染常规文本段落 (Description, Input, Output) */}
            {problem.sections.map((section, index) => (
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
            {problem.samples.map((sample, index) => {
              // 如果只有一组样例，标题不显示序号；如果有多组，显示 1, 2, 3...
              const suffix = problem.samples.length > 1 ? ` ${index + 1}` : '';
              
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

          <div className="mt-12 text-center">
            <Link
              href={`/contest/${contestId}/submit?problem=${problemId}`}
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-sm font-bold shadow-md transition-transform active:scale-95"
            >
              Submit Solution
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
