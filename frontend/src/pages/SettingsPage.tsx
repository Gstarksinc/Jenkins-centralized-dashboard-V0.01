import React from 'react';
import { Shield, Clock } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Global dashboard configuration, session policies, data retention, and security controls
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-6 max-w-3xl">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Security & Session Policy</span>
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Session Inactivity Timeout</label>
              <input
                type="text"
                defaultValue="12 Hours"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Max Failed Login Attempts</label>
              <input
                type="text"
                defaultValue="5 attempts (15 min lockout)"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                readOnly
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Background Polling Defaults</span>
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Controller Health Poll Interval</label>
              <input
                type="text"
                defaultValue="60 Seconds"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                readOnly
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium mb-1">Stale Data Threshold</label>
              <input
                type="text"
                defaultValue="300 Seconds (5 min)"
                className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-slate-800 bg-slate-50"
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
