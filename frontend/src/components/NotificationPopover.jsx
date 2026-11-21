import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, AlertTriangle, FileText, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { api, getCurrentUser } from '../api';

/**
 * Shadcn-Admin style Notification Popover with real-time pending approvals & stock alerts
 */
export default function NotificationPopover() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const popoverRef = useRef(null);
  const user = getCurrentUser() || {};

  // Fetch pending action counts
  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        setLoading(true);
        const [dashRes, itemsRes] = await Promise.allSettled([
          api.getDashboard?.() || Promise.resolve({}),
          api.getItems?.({ page_size: 50 }) || Promise.resolve({ items: [] }),
        ]);

        const notifs = [];

        // 1. Check low stock items
        const items = itemsRes.status === 'fulfilled' ? (itemsRes.value.items || itemsRes.value || []) : [];
        const lowItems = items.filter(it => (it.current_qty ?? it.qty ?? 0) <= (it.min_level ?? it.min_stock ?? 0));
        lowItems.slice(0, 4).forEach(it => {
          const balance = it.current_qty ?? it.qty ?? 0;
          const minLvl = it.min_level ?? it.min_stock ?? 0;
          notifs.push({
            id: `stock-${it.id}`,
            type: 'stock',
            title: `Low stock threshold: ${it.name}`,
            description: `Physical balance ${balance} ${it.unit} is at or below reorder level (${minLvl} ${it.unit}).`,
            link: '/items?low=true',
            tag: 'Inventory Warning',
            time: 'Live',
            severity: 'warning'
          });
        });

        // 2. Check pending approvals if approver or admin
        if (['approver', 'admin', 'store'].includes(user.role)) {
          const dash = dashRes.status === 'fulfilled' ? dashRes.value : {};
          const pendingIndents = dash.attention?.pending_indents || 0;
          if (pendingIndents > 0) {
            notifs.push({
              id: 'pending-indents',
              type: 'approval',
              title: `${pendingIndents} Indent requisition(s) pending`,
              description: 'Departmental store requisitions awaiting review and director sanction.',
              link: '/indents',
              tag: 'Approval Action',
              time: 'Needs action',
              severity: 'action'
            });
          }

          const pendingWriteOffs = dash.attention?.pending_write_offs || 0;
          if (pendingWriteOffs > 0) {
            notifs.push({
              id: 'pending-write-offs',
              type: 'approval',
              title: `${pendingWriteOffs} Condemnation proposal(s) pending`,
              description: 'Survey committee write-off requests awaiting administrative sanction.',
              link: '/write-offs',
              tag: 'Survey Committee',
              time: 'Pending',
              severity: 'action'
            });
          }
        }

        if (isMounted) {
          setAlerts(notifs);
        }
      } catch (e) {
        // quiet fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNotifications();
  }, [user.role]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = alerts.length;
  const filteredAlerts = activeTab === 'all' 
    ? alerts 
    : alerts.filter(a => a.type === activeTab);

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={`Open notifications (${unreadCount} pending)`}
        aria-expanded={open}
        className="relative p-2 rounded hover:bg-paper text-ink-muted hover:text-ink transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface border border-line rounded-panel shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Popover Header */}
          <div className="p-3.5 border-b border-line flex items-center justify-between bg-paper/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink text-[13px]">Action Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface border border-line rounded p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeTab === 'all' ? 'bg-primary text-white shadow-2xs' : 'text-ink-muted hover:text-ink'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('approval')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeTab === 'approval' ? 'bg-primary text-white shadow-2xs' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Approvals
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stock')}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  activeTab === 'stock' ? 'bg-primary text-white shadow-2xs' : 'text-ink-muted hover:text-ink'
                }`}
              >
                Stock
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-line/60">
            {filteredAlerts.length === 0 ? (
              <div className="p-6 text-center text-ink-subtle space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto stroke-1" />
                <p className="text-[13px] font-medium text-ink">All caught up</p>
                <p className="text-[11px]">No pending requisitions or critical stock-outs.</p>
              </div>
            ) : (
              filteredAlerts.map(alert => (
                <Link
                  key={alert.id}
                  to={alert.link}
                  onClick={() => setOpen(false)}
                  className="p-3 hover:bg-paper/70 flex items-start gap-3 transition-colors block text-left group"
                >
                  <div className={`p-1.5 rounded shrink-0 mt-0.5 ${
                    alert.severity === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-blue-50 text-primary border border-blue-200'
                  }`}>
                    {alert.severity === 'warning' ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="text-[11px] font-semibold text-primary uppercase tracking-wide">
                        {alert.tag}
                      </span>
                      <span className="text-[10px] text-ink-subtle">{alert.time}</span>
                    </div>
                    <strong className="text-[12px] font-semibold text-ink group-hover:text-primary transition-colors block truncate">
                      {alert.title}
                    </strong>
                    <p className="text-[11px] text-ink-muted line-clamp-2 mt-0.5 leading-snug">
                      {alert.description}
                    </p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-ink-subtle group-hover:translate-x-0.5 transition-transform shrink-0 self-center" />
                </Link>
              ))
            )}
          </div>

          {/* Popover Footer */}
          <div className="p-2 bg-paper/60 border-t border-line text-center text-[11px] text-ink-muted flex items-center justify-between px-3">
            <span>Official audit log synchronized</span>
            <Link to="/reports" onClick={() => setOpen(false)} className="text-primary hover:underline font-medium">
              View reports →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
