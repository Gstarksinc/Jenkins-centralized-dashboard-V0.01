import React from 'react';
import {
  Server,
  GitBranch,
  Play,
  Layers,
  Cpu,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const mockTrends = [
  { time: '10:00', successful: 24, failed: 2 },
  { time: '11:00', successful: 35, failed: 4 },
  { time: '12:00', successful: 42, failed: 3 },
  { time: '13:00', successful: 38, failed: 5 },
  { time: '14:00', successful: 55, failed: 1 },
  { time: '15:00', successful: 62, failed: 3 },
];

export const OverviewPage: React.FC = () => {
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
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Live Telemetry Mode</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Controllers"
          value="1"
          subtitle="1 Online / 0 Degraded"
          icon={Server}
          variant="default"
        />
        <MetricCard
          title="Active Build Jobs"
          value="28"
          subtitle="Across all folders"
          icon={GitBranch}
          variant="default"
        />
        <MetricCard
          title="Running Builds"
          value="3"
          subtitle="Queue Length: 0"
          icon={Play}
          variant="default"
        />
        <MetricCard
          title="Executors In Use"
          value="3 / 8"
          subtitle="37.5% capacity"
          icon={Cpu}
          variant="default"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Build Success Rate (24h)"
          value="94.2%"
          subtitle="214 completed builds"
          icon={CheckCircle2}
          variant="success"
        />
        <MetricCard
          title="Failed Builds (24h)"
          value="13"
          subtitle="1 requires immediate review"
          icon={XCircle}
          variant="danger"
        />
        <MetricCard
          title="Queue Wait Time"
          value="1.2s"
          subtitle="Median over last 6h"
          icon={Layers}
          variant="default"
        />
        <MetricCard
          title="Active Alerts"
          value="0"
          subtitle="All thresholds nominal"
          icon={AlertTriangle}
          variant="success"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Build Throughput & Health Trend</h2>
              <p className="text-xs text-slate-500">Successful vs failed build executions over time</p>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
              Last 6 Hours
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="successGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="failGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="successful"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#successGrad)"
                  name="Success"
                />
                <Area
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  fillOpacity={1}
                  fill="url(#failGrad)"
                  name="Failure"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Controller Status Summary Card */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Registered Controllers</h2>
            <p className="text-xs text-slate-500 mb-4">Controller connection status and health</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-slate-900">Local Jenkins Test</h3>
                    <p className="text-[10px] text-slate-500">v2.440.3 • Staging</p>
                  </div>
                </div>
                <StatusBadge status="ONLINE" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Last sync: 1 min ago</span>
            <span className="text-indigo-600 font-medium cursor-pointer hover:underline">
              View All Controllers →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
