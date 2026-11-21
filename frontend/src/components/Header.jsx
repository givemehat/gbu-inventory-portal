import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, LogOut, ChevronDown, Package } from 'lucide-react';
import { getCurrentUser, logout, api } from '../api';

export default function Header({ setMobileOpen, title, onItemSelect }) {
  const user = getCurrentUser() || { name: 'User', role: 'store', dept: 'Stores & Purchase' };
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchRef = useRef(null);

  // Global keyboard shortcut: press / to focus search
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click outside listener for menu & search
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search items as user types
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      api.getItems({ q: searchQuery.trim() })
        .then((res) => {
          setSearchResults(res.slice(0, 8));
          setSearchOpen(true);
        })
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
      setSearchOpen(false);
    }
  }, [searchQuery]);

  const roleDisplay = {
    admin: 'Administrator',
    store: 'Store Officer',
    approver: 'Director (S&P)',
    dept: 'Department Staff',
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-surface border-b border-line px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile trigger & Page Title (Serif) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="lg:hidden text-ink-muted hover:text-ink p-1 rounded"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-serif text-[18px] sm:text-[20px] font-semibold text-ink tracking-tight">
          {title}
        </h1>
      </div>

      {/* Middle: Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
            placeholder="Search items by name or code (press / to focus)..."
            className="w-full h-8 pl-9 pr-8 text-[13px] bg-paper rounded border border-line focus:border-primary focus:bg-surface outline-none transition-colors placeholder:text-ink-subtle"
          />
          <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-ink-subtle border border-line bg-surface px-1 py-0.2 rounded pointer-events-none">
            /
          </kbd>
        </div>

        {/* Search Results Dropdown */}
        {searchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded shadow-sm overflow-hidden z-50 divide-y divide-line/40">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery('');
                  onItemSelect?.(item);
                }}
                className="w-full px-3 py-2 text-left hover:bg-paper flex items-center justify-between transition-colors text-[13px]"
              >
                <div className="truncate pr-2">
                  <span className="font-mono text-[11px] text-ink-muted mr-1.5">[{item.code}]</span>
                  <span className="font-medium text-ink truncate">{item.name}</span>
                </div>
                <span className="tabular-nums text-[12px] font-medium text-ink-muted shrink-0">
                  {item.qty} {item.unit}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: Consolidated User Menu */}
      <div ref={menuRef} className="relative shrink-0">
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
    </header>
  );
}
