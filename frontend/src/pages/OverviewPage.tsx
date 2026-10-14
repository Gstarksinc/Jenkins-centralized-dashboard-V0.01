import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Server,
  GitBranch,
  Play,
  Cpu,
  AlertTriangle,
  RefreshCw,
  Layers,
  BarChart2,
  Plus,
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
import { JenkinsDashboardView } from '../components/JenkinsDashboardView';
import { apiFetch } from '../api/client';
import { DashboardSummary, BuildTrendItem, JenkinsServer } from '../types';

export const OverviewPage: React.FC = () => {
  const [selectedServer, setSelectedServer] = useState<JenkinsServer | null>(null);
  const [showTelemetryDetails, setShowTelemetryDetails] = useState(false);

  // 1. Fetch Registered Servers
  const { data: servers = [], isLoading: isServersLoading } = useQuery<JenkinsServer[]>({
    queryKey: ['servers'],
    queryFn: () => apiFetch<JenkinsServer[]>('/api/v1/servers'),
    refetchInterval: 15000,
  });

  // 2. Fetch Dashboard Summary
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

  // 3. Fetch 7-day Build Trends
  const { data: trends = [] } = useQuery<BuildTrendItem[]>({
    queryKey: ['dashboard-trends'],
    queryFn: () => apiFetch<BuildTrendItem[]>('/api/v1/dashboard/build-trends?days=7'),
    refetchInterval: 30000,
  });

  const totalControllers = summary?.total_controllers ?? servers.length;
  const onlineControllers = summary?.online_controllers ?? servers.filter((s) => s.status === 'ONLINE').length;
  const offlineControllers = summary?.offline_controllers ?? (totalControllers - onlineControllers);
  const totalJobs = summary?.total_jobs ?? 0;
  const totalNodes = summary?.total_nodes ?? 0;
  const onlineNodes = summary?.online_nodes ?? 0;
  const activeBuilds = summary?.active_builds ?? 0;
  const activeAlerts = summary?.active_alerts ?? 0;
  const queueDepth = summary?.queue_depth ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Header with Mode Toggle & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <span>Jenkins Control Center</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
              Centralized
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized orchestration, unified Jenkins dashboard views, and multi-controller management
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTelemetryDetails(!showTelemetryDetails)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition ${
              showTelemetryDetails
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{showTelemetryDetails ? 'Hide Analytics' : 'Fleet Analytics'}</span>
          </button>

          <button
            onClick={() => refetchSummary()}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Interactive Controller Selection Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Select Jenkins Controller
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Click any controller to view its Jenkins dashboard and jobs
          </span>
        </div>

        <div className="flex items-center space-x-2.5 overflow-x-auto pb-1 pt-1">
          {/* All Controllers Pill */}
          <button
            onClick={() => setSelectedServer(null)}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition shrink-0 border ${
              selectedServer === null
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Controllers</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-200">
              {servers.length}
            </span>
          </button>

          {/* Individual Controller Cards */}
          {servers.map((server) => {
            const isSelected = selectedServer?.id === server.id;
            const isOnline = server.status === 'ONLINE';

            return (
              <button
                key={server.id}
                onClick={() => setSelectedServer(server)}
                className={`flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-medium transition shrink-0 border text-left ${
                  isSelected
                    ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-400 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    isOnline ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-rose-500'
                  }`}
                />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-900 leading-tight">
                    {server.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {server.version_info ? `v${server.version_info}` : server.environment}
                  </span>
                </div>
              </button>
            );
          })}

          {servers.length === 0 && !isServersLoading && (
            <a
              href="/servers"
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Connect First Jenkins Server</span>
            </a>
          )}
        </div>
      </div>

      {/* 3. Authentic Jenkins Dashboard View (Views Tabs, Status Balls, Weather, Build Queue & Jobs) */}
      <JenkinsDashboardView
        selectedServer={selectedServer}
        servers={servers}
        onSelectServer={setSelectedServer}
      />

      {/* 4. Expandable Fleet Telemetry & Charts (Optional Panel) */}
      {showTelemetryDetails && (
        <div className="space-y-6 pt-4 border-t border-slate-200">
          <div className="flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Fleet Telemetry & Build Trends</h2>
          </div>

          {/* Aggregate Metrics Grid */}
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

          {/* 7-day Area Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Build Volume & Trends (Last 7 Days)</h3>
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
        </div>
      )}
    </div>
  );
};
