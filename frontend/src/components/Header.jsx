import React from 'react';
import { Menu, LogOut, Shield, User, Building } from 'lucide-react';
import { getCurrentUser, logout } from '../api';

export default function Header({ setMobileOpen, title, subtitle }) {
  const user = getCurrentUser() || { name: 'User', role: 'store', dept: 'Stores & Purchase' };

  const roleNames = {
    admin: 'Administrator',
    store: 'Store Officer',
    approver: 'Director (S&P)',
    dept: 'Department User',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User Info Capsule */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="w-8 h-8 rounded-lg bg-gbu-900 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-none">
              {roleNames[user.role] || user.role} • {user.dept || 'Stores & Purchase'}
            </p>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={logout}
          title="Sign out of portal"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100/80 hover:text-rose-800 transition-colors shadow-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
