"use client";

import { submitQuestion } from "./actions";
import { toast } from "sonner";
import { useRef } from "react";

interface Props {
  contestId: number;
  problems: { displayId: string; problemId: number }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dict: any;
}

export default function ClarificationForm({
  contestId,
  problems,
  dict,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    const res = await submitQuestion(formData);
    if (res?.error) {
      toast.error(res.error);
    } else if (res?.success) {
      toast.success("Question submitted");
      formRef.current?.reset();
    }
  }

  return (
    <section className="bg-white border border-gray-200 shadow-sm rounded-lg p-6 md:p-8">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
        {dict.clarifications.askQuestion}
      </h3>
      <form ref={formRef} action={handleSubmit} className="flex flex-col gap-5">
        <input type="hidden" name="contestId" value={contestId} />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Select Problem */}
          <div className="md:col-span-1">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              {dict.clarifications.problem}
            </label>
            <select
              name="displayId"
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
            >
              <option value="General">{dict.clarifications.general}</option>
              {problems.map((p) => (
                <option key={p.displayId} value={p.displayId}>
                  Problem {p.displayId}
                </option>
              ))}
            </select>
          </div>

          {/* Title Input */}
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
              {dict.clarifications.title}
            </label>
            <input
              name="title"
              required
              className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
              placeholder="Brief summary of your question..."
            />
          </div>
        </div>

        {/* Content Input */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">
            {dict.clarifications.content}
          </label>
          <textarea
            name="content"
            required
            rows={5}
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none"
            placeholder="Detailed description..."
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="text-white bg-blue-600 hover:bg-blue-700 font-medium rounded-lg text-sm px-8 py-2.5 shadow-md transition-colors"
          >
            {dict.common.submit}
          </button>
        </div>
      </form>
    </section>
  );
}
