import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import UtilityBar from './UtilityBar';
import Footer from './Footer';
import ItemDrawer from './ItemDrawer';
import CommandPalette from './CommandPalette';
import ShortcutsModal from './ShortcutsModal';
import { getToken, getCurrentUser } from '../api';
import { ChevronRight, Home } from 'lucide-react';

const routeMetadata = {
  '/dashboard': { title: 'Dashboard', group: 'Overview' },
  '/items': { title: 'Stock register', group: 'Stores' },
  '/issue-stock': { title: 'Issue stock', group: 'Stores' },
  '/indents': { title: 'Requisitions & indents', group: 'Procurement' },
  '/purchase-orders': { title: 'Purchase orders & GRN', group: 'Procurement' },
  '/write-offs': { title: 'Condemnations & write-offs', group: 'Control' },
  '/reports': { title: 'Reports & statements', group: 'Control' },
  '/audit': { title: 'Audit log', group: 'Control' },
  '/directory': { title: 'Directory', group: 'Help & resources' },
  '/forms': { title: 'Forms and slips', group: 'Help & resources' },
  '/help': { title: 'Help', group: 'Help & resources' },
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentMeta = routeMetadata[location.pathname] || {
    title: 'Stores & Purchase',
    group: 'Portal',
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col text-ink font-sans">
      <div className="flex-1 flex">
        {/* 232px Sidebar */}
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Body */}
        <div className="flex-1 lg:pl-[232px] flex flex-col min-w-0">
          {/* Top Utility Bar starts at content edge, never clipped by sidebar */}
          <UtilityBar />

          {/* Clean 56px Merged Header: Breadcrumbs + Search + User */}
          <Header
            setMobileOpen={setMobileOpen}
            title={currentMeta.title}
            group={currentMeta.group}
            onItemSelect={(item) => setDrawerItem(item)}
            onOpenCommand={() => setCommandOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
          />

          <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-6">
            <Outlet context={{ openItemDrawer: (item) => setDrawerItem(item) }} />
          </main>

          {/* Standard 3-Column Footer */}
          <Footer />
        </div>
      </div>

      {/* Global Right-side Item Drawer */}
      <ItemDrawer
        item={drawerItem}
        isOpen={!!drawerItem}
        onClose={() => setDrawerItem(null)}
      />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={commandOpen}
        setIsOpen={setCommandOpen}
        onItemSelect={(item) => setDrawerItem(item)}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal (?) */}
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </div>
  );
}
