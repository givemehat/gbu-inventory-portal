import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  Package,
  ArrowUpRight,
  ClipboardList,
  FileCheck2,
  Trash2,
  FileSpreadsheet,
  Building2,
  FileText,
  HelpCircle,
  Plus,
  Download,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { api, getCurrentUser } from '../api';

export default function CommandPalette({ isOpen, setIsOpen, onItemSelect }) {
  const [query, setQuery] = useState('');
  const [itemResults, setItemResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const user = getCurrentUser() || {};

  // Static Navigation items
  const navigationActions = [
    { id: 'nav-dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, route: '/dashboard', group: 'Navigation' },
    { id: 'nav-items', label: 'Stock Register & Items Ledger', icon: Package, route: '/items', group: 'Navigation' },
    { id: 'nav-issue', label: 'Issue Stock to Department', icon: ArrowUpRight, route: '/issue-stock', group: 'Navigation', roles: ['admin', 'store'] },
    { id: 'nav-indents', label: 'Material Requisitions & Indents', icon: ClipboardList, route: '/indents', group: 'Navigation' },
    { id: 'nav-pos', label: 'Purchase Orders & GRN Inward', icon: FileCheck2, route: '/purchase-orders', group: 'Navigation', roles: ['admin', 'store', 'approver'] },
    { id: 'nav-writeoffs', label: 'Condemnations & Write-Offs', icon: Trash2, route: '/write-offs', group: 'Navigation', roles: ['admin', 'store', 'approver'] },
    { id: 'nav-reports', label: 'Reports & Statements (Bin Card / ABC)', icon: FileSpreadsheet, route: '/reports', group: 'Navigation' },
    { id: 'nav-forms', label: 'Printable Forms & Slips (A4)', icon: FileText, route: '/forms', group: 'Navigation' },
    { id: 'nav-dir', label: 'University Directory & Vendors', icon: Building2, route: '/directory', group: 'Navigation' },
    { id: 'nav-help', label: 'Help, FAQ & Portal Guide', icon: HelpCircle, route: '/help', group: 'Navigation' },
  ].filter((item) => !item.roles || item.roles.includes(user.role));

  // Quick Command Actions
  const quickActions = [
    { id: 'act-indent', label: 'Raise New Material Requisition', icon: Plus, action: () => navigate('/indents', { state: { openNew: true } }), group: 'Actions' },
    { id: 'act-po', label: 'Draft Purchase Order', icon: Plus, action: () => navigate('/purchase-orders', { state: { openNew: true } }), group: 'Actions', roles: ['admin', 'store'] },
    { id: 'act-export', label: 'Download Stock CSV Statement', icon: Download, action: () => api.downloadStockReport(), group: 'Actions', roles: ['admin', 'store', 'approver'] },
  ].filter((item) => !item.roles || item.roles.includes(user.role));

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setItemResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global key listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Debounced search for items
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setItemResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.getItems({ q: query.trim(), page_size: 6 });
        setItemResults(res?.items || []);
      } catch (e) {
        setItemResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Filter static items by search query
  const filteredNav = query.trim()
    ? navigationActions.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
    : navigationActions.slice(0, 5);

  const filteredActs = query.trim()
    ? quickActions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : quickActions;

  // Build combined actionable list for keyboard selection
  const allInteractive = [
    ...itemResults.map((item) => ({
      id: `item-${item.id}`,
      type: 'item',
      data: item,
      run: () => {
        onItemSelect?.(item);
        setIsOpen(false);
      },
    })),
    ...filteredActs.map((act) => ({
      id: act.id,
      type: 'action',
      data: act,
      run: () => {
        act.action();
        setIsOpen(false);
      },
    })),
    ...filteredNav.map((nav) => ({
      id: nav.id,
      type: 'nav',
      data: nav,
      run: () => {
        navigate(nav.route);
        setIsOpen(false);
      },
    })),
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, allInteractive.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allInteractive.length) % Math.max(1, allInteractive.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allInteractive[selectedIndex]) {
        allInteractive[selectedIndex].run();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-xl bg-surface rounded-xl border border-line shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-line flex items-center px-4 py-3 bg-surface">
          <Search className="w-5 h-5 text-ink-subtle mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, page name, or search items (e.g. 'paper', 'indent', 'reports')..."
            className="w-full bg-transparent text-[14px] text-ink placeholder:text-ink-subtle outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 hover:bg-paper rounded text-ink-muted"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-ink-subtle border border-line bg-paper rounded shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Command Body */}
        <div className="max-h-[380px] overflow-y-auto p-2 divide-y divide-line/40">
          {/* Section 1: Item Results if search query */}
          {itemResults.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-ink-muted flex items-center justify-between">
                <span>Matching Stock Items</span>
                <span className="text-[10px] text-primary font-mono">{itemResults.length} found</span>
              </div>
              <div className="space-y-0.5">
                {itemResults.map((item, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onItemSelect?.(item);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-light text-primary' : 'hover:bg-paper text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Package className="w-4 h-4 text-ink-subtle shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-[13px] block truncate">{item.name}</span>
                          <span className="text-[11px] text-ink-muted font-mono">
                            [{item.code}] • {item.category}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-[12px] font-bold block">{item.qty} {item.unit}</span>
                        <span className="text-[10px] text-ink-subtle">₹{item.price} / unit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Quick Actions */}
          {filteredActs.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-ink-muted">Quick actions</div>
              <div className="space-y-0.5">
                {filteredActs.map((act, idx) => {
                  const globalIdx = itemResults.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      onClick={() => {
                        act.action();
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-light text-primary' : 'hover:bg-paper text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-[13px]">{act.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-ink-subtle" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 3: Navigation */}
          {filteredNav.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-ink-muted">Navigation</div>
              <div className="space-y-0.5">
                {filteredNav.map((nav, idx) => {
                  const globalIdx = itemResults.length + filteredActs.length + idx;
                  const isSelected = selectedIndex === globalIdx;
                  const Icon = nav.icon;
                  return (
                    <div
                      key={nav.id}
                      onClick={() => {
                        navigate(nav.route);
                        setIsOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIdx)}
                      className={`px-3 py-2 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary-light text-primary' : 'hover:bg-paper text-ink'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-ink-muted shrink-0" />
                        <span className="font-medium text-[13px]">{nav.label}</span>
                      </div>
                      <span className="text-[11px] text-ink-subtle font-mono">{nav.route}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {allInteractive.length === 0 && !loading && (
            <div className="py-8 text-center text-[13px] text-ink-muted">
              No matching pages or items found for "{query}".
            </div>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-paper border-t border-line text-[11px] text-ink-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono">↑↓</kbd> to navigate</span>
            <span><kbd className="font-mono">↵</kbd> to select</span>
            <span><kbd className="font-mono">esc</kbd> to close</span>
          </div>
          <span className="text-primary font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            GBU Quick Command
          </span>
        </div>
      </div>
    </div>
  );
}
