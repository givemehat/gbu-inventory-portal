import React, { useState } from 'react';
import { Navigate, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import ItemDrawer from './ItemDrawer';
import CommandPalette from './CommandPalette';
import ShortcutsModal from './ShortcutsModal';
import { getToken, getCurrentUser } from '../api';
import { ChevronRight, Home, Building2, FileText, HelpCircle } from 'lucide-react';
import { useTextSize } from '../context/TextSizeContext';

const routeMetadata = {
  '/dashboard': { title: 'Inventory_Management_System', group: 'roadmaps' },
  '/items': { title: 'Central_Stock_Register', group: 'roadmaps' },
  '/issue-stock': { title: 'Issue_Stock_to_Schools', group: 'roadmaps' },
  '/indents': { title: 'Departmental_Requisitions', group: 'roadmaps' },
  '/purchase-orders': { title: 'Purchase_Orders_and_Goods_Receipt', group: 'roadmaps' },
  '/write-offs': { title: 'Condemnations_and_WriteOffs', group: 'governance' },
  '/reports': { title: 'Inventory_Reports_and_Statements', group: 'roadmaps' },
  '/audit': { title: 'Audit_Ledger_Log', group: 'governance' },
  '/directory': { title: 'University_Directory', group: 'resources' },
  '/forms': { title: 'Forms_and_Slips', group: 'resources' },
  '/help': { title: 'Stores_Help_and_SOP', group: 'resources' },
};

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [drawerItem, setDrawerItem] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const token = getToken();
  const user = getCurrentUser();
  const { textSize, setTextSize } = useTextSize();

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const currentMeta = routeMetadata[location.pathname] || {
    title: 'Stores_and_Purchase_Portal',
    group: 'roadmaps',
  };

  const handleHomeClick = (e) => {
    if (location.pathname === '/dashboard') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 font-sans">
      {/* 1. Full-Width MIT Top Bar (Black): GBU Emblem + "GBU INVENTORY MANAGEMENT PORTAL" + Search at very top */}
      <Header
        setMobileOpen={setMobileOpen}
        onOpenCommand={() => setCommandOpen(true)}
        onOpenShortcuts={() => setShortcutsOpen(true)}
      />

      {/* 2. Body Container below Top Bar (pt-14 matches Header h-14) */}
      <div className="flex-1 flex pt-14">
        {/* 240px Royal Blue Sidebar starting beneath top bar */}
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        {/* Main Body */}
        <div className="flex-1 lg:pl-[240px] flex flex-col min-w-0">
          {/* Sub-Header: Single clean Breadcrumb Bar (MIT Style) + Quick Links */}
          <div className="h-10 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between text-[13.5px] select-none shrink-0 z-10 shadow-2xs">
            {/* Breadcrumb Navigation Trail */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-slate-500 font-medium truncate">
              <Link
                to="/dashboard"
                onClick={handleHomeClick}
                className="hover:text-[#1565C0] flex items-center gap-1.5 text-slate-500 hover:text-[#1565C0] transition-colors"
                title="Go to Home Overview (Click to scroll top)"
              >
                <Home className="w-4 h-4 text-slate-400" />
                <span className="font-semibold text-slate-700 hover:text-[#1565C0]">home</span>
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 hidden sm:inline shrink-0">{currentMeta.group}</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-900 truncate">{currentMeta.title}</span>
            </nav>

            {/* Quick Resource Links & Text Size Controls */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="hidden md:flex items-center gap-3.5 text-[12.5px] text-slate-600 font-medium">
                <Link to="/directory" className="hover:text-[#1565C0] flex items-center gap-1 transition-colors">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Directory</span>
                </Link>
                <Link to="/forms" className="hover:text-[#1565C0] flex items-center gap-1 transition-colors">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Forms & Slips</span>
                </Link>
                <Link to="/help" className="hover:text-[#1565C0] flex items-center gap-1 transition-colors">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Help</span>
                </Link>
              </div>

              <div className="hidden md:block h-3.5 w-px bg-slate-200" />

              {/* Text Size Scale Control: A- | A | A+ */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-md px-1.5 py-0.5 border border-slate-200">
                <span className="text-[10px] text-slate-500 mr-1 hidden sm:inline font-medium">Text:</span>
                <button
                  type="button"
                  onClick={() => setTextSize('sm')}
                  title="Compact text"
                  className={`px-1.5 py-0.2 rounded font-semibold text-[10.5px] transition-colors ${
                    textSize === 'sm'
                      ? 'bg-[#1565C0] text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize('base')}
                  title="Default text"
                  className={`px-1.5 py-0.2 rounded font-semibold text-[10.5px] transition-colors ${
                    textSize === 'base'
                      ? 'bg-[#1565C0] text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() => setTextSize('lg')}
                  title="Larger text"
                  className={`px-1.5 py-0.2 rounded font-semibold text-[10.5px] transition-colors ${
                    textSize === 'lg'
                      ? 'bg-[#1565C0] text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  A+
                </button>
              </div>
            </div>
          </div>

          {/* Main Page Content */}
          <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 py-6">
            <Outlet context={{ openItemDrawer: (item) => setDrawerItem(item) }} />
          </main>

          {/* Standard Footer */}
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
