import React from 'react';
import { Cpu, HardDrive, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const NodesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nodes & Resources</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build agent capacity, executor utilization, and system hardware metrics
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Online Agents</div>
            <div className="text-xl font-bold text-slate-900">4 / 4</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Total Executors</div>
            <div className="text-xl font-bold text-slate-900">16 (5 Busy, 11 Idle)</div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Avg Agent Disk Free</div>
            <div className="text-xl font-bold text-slate-900">82.4 GB</div>
          </div>
        </div>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                <th className="px-5 py-3">Node Name</th>
                <th className="px-5 py-3">Controller</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Executors</th>
                <th className="px-5 py-3">Utilization</th>
                <th className="px-5 py-3">Labels</th>
                <th className="px-5 py-3">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 font-semibold text-slate-900">built-in (controller)</td>
                <td className="px-5 py-3.5 text-slate-600">Primary Controller</td>
                <td className="px-5 py-3.5"><StatusBadge status="ONLINE" /></td>
                <td className="px-5 py-3.5 text-slate-600">2 (1 busy, 1 idle)</td>
                <td className="px-5 py-3.5">
                  <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '50%' }} />
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500">controller</td>
                <td className="px-5 py-3.5 text-slate-500">Just now</td>
              </tr>
              <tr className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 font-semibold text-slate-900">linux-docker-agent-01</td>
                <td className="px-5 py-3.5 text-slate-600">Primary Controller</td>
                <td className="px-5 py-3.5"><StatusBadge status="ONLINE" /></td>
                <td className="px-5 py-3.5 text-slate-600">4 (2 busy, 2 idle)</td>
                <td className="px-5 py-3.5">
                  <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '50%' }} />
                  </div>
                </td>
                <td className="px-5 py-3.5 font-mono text-[10px] text-slate-500">linux, docker, amd64</td>
                <td className="px-5 py-3.5 text-slate-500">30s ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
