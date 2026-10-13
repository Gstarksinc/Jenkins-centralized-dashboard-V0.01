import React from 'react';
import { ServerStatus, BuildStatus } from '../types';

interface StatusBadgeProps {
  status: ServerStatus | BuildStatus | string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'ONLINE':
      case 'SUCCESS':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'OFFLINE':
      case 'FAILURE':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'DEGRADED':
      case 'UNSTABLE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RUNNING':
        return 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
      case 'QUEUED':
      case 'UNVERIFIED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'AUTH_FAILED':
      case 'PERMISSION_DENIED':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'DISABLED':
      case 'ABORTED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getBadgeStyle()}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-75" />
      {status}
    </span>
  );
};
