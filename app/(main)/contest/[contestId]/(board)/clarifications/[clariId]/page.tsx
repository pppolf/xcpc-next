"use client"; // 使用 Client Component 方便做表单交互

import Link from "next/link";
import * as React from 'react';

// 模拟详情数据
const mockThread = {
  id: 101,
  title: "#1002 1002 数据已更新，深感抱歉",
  content: `由于比赛准备比较仓促，1002 虽然经过一定测试仍有问题，后续会 rejudge 之前的 1002 提交记录。\n\n对各位造成了不好的比赛体验，在这里表示抱歉。`,
  author: "admin",
  time: "21:28:02, Mar 7",
  replies: [
    {
      id: 1,
      content: "能不能给一下1002的数据啊，和std对拍找不出来错样例QwQ",
      author: "team360 陈炎松 长安大学",
      time: "23:22:47, Mar 10",
    },
  ],
};

interface Props {
  params: React.Usable<{
    contestId: string;
		clariId: string;
  }>;
}

export default function ClarificationDetail({
  params,
}: Props) {
  // 实际开发中 const thread = await fetch(...)
	const {contestId} = React.use(params);
  return (
    <div className="space-y-6 mx-auto">
      {/* 返回按钮 */}
      <Link
        href={`/contest/${contestId}/clarifications`}
        className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-2"
      >
        &larr; Back to Clarifications
      </Link>

      {/* --- 1. Main Post (主楼) --- */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-8">
        <h1 className="text-2xl font-serif font-bold text-blue-900 mb-6">
          {mockThread.title}
        </h1>

        {/* 杭电风格的细分割线 */}
        <div className="h-px bg-gray-300 w-full mb-6"></div>

        <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-line mb-8">
          {mockThread.content}
        </div>

        <div className="text-xs text-gray-500 font-mono">
          {mockThread.author} @ {mockThread.time}
        </div>
      </div>

      {/* --- 2. Replies List (回复列表) --- */}
      {mockThread.replies.length > 0 && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-8">
          <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 pl-2">
            Replies
          </h2>
          <div className="h-px bg-gray-300 w-full mb-6"></div>

          <div className="space-y-8">
            {mockThread.replies.map((reply) => (
              <div
                key={reply.id}
                className="border-b border-gray-100 last:border-0 pb-6 last:pb-0"
              >
                <div className="text-gray-800 text-sm whitespace-pre-wrap mb-3">
                  {reply.content}
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  {reply.author} @ {reply.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- 3. Reply Form (回复框) --- */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-8">
        <h2 className="text-2xl font-serif font-bold text-gray-900 mb-4 pl-2">
          Replay
        </h2>
        <div className="h-px bg-gray-300 w-full mb-6"></div>

        <form className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Content
            </label>
            <textarea
              rows={4}
              className="w-full bg-[#eef2f7] border border-gray-300 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block p-3 outline-none transition-colors hover:bg-white"
              placeholder="Type your clarification here..."
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-sm text-sm px-6 py-2.5 shadow-md transition-colors"
            >
              Submit Reply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
