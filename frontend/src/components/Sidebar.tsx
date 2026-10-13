import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Cpu,
  GitBranch,
  Users,
  ShieldCheck,
  Bell,
  BarChart3,
  ScrollText,
  Settings,
  Blocks,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { name: 'Overview', path: '/', icon: LayoutDashboard },
  { name: 'Jenkins Servers', path: '/servers', icon: Server },
  { name: 'Nodes & Resources', path: '/nodes', icon: Cpu },
  { name: 'Jobs & Builds', path: '/jobs', icon: GitBranch },
  { name: 'Users & Teams', path: '/users', icon: Users },
  { name: 'Roles & Permissions', path: '/roles', icon: ShieldCheck },
  { name: 'Alerts & Notifications', path: '/alerts', icon: Bell },
  { name: 'Analytics & Reports', path: '/analytics', icon: BarChart3 },
  { name: 'Audit Logs', path: '/audit', icon: ScrollText },
  { name: 'System Settings', path: '/settings', icon: Settings },
  { name: 'Integrations', path: '/integrations', icon: Blocks },
];

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 border-r border-slate-800 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-indigo-500/20">
              JC
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-white tracking-tight">
                Jenkins Control Center
              </span>
              <span className="text-[10px] text-indigo-400 font-medium">Enterprise Orchestrator</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
            JC
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 text-xs font-medium rounded-lg transition-colors group ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${collapsed ? 'mx-auto' : 'mr-3'}`} />
              {!collapsed && <span>{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800 flex items-center justify-between">
        {!collapsed && (
          <span className="text-xs text-slate-500 pl-2">v1.0.0-rc</span>
        )}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
