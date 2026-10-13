import React from 'react';
import { GitBranch, Play, Search, Filter } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const JobsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Jobs & Builds</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated job definitions, build execution history, and authorized build triggers
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter jobs by name, folder, or controller..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
          />
        </div>
        <button className="flex items-center space-x-1 px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                <th className="px-5 py-3">Job Name</th>
                <th className="px-5 py-3">Folder</th>
                <th className="px-5 py-3">Server</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Last Build</th>
                <th className="px-5 py-3">Result</th>
                <th className="px-5 py-3">Health</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-slate-400" />
                  <span>api-service-pipeline</span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">core/backend</td>
                <td className="px-5 py-3.5 text-slate-700">Primary Controller</td>
                <td className="px-5 py-3.5 text-slate-500">Pipeline</td>
                <td className="px-5 py-3.5 text-slate-700 font-mono">#142</td>
                <td className="px-5 py-3.5"><StatusBadge status="SUCCESS" /></td>
                <td className="px-5 py-3.5">
                  <span className="text-emerald-600 font-semibold">100%</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold text-xs transition-colors">
                    <Play className="w-3 h-3" />
                    <span>Build</span>
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-slate-400" />
                  <span>frontend-portal-release</span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">apps/portal</td>
                <td className="px-5 py-3.5 text-slate-700">Primary Controller</td>
                <td className="px-5 py-3.5 text-slate-500">Pipeline</td>
                <td className="px-5 py-3.5 text-slate-700 font-mono">#89</td>
                <td className="px-5 py-3.5"><StatusBadge status="RUNNING" /></td>
                <td className="px-5 py-3.5">
                  <span className="text-indigo-600 font-semibold">80%</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold text-xs transition-colors">
                    <Play className="w-3 h-3" />
                    <span>Build</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
