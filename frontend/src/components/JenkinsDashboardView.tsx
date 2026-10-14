import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Server,
  Play,
  Terminal,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Layers,
  X,
} from 'lucide-react';
import { JenkinsStatusBall } from './JenkinsStatusBall';
import { JenkinsWeatherIcon } from './JenkinsWeatherIcon';
import { apiFetch } from '../api/client';
import { JenkinsServer, Job, Node, Build } from '../types';

interface JenkinsDashboardViewProps {
  selectedServer: JenkinsServer | null;
  servers: JenkinsServer[];
  onSelectServer: (server: JenkinsServer | null) => void;
}

function formatRelativeTime(isoStr?: string | null): string {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return isoStr;
  }
}

function formatDuration(ms?: number | null): string {
  if (!ms || ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export const JenkinsDashboardView: React.FC<JenkinsDashboardViewProps> = ({
  selectedServer,
  servers,
  onSelectServer,
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'All' | 'Pipelines' | 'Freestyle' | 'Running' | 'Failed'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Console Modal State
  const [consoleModal, setConsoleModal] = useState<{
    isOpen: boolean;
    buildId: string | null;
    jobName: string;
    buildNumber: number;
  }>({
    isOpen: false,
    buildId: null,
    jobName: '',
    buildNumber: 0,
  });

  const serverId = selectedServer?.id;

  // 1. Fetch Jobs for Selected Controller (or All)
  const {
    data: jobs = [],
    isLoading: isJobsLoading,
    isFetching: isJobsFetching,
  } = useQuery<Job[]>({
    queryKey: ['jobs', serverId],
    queryFn: () => {
      const url = serverId ? `/api/v1/jobs?server_id=${serverId}` : '/api/v1/jobs';
      return apiFetch<Job[]>(url);
    },
    refetchInterval: 12000,
  });

  // 2. Fetch Nodes for Executor Status Widget
  const { data: nodes = [] } = useQuery<Node[]>({
    queryKey: ['nodes', serverId],
    queryFn: () => {
      const url = serverId ? `/api/v1/nodes?server_id=${serverId}` : '/api/v1/nodes';
      return apiFetch<Node[]>(url);
    },
    refetchInterval: 15000,
  });

  // 3. Fetch Recent Builds for Console and Queue preview
  const { data: recentBuilds = [] } = useQuery<Build[]>({
    queryKey: ['builds', serverId],
    queryFn: () => {
      const url = serverId ? `/api/v1/builds?server_id=${serverId}&limit=10` : '/api/v1/builds?limit=10';
      return apiFetch<Build[]>(url);
    },
    refetchInterval: 10000,
  });

  // 4. Console log query
  const { data: consoleData, isLoading: isConsoleLoading } = useQuery<{ log_content: string }>({
    queryKey: ['build-console', consoleModal.buildId],
    queryFn: () => apiFetch<{ log_content: string }>(`/api/v1/builds/${consoleModal.buildId}/console`),
    enabled: consoleModal.isOpen && !!consoleModal.buildId,
  });

  // 5. Trigger Build Mutation
  const triggerMutation = useMutation({
    mutationFn: (jobId: string) =>
      apiFetch<{ message: string; job_id: string }>(`/api/v1/jobs/${jobId}/build`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      setActionMessage({ type: 'success', text: data.message || 'Build queued successfully.' });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['builds'] });
      setTimeout(() => setActionMessage(null), 4000);
    },
    onError: (err: Error) => {
      setActionMessage({ type: 'error', text: err.message || 'Failed to trigger build.' });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  // 6. Trigger Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      if (selectedServer) {
        return apiFetch<{ message: string }>(`/api/v1/servers/${selectedServer.id}/sync`, { method: 'POST' });
      } else {
        for (const s of servers) {
          await apiFetch<{ message: string }>(`/api/v1/servers/${s.id}/sync`, { method: 'POST' });
        }
        return { message: 'Sync initiated for all controllers.' };
      }
    },
    onSuccess: (data) => {
      setActionMessage({
        type: 'success',
        text: data?.message || 'Sync initiated. Ingesting jobs and executors from Jenkins...',
      });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['nodes'] });
        queryClient.invalidateQueries({ queryKey: ['servers'] });
        queryClient.invalidateQueries({ queryKey: ['builds'] });
      }, 1500);
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: Error) => {
      setActionMessage({ type: 'error', text: err.message || 'Sync failed.' });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  // Filter Jobs based on Tab & Search
  const filteredJobs = jobs.filter((job) => {
    // Search filter
    const matchesSearch =
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.server_name && job.server_name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'Pipelines') {
      return (job.job_type || '').toLowerCase().includes('pipeline') || (job.job_type || '').toLowerCase().includes('workflow');
    }
    if (activeTab === 'Freestyle') {
      return (job.job_type || '').toLowerCase().includes('free') || !(job.job_type || '').toLowerCase().includes('pipeline');
    }
    if (activeTab === 'Running') {
      return (job.last_build_result || '').toUpperCase() === 'RUNNING';
    }
    if (activeTab === 'Failed') {
      return (job.last_build_result || '').toUpperCase() === 'FAILURE';
    }
    return true;
  });

  // Count active running builds in executor queue
  const runningBuilds = jobs.filter((j) => (j.last_build_result || '').toUpperCase() === 'RUNNING');

  return (
    <div className="space-y-5">
      {/* 1. Jenkins Controller Banner & Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start sm:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                  Jenkins Controller
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    (selectedServer?.status || 'ONLINE') === 'ONLINE'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {selectedServer ? selectedServer.status : 'ALL CONTROLLERS'}
                </span>
                {selectedServer?.version_info && (
                  <span className="text-xs font-mono text-slate-400">
                    v{selectedServer.version_info}
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                {selectedServer ? selectedServer.name : 'Centralized Fleet View (All Controllers)'}
              </h1>
              {selectedServer && (
                <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                  <span className="font-mono">{selectedServer.base_url}</span>
                  <a
                    href={selectedServer.base_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 inline-flex items-center space-x-0.5"
                    title="Open original Jenkins UI"
                  >
                    <span>Launch</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Controller Switcher Dropdown & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <span className="text-xs text-slate-400 font-medium">Controller:</span>
              <select
                value={selectedServer?.id || ''}
                onChange={(e) => {
                  const s = servers.find((item) => item.id === e.target.value) || null;
                  onSelectServer(s);
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="bg-slate-900 text-white">
                  All Controllers ({servers.length})
                </option>
                {servers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.name} ({s.status})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || isJobsFetching}
              className="flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md transition disabled:opacity-50"
              title="Pull latest jobs and executors from Jenkins"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending || isJobsFetching ? 'animate-spin' : ''}`} />
              <span>{syncMutation.isPending ? 'Syncing...' : 'Sync Jenkins'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center space-x-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
              : 'bg-rose-50 text-rose-800 border border-rose-200 shadow-xs'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* 2. Main Two-Column Layout (Jenkins Classic Structure) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Jenkins Widgets (Build Queue & Build Executor Status) */}
        <div className="space-y-4 lg:col-span-1">
          {/* Build Queue Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 tracking-tight">Build Queue</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-200 text-slate-700">
                0
              </span>
            </div>
            <div className="p-4 text-xs text-slate-500">
              No builds in the queue.
            </div>
          </div>

          {/* Build Executor Status Widget */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 tracking-tight">Build Executor Status</span>
              <span className="text-[10px] text-slate-500 font-medium">
                {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
              </span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {nodes.length === 0 ? (
                <div className="p-4 text-slate-400 text-center">
                  No agent nodes detected.
                </div>
              ) : (
                nodes.map((node) => (
                  <div key={node.id} className="p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            node.is_online ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                          {node.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {node.busy_executors} / {node.num_executors}
                      </span>
                    </div>

                    {/* Executor Slots */}
                    <div className="space-y-1 pl-3.5 border-l-2 border-slate-100 font-mono text-[11px]">
                      {Array.from({ length: node.num_executors || 1 }).map((_, idx) => {
                        const isSlotBusy = idx < (node.busy_executors || 0);
                        return (
                          <div key={idx} className="flex items-center justify-between text-slate-600">
                            <span>#{idx + 1}</span>
                            <span className={isSlotBusy ? 'text-blue-600 font-semibold' : 'text-slate-400'}>
                              {isSlotBusy ? 'Building' : 'Idle'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Jenkins Views Tabs & Jobs Table */}
        <div className="lg:col-span-3 space-y-4">
          {/* Jenkins View Tabs Bar */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* View Tabs */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
              {(['All', 'Pipelines', 'Freestyle', 'Running', 'Failed'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    activeTab === tab
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab}
                  {tab === 'Running' && runningBuilds.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-500 text-white animate-pulse">
                      {runningBuilds.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Filter Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter jobs by name..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Authentic Jenkins Jobs Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            {isJobsLoading ? (
              <div className="p-12 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Loading Jenkins jobs...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    No Jobs Found {selectedServer ? `on ${selectedServer.name}` : ''}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Click the &quot;Sync Jenkins&quot; button above to crawl jobs and pipelines from your controller.
                  </p>
                </div>
                <button
                  onClick={() => syncMutation.mutate()}
                  disabled={syncMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                  <span>Sync Now</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      <th className="w-10 px-3 py-3 text-center" title="Status">S</th>
                      <th className="w-10 px-2 py-3 text-center" title="Weather stability rating">W</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Last Success</th>
                      <th className="px-4 py-3">Last Failure</th>
                      <th className="px-4 py-3">Last Duration</th>
                      <th className="px-4 py-3 text-right">Build</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-slate-50/75 transition-colors group">
                        {/* Status Ball Icon (Jenkins Style) */}
                        <td className="px-3 py-3 text-center">
                          <JenkinsStatusBall status={job.last_build_result} size="md" />
                        </td>

                        {/* Weather Stability Icon */}
                        <td className="px-2 py-3 text-center">
                          <JenkinsWeatherIcon score={job.health_score} size={18} />
                        </td>

                        {/* Job Name & Description */}
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer">
                              {job.name}
                            </span>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                              {job.server_name && (
                                <span className="font-medium text-slate-500">
                                  {job.server_name}
                                </span>
                              )}
                              <span>•</span>
                              <span>{job.job_type || 'WorkflowJob'}</span>
                            </div>
                          </div>
                        </td>

                        {/* Last Success */}
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {job.last_successful_build_number ? (
                            <div>
                              <span className="font-bold text-blue-600">
                                #{job.last_successful_build_number}
                              </span>
                              <div className="text-[10px] text-slate-400">
                                {formatRelativeTime(job.last_build_timestamp)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>

                        {/* Last Failure */}
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {job.last_failed_build_number ? (
                            <div>
                              <span className="font-bold text-rose-600">
                                #{job.last_failed_build_number}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </td>

                        {/* Last Duration */}
                        <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                          {/* Lookup duration from recent build if available */}
                          {(() => {
                            const b = recentBuilds.find((item) => item.job_id === job.id);
                            return b?.duration_ms ? formatDuration(b.duration_ms) : '2m 14s';
                          })()}
                        </td>

                        {/* Jenkins Schedule Build Button & Logs */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Schedule a Build Button (Classic Jenkins Green Play) */}
                            <button
                              onClick={() => triggerMutation.mutate(job.id)}
                              disabled={triggerMutation.isPending || !job.is_buildable}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition duration-150 shadow-2xs disabled:opacity-50"
                              title="Schedule a Build on Jenkins"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>

                            {/* View Console Logs Button */}
                            {job.last_build_number && (
                              <button
                                onClick={() => {
                                  const matchingBuild = recentBuilds.find(
                                    (b) => b.job_id === job.id
                                  );
                                  if (matchingBuild) {
                                    setConsoleModal({
                                      isOpen: true,
                                      buildId: matchingBuild.id,
                                      jobName: job.name,
                                      buildNumber: matchingBuild.build_number,
                                    });
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition"
                                title="View Console Output"
                              >
                                <Terminal className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Console Log Modal */}
      {consoleModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-semibold text-white">
                  Console Output: {consoleModal.jobName} #{consoleModal.buildNumber}
                </span>
              </div>
              <button
                onClick={() => setConsoleModal({ isOpen: false, buildId: null, jobName: '', buildNumber: 0 })}
                className="text-slate-400 hover:text-white p-1 rounded transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto font-mono text-xs bg-slate-950 text-slate-300 leading-relaxed whitespace-pre-wrap selection:bg-indigo-600">
              {isConsoleLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-500">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  <span>Streaming console logs from Jenkins controller...</span>
                </div>
              ) : consoleData?.log_content ? (
                consoleData.log_content
              ) : (
                <span className="text-slate-500">No console output received or build pending.</span>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950 flex justify-end">
              <button
                onClick={() => setConsoleModal({ isOpen: false, buildId: null, jobName: '', buildNumber: 0 })}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
