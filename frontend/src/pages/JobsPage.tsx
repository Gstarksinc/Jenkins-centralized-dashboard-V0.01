import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GitBranch,
  Play,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Server,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../api/client';
import { Job, JenkinsServer } from '../types';

export const JobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch Registered Servers for Dropdown
  const { data: servers = [] } = useQuery<JenkinsServer[]>({
    queryKey: ['servers'],
    queryFn: () => apiFetch<JenkinsServer[]>('/api/v1/servers'),
  });

  // 2. Fetch Jobs (Filtered by Server if selected)
  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<Job[]>({
    queryKey: ['jobs', selectedServerId],
    queryFn: () => {
      const url = selectedServerId
        ? `/api/v1/jobs?server_id=${selectedServerId}`
        : '/api/v1/jobs';
      return apiFetch<Job[]>(url);
    },
    refetchInterval: 15000,
  });

  // 3. Trigger Build Mutation
  const triggerMutation = useMutation({
    mutationFn: (jobId: string) =>
      apiFetch<{ message: string; job_id: string }>(`/api/v1/jobs/${jobId}/build`, {
        method: 'POST',
      }),
    onSuccess: (data) => {
      setActionMessage({ type: 'success', text: data.message || 'Build queued successfully.' });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setTimeout(() => setActionMessage(null), 4000);
    },
    onError: (err: Error) => {
      setActionMessage({ type: 'error', text: err.message || 'Failed to trigger build.' });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  // 4. Trigger Ingestion Sync Mutation
  const syncMutation = useMutation({
    mutationFn: async (serverId: string) => {
      if (serverId) {
        return apiFetch<{ message: string }>(`/api/v1/servers/${serverId}/sync`, { method: 'POST' });
      } else {
        // Trigger sync across all servers
        for (const s of servers) {
          await apiFetch<{ message: string }>(`/api/v1/servers/${s.id}/sync`, { method: 'POST' });
        }
        return { message: 'Sync initiated for all controllers.' };
      }
    },
    onSuccess: (data) => {
      setActionMessage({
        type: 'success',
        text: data?.message || 'Sync initiated. Ingesting jobs from Jenkins...',
      });
      // Invalidate queries so fresh jobs load
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['servers'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      }, 1500);
      setTimeout(() => setActionMessage(null), 5000);
    },
    onError: (err: Error) => {
      setActionMessage({ type: 'error', text: err.message || 'Failed to initiate sync.' });
      setTimeout(() => setActionMessage(null), 5000);
    },
  });

  const filteredJobs = jobs.filter((j) =>
    j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.server_name && j.server_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedServer = servers.find((s) => s.id === selectedServerId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Jobs & Pipelines</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse and trigger CI/CD jobs across registered controllers
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => syncMutation.mutate(selectedServerId)}
            disabled={syncMutation.isPending || servers.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition disabled:opacity-50"
            title="Fetch latest jobs from Jenkins controller"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{syncMutation.isPending ? 'Syncing...' : 'Sync Jobs Now'}</span>
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center space-x-2 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
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

      {/* Filter Toolbar with Server Selector Dropdown */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Server Dropdown Selector */}
        <div className="flex items-center space-x-2 min-w-[260px]">
          <Server className="w-4 h-4 text-slate-400 shrink-0" />
          <div className="flex-1">
            <select
              value={selectedServerId}
              onChange={(e) => setSelectedServerId(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Jenkins Controllers ({servers.length})</option>
              {servers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search jobs by name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <span className="text-xs text-slate-500 font-medium whitespace-nowrap self-center">
          {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
        </span>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading CI/CD jobs...</span>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-rose-600">
            Failed to load jobs: {(error as Error)?.message}
          </div>
        ) : servers.length === 0 ? (
          <div className="p-12 text-center">
            <Server className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Jenkins Controllers Registered</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You must register at least one Jenkins server before jobs can be displayed and triggered.
            </p>
            <a
              href="/servers"
              className="inline-flex items-center space-x-1.5 mt-4 px-3.5 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition"
            >
              <span>Go to Jenkins Servers</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <FolderGit2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">
              No Jobs Found {selectedServer ? `on '${selectedServer.name}'` : ''}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              If you just added this Jenkins controller or created new pipelines, click below to immediately pull the latest jobs from Jenkins.
            </p>
            <button
              onClick={() => syncMutation.mutate(selectedServerId)}
              disabled={syncMutation.isPending}
              className="inline-flex items-center space-x-1.5 mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              <span>{syncMutation.isPending ? 'Syncing with Jenkins...' : 'Sync Now to Fetch Jobs'}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <th className="px-5 py-3">Job Name</th>
                  <th className="px-5 py-3">Controller</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Last Build</th>
                  <th className="px-5 py-3">Result</th>
                  <th className="px-5 py-3">Health</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center space-x-2">
                      <GitBranch className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate max-w-xs">{job.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {job.server_name || 'Controller'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {job.job_type || 'Job'}
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-mono">
                      {job.last_build_number ? `#${job.last_build_number}` : 'None'}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={job.last_build_result || 'UNKNOWN'} />
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`font-semibold ${
                          (job.health_score ?? 100) >= 80
                            ? 'text-emerald-600'
                            : (job.health_score ?? 100) >= 50
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {job.health_score !== null && job.health_score !== undefined
                          ? `${job.health_score}%`
                          : '100%'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => triggerMutation.mutate(job.id)}
                        disabled={triggerMutation.isPending || !job.is_buildable}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-semibold text-xs transition disabled:opacity-50"
                        title={job.is_buildable ? 'Trigger build on Jenkins' : 'Job is disabled in Jenkins'}
                      >
                        <Play className="w-3 h-3" />
                        <span>Build</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
