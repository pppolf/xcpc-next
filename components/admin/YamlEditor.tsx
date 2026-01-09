"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

// 动态导入编辑器以避免 SSR 问题
const CodeEditor = dynamic(
  () => import("@uiw/react-textarea-code-editor").then((mod) => mod.default),
  { ssr: false }
);

interface YamlEditorProps {
  initialValue: string;
  onSave: (value: string) => Promise<void>;
}

export default function YamlEditor({ initialValue, onSave }: YamlEditorProps) {
  const [code, setCode] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(code);
    setSaving(false);
  };

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-bold text-gray-700 text-sm">
          problem.yml Configuration
        </h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs rounded transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Config"}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-[#f5f5f5] text-sm font-mono relative">
        <CodeEditor
          value={code}
          language="yaml"
          placeholder="Please enter YAML configuration."
          onChange={(evn) => setCode(evn.target.value)}
          padding={15}
          style={{
            fontSize: 13,
            backgroundColor: "#f5f5f5",
            fontFamily:
              "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
            minHeight: "100%",
          }}
        />
      </div>
    </div>
  );
}
