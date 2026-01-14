import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import Link from "next/link";
import CodeBlock from "@/components/CodeBlock";
import ProblemInfoCard from "@/components/ProblemInfoCard";
import { prisma } from "@/lib/prisma";
import { Verdict } from "@/lib/generated/prisma/client";
import { notFound } from "next/navigation";

type Problem = {
  id: number;
  title: string;
  defaultTimeLimit: number;
  defaultMemoryLimit: number;

  sections: {
    title: string;
    content: string;
  }[];

  samples: {
    input: string;
    output: string;
  }[];

  hint: string;
};

interface Props {
  params: Promise<{
    contestId: string;
    problemId: string;
  }>;
}
// 提取公共样式：标题样式 (蓝色竖线)
const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-lg font-bold text-blue-800 border-l-4 border-blue-600 pl-3 mb-3 font-serif tracking-wide">
    {children}
  </h3>
);

export default async function ProblemDetail({ params }: Props) {
  // 实际开发中：const problem = await fetchProblem(params.contestId, params.problemId);
  const { contestId, problemId } = await params;
  const cid = Number(contestId);

  if (isNaN(cid)) return notFound();

  const contestProblem = await prisma.contestProblem.findFirst({
    where: {
      contestId: cid,
      displayId: problemId,
    },
    include: {
      problem: true,
    },
  });
  const problem = contestProblem?.problem;

  if (!problem) notFound();

  const totalStats = await prisma.submission.count({
    where: { contestId: cid, problemId: problem.id },
  });

  const acStats = await prisma.submission.count({
    where: {
      contestId: cid,
      problemId: problem.id,
      verdict: Verdict.ACCEPTED,
    },
  });
  const info = {
    timeLimit: problem?.defaultTimeLimit || 0,
    memoryLimit: problem?.defaultMemoryLimit || 0,
    submissions: totalStats,
    accepted: acStats,
  };
  // const problem = mockProblem;

  return (
    <div className="flex flex-col min-w-7xl max-w-7xl lg:flex-row gap-6 items-start">
      {/* --- 左侧：题目基本信息卡片 --- */}
      <aside className="w-full lg:w-72 shrink-0 space-y-4">
        <ProblemInfoCard
          contestId={contestId}
          problemId={problemId}
          info={info}
          type="problem"
        />
      </aside>

      {/* --- 右侧：题目详细描述 (Markdown 渲染) --- */}
      <main className="flex-1 w-full min-w-0">
        {" "}
        {/* min-w-0 防止 flex 子元素溢出 */}
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6 lg:p-10">
          <h1 className="text-3xl font-serif font-bold text-gray-900 mb-8 text-center border-b pb-4">
            {problem?.title}
          </h1>

          <div className="space-y-8">
            {/* 1. 渲染常规文本段落 (Description, Input, Output) */}
            {(problem as unknown as Problem).sections?.map((section, index) => (
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
            {(problem as unknown as Problem).samples.map((sample, index) => {
              // 如果只有一组样例，标题不显示序号；如果有多组，显示 1, 2, 3...
              const suffix =
                (problem as unknown as Problem).samples.length > 1
                  ? ` ${index + 1}`
                  : "";

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
