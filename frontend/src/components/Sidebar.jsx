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
  X
} from 'lucide-react';
import { getCurrentUser } from '../api';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const user = getCurrentUser() || { name: 'User', role: 'store' };

  const navSections = [
    {
      title: 'Overview',
      items: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'store', 'approver', 'dept'] },
      ],
    },
    {
      title: 'Stores',
      items: [
        { to: '/items', label: 'Items', icon: Package, roles: ['admin', 'store', 'approver', 'dept'] },
        { to: '/issue-stock', label: 'Issue stock', icon: ArrowUpRight, roles: ['admin', 'store'] },
      ],
    },
    {
      title: 'Procurement',
      items: [
        { to: '/indents', label: 'Indents', icon: ClipboardList, roles: ['admin', 'store', 'approver', 'dept'] },
        { to: '/purchase-orders', label: 'Purchase orders', icon: FileCheck2, roles: ['admin', 'store', 'approver'] },
      ],
    },
    {
      title: 'Control',
      items: [
        { to: '/write-offs', label: 'Write-offs', icon: Trash2, roles: ['admin', 'store', 'approver'] },
        { to: '/reports', label: 'Reports', icon: FileSpreadsheet, roles: ['admin', 'store', 'approver', 'dept'] },
        { to: '/audit', label: 'Audit log', icon: History, roles: ['admin', 'approver'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-40 lg:hidden backdrop-blur-[1px]"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[232px] bg-surface border-r border-line flex flex-col transition-transform duration-150 ease-in-out lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-lg' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-14 px-4 border-b border-line flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-primary text-white flex items-center justify-center font-bold text-[13px] tracking-tight shrink-0">
              GBU
            </div>
            <div className="leading-tight">
              <span className="font-semibold text-[13px] text-ink block">Stores & Purchase</span>
              <span className="text-[11px] text-ink-subtle block">Gautam Buddha University</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden text-ink-muted hover:text-ink p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 py-3 overflow-y-auto space-y-4">
          {navSections.map((section) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(user.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={section.title} className="px-2">
                <span className="px-2.5 text-[11px] font-semibold text-ink-subtle uppercase tracking-wider block mb-1">
                  {section.title}
                </span>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-2.5 h-8 rounded text-[13px] font-medium transition-colors ${
                            isActive
                              ? 'bg-primary-light text-primary font-semibold border-l-[3px] border-primary rounded-l-none pl-[7px]'
                              : 'text-ink hover:bg-paper hover:text-ink'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0 text-ink-muted" />
                        <span className="whitespace-nowrap">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Minimal Footer */}
        <div className="p-3 border-t border-line text-[11px] text-ink-subtle">
          Central Stores Portal
        </div>
      </aside>
    </>
  );
}
