import React from 'react';

interface JenkinsStatusBallProps {
  status?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const JenkinsStatusBall: React.FC<JenkinsStatusBallProps> = ({
  status = 'UNKNOWN',
  size = 'md',
}) => {
  const norm = (status || '').toUpperCase();

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }[size];

  if (norm === 'SUCCESS') {
    return (
      <div className="relative flex items-center justify-center" title="Success">
        <span className={`${sizeClasses} rounded-full bg-blue-600 shadow-xs shadow-blue-500/50 inline-block`} />
      </div>
    );
  }

  if (norm === 'RUNNING' || norm === 'BUILDING') {
    return (
      <div className="relative flex items-center justify-center" title="Build in progress">
        <span className={`absolute ${sizeClasses} rounded-full bg-blue-400 animate-ping opacity-75`} />
        <span className={`${sizeClasses} rounded-full bg-blue-600 animate-pulse inline-block`} />
      </div>
    );
  }

  if (norm === 'FAILURE') {
    return (
      <div className="relative flex items-center justify-center" title="Failed">
        <span className={`${sizeClasses} rounded-full bg-rose-600 shadow-xs shadow-rose-500/50 inline-block`} />
      </div>
    );
  }

  if (norm === 'UNSTABLE') {
    return (
      <div className="relative flex items-center justify-center" title="Unstable">
        <span className={`${sizeClasses} rounded-full bg-amber-500 shadow-xs shadow-amber-500/50 inline-block`} />
      </div>
    );
  }

  // Aborted, Disabled, Not Built, or Unknown
  return (
    <div className="relative flex items-center justify-center" title={status || 'Not built'}>
      <span className={`${sizeClasses} rounded-full bg-slate-400 inline-block`} />
    </div>
  );
};
