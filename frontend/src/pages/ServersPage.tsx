import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Server,
  Plus,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  AlertCircle,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../api/client';
import { JenkinsServer } from '../types';

interface TestResult {
  online: boolean;
  status: string;
  version?: string;
  message: string;
}

export const ServersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [description, setDescription] = useState('');
  const [authType, setAuthType] = useState('TOKEN');
  const [username, setUsername] = useState('');
  const [secretToken, setSecretToken] = useState('');
  const [timeoutSeconds, setTimeoutSeconds] = useState(15);
  const [formError, setFormError] = useState<string | null>(null);

  // Test connection state
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // 1. Fetch Registered Servers
  const {
    data: servers = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<JenkinsServer[]>({
    queryKey: ['servers'],
    queryFn: () => apiFetch<JenkinsServer[]>('/api/v1/servers'),
  });

  // 2. Add Server Mutation
  const addServerMutation = useMutation({
    mutationFn: (newServer: {
      name: string;
      base_url: string;
      environment: string;
      description?: string;
      auth_type: string;
      username: string;
      secret_token: string;
      connection_timeout_seconds: number;
    }) =>
      apiFetch<JenkinsServer>('/api/v1/servers', {
        method: 'POST',
        body: JSON.stringify(newServer),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      setShowModal(false);
      resetForm();
    },
    onError: (err: Error) => {
      setFormError(err.message || 'Failed to save Jenkins server');
    },
  });

  // 3. Delete Server Mutation
  const deleteServerMutation = useMutation({
    mutationFn: (serverId: string) =>
      apiFetch<void>(`/api/v1/servers/${serverId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: (err: Error) => {
      alert(`Delete failed: ${err.message}`);
    },
  });

  // 4. Re-test Existing Server Mutation
  const retestMutation = useMutation({
    mutationFn: (serverId: string) =>
      apiFetch<TestResult>(`/api/v1/servers/${serverId}/test-connection`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
    onError: (err: Error) => {
      alert(`Connection test failed: ${err.message}`);
    },
  });

  // 5. Trigger Sync Mutation
  const syncMutation = useMutation({
    mutationFn: (serverId: string) =>
      apiFetch<{ message: string }>(`/api/v1/servers/${serverId}/sync`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['nodes'] });
    },
    onError: (err: Error) => {
      alert(`Sync failed: ${err.message}`);
    },
  });

  const resetForm = () => {
    setName('');
    setBaseUrl('');
    setEnvironment('production');
    setDescription('');
    setAuthType('TOKEN');
    setUsername('');
    setSecretToken('');
    setTimeoutSeconds(15);
    setTestResult(null);
    setFormError(null);
  };

  const handleTestConnection = async () => {
    if (!baseUrl || !username || !secretToken) {
      setFormError('Please enter URL, username, and token before testing.');
      return;
    }
    setFormError(null);
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await apiFetch<TestResult>('/api/v1/servers/test-connection', {
        method: 'POST',
        body: JSON.stringify({
          base_url: baseUrl,
          username,
          secret_token: secretToken,
          auth_type: authType,
          connection_timeout_seconds: timeoutSeconds,
        }),
      });
      setTestResult(res);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      setTestResult({
        online: false,
        status: 'OFFLINE',
        message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !baseUrl || !username || !secretToken) {
      setFormError('Please complete all required fields.');
      return;
    }

    addServerMutation.mutate({
      name,
      base_url: baseUrl,
      environment,
      description,
      auth_type: authType,
      username,
      secret_token: secretToken,
      connection_timeout_seconds: timeoutSeconds,
    });
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
        <div className="flex items-center space-x-2">
          <button
            onClick={() => refetch()}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Refresh controllers"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" /> Add Jenkins Server
          </button>
        </div>
      </div>

      {/* Servers Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200/80 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-700">
            {servers.length} {servers.length === 1 ? 'Controller' : 'Controllers'} Registered
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading controllers...</span>
          </div>
        ) : isError ? (
          <div className="p-6 text-center text-xs text-rose-600 flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4" />
            <span>Failed to load controllers: {(error as Error)?.message}</span>
          </div>
        ) : servers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No Jenkins controllers registered yet. Click &quot;Add Jenkins Server&quot; to connect your first controller.
          </div>
        ) : (
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
                {servers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center space-x-2.5">
                      <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                        <Server className="w-4 h-4" />
                      </div>
                      <div>
                        <div>{s.name}</div>
                        {s.last_error_message && (
                          <div className="text-[10px] text-rose-600 max-w-xs truncate" title={s.last_error_message}>
                            {s.last_error_message}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                      <a
                        href={s.base_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center space-x-1"
                      >
                        <span>{s.base_url}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 uppercase">
                        {s.environment}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {s.version_info || 'Unknown'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {s.last_successful_sync
                        ? new Date(s.last_successful_sync).toLocaleTimeString()
                        : 'Never'}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => syncMutation.mutate(s.id)}
                        disabled={syncMutation.isPending}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50"
                        title="Trigger Data Collection Sync"
                      >
                        {syncMutation.isPending ? 'Syncing...' : 'Sync'}
                      </button>
                      <button
                        onClick={() => retestMutation.mutate(s.id)}
                        disabled={retestMutation.isPending}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      >
                        {retestMutation.isPending ? 'Testing...' : 'Test'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remove Jenkins controller '${s.name}'?`)) {
                            deleteServerMutation.mutate(s.id);
                          }
                        }}
                        disabled={deleteServerMutation.isPending}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 disabled:opacity-50 inline-flex items-center"
                        title="Delete Controller"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Server Dialog Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Register Jenkins Controller</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Staging EU-Central"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenkins Base URL *</label>
                <input
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://jenkins.company.net"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1 flex items-center">
                  <ShieldAlert className="w-3 h-3 mr-1 text-amber-500" />
                  SSRF Protected: Requests to internal metadata &amp; loopbacks are rejected.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Environment</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Auth Type</label>
                  <select
                    value={authType}
                    onChange={(e) => setAuthType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="TOKEN">API Token (Recommended)</option>
                    <option value="BASIC">Username &amp; Password</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Service Account Username *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="dashboard-svc"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">API Token / Secret *</label>
                <input
                  type="password"
                  required
                  value={secretToken}
                  onChange={(e) => setSecretToken(e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Stored with authenticated Fernet encryption. Never exposed back to the browser.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Main European CI runner cluster"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg flex items-start space-x-2 text-xs ${
                    testResult.online
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.online ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div>
                    <div className="font-semibold">{testResult.status}</div>
                    <div>{testResult.message}</div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center space-x-1"
                >
                  {isTesting && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />}
                  <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
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
                    type="submit"
                    disabled={addServerMutation.isPending}
                    className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 shadow-xs flex items-center space-x-1"
                  >
                    {addServerMutation.isPending && (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />
                    )}
                    <span>Save Controller</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
