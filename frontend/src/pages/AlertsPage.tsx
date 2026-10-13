import React from 'react';
import { CheckCircle2, Sliders } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Alerts & Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time operational alerts, threshold violations, and deduplicated notification events
          </p>
        </div>
        <button className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50">
          <Sliders className="w-3.5 h-3.5 mr-1.5" /> Configure Rules
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-900">No Active Alerts</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
          All registered Jenkins controllers, agents, queues, and build health metrics are currently operating within nominal thresholds.
        </p>
      </div>
    </div>
  );
};
