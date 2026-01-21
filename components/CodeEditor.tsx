"use client";

import Editor, { OnMount } from "@monaco-editor/react";
import { useRef, useState } from "react";

interface CodeEditorProps {
  value: string;
  language: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

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
  readOnly = false,
}: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const [, setMounted] = useState(false);

  // 编辑器加载完成后的回调
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    setMounted(true);

    // 关键修复：延迟 100ms 强制刷新一次布局
    // 解决 DOM 挂载初期尺寸为 0 导致 Monaco 计算出 1.6e7px 巨大尺寸的问题
    setTimeout(() => {
      editor.layout();
    }, 100);
  };

  const monacoLanguage = LANGUAGE_MAP[language] || "plaintext";

  return (
    <div
      // 关键修复：添加 w-full h-full 确保填满外部的 absolute 容器
      className="border border-gray-300 rounded-sm overflow-hidden shadow-sm relative w-full h-full"
      style={{ height: height }}
    >
      <Editor
        height="100%"
        width="100%"
        language={monacoLanguage}
        value={value}
        onChange={(val) => onChange && onChange(val || "")}
        theme="vs-light"
        options={{
          readOnly: readOnly,
          domReadOnly: readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          mouseWheelZoom: true,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          fontFamily: "'Fira Code', 'Consolas', monospace",
          // 关键修复：开启自动换行，防止宽度被计算为只有一行无限长
          wordWrap: "on",
          // 隐藏垂直滚动条概览，有时候它也会导致布局计算问题
          overviewRulerBorder: false,
          fixedOverflowWidgets: true,
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
