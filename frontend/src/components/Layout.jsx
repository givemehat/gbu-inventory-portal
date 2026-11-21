import React, { useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ItemDrawer from './ItemDrawer';
import { getToken, getCurrentUser } from '../api';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/items': 'Stock register',
  '/issue-stock': 'Issue stock',
  '/indents': 'Indents',
  '/purchase-orders': 'Purchase orders',
  '/write-offs': 'Write-offs',
  '/reports': 'Reports & statements',
  '/audit': 'Audit log',
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

  const currentTitle = routeTitles[location.pathname] || 'Stores & Purchase';

  return (
    <div className="min-h-screen bg-paper flex text-ink">
      {/* 232px Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Container */}
      <div className="flex-1 lg:pl-[232px] flex flex-col min-w-0 min-h-screen">
        <Header
          setMobileOpen={setMobileOpen}
          title={currentTitle}
          onItemSelect={(item) => setDrawerItem(item)}
        />

        <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 sm:px-6 py-6">
          <Outlet context={{ openItemDrawer: (item) => setDrawerItem(item) }} />
        </main>
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
