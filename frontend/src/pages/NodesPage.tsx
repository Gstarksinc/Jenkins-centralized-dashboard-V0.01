import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cpu, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { apiFetch } from '../api/client';
import { Node } from '../types';

export const NodesPage: React.FC = () => {
  const [filterOnline, setFilterOnline] = useState<boolean | null>(null);

  // 1. Fetch Nodes
  const {
    data: nodes = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<Node[]>({
    queryKey: ['nodes'],
    queryFn: () => apiFetch<Node[]>('/api/v1/nodes'),
    refetchInterval: 15000,
  });

  const onlineCount = nodes.filter((n) => n.is_online).length;
  const totalExecutors = nodes.reduce((sum, n) => sum + (n.num_executors || 0), 0);
  const busyExecutors = nodes.reduce((sum, n) => sum + (n.busy_executors || 0), 0);
  const idleExecutors = nodes.reduce((sum, n) => sum + (n.idle_executors || 0), 0);

  const filteredNodes = nodes.filter((n) => {
    if (filterOnline === null) return true;
    return n.is_online === filterOnline;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nodes & Agents</h1>
          <p className="text-xs text-slate-500 mt-1">
            Build agent fleet health, executor load, and assigned capability labels
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Online Agents</div>
            <div className="text-xl font-bold text-slate-900">
              {isLoading ? '...' : `${onlineCount} / ${nodes.length}`}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Executor Pool</div>
            <div className="text-xl font-bold text-slate-900">
              {isLoading ? '...' : `${totalExecutors} (${busyExecutors} Busy, ${idleExecutors} Idle)`}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="p-2.5 rounded-lg bg-slate-50 text-slate-600">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase">Utilization Rate</div>
            <div className="text-xl font-bold text-slate-900">
              {totalExecutors > 0
                ? `${Math.round((busyExecutors / totalExecutors) * 100)}%`
                : '0%'}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterOnline(null)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            filterOnline === null ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Nodes ({nodes.length})
        </button>
        <button
          onClick={() => setFilterOnline(true)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            filterOnline === true ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Online ({onlineCount})
        </button>
        <button
          onClick={() => setFilterOnline(false)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
            filterOnline === false ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Offline ({nodes.length - onlineCount})
        </button>
      </div>

      {/* Agents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading build agents...</div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-rose-600">
            Failed to load nodes: {(error as Error)?.message}
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="p-12 text-center">
            <Cpu className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No agent nodes found</p>
            <p className="text-xs text-slate-400 mt-1">
              Ensure controllers are registered and sync has completed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <th className="px-5 py-3">Node Name</th>
                  <th className="px-5 py-3">Controller</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Executors</th>
                  <th className="px-5 py-3">Assigned Labels</th>
                  <th className="px-5 py-3">Offline Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredNodes.map((n) => (
                  <tr key={n.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                      <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{n.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {n.server_name || 'Controller'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          n.is_online
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {n.is_online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-mono">
                      {n.busy_executors} / {n.num_executors} busy
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {n.labels && n.labels.length > 0 ? (
                          n.labels.map((lbl, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono"
                            >
                              {lbl}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs truncate max-w-xs">
                      {n.offline_cause || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
