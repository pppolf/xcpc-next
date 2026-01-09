"use client";

import { useState } from "react";
import Link from "next/link";
import MarkdownEditor from "@/components/MarkdownEditor";

interface ProblemData {
  id?: number;
  title: string;
  type: string;
  defaultTimeLimit: number;
  defaultMemoryLimit: number;
  sections: { title: string; content: string }[];
  samples: { input: string; output: string }[];
  hint?: string;
  judgeConfig?: string;
}

// 定义 Props，如果是编辑模式会传入 initialData
interface ProblemEditorProps {
  initialData?: ProblemData;
  isEdit?: boolean;
}

export default function ProblemEditor({
  initialData,
  isEdit = false,
}: ProblemEditorProps) {
  const [loading, setLoading] = useState(false);

  // 基础字段状态
  const [title, setTitle] = useState(initialData?.title || "");
  const [timeLimit, setTimeLimit] = useState(
    initialData?.defaultTimeLimit || 1000
  );
  const [memoryLimit, setMemoryLimit] = useState(
    initialData?.defaultMemoryLimit || 128
  );
  const [type, setType] = useState(initialData?.type || "default");
  const [hint, setHint] = useState(initialData?.hint || "");

  // 动态数组：Sections (题面描述)
  const [sections, setSections] = useState<
    { title: string; content: string }[]
  >(
    initialData?.sections || [
      { title: "Problem Description", content: "" },
      { title: "Input", content: "" },
      { title: "Output", content: "" },
    ]
  );

  // 动态数组：Samples (样例)
  const [samples, setSamples] = useState<{ input: string; output: string }[]>(
    initialData?.samples || [{ input: "", output: "" }]
  );

  // 文件
  const [file, setFile] = useState<File | null>(null);

  // 辅助函数：处理数组变更
  const updateSection = (
    idx: number,
    field: "title" | "content",
    val: string
  ) => {
    const newSections = [...sections];
    newSections[idx][field] = val;
    setSections(newSections);
  };

  const updateSample = (
    idx: number,
    field: "input" | "output",
    val: string
  ) => {
    const newSamples = [...samples];
    newSamples[idx][field] = val;
    setSamples(newSamples);
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    if (isEdit && initialData?.id) {
      formData.append("id", initialData.id.toString());
    }
    formData.append("title", title);
    formData.append("type", type);
    formData.append("defaultTimeLimit", timeLimit.toString());
    formData.append("defaultMemoryLimit", memoryLimit.toString());
    formData.append("hint", hint);

    // 序列化 JSON 字段
    formData.append("sections", JSON.stringify(sections));
    formData.append("samples", JSON.stringify(samples));

    if (file) {
      formData.append("testData", file);
    }

    // 动态导入 Server Action 以避免客户端打包问题
    const { saveProblem } = await import("@/app/admin/problems/actions");
    await saveProblem(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-20">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEdit ? `Edit Problem #${initialData?.id}` : "Create New Problem"}
        </h1>
        <div className="space-x-4">
          <Link
            href="/admin/problems"
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Problem"}
          </button>
        </div>
      </div>

      {/* 1. 基本信息 */}
      <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-gray-700">Basic Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time Limit (ms)
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(Number(e.target.value))}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Memory Limit (MB)
            </label>
            <input
              type="number"
              value={memoryLimit}
              onChange={(e) => setMemoryLimit(Number(e.target.value))}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Judge Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 bg-white"
            >
              <option value="default">Default (Standard IO)</option>
              <option value="spj">Special Judge</option>
              <option value="interactive">Interactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. 题面描述 (Sections) */}
      <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-700">
            Description Sections
          </h2>
          <button
            type="button"
            onClick={() =>
              setSections([...sections, { title: "New Section", content: "" }])
            }
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Section
          </button>
        </div>

        <div className="space-y-8">
          {sections.map((sec, idx) => (
            <div
              key={idx}
              className="border p-4 rounded bg-gray-50 relative group"
            >
              <button
                type="button"
                onClick={() =>
                  setSections(sections.filter((_, i) => i !== idx))
                }
                className="absolute top-2 right-2 text-red-400 hover:text-red-600 z-10 bg-white px-2 py-1 rounded shadow-sm text-xs font-bold cursor-pointer"
              >
                Remove Block
              </button>

              <div className="mb-4">
                <input
                  value={sec.title}
                  onChange={(e) => updateSection(idx, "title", e.target.value)}
                  className="block w-full text-lg font-bold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none pb-2"
                  placeholder="Section Title (e.g. Input)"
                />
              </div>

              <MarkdownEditor
                value={sec.content}
                onChange={(val) => updateSection(idx, "content", val)}
                height={300} // 设置合适的高度
              />
            </div>
          ))}
        </div>
      </div>

      {/* 提示 Hint */}
      <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-700">Hint</h2>
        </div>
        <MarkdownEditor
          value={hint}
          onChange={(val) => setHint(val)}
          height={300} // 设置合适的高度
        />
      </div>

      {/* 3. 样例 (Samples) */}
      <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-700">Samples</h2>
          <button
            type="button"
            onClick={() => setSamples([...samples, { input: "", output: "" }])}
            className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            + Add Sample
          </button>
        </div>

        <div className="space-y-4">
          {samples.map((sample, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500">
                  Input #{idx + 1}
                </label>
                <textarea
                  value={sample.input}
                  onChange={(e) => updateSample(idx, "input", e.target.value)}
                  className="w-full h-24 p-2 border border-gray-300 rounded font-mono text-sm"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500">
                  Output #{idx + 1}
                </label>
                <textarea
                  value={sample.output}
                  onChange={(e) => updateSample(idx, "output", e.target.value)}
                  className="w-full h-24 p-2 border border-gray-300 rounded font-mono text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setSamples(samples.filter((_, i) => i !== idx))}
                className="mt-6 text-red-500 hover:text-red-700"
              >
                x
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. 测试数据上传 */}
      <div className="bg-white p-6 rounded shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-gray-700">
          Test Data (ZIP)
        </h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <p className="text-xs text-gray-500 mt-2">
            Upload a .zip file containing test cases (.in/.out) and optional
            problem.yml. Existing data will be overwritten.
          </p>
        </div>
      </div>
    </form>
  );
}
