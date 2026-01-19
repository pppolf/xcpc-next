"use client";

import { useState } from "react";
import CodeEditor from "@/components/CodeEditor";
import { submitCode } from "./actions";
import { useLanguage } from "@/context/LanguageContext";

const LANGUAGES = [
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "java", label: "Java" },
  { value: "pypy3", label: "PyPy3" },
];

export default function SubmitForm({
  contestId,
  problemId,
  isAdmin,
}: {
  contestId: string;
  problemId: string;
  isAdmin: boolean;
}) {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("cpp");
  const { dict } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCode(Number(contestId), problemId, language, code);
  };

  return (
    <main className="flex-1 w-full min-w-0">
      <div className="bg-white border border-gray-200 shadow-sm rounded-sm p-6">
        <h2 className="text-2xl font-serif font-bold text-gray-800 mb-6 border-b pb-4">
          {dict.submit.title}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {dict.common.language}
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

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {dict.common.code}
            </label>
            <div className="relative">
              <CodeEditor
                value={code}
                language={language}
                onChange={setCode}
                height="500px"
              />
              <div className="absolute bottom-2 right-2 text-xs text-gray-400">
                {code.length} chars
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isAdmin ? (
              <button
                disabled
                className="bg-gray-400 text-white font-medium rounded-sm text-sm px-8 py-3 shadow-md cursor-not-allowed opacity-60"
                title="Admins cannot submit"
              >
                {dict.common.submit}
              </button>
            ) : (
              <button
                type="submit"
                className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-sm text-sm px-8 py-3 shadow-md transition-colors"
              >
                {dict.common.submit}
              </button>
            )}

            <button
              type="button"
              onClick={() => setCode("")}
              className="text-gray-600 bg-gray-100 hover:bg-gray-200 font-medium rounded-sm text-sm px-6 py-3 transition-colors"
            >
              {dict.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
