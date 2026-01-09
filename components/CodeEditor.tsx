"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useRef, useState } from "react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  height?: string;
}

// 语言映射：将你的系统语言代码映射为 Monaco 支持的语言 ID
const LANGUAGE_MAP: Record<string, string> = {
  c: "c",
  cpp: "cpp",
  java: "java",
  pypy3: "python",
};

export default function CodeEditor({
  value,
  language,
  onChange,
  height = "500px",
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const [, setMounted] = useState(false);

  // 编辑器加载完成后的回调
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    setMounted(true);

    // 你可以在这里配置一些全局设置，比如自动格式化等
    // monaco.languages.registerCompletionItemProvider()
  };

  const monacoLanguage = LANGUAGE_MAP[language] || "plaintext";

  return (
    <div
      className="border border-gray-300 rounded-sm overflow-hidden shadow-sm"
      style={{ height: height }}
    >
      <Editor
        height="100%"
        language={monacoLanguage}
        value={value}
        onChange={(val) => onChange(val || "")}
        theme="vs-light" // 浅色主题，契合你的系统风格 (vs-dark 为深色)
        options={{
          minimap: { enabled: false }, // 关闭右侧代码缩略图，节省空间
          fontSize: 14,
          scrollBeyondLastLine: false, // 滚动条不滚过最后一行
          automaticLayout: true, // 自动适应容器大小
          tabSize: 4,
          fontFamily: "'Fira Code', 'Consolas', monospace", // 推荐字体
        }}
        onMount={handleEditorDidMount}
        loading={
          <div className="h-full w-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
            Initializing Editor...
          </div>
        }
      />
    </div>
  );
}
