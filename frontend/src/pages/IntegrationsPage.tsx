import React from 'react';
import { Blocks } from 'lucide-react';

const integrations = [
  {
    name: 'Jenkins Core REST API',
    category: 'CI/CD Controller',
    status: 'Connected',
    desc: 'Native JSON API with CSRF Crumb support for Jenkins 2.300+ controllers.',
  },
  {
    name: 'PostgreSQL Database',
    category: 'Persistence',
    status: 'Connected',
    desc: 'Relational data store for controller registrations, build metadata, and audit events.',
  },
  {
    name: 'Redis Queue & Celery',
    category: 'Background Task Worker',
    status: 'Connected',
    desc: 'Distributed queue broker for asynchronous health and build polling.',
  },
  {
    name: 'Slack / Teams Webhooks',
    category: 'Notifications',
    status: 'Configurable',
    desc: 'Dispatch alerts for offline controllers or high failure thresholds.',
  },
];

export const IntegrationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Integrations</h1>
          <p className="text-xs text-slate-500 mt-1">
            Connected services, messaging channels, and monitoring providers
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((item) => (
          <div key={item.name} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Blocks className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {item.status}
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider block mt-1">
                {item.category}
              </span>
              <p className="text-xs text-slate-500 mt-2">{item.desc}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button className="text-xs text-indigo-600 font-semibold hover:underline">
                Configure →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
