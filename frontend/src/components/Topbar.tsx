import React from 'react';
import { Search, Bell, Shield, User as UserIcon, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  collapsed: boolean;
  onRefresh?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ collapsed, onRefresh }) => {
  const { user, logout } = useAuth();

  return (
    <header
      className={`fixed top-0 right-0 z-20 h-16 bg-white border-b border-slate-200 transition-all duration-300 flex items-center justify-between px-6 ${
        collapsed ? 'left-18' : 'left-64'
      }`}
    >
      {/* Search Input */}
      <div className="flex items-center w-96 relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          placeholder="Search controllers, jobs, builds, nodes..."
          className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>

      {/* Action Controls & User Pill */}
      <div className="flex items-center space-x-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <div className="relative">
          <button
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="Active Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200" />

        {/* User profile and logout */}
        <div className="flex items-center space-x-3 pl-2">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-semibold text-xs">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.display_name || 'Administrator'}
              </span>
              <span className="text-[10px] text-slate-500 flex items-center">
                <Shield className="w-2.5 h-2.5 mr-0.5 text-indigo-600" />
                {user?.roles?.[0] || 'Platform Admin'}
              </span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
