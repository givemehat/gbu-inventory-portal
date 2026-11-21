import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import UtilityBar from './UtilityBar';
import Footer from './Footer';
import ItemDrawer from './ItemDrawer';
import { getToken, getCurrentUser } from '../api';
import { ChevronRight, Home } from 'lucide-react';

const routeMetadata = {
  '/dashboard': { title: 'Dashboard', group: 'Overview' },
  '/items': { title: 'Stock register', group: 'Stores' },
  '/issue-stock': { title: 'Issue stock', group: 'Stores' },
  '/indents': { title: 'Material Requisitions', group: 'Procurement' },
  '/purchase-orders': { title: 'Purchase orders & GRN', group: 'Procurement' },
  '/write-offs': { title: 'Condemnations & Write-offs', group: 'Control' },
  '/reports': { title: 'Reports & statements', group: 'Control' },
  '/audit': { title: 'Audit log', group: 'Control' },
  '/directory': { title: 'University Directory', group: 'Help & Resources' },
  '/forms': { title: 'Printable Forms & Slips', group: 'Help & Resources' },
  '/help': { title: 'Stores & Purchase Help', group: 'Help & Resources' },
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState(null);
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
    <div className="min-h-screen bg-paper flex flex-col text-ink">
      {/* 32px GBU Dark Blue Utility Bar at top */}
      <UtilityBar />

      <div className="flex-1 flex">
        {/* 232px Sidebar */}
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Body */}
        <div className="flex-1 lg:pl-[232px] flex flex-col min-w-0">
          <Header
            setMobileOpen={setMobileOpen}
            title={currentMeta.title}
            onItemSelect={(item) => setDrawerItem(item)}
          />

          {/* Breadcrumbs Trail under Header */}
          <div className="no-print bg-surface/60 border-b border-line px-4 sm:px-6 py-1.5 text-[11px] text-ink-muted flex items-center gap-1.5">
            <Link to="/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
              <Home className="w-3 h-3 text-ink-subtle" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 text-line" />
            <span className="text-ink-subtle">{currentMeta.group}</span>
            <ChevronRight className="w-3 h-3 text-line" />
            <span className="font-medium text-ink">{currentMeta.title}</span>
          </div>

          <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-6">
            <Outlet context={{ openItemDrawer: (item) => setDrawerItem(item) }} />
          </main>

          {/* GBU Standard 3-Column Footer */}
          <Footer />
        </div>
      </div>

      {/* Global Right-side Item Drawer */}
      <ItemDrawer
        item={drawerItem}
        isOpen={!!drawerItem}
        onClose={() => setDrawerItem(null)}
      />
    </div>
  );
}
