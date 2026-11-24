import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Search, LogOut, ChevronDown, Package, Home, ChevronRight, Keyboard } from 'lucide-react';
import { getCurrentUser, logout, api } from '../api';
import NotificationPopover from './NotificationPopover';

export default function Header({ setMobileOpen, title, group = 'Portal', onItemSelect, onOpenCommand, onOpenShortcuts }) {
  const user = getCurrentUser() || { name: 'User', role: 'store', dept: 'Stores & Purchase' };
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Global keyboard shortcuts: / for command, ? for shortcuts cheat sheet
  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === '/') {
        e.preventDefault();
        onOpenCommand?.();
      } else if (e.key === '?') {
        e.preventDefault();
        onOpenShortcuts?.();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommand, onOpenShortcuts]);

  // Click outside listener for menu
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleDisplay = {
    admin: 'Administrator',
    store: 'Store Officer',
    approver: 'Director (S&P)',
    dept: 'Department Staff',
  };

  return (
    <header className="sticky top-0 z-30 h-15 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 shadow-2xs">
      {/* Left: Mobile trigger & Merged Breadcrumbs Trail */}
      <div className="flex items-center gap-2.5 shrink-0 min-w-0">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-slate-500 hover:text-slate-800 p-1.5 rounded"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13.5px] text-slate-600 truncate font-medium">
          <Link to="/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 shrink-0">
            <Home className="w-4 h-4 text-slate-400 hover:text-blue-600" />
            <span className="hidden sm:inline">home</span>
          </Link>
          <span className="text-slate-400 font-light">/</span>
          <span className="text-slate-500 hidden md:inline shrink-0">{group.toLowerCase().replace(/\s+/g, '_')}</span>
          <span className="text-slate-400 font-light hidden md:inline">/</span>
          <span className="font-semibold text-slate-900 text-[15px] truncate">{title.replace(/\s+/g, '_')}</span>
        </nav>
      </div>

      {/* Middle: Global Search / Command Palette Launcher (MIT / Modern Style) */}
      <div className="relative flex-1 max-w-md hidden md:block">
        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Search items by name or code (press ⌘K or / to open)"
          className="w-full h-9 pl-3.5 pr-2.5 text-[14px] bg-slate-100/80 hover:bg-slate-100 rounded-full border border-slate-200 hover:border-blue-400 text-left text-slate-500 flex items-center justify-between transition-colors shadow-2xs group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            <span className="truncate">Search catalog, POs, circulars...</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <kbd className="text-[11px] font-mono text-slate-500 border border-slate-300 bg-white px-2 py-0.5 rounded-full shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right: Actions, Notifications & Consolidated User Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Keyboard Shortcuts Trigger */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          aria-label="View keyboard shortcuts (press ?)"
          className="hidden sm:flex items-center gap-1 p-1.5 px-2 rounded hover:bg-paper text-ink-muted hover:text-ink text-[12px] font-mono transition-colors border border-transparent hover:border-line"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span className="text-[11px] text-ink-subtle">?</span>
        </button>

        {/* Shadcn-Admin Notification Popover */}
        <NotificationPopover />

        {/* User Menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User account menu"
            className="flex items-center gap-2 py-1 px-1.5 rounded hover:bg-paper transition-colors"
          >
            <div className="w-7 h-7 rounded bg-primary text-white flex items-center justify-center font-bold text-[12px] uppercase">
              {user.name.charAt(0)}
            </div>
            <span className="text-[13px] font-medium text-ink hidden sm:inline">{user.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
          </button>

        {/* User Dropdown */}
        {menuOpen && (
          <div className="absolute right-0 mt-1 w-56 bg-surface border border-line rounded shadow-sm overflow-hidden z-50">
            <div className="p-3 border-b border-line bg-paper">
              <span className="text-[13px] font-semibold text-ink block truncate">{user.name}</span>
              <span className="text-[12px] text-primary font-medium block">
                {roleDisplay[user.role] || user.role}
              </span>
              <span className="text-[11px] text-ink-muted block mt-0.5 truncate">
                {user.dept || 'Stores & Purchase'}
              </span>
            </div>

            <div className="p-1">
              <button
                type="button"
                onClick={logout}
                className="w-full px-3 py-2 text-left text-[13px] font-medium text-red hover:bg-red-light/40 rounded flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  </header>
  );
}
