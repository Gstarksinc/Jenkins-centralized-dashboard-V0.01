import React from 'react';
import { UserPlus, Shield } from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const UsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Users & Teams</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage dashboard user accounts, group memberships, and controller assignments
          </p>
        </div>
        <button className="inline-flex items-center px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs">
          <UserPlus className="w-4 h-4 mr-1.5" /> Invite User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Teams</th>
              <th className="px-5 py-3">Last Login</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr className="hover:bg-slate-50/50">
              <td className="px-5 py-3.5">
                <div className="font-semibold text-slate-900">Admin User</div>
                <div className="text-[11px] text-slate-500">admin@company.com</div>
              </td>
              <td className="px-5 py-3.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Shield className="w-3 h-3 mr-1" /> Platform Admin
                </span>
              </td>
              <td className="px-5 py-3.5"><StatusBadge status="ACTIVE" /></td>
              <td className="px-5 py-3.5 text-slate-600">DevOps Core</td>
              <td className="px-5 py-3.5 text-slate-500">Just now</td>
              <td className="px-5 py-3.5 text-right space-x-2">
                <button className="text-indigo-600 hover:text-indigo-800 font-semibold">Edit</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
