'use client'; // 因为有文件交互，建议使用 client component
import * as React from 'react'
import { useState } from 'react';

export default function ProblemUpload({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('manual'); // manual 或 file

  const { id } = React.use(params)

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manage Problems</h1>
        <p className="text-gray-500">Contest ID: {id}</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* Tab 切换 */}
        <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab('manual')}
            className={`pb-3 px-4 text-sm font-medium ${activeTab === 'manual' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Manual Entry
          </button>
          <button 
            onClick={() => setActiveTab('file')}
            className={`pb-3 px-4 text-sm font-medium ${activeTab === 'file' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Batch Upload (XML/ZIP)
          </button>
        </div>

        {activeTab === 'manual' ? (
          <form className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Problem Title</label>
                <input type="text" className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. A + B Problem" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (ms)</label>
                <input type="number" className="w-full border border-gray-300 rounded p-2" defaultValue="1000" />
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Description (Markdown)</label>
               <textarea className="w-full h-40 border border-gray-300 rounded p-2 font-mono text-sm" placeholder="# Problem Description..."></textarea>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Test Input (.in)</label>
                 <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Test Output (.out)</label>
                 <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-medium">Add Problem</button>
          </form>
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900">Upload FPS (XML) or ZIP</h3>
            <p className="text-gray-500 text-sm mt-1 mb-6">Support Hydro / HUSTOJ format packages</p>
            <input type="file" className="mx-auto block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
        )}
      </div>
    </div>
  );
}