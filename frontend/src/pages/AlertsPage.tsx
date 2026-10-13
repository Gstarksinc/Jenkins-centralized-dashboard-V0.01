import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { apiFetch } from '../api/client';
import { Alert } from '../types';

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

export const AlertsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');

  // 1. Fetch Alerts
  const {
    data: alerts = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<Alert[]>({
    queryKey: ['alerts', statusFilter],
    queryFn: () => {
      const url = statusFilter ? `/api/v1/alerts?status=${statusFilter}` : '/api/v1/alerts';
      return apiFetch<Alert[]>(url);
    },
    refetchInterval: 10000,
  });

  // 2. Acknowledge Mutation
  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiFetch<Alert>(`/api/v1/alerts/${alertId}/acknowledge`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  // 3. Resolve Mutation
  const resolveMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiFetch<Alert>(`/api/v1/alerts/${alertId}/resolve`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Alerts & Incidents</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time operational alerts, node disconnects, and threshold violations across controllers
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
        {[
          { key: 'ACTIVE', label: 'Active Alerts' },
          { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
          { key: 'RESOLVED', label: 'Resolved' },
          { key: '', label: 'All History' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              statusFilter === tab.key
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Loading alerts...
        </div>
      ) : isError ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-xs text-rose-600">
          Failed to load alerts: {(error as Error)?.message}
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No {statusFilter || 'recorded'} alerts</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            All registered Jenkins controllers, agent nodes, and build queues are operating nominally.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alt) => (
            <div
              key={alt.id}
              className={`bg-white rounded-xl border p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition ${
                alt.status === 'ACTIVE'
                  ? alt.severity === 'CRITICAL'
                    ? 'border-rose-300 bg-rose-50/20'
                    : 'border-amber-300 bg-amber-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-start space-x-3.5">
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    alt.severity === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        alt.severity === 'CRITICAL'
                          ? 'bg-rose-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {alt.severity}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">{alt.title}</span>
                    <span className="text-xs text-slate-500">• {alt.server_name || 'Controller'}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 max-w-2xl">{alt.description}</p>
                  <div className="flex items-center space-x-4 text-[11px] text-slate-400 mt-2">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Detected: {formatTimestamp(alt.first_detected_at)}</span>
                    </span>
                    <span>Status: <strong className="font-semibold text-slate-600">{alt.status}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                {alt.status === 'ACTIVE' && (
                  <button
                    onClick={() => acknowledgeMutation.mutate(alt.id)}
                    disabled={acknowledgeMutation.isPending}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                  >
                    Acknowledge
                  </button>
                )}
                {alt.status !== 'RESOLVED' && (
                  <button
                    onClick={() => resolveMutation.mutate(alt.id)}
                    disabled={resolveMutation.isPending}
                    className="px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded transition flex items-center space-x-1"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Resolve</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
