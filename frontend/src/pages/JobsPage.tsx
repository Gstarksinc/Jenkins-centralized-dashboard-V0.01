import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GitBranch, Play, Search, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { apiFetch } from '../api/client';
import { Job } from '../types';

export const JobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch Jobs
  const {
    data: jobs = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: () => apiFetch<Job[]>('/api/v1/jobs'),
    refetchInterval: 15000,
  });

  // 2. Trigger Build Mutation
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

  const filteredJobs = jobs.filter((j) =>
    j.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.server_name && j.server_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Jobs & Pipelines</h1>
          <p className="text-xs text-slate-500 mt-1">
            Aggregated job definitions and on-demand build triggers across registered controllers
          </p>
        </div>
        <div className="flex items-center space-x-2">
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

      {/* Filter Toolbar */}
      <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search jobs by name or controller..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {filteredJobs.length} of {jobs.length} jobs
        </span>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading CI/CD jobs...</div>
        ) : isError ? (
          <div className="p-8 text-center text-xs text-rose-600">
            Failed to load jobs: {(error as Error)?.message}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center">
            <GitBranch className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-600">No CI/CD jobs detected yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Ensure controllers are registered and sync has completed.
            </p>
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
