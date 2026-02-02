'use client';

import { useState } from "react";
import { PlayIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { toast } from "sonner";

export default function AdminContestsImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/zip" || selectedFile.name.endsWith(".zip")) {
        setFile(selectedFile);
      } else {
        toast.error("Please upload a ZIP file");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Please select a ZIP file to upload");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch('/api/contests/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();
      toast.success(`Successfully imported ${result.importedContests} contests`);
      setFile(null);
    } catch (error) {
      toast.error((error as Error).message || 'Import failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/contests"
          className="flex items-center gap-1 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Contests
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Import Contests</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 p-6">
        <div className="max-w-md mx-auto">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Upload Contest Data</h2>
            <p className="text-gray-500 text-sm">
              Upload a ZIP file containing contest data exported from another system.
              The file should include all contest information, users, problems, and submissions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <PlayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Drag and drop your ZIP file here</p>
                <p className="text-xs text-gray-500">or</p>
                <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                  Browse files
                  <input
                    type="file"
                    className="sr-only"
                    accept=".zip,application/zip"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            {file && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-700">Selected file: {file.name}</p>
                <p className="text-xs text-gray-500">Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading || !file}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importing...
                  </>
                ) : (
                  'Import Contests'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
