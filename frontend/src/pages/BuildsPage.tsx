import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Terminal, RefreshCw, X, Play } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../api/client';
import { Build } from '../types';

interface ConsoleModalState {
  isOpen: boolean;
  buildId: string | null;
  jobName: string;
  buildNumber: number;
}

function formatDuration(ms?: number): string {
  if (!ms || ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatTimestamp(isoStr?: string): string {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export const BuildsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [consoleModal, setConsoleModal] = useState<ConsoleModalState>({
    isOpen: false,
    buildId: null,
    jobName: '',
    buildNumber: 0,
  });

  // 1. Fetch Builds
  const {
    data: builds = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<Build[]>({
    queryKey: ['builds', statusFilter],
    queryFn: () => {
      const url = statusFilter
        ? `/api/v1/builds?status=${statusFilter}`
        : '/api/v1/builds';
      return apiFetch<Build[]>(url);
    },
    refetchInterval: 10000,
  });

  // 2. Fetch Console Log when Modal open
  const {
    data: consoleData,
    isLoading: isConsoleLoading,
  } = useQuery<{ log_content: string }>({
    queryKey: ['build-console', consoleModal.buildId],
    queryFn: () => apiFetch<{ log_content: string }>(`/api/v1/builds/${consoleModal.buildId}/console`),
    enabled: consoleModal.isOpen && !!consoleModal.buildId,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Build History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Execution history, duration, outcomes, and live console output across controllers
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

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {['', 'RUNNING', 'SUCCESS', 'FAILURE', 'UNSTABLE'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              statusFilter === st
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st === '' ? 'All Builds' : st}
          </button>
        ))}
      </div>

      {/* Builds Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading build history...</div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-rose-600">
            Failed to load builds: {(error as Error)?.message}
          </div>
        ) : builds.length === 0 ? (
          <div className="p-12 text-center">
            <Play className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No build runs recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Trigger a build from the Jobs page or wait for controller synchronization.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <th className="px-5 py-3">Build</th>
                  <th className="px-5 py-3">Job Name</th>
                  <th className="px-5 py-3">Controller</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Started</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3 text-right">Console Output</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {builds.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-bold font-mono text-slate-900">
                      #{b.build_number}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">
                      {b.job_name || 'Job'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {b.server_name || 'Controller'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={b.normalized_status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {formatTimestamp(b.start_time || b.created_at)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDuration(b.duration_ms)}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() =>
                          setConsoleModal({
                            isOpen: true,
                            buildId: b.id,
                            jobName: b.job_name || 'Job',
                            buildNumber: b.build_number,
                          })
                        }
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium text-xs transition"
                        title="View Console Output"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Logs</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Console Log Modal */}
      {consoleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200">
            {/* Modal Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-semibold text-white">
                  Console Output: {consoleModal.jobName} #{consoleModal.buildNumber}
                </span>
              </div>
              <button
                onClick={() => setConsoleModal({ isOpen: false, buildId: null, jobName: '', buildNumber: 0 })}
                className="text-slate-400 hover:text-white p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs bg-slate-950 text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-indigo-600">
              {isConsoleLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  <span>Streaming console logs from Jenkins controller...</span>
                </div>
              ) : consoleData?.log_content ? (
                consoleData.log_content
              ) : (
                <span className="text-slate-500">No console output received or build pending.</span>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setConsoleModal({ isOpen: false, buildId: null, jobName: '', buildNumber: 0 })}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
