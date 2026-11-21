import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import StockLevelBar from '../components/StockLevelBar';
import WorkflowStrip from '../components/WorkflowStrip';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import { Bell, Plus, Trash2, X, ChevronRight, Sparkles, AlertTriangle, Building2 } from 'lucide-react';

// Format Indian currency into Lakhs or standard grouping
function formatRupees(num = 0) {
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)} K`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', ref_no: '' });
  const [submittingNotice, setSubmittingNotice] = useState(false);
  const user = getCurrentUser() || {};
  const isOfficer = ['store', 'approver', 'admin'].includes(user.role);
  const toast = useToast();
  const navigate = useNavigate();
  const { openItemDrawer } = useOutletContext() || {};

  // Inline decision modal for Director
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    type: '', // 'indent' | 'writeoff'
    id: null,
    no: '',
    isApprove: true,
  });

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([
      api.getDashboard(),
      api.getNotices().catch(() => []),
      api.getStockForecast().catch(() => null),
    ])
      .then(([res, noticesData, forecastRes]) => {
        setData(res);
        setNotices(noticesData || []);
        setForecastData(forecastRes);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    try {
      setSubmittingNotice(true);
      await api.addNotice(newNotice);
      toast.success('Store circular published');
      setIsNoticeModalOpen(false);
      setNewNotice({ title: '', content: '', ref_no: '' });
      api.getNotices().then(setNotices);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingNotice(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    try {
      await api.deleteNotice(id);
      toast.success('Notice archived');
      setNotices(notices.filter((n) => n.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDecisionConfirm = async (remark) => {
    try {
      if (decisionModal.type === 'indent') {
        await api.decideIndent(decisionModal.id, decisionModal.isApprove, remark);
        toast.success(`Indent ${decisionModal.no} ${decisionModal.isApprove ? 'approved' : 'rejected'}`);
      } else {
        await api.decideWriteOff(decisionModal.id, decisionModal.isApprove, remark);
        toast.success(`Write-off ${decisionModal.no} ${decisionModal.isApprove ? 'approved' : 'rejected'}`);
      }
      loadDashboard();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-44 bg-surface border border-line rounded-panel" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 bg-surface border border-line rounded" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-64 bg-surface border border-line rounded-panel" />
          <div className="h-64 bg-surface border border-line rounded-panel" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const attention = data.attention || {};
  const isStore = ['store', 'admin'].includes(user.role);
  const isDirector = user.role === 'approver';
  const isDept = user.role === 'dept';

  return (
    <div className="space-y-6">
      {/* Top Institutional Header: Administrative Block */}
      <div className="bg-surface rounded-panel border border-line p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <img
            src="/gbu-campus.webp"
            alt="GBU Administrative Block"
            className="w-16 h-14 sm:w-20 sm:h-16 rounded object-cover border border-line shrink-0"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-serif text-[16px] sm:text-[18px] font-semibold text-ink">
                Gautam Buddha University
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-primary border border-blue-200 font-medium">
                Central Stores & Purchase
              </span>
            </div>
            <p className="text-[12px] text-ink-muted mt-0.5 truncate">
              Administrative Building (प्रशासनिक भवन) • Greater Noida • Academic Session 2026–27
            </p>
            <div className="flex items-center gap-3 text-[11px] text-ink-subtle mt-1">
              <span>Active official: <strong className="text-ink font-medium">{user.name}</strong> ({user.role})</span>
              <span>•</span>
              <span>Department: <strong className="text-ink font-medium">{user.dept}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-ink-muted block">Stock health index</span>
            <span className="font-mono text-[13px] font-bold text-green">94.8% Nominal</span>
          </div>
          <div className="h-8 w-px bg-line hidden sm:block" />
          <Link
            to="/items"
            className="px-3 py-1.5 bg-paper hover:bg-slate-100 border border-line rounded text-[12px] font-medium text-ink transition-colors"
          >
            Open stock register
          </Link>
        </div>
      </div>

      {/* AI/ML Predictive Stock-Out & Consumption Run-Rate Forecast */}
      {forecastData && (forecastData.critical_count > 0 || forecastData.warning_count > 0 || forecastData.cross_dept_anomalies?.length > 0) && (
        <div className="bg-surface rounded-panel border border-blue-200 overflow-hidden shadow-xs">
          <div className="p-3.5 px-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 border-b border-blue-200 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-[13px] font-semibold text-ink">
                Predictive stock-out & reorder intelligence
              </h3>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-primary border border-blue-300 font-mono font-medium">
                ML run-rate
              </span>
            </div>
            <div className="text-[11px] text-ink-muted flex items-center gap-3">
              <span>Analysis window: 60 days</span>
              <span>•</span>
              <span>Safety stock service level: 95%</span>
            </div>
          </div>

          {/* Cross-Department Duplicate Indents Alert */}
          {forecastData.cross_dept_anomalies?.length > 0 && (
            <div className="p-3 bg-amber/5 border-b border-amber/20 flex items-start gap-2.5 text-[12px] text-ink">
              <AlertTriangle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber">Cross-department requisition anomaly:</span>
                <span className="ml-1.5 text-ink-muted">
                  {forecastData.cross_dept_anomalies[0].recommendation} ({forecastData.cross_dept_anomalies[0].name} requested by {forecastData.cross_dept_anomalies[0].departments.join(' & ')}).
                </span>
              </div>
            </div>
          )}

          {/* Top Predicted Stock-outs */}
          <div className="p-3 divide-y divide-line/60">
            {forecastData.forecasts
              .filter((f) => ['STOCKOUT', 'CRITICAL', 'WARNING'].includes(f.urgency))
              .slice(0, 3)
              .map((f) => (
                <div key={f.item_id} className="py-2.5 flex items-center justify-between text-[13px] gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-ink-muted">[{f.code}]</span>
                      <span className="font-medium text-ink truncate">{f.name}</span>
                      <span
                        className={`text-[10px] font-medium px-1.5 py-0.2 rounded ${
                          f.urgency === 'CRITICAL' || f.urgency === 'STOCKOUT'
                            ? 'bg-red-50 text-red border border-red-200'
                            : 'bg-amber-50 text-amber border border-amber-200'
                        }`}
                      >
                        {f.urgency === 'STOCKOUT' ? 'Exhausted' : `${f.days_of_supply} days supply remaining`}
                      </span>
                    </div>
                    <p className="text-[11px] text-ink-muted mt-0.5">
                      Current stock: <strong className="text-ink font-mono">{f.current_stock} {f.unit}</strong> • Average burn rate: <strong className="text-ink font-mono">{f.daily_run_rate} {f.unit}/day</strong> • Economic order qty (EOQ): <strong className="text-ink font-mono">{f.economic_order_qty} {f.unit}</strong> • Projected exhaustion: <strong className="text-ink font-mono">{f.stockout_date || 'N/A'}</strong>
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => navigate('/indents', { state: { prefillItem: { id: f.item_id, name: f.name, unit: f.unit } } })}
                      className="px-2.5 h-7 text-[12px] font-semibold text-primary bg-primary-light hover:bg-blue-100 rounded border border-blue-200"
                    >
                      Draft indent
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ROW 1: "Needs your attention" panel (role-aware, top priority) */}
      <div className="bg-surface rounded-panel border border-line overflow-hidden shadow-sm">
        <div className="p-3.5 px-4 border-b border-line bg-paper flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-ink">Needs your attention</h2>
          <span className="text-[12px] text-ink-muted">
            {isStore && `${attention.low_stock?.length || 0} items low, ${attention.open_pos?.length || 0} POs waiting`}
            {isDirector && `${attention.pending_indents?.length || 0} indents, ${attention.pending_writeoffs?.length || 0} write-offs pending`}
            {isDept && `Last 5 requisitions for ${user.dept || 'your department'}`}
          </span>
        </div>

        <div className="p-4">
          {/* Store Officer Attention View */}
          {isStore && (
            <div className="space-y-4">
              {attention.low_stock?.length === 0 && attention.open_pos?.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-ink-muted">
                  No critical shortages or pending deliveries.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Low Stock Items */}
                  <div className="border border-line rounded p-3 bg-surface">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-ink-muted">
                        Stock below minimum threshold ({attention.low_stock?.length || 0})
                      </span>
                      <Link to="/items?low=true" className="text-[12px] text-primary hover:underline font-medium">
                        View all
                      </Link>
                    </div>

                    <div className="divide-y divide-line/60">
                      {attention.low_stock?.slice(0, 4).map((i) => (
                        <div key={i.id} className="py-2 flex items-center justify-between text-[13px]">
                          <div className="truncate pr-2">
                            <span className="font-mono text-[11px] text-ink-muted mr-1.5">[{i.code}]</span>
                            <button
                              type="button"
                              onClick={() => openItemDrawer?.(i)}
                              className="font-medium text-ink hover:text-primary transition-colors text-left"
                            >
                              {i.name}
                            </button>
                            <span className="text-[12px] text-amber font-medium block">
                              {i.qty} {i.unit} in stock (deficiency: {i.deficit} {i.unit})
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => navigate('/indents', { state: { prefillItem: i } })}
                            className="px-2.5 h-7 text-[12px] font-semibold text-primary bg-primary-light hover:bg-blue-100 rounded border border-blue-200 shrink-0"
                          >
                            Raise indent
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Open POs waiting for goods */}
                  <div className="border border-line rounded p-3 bg-surface">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-semibold text-ink-muted">
                        Purchase orders awaiting goods receipt ({attention.open_pos?.length || 0})
                      </span>
                      <Link to="/purchase-orders" className="text-[12px] text-primary hover:underline font-medium">
                        View all
                      </Link>
                    </div>

                    <div className="divide-y divide-line/60">
                      {attention.open_pos?.length === 0 ? (
                        <div className="py-4 text-[12px] text-ink-muted">No open orders.</div>
                      ) : (
                        attention.open_pos?.slice(0, 4).map((po) => (
                          <div key={po.id} className="py-2 flex items-center justify-between text-[13px]">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold text-ink">
                                  {po.no}
                                </span>
                                <StatusBadge status={po.status} />
                              </div>
                              <span className="text-[12px] text-ink-muted block mt-0.5">
                                Vendor: {po.vendor} • {formatRupees(po.total)}
                              </span>
                            </div>

                            <Link
                              to="/purchase-orders"
                              className="px-2.5 h-7 text-[12px] font-semibold text-green bg-green-light hover:bg-emerald-100 rounded border border-green-border flex items-center"
                            >
                              Receive goods
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Director Attention View */}
          {isDirector && (
            <div className="space-y-4">
              {attention.pending_indents?.length === 0 && attention.pending_writeoffs?.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-ink-muted">
                  All requisitions and condemnations have been sanctioned.
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Pending Requisitions */}
                  <div className="border border-line rounded p-3 bg-surface">
                    <span className="text-[12px] font-semibold text-ink-muted block mb-2">
                      Requisitions pending sanction ({attention.pending_indents?.length || 0})
                    </span>

                    <div className="divide-y divide-line/60">
                      {attention.pending_indents?.map((ind) => (
                        <div key={ind.id} className="py-2.5 flex items-center justify-between text-[13px]">
                          <div>
                            <span className="font-mono text-[11px] font-semibold text-ink mr-2">[{ind.no}]</span>
                            <span className="font-medium text-ink">{ind.dept}</span>
                            <span className="text-[11px] text-ink-muted block mt-0.5">
                              {ind.lines_count} lines • Raised by {ind.by}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDecisionModal({ isOpen: true, type: 'indent', id: ind.id, no: ind.no, isApprove: false })}
                              className="px-2 h-7 text-[12px] text-red border border-red-border hover:bg-red-light rounded font-medium"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => setDecisionModal({ isOpen: true, type: 'indent', id: ind.id, no: ind.no, isApprove: true })}
                              className="px-2.5 h-7 text-[12px] text-white bg-green hover:bg-green/90 rounded font-semibold"
                            >
                              Approve
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pending Write-offs */}
                  <div className="border border-line rounded p-3 bg-surface">
                    <span className="text-[12px] font-semibold text-ink-muted block mb-2">
                      Write-offs pending sanction ({attention.pending_writeoffs?.length || 0})
                    </span>

                    <div className="divide-y divide-line/60">
                      {attention.pending_writeoffs?.map((wo) => (
                        <div key={wo.id} className="py-2.5 flex items-center justify-between text-[13px]">
                          <div>
                            <span className="font-mono text-[11px] font-semibold text-ink mr-2">[{wo.no}]</span>
                            <span className="font-medium text-ink">{wo.item}</span>
                            <span className="text-[11px] text-amber block mt-0.5">
                              Condemn {wo.qty} {wo.unit} ({wo.reason})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setDecisionModal({ isOpen: true, type: 'writeoff', id: wo.id, no: wo.no, isApprove: false })}
                              className="px-2 h-7 text-[12px] text-red border border-red-border hover:bg-red-light rounded font-medium"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={() => setDecisionModal({ isOpen: true, type: 'writeoff', id: wo.id, no: wo.no, isApprove: true })}
                              className="px-2.5 h-7 text-[12px] text-white bg-primary hover:bg-primary-hover rounded font-semibold"
                            >
                              Sanction
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Department Staff Attention View */}
          {isDept && (
            <div>
              {attention.my_indents?.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-ink-muted">
                  No requisitions raised by your department yet.
                </div>
              ) : (
                <div className="divide-y divide-line/60">
                  {attention.my_indents?.map((ind) => (
                    <div key={ind.id} className="py-2.5 flex items-center justify-between text-[13px]">
                      <div>
                        <span className="font-mono text-[12px] font-semibold text-ink mr-2">{ind.no}</span>
                        <StatusBadge status={ind.status} />
                        <span className="text-[11px] text-ink-muted block mt-0.5">
                          {ind.lines_count} items requested on {new Date(ind.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <WorkflowStrip status={ind.status} compact />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ROW 2: High-density Ergonomic Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Catalog Items */}
        <div className="bg-surface p-4 rounded-panel border border-line hover:border-line-hover transition-colors shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-ink-muted">Catalog items</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-primary border border-blue-200">
              Active stock
            </span>
          </div>
          <div className="my-2">
            <span className="text-[24px] font-semibold text-ink tabular-nums block">
              {data.total_items}
            </span>
            <span className="text-[11px] text-ink-subtle">
              Across 5 store categories
            </span>
          </div>
          <Link to="/items" className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1 pt-2 border-t border-line/60">
            <span>View stock register</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 2: Stock Valuation */}
        <div className="bg-surface p-4 rounded-panel border border-line hover:border-line-hover transition-colors shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-ink-muted">Stock valuation</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-green border border-green-200">
              WAC Basis
            </span>
          </div>
          <div className="my-2">
            <span className="text-[24px] font-semibold text-ink tabular-nums block">
              {formatRupees(data.stock_value)}
            </span>
            <span className="text-[11px] text-ink-subtle">
              Weighted Average Cost
            </span>
          </div>
          <Link to="/reports" className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1 pt-2 border-t border-line/60">
            <span>View stock statement</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 3: Below Minimum */}
        <div className="bg-surface p-4 rounded-panel border border-line hover:border-line-hover transition-colors shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-ink-muted">Below minimum</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
              data.low_stock_count > 0 
                ? 'bg-amber-50 text-amber border border-amber-200' 
                : 'bg-emerald-50 text-green border border-green-200'
            }`}>
              {data.low_stock_count > 0 ? 'Refill needed' : 'Nominal'}
            </span>
          </div>
          <div className="my-2">
            <span className={`text-[24px] font-semibold tabular-nums block ${
              data.low_stock_count > 0 ? 'text-amber' : 'text-ink'
            }`}>
              {data.low_stock_count || 0}
            </span>
            <span className="text-[11px] text-ink-subtle">
              Threshold alert triggers
            </span>
          </div>
          <Link to="/items?low=true" className="text-[11px] text-amber hover:underline font-medium flex items-center gap-1 pt-2 border-t border-line/60">
            <span>{data.low_stock_count || 0} items need refill</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Card 4: Open POs */}
        <div className="bg-surface p-4 rounded-panel border border-line hover:border-line-hover transition-colors shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-ink-muted">Open purchase orders</span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-blue-700 border border-blue-200">
              Inward transit
            </span>
          </div>
          <div className="my-2">
            <span className="text-[24px] font-semibold text-ink tabular-nums block">
              {data.open_pos || 0}
            </span>
            <span className="text-[11px] text-ink-subtle">
              Awaiting GRN entry
            </span>
          </div>
          <Link to="/purchase-orders" className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1 pt-2 border-t border-line/60">
            <span>Track shipments</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* ROW 3: Two charts side-by-side (Horizontal category valuation + Grouped weekly in vs out) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Horizontal Bar Chart: Category Valuation */}
        <div className="bg-surface p-4 rounded-panel border border-line">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Stock value by category</h3>
              <span className="text-[12px] text-ink-muted">Sorted high to low</span>
            </div>
            <span className="text-[13px] font-semibold text-ink tabular-nums">
              Total {formatRupees(data.stock_value)}
            </span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data.value_by_category || []}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="2 2" horizontal={false} stroke="#E3E6EC" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: '#6B7280' }}
                  tickFormatter={(val) => formatRupees(val)}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#14213D' }}
                  width={110}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Valuation']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E3E6EC',
                    borderRadius: '6px',
                    fontSize: '12px',
                    color: '#14213D',
                  }}
                />
                <Bar dataKey="value" fill="#1F3A8A" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grouped Bar Chart: Weekly In vs Out (8 weeks, strictly no OPENING stock spike) */}
        <div className="bg-surface p-4 rounded-panel border border-line">
          <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
            <div>
              <h3 className="text-[14px] font-semibold text-ink">Weekly material flow</h3>
              <span className="text-[12px] text-ink-muted">Inward (GRN) vs Outward (Dispatches) across 8 weeks</span>
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="flex items-center gap-1.5 font-medium text-ink">
                <span className="w-2.5 h-2.5 bg-green rounded-sm" /> In
              </span>
              <span className="flex items-center gap-1.5 font-medium text-ink">
                <span className="w-2.5 h-2.5 bg-primary rounded-sm" /> Out
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            {(!data.weekly_flow || data.weekly_flow.length === 0) ? (
              <div className="h-full flex items-center justify-center text-[13px] text-ink-muted">
                No material receipts or issues in the last 8 weeks.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weekly_flow} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#E3E6EC" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} />
                  <Tooltip
                    formatter={(val, name) => [`${val} units`, name === 'in' ? 'Material in' : 'Material out']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E3E6EC',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#14213D',
                    }}
                  />
                  <Bar dataKey="in" fill="#15803D" radius={[3, 3, 0, 0]} barSize={12} />
                  <Bar dataKey="out" fill="#1F3A8A" radius={[3, 3, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ROW 4: Circulars & Notices (Matching GBU Website Tenders/Notices style) */}
      <div className="bg-surface rounded-panel border border-line p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <h3 className="text-[14px] font-semibold text-ink">University Store Circulars & Notices</h3>
            <span className="text-[11px] text-ink-muted bg-paper px-2 py-0.5 rounded border border-line font-medium hidden sm:inline">
              Stores & Purchase Office
            </span>
          </div>

          {isOfficer && (
            <button
              type="button"
              onClick={() => setIsNoticeModalOpen(true)}
              className="h-7 px-2.5 rounded bg-primary hover:bg-primary-hover text-white text-[12px] font-medium transition-colors inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Post notice</span>
            </button>
          )}
        </div>

        {notices.length === 0 ? (
          <div className="py-6 text-center text-[13px] text-ink-muted">
            No active store circulars at this moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {notices.map((n) => (
              <div
                key={n.id}
                className="p-3.5 rounded border border-line bg-paper/50 hover:bg-paper transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[10px] font-semibold text-primary bg-primary-light px-1.5 py-0.5 rounded border border-blue-200">
                      {n.ref_no || 'GBU/S&P/CIRCULAR'}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-ink-muted">
                      <span className="tabular-nums">
                        {new Date(n.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      {isOfficer && (
                        <button
                          type="button"
                          onClick={() => handleDeleteNotice(n.id)}
                          className="text-ink-subtle hover:text-red p-0.5"
                          title="Archive notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h4 className="font-serif text-[14px] font-semibold text-ink leading-snug">
                    {n.title}
                  </h4>
                  <p className="text-[12px] text-ink-muted mt-1.5 leading-relaxed">
                    {n.content}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-line/60 text-[11px] text-ink-subtle flex items-center justify-between">
                  <span>Issued by: <strong className="text-ink">{n.by}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ROW 5: Recent activity timeline list */}
      <div className="bg-surface rounded-panel border border-line p-4">
        <div className="flex items-center justify-between pb-3 border-b border-line mb-3">
          <h3 className="text-[14px] font-semibold text-ink">Recent store activity</h3>
          <Link to="/reports" className="text-[12px] text-primary hover:underline font-medium">
            Export log →
          </Link>
        </div>

        <div className="divide-y divide-line/60">
          {(!data.recent || data.recent.length === 0) ? (
            <div className="py-4 text-[13px] text-ink-muted text-center">No recent activity.</div>
          ) : (
            data.recent.slice(0, 6).map((txn) => (
              <div key={txn.id} className="py-2.5 flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-3">
                  <StatusBadge status={txn.kind} />
                  <div>
                    <span className="font-medium text-ink">{txn.item}</span>
                    <span className="text-[11px] text-ink-muted block mt-0.5">
                      {txn.note} • By {txn.by}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`tabular-nums font-semibold ${txn.kind === 'IN' ? 'text-green' : 'text-ink'}`}>
                    {txn.kind === 'IN' ? `+${txn.qty}` : `-${txn.qty}`} {txn.unit}
                  </span>
                  <span className="text-[11px] text-ink-subtle block">
                    {new Date(txn.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Inline Approval Confirmation Modal */}
      <ConfirmModal
        isOpen={decisionModal.isOpen}
        onClose={() => setDecisionModal({ ...decisionModal, isOpen: false })}
        onConfirm={handleDecisionConfirm}
        title={`${decisionModal.isApprove ? 'Approve' : 'Reject'} ${decisionModal.no}`}
        summary={
          decisionModal.type === 'indent'
            ? decisionModal.isApprove
              ? 'Sanctioning this requisition will permit Stores to generate a Purchase Order.'
              : 'Rejecting this requisition will return it to the requesting department.'
            : decisionModal.isApprove
            ? 'Sanctioning this write-off will immediately deduct the physical items from inventory and record a ledger entry.'
            : 'Rejecting this write-off will retain the materials on store books.'
        }
        confirmText={decisionModal.isApprove ? 'Confirm approval' : 'Confirm rejection'}
        confirmVariant={decisionModal.isApprove ? 'success' : 'danger'}
        remarkLabel="Sanction remarks"
      />

      {/* Post Official Notice Modal */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-surface rounded-panel max-w-lg w-full border border-line shadow-sm overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[18px] font-semibold text-ink">Publish Store Notice / Circular</h3>
                <p className="text-[12px] text-ink-muted">Announcement visible across the stores portal</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNoticeModalOpen(false)}
                className="text-ink-muted hover:text-ink p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Circular Title *
                </label>
                <input
                  type="text"
                  required
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  placeholder="e.g. Schedule for Annual Stock Verification 2026"
                  className="w-full h-9 text-[13px] px-3 rounded border border-line focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Reference Number (optional)
                </label>
                <input
                  type="text"
                  value={newNotice.ref_no}
                  onChange={(e) => setNewNotice({ ...newNotice, ref_no: e.target.value })}
                  placeholder="e.g. GBU/S&P/2026/NOT-086"
                  className="w-full h-9 text-[13px] px-3 rounded border border-line focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Circular Content / Directives *
                </label>
                <textarea
                  required
                  rows={4}
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  placeholder="Enter details of circular directives for schools, labs, and vendors..."
                  className="w-full text-[13px] p-2.5 rounded border border-line focus:border-primary outline-none placeholder:text-ink-subtle"
                />
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="h-8 px-3 text-[13px] text-ink-muted hover:bg-paper rounded border border-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotice}
                  className="h-8 px-4 bg-primary hover:bg-primary-hover text-surface text-[13px] font-medium rounded transition-colors disabled:opacity-50"
                >
                  {submittingNotice ? 'Publishing...' : 'Publish circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
