import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, LogOut, ChevronDown, Home, Keyboard, ShieldCheck } from 'lucide-react';
import { getCurrentUser, logout } from '../api';
import NotificationPopover from './NotificationPopover';
import { assetUrl } from '../lib/utils';

export default function Header({ setMobileOpen, onOpenCommand, onOpenShortcuts }) {
  const user = getCurrentUser() || { name: 'Store Officer', role: 'store', dept: 'Stores & Purchase' };
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Global keyboard shortcuts: / or Cmd+K for command, ? for shortcuts
  useEffect(() => {
    function handleKeyDown(e) {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      if (e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key === 'k')) {
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

  const handleHomeLogoClick = (e) => {
    if (window.location.pathname.endsWith('/dashboard') || window.location.pathname.endsWith('/')) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#0B0F19] text-white z-50 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 select-none shadow-md">
      {/* 1. Left: MIT-Style Institutional Branding */}
      <div className="flex items-center gap-3 shrink-0 min-w-0">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link
          to="/dashboard"
          onClick={handleHomeLogoClick}
          className="flex items-center gap-2.5 group cursor-pointer"
          title="Return to Dashboard Home"
        >
          {/* Logo with University Emblem + Red Accent Bar (MIT style) */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-6 bg-red-600 rounded-full shrink-0 shadow-xs" />
            <img
              src={assetUrl('gbu-logo.jpg')}
              alt="GBU Seal"
              className="w-8 h-8 rounded-full bg-white object-contain p-0.5 border border-white/20 shrink-0"
            />
          </div>

          <div className="leading-tight">
            <span className="font-bold text-white text-[14px] sm:text-[15.5px] tracking-wide uppercase group-hover:text-blue-400 transition-colors block">
              GBU INVENTORY MANAGEMENT PORTAL
            </span>
          </div>
        </Link>
      </div>

      {/* 2. Middle: Search Bar RIGHT AT THE VERY TOP (MIT Screen 2 Style) */}
      <div className="relative flex-1 max-w-md lg:max-w-xl hidden md:block">
        <button
          type="button"
          onClick={onOpenCommand}
          aria-label="Search items by name or code (press ⌘K or / to open)"
          className="w-full h-9.5 pl-3.5 pr-2.5 text-[13.5px] bg-slate-900/90 hover:bg-slate-900 rounded-full border border-slate-700/80 hover:border-blue-500/80 text-left text-slate-300 flex items-center justify-between transition-colors shadow-inner group"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
            <span className="truncate text-slate-300">Search catalog, items, POs, circulars...</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="text-[11px] font-mono text-slate-400 border border-slate-700 bg-slate-800 px-2 py-0.5 rounded-full shadow-2xs">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* 3. Right: Shortcuts, Notification Bell & User Profile Menu */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Search Button (shows when top pill is hidden) */}
        <button
          type="button"
          onClick={onOpenCommand}
          className="md:hidden p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800"
          title="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Keyboard Shortcuts Trigger */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          aria-label="View keyboard shortcuts (press ?)"
          className="hidden sm:flex items-center gap-1 p-1.5 px-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white text-[12px] font-mono transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="w-4 h-4" />
          <span className="text-[11px] font-bold">?</span>
        </button>

        {/* Notification Popover */}
        <NotificationPopover />

        {/* User Account Menu */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User account menu"
            className="flex items-center gap-2 py-1 px-2 rounded-full hover:bg-slate-800/80 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#1565C0] text-white flex items-center justify-center font-bold text-[12.5px] uppercase border border-white/20">
              {user.name.charAt(0)}
            </div>
            <span className="text-[13.5px] font-semibold text-slate-200 hidden sm:inline">
              {user.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* User Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 text-slate-800 animate-in fade-in slide-in-from-top-1 duration-100">
              <div className="p-3.5 border-b border-slate-100 bg-slate-50">
                <span className="text-[14px] font-bold text-slate-900 block truncate">{user.name}</span>
                <span className="text-[12.5px] text-[#1565C0] font-semibold block mt-0.5">
                  {roleDisplay[user.role] || user.role}
                </span>
                <span className="text-[11.5px] text-slate-500 block mt-0.5 truncate">
                  {user.dept || 'Stores & Purchase'}
                </span>
              </div>

              <div className="p-1.5">
                <Link
                  to="/directory"
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-100 rounded-md block transition-colors"
                >
                  University Directory
                </Link>
                <Link
                  to="/help"
                  onClick={() => setMenuOpen(false)}
                  className="w-full px-3 py-2 text-left text-[13px] text-slate-700 hover:bg-slate-100 rounded-md block transition-colors"
                >
                  Help & SOP Manual
                </Link>

                <div className="my-1 border-t border-slate-100" />

                <button
                  type="button"
                  onClick={logout}
                  className="w-full px-3 py-2 text-left text-[13px] font-semibold text-red-600 hover:bg-red-50 rounded-md flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
