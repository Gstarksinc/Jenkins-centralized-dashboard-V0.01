import React from 'react';

const mockLogs = [
  {
    id: 1,
    action: 'SERVER_TEST_CONNECTION',
    actor: 'admin@company.com',
    target: 'Primary Controller',
    status: 'SUCCESS',
    ip: '10.0.4.12',
    time: '4 mins ago',
  },
  {
    id: 2,
    action: 'AUTH_LOGIN_SUCCESS',
    actor: 'admin@company.com',
    target: 'Session / Dashboard',
    status: 'SUCCESS',
    ip: '10.0.4.12',
    time: '18 mins ago',
  },
  {
    id: 3,
    action: 'USER_ROLE_ASSIGN',
    actor: 'admin@company.com',
    target: 'Developer Role',
    status: 'SUCCESS',
    ip: '10.0.4.12',
    time: '1 hour ago',
  },
];

export const AuditPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident append-only record of security events, administrative actions, and build triggers
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Action</th>
              <th className="px-5 py-3">Actor</th>
              <th className="px-5 py-3">Target Resource</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Source IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50/50">
                <td className="px-5 py-3.5 text-slate-500">{log.time}</td>
                <td className="px-5 py-3.5 font-mono font-semibold text-slate-900">{log.action}</td>
                <td className="px-5 py-3.5 text-slate-700">{log.actor}</td>
                <td className="px-5 py-3.5 text-slate-600">{log.target}</td>
                <td className="px-5 py-3.5">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {log.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
