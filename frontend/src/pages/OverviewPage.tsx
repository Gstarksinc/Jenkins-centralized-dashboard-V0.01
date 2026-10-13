import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Server,
  GitBranch,
  Play,
  Cpu,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { apiFetch } from '../api/client';
import { DashboardSummary, BuildTrendItem } from '../types';

export const OverviewPage: React.FC = () => {
  // 1. Fetch Summary
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
    isFetching,
  } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiFetch<DashboardSummary>('/api/v1/dashboard/summary'),
    refetchInterval: 15000,
  });

  // 2. Fetch Trends
  const { data: trends = [] } = useQuery<BuildTrendItem[]>({
    queryKey: ['dashboard-trends'],
    queryFn: () => apiFetch<BuildTrendItem[]>('/api/v1/dashboard/build-trends?days=7'),
    refetchInterval: 30000,
  });

  const totalControllers = summary?.total_controllers ?? 0;
  const onlineControllers = summary?.online_controllers ?? 0;
  const offlineControllers = summary?.offline_controllers ?? 0;
  const totalJobs = summary?.total_jobs ?? 0;
  const totalNodes = summary?.total_nodes ?? 0;
  const onlineNodes = summary?.online_nodes ?? 0;
  const activeBuilds = summary?.active_builds ?? 0;
  const activeAlerts = summary?.active_alerts ?? 0;
  const queueDepth = summary?.queue_depth ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized health and telemetry across registered Jenkins controllers
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetchSummary()}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live Telemetry</span>
          </div>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Controllers"
          value={isSummaryLoading ? '...' : `${onlineControllers} / ${totalControllers}`}
          subtitle={offlineControllers > 0 ? `${offlineControllers} offline` : 'All online'}
          icon={Server}
          variant={offlineControllers > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="CI/CD Jobs"
          value={isSummaryLoading ? '...' : totalJobs}
          subtitle="Managed jobs"
          icon={GitBranch}
          variant="default"
        />
        <MetricCard
          title="Active Builds"
          value={isSummaryLoading ? '...' : activeBuilds}
          subtitle="Currently running"
          icon={Play}
          variant={activeBuilds > 0 ? 'success' : 'default'}
        />
        <MetricCard
          title="Agent Nodes"
          value={isSummaryLoading ? '...' : `${onlineNodes} / ${totalNodes}`}
          subtitle={`${totalNodes - onlineNodes} offline`}
          icon={Cpu}
          variant={totalNodes - onlineNodes > 0 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Queue Depth"
          value={isSummaryLoading ? '...' : queueDepth}
          subtitle={queueDepth > 5 ? 'High queue' : 'Normal'}
          icon={RefreshCw}
          variant={queueDepth > 5 ? 'warning' : 'default'}
        />
        <MetricCard
          title="Active Alerts"
          value={isSummaryLoading ? '...' : activeAlerts}
          subtitle={activeAlerts > 0 ? 'Needs attention' : 'All clear'}
          icon={AlertTriangle}
          variant={activeAlerts > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* Charts & Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Build Volume & Trends (Last 7 Days)</h2>
              <p className="text-xs text-slate-500">Completed build runs grouped by outcome</p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Success</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-600">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Failure</span>
              </span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorFailure" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="success"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                />
                <Area
                  type="monotone"
                  dataKey="failure"
                  stroke="#f43f5e"
                  fillOpacity={1}
                  fill="url(#colorFailure)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Fleet Health Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Fleet Operations Status</h2>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-800">Controllers Health</p>
                <p className="text-xs text-slate-500">
                  {onlineControllers} connected, {offlineControllers} unreachable
                </p>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  offlineControllers === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {offlineControllers === 0 ? 'OPTIMAL' : 'ATTENTION'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-800">Agent Nodes Capacity</p>
                <p className="text-xs text-slate-500">
                  {onlineNodes} online agents ({totalNodes} registered)
                </p>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  onlineNodes === totalNodes
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {onlineNodes === totalNodes ? 'READY' : 'DEGRADED'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-800">Operational Alerts</p>
                <p className="text-xs text-slate-500">
                  {activeAlerts === 0
                    ? 'No active issues recorded'
                    : `${activeAlerts} unresolved alerts`}
                </p>
              </div>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  activeAlerts === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {activeAlerts === 0 ? 'CLEAR' : 'ALERT'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <a
              href="/servers"
              className="flex items-center justify-center space-x-1.5 w-full py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
            >
              <span>Manage Controllers</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
