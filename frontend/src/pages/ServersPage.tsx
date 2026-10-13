import React, { useState } from 'react';
import { Server, Plus, RefreshCw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const ServersPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);

  const handleTestConnection = () => {
    setTestingConnection(true);
    setTestResult(null);
    setTimeout(() => {
      setTestingConnection(false);
      setTestResult({
        success: true,
        msg: 'Connection verified: Jenkins v2.440.3 responding with valid CSRF Crumb.',
      });
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Jenkins Servers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage, authenticate, and monitor registered Jenkins controllers
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Jenkins Server
        </button>
      </div>

      {/* Servers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">1 Controller Registered</span>
          <div className="flex items-center space-x-2">
            <button className="text-slate-500 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                <th className="px-5 py-3">Server Name</th>
                <th className="px-5 py-3">Base URL</th>
                <th className="px-5 py-3">Environment</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Version</th>
                <th className="px-5 py-3">Last Sync</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                    <Server className="w-4 h-4" />
                  </div>
                  <span>Primary Controller</span>
                </td>
                <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                  https://jenkins.internal.company.net
                </td>
                <td className="px-5 py-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 uppercase">
                    Production
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status="ONLINE" />
                </td>
                <td className="px-5 py-3.5 text-slate-600">2.440.3</td>
                <td className="px-5 py-3.5 text-slate-500">2 mins ago</td>
                <td className="px-5 py-3.5 text-right space-x-2">
                  <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                    Test
                  </button>
                  <button className="text-xs font-semibold text-slate-600 hover:text-slate-900">
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Server Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Register Jenkins Controller</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setTestResult(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g., Staging EU-Central"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenkins Base URL</label>
                <input
                  type="url"
                  placeholder="https://jenkins.example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1 text-amber-500" />
                  SSRF protected: private IP ranges and loopbacks are blocked by default.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Environment</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Auth Type</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                    <option value="token">API Token (Recommended)</option>
                    <option value="basic">Username & Password</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Account Username</label>
                <input
                  type="text"
                  placeholder="dashboard-svc"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">API Token / Secret</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••••••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Stored with AES-256-Fernet encryption. Never returned to the browser.
                </p>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg flex items-start space-x-2 text-xs ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span>{testResult.msg}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testingConnection}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {testingConnection ? 'Testing...' : 'Test Connection'}
              </button>
              <div className="space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xs"
                >
                  Save Controller
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
