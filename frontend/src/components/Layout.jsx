import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { getToken, getCurrentUser } from '../api';

const routeMeta = {
  '/dashboard': { title: 'Stores & Purchase Dashboard', subtitle: 'Real-time overview of inventory levels, valuations, and procurement flows' },
  '/items': { title: 'Stores Inventory Master', subtitle: 'Search, manage, and audit all physical stock items across departments' },
  '/issue-stock': { title: 'Issue Stock to Department', subtitle: 'Log material issuance against departments with real-time stock deductions' },
  '/indents': { title: 'Requisitions & Indents', subtitle: 'Manage department demand requisitions and administrative approvals' },
  '/purchase-orders': { title: 'Purchase Orders & GRN', subtitle: 'Manage vendor orders, rates, and partial/complete goods receipt notes' },
  '/write-offs': { title: 'Material Write-off Requests', subtitle: 'Condemn damaged, obsolete, or expired materials with administrative sanction' },
  '/reports': { title: 'Inventory Reports & Export', subtitle: 'Download live CSV reports and view print-ready university store statements' },
  '/audit': { title: 'System Audit Trail', subtitle: 'Immutable chronological record of administrative and storekeeper actions' },
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const token = getToken();
  const user = getCurrentUser();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentMeta = routeMeta[location.pathname] || {
    title: 'Stores & Purchase Portal',
    subtitle: 'Gautam Buddha University, Greater Noida',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main content area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        <Header
          setMobileOpen={setMobileOpen}
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
