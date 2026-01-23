"use client";

import Editor, { OnMount, loader } from "@monaco-editor/react";
import { useRef, useState } from "react";

loader.config({
  paths: {
    vs: "https://registry.npmmirror.com/monaco-editor/0.45.0/files/min/vs",
  },
});

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

    setTimeout(() => {
      editor.layout();
    }, 1000);
  };

  const monacoLanguage = LANGUAGE_MAP[language] || "plaintext";

  return (
    <div
      // 关键修复：添加 w-full 确保填满外部的 absolute 容器
      className="border border-gray-300 rounded-sm overflow-hidden shadow-sm relative w-full"
      style={{ height: height }}
    >
      <div className="absolute inset-0">
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
            wordWrap: "on",
            overviewRulerBorder: true,
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
    </div>
  );
}
