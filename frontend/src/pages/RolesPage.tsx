import React from 'react';
import { ShieldCheck } from 'lucide-react';

const roles = [
  {
    name: 'Platform Administrator',
    description: 'Full control over all dashboard users, controllers, RBAC permissions, and audit logs.',
    usersCount: 1,
    isSystem: true,
  },
  {
    name: 'Server Administrator',
    description: 'Administrative operational control over assigned Jenkins controllers.',
    usersCount: 2,
    isSystem: true,
  },
  {
    name: 'Developer',
    description: 'View permitted controllers, jobs, and trigger builds with authorization.',
    usersCount: 14,
    isSystem: true,
  },
  {
    name: 'Viewer',
    description: 'Read-only visibility into assigned controllers and builds without operational rights.',
    usersCount: 5,
    isSystem: true,
  },
];

export const RolesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Roles & Permissions</h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise RBAC hierarchy and fine-grained operational permission boundaries
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((r) => (
          <div key={r.name} className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">{r.name}</h3>
                </div>
                {r.isSystem && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase">
                    System
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">{r.description}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{r.usersCount} Assigned Users</span>
              <button className="text-indigo-600 font-semibold hover:underline">View Policy →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
