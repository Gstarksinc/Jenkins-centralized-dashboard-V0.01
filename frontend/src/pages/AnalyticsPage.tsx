import React from 'react';
import { TrendingUp, Calendar } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const buildVolumeData = [
  { day: 'Mon', builds: 84 },
  { day: 'Tue', builds: 112 },
  { day: 'Wed', builds: 145 },
  { day: 'Thu', builds: 130 },
  { day: 'Fri', builds: 168 },
  { day: 'Sat', builds: 42 },
  { day: 'Sun', builds: 31 },
];

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Analytics & Reports</h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical build volume, duration trends, executor consumption, and reliability indices
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>Last 7 Days</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Weekly Execution Volume</h2>
            <p className="text-xs text-slate-500">Total CI/CD pipeline builds run per day</p>
          </div>
          <div className="flex items-center space-x-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% vs last week</span>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buildVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip />
              <Bar dataKey="builds" fill="#6366f1" radius={[4, 4, 0, 0]} name="Builds Run" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
