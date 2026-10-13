import React from 'react';
import { Clock, Terminal } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const BuildsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Build History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Execution logs, run duration, trigger causes, and VCS metadata
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                <th className="px-5 py-3">Build</th>
                <th className="px-5 py-3">Job Name</th>
                <th className="px-5 py-3">Server</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Started</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Branch / Commit</th>
                <th className="px-5 py-3 text-right">Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 font-bold font-mono text-slate-900">#142</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">api-service-pipeline</td>
                <td className="px-5 py-3.5 text-slate-600">Primary Controller</td>
                <td className="px-5 py-3.5"><StatusBadge status="SUCCESS" /></td>
                <td className="px-5 py-3.5 text-slate-500">12 mins ago</td>
                <td className="px-5 py-3.5 text-slate-600 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>2m 14s</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">
                  main <span className="text-slate-400">@ 9a3f2b1</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100" title="View Console Output">
                    <Terminal className="w-4 h-4" />
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
