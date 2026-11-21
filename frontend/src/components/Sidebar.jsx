import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ArrowUpRight,
  ClipboardList,
  FileCheck2,
  Trash2,
  FileSpreadsheet,
  History,
  Building2,
  X,
  ShieldCheck,
  UserCheck,
  Layers
} from 'lucide-react';
import { getCurrentUser } from '../api';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const user = getCurrentUser() || { name: 'User', role: 'store', dept: 'Stores & Purchase' };

  const navItems = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'store', 'approver', 'dept'],
    },
    {
      to: '/items',
      label: 'Store Items',
      icon: Package,
      roles: ['admin', 'store', 'approver', 'dept'],
    },
    {
      to: '/issue-stock',
      label: 'Issue Stock',
      icon: ArrowUpRight,
      roles: ['admin', 'store'],
    },
    {
      to: '/indents',
      label: 'Indents (Requisitions)',
      icon: ClipboardList,
      roles: ['admin', 'store', 'approver', 'dept'],
    },
    {
      to: '/purchase-orders',
      label: 'Purchase Orders',
      icon: FileCheck2,
      roles: ['admin', 'store', 'approver'],
    },
    {
      to: '/write-offs',
      label: 'Write-offs',
      icon: Trash2,
      roles: ['admin', 'store', 'approver'],
    },
    {
      to: '/reports',
      label: 'Reports & Export',
      icon: FileSpreadsheet,
      roles: ['admin', 'store', 'approver', 'dept'],
    },
    {
      to: '/audit',
      label: 'Audit Trail',
      icon: History,
      roles: ['admin', 'approver'],
    },
  ];

  const visibleNav = navItems.filter((item) => item.roles.includes(user.role));

  const roleLabels = {
    admin: { label: 'System Admin', bg: 'bg-rose-500/10 text-rose-300 border-rose-500/20' },
    store: { label: 'Store Officer', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' },
    approver: { label: 'Director (S&P)', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/20' },
    dept: { label: 'Department Staff', bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20' },
  };

  const currentRole = roleLabels[user.role] || { label: user.role, bg: 'bg-slate-700 text-slate-300' };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-gbu-900 text-white flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-gbu-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md shadow-amber-900/40 text-slate-900 font-black text-lg">
              GBU
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight leading-none text-white">Stores & Purchase</h1>
              <p className="text-xs text-gbu-300 mt-1 font-medium">Gautam Buddha University</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-gbu-300 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current user badge */}
        <div className="px-4 py-3 mx-3 my-3 rounded-xl bg-gbu-950/60 border border-gbu-800">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate">
              <p className="text-xs text-gbu-300 font-medium truncate">{user.dept || 'Stores & Purchase'}</p>
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${currentRole.bg} shrink-0`}>
              {currentRole.label}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                      : 'text-gbu-100 hover:bg-gbu-800/70 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-4 border-t border-gbu-800/80 text-xs text-gbu-400 flex items-center justify-between">
          <span>Portal v2.6 • Production</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online
          </span>
        </div>
      </aside>
    </>
  );
}
