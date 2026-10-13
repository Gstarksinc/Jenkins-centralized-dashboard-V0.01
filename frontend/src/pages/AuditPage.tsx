import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, RefreshCw } from 'lucide-react';
import { apiFetch } from '../api/client';
import { AuditEvent } from '../types';

function formatTimestamp(isoStr?: string): string {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

export const AuditPage: React.FC = () => {
  // 1. Fetch live audit events
  const {
    data: logs = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<AuditEvent[]>({
    queryKey: ['audit-events'],
    queryFn: () => apiFetch<AuditEvent[]>('/api/v1/audit-events'),
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Trail</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident record of security events, administrative changes, and build executions
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

      {/* Table Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading audit trail...</div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-rose-600">
            Failed to load audit events: {(error as Error)?.message}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No audit events recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Events are generated when users log in, servers are registered, or builds are triggered.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Resource</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Source IP</th>
                  <th className="px-5 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {log.resource_type}: <span className="font-mono text-[11px] text-slate-500">{log.resource_id || '-'}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px] truncate max-w-xs">
                      {log.details ? JSON.stringify(log.details) : '-'}
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
