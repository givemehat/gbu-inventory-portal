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
  X,
  Building2,
  FileText,
  HelpCircle,
  ChevronRight,
  MapPin,
  Sparkles
} from 'lucide-react';
import { getCurrentUser } from '../api';
import { assetUrl } from '../lib/utils';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const user = getCurrentUser() || { name: 'User', role: 'store' };

  const navSections = [
    {
      title: null, // Top primary links (MIT style)
      items: [
        { to: '/dashboard', label: 'Message & Overview', icon: LayoutDashboard, roles: ['admin', 'store', 'approver', 'dept'] },
        { to: '/items', label: 'Stock Register (Catalog)', icon: Package, roles: ['admin', 'store', 'approver', 'dept'] },
        { to: '/issue-stock', label: 'Issue Stock to Schools', icon: ArrowUpRight, roles: ['admin', 'store'] },
        { to: '/indents', label: 'Departmental Indents', icon: ClipboardList, roles: ['admin', 'store', 'approver', 'dept'] },
        { to: '/purchase-orders', label: 'Purchase Orders & GRN', icon: FileCheck2, roles: ['admin', 'store', 'approver'] },
      ],
    },
    {
      title: 'Technology Roadmaps',
      items: [
        { to: '/reports', label: 'School Consumption & Plots', icon: ChevronRight, roles: ['admin', 'store', 'approver', 'dept'], isSub: true },
        { to: '/audit', label: 'Audit Trail & Ledgers', icon: ChevronRight, roles: ['admin', 'approver'], isSub: true },
      ],
    },
    {
      title: 'Bubbles & Governance',
      items: [
        { to: '/write-offs', label: 'Write-offs & Condemnations', icon: ChevronRight, roles: ['admin', 'store', 'approver'], isSub: true },
        { to: '/forms', label: 'Forms, Slips & Registers', icon: ChevronRight, roles: ['admin', 'store', 'approver', 'dept'], isSub: true },
        { to: '/directory', label: 'Central University Directory', icon: ChevronRight, roles: ['admin', 'store', 'approver', 'dept'], isSub: true },
        { to: '/help', label: 'Operational SOPs & Help', icon: ChevronRight, roles: ['admin', 'store', 'approver', 'dept'], isSub: true },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar container with MIT-inspired Royal Blue Theme starting beneath top bar */}
      <aside
        className={`fixed top-14 bottom-0 left-0 z-40 w-[240px] bg-[#1565C0] text-white flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-md ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Navigation Roster Header */}
        <div className="h-11 px-4 bg-[#0D47A1] border-b border-blue-400/20 flex items-center justify-between shrink-0">
          <span className="font-bold text-[11.5px] uppercase tracking-wider text-blue-100/90">
            Navigation Menu
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="lg:hidden text-white/80 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Groups with larger text & distinct hierarchy */}
        <nav className="flex-1 py-3 px-2.5 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-blue-400/30">
          {navSections.map((section, idx) => {
            const visibleItems = section.items.filter((item) => item.roles.includes(user.role));
            if (visibleItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {section.title && (
                  <span className="px-2.5 pt-2 text-[11px] font-bold text-blue-200/90 uppercase tracking-wider block mb-1">
                    {section.title}
                  </span>
                )}
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => {
                          setMobileOpen(false);
                          if (item.to === '/dashboard') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 px-3 py-2 rounded-md text-[14.5px] font-medium transition-all ${
                            isActive
                              ? 'bg-white/20 text-white font-semibold shadow-xs ring-1 ring-white/30 pl-3.5'
                              : 'text-white/90 hover:bg-white/10 hover:text-white'
                          }`
                        }
                      >
                        <Icon className={`shrink-0 ${item.isSub ? 'w-3.5 h-3.5 text-blue-200' : 'w-4.5 h-4.5 text-white'}`} />
                        <span className="truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Institutional Badge Footer */}
        <div className="p-3.5 bg-[#0D47A1]/80 border-t border-blue-400/20 text-[11.5px] text-blue-200 flex items-center justify-between">
          <span>Enterprise IMS v2.4</span>
          <span className="px-1.5 py-0.5 bg-blue-500/30 text-white rounded text-[10px] font-mono">MIT Style</span>
        </div>
      </aside>
    </>
  );
}
