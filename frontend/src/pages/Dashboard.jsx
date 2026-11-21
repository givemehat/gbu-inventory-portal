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
import { Bell, Plus, Trash2, X, ChevronRight } from 'lucide-react';

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
    ])
      .then(([res, noticesData]) => {
        setData(res);
        setNotices(noticesData || []);
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
                      <span className="text-[12px] font-semibold uppercase text-ink-muted tracking-wide">
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
                      <span className="text-[12px] font-semibold uppercase text-ink-muted tracking-wide">
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
                    <span className="text-[12px] font-semibold uppercase text-ink-muted tracking-wide block mb-2">
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
                    <span className="text-[12px] font-semibold uppercase text-ink-muted tracking-wide block mb-2">
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

      {/* ROW 2: Compact stat row (4 figures, plain white surface, 1px border, monochrome) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface p-4 rounded border border-line">
          <span className="text-[12px] font-medium text-ink-muted block">Catalog items</span>
          <span className="text-[22px] font-semibold text-ink tabular-nums block mt-1">
            {data.total_items}
          </span>
          <Link to="/items" className="text-[11px] text-primary hover:underline font-medium mt-1 inline-block">
            View stock register →
          </Link>
        </div>

        <div className="bg-surface p-4 rounded border border-line">
          <span className="text-[12px] font-medium text-ink-muted block">Stock valuation</span>
          <span className="text-[22px] font-semibold text-ink tabular-nums block mt-1">
            {formatRupees(data.stock_value)}
          </span>
          <Link to="/reports" className="text-[11px] text-primary hover:underline font-medium mt-1 inline-block">
            View stock statement →
          </Link>
        </div>

        <div className="bg-surface p-4 rounded border border-line">
          <span className="text-[12px] font-medium text-ink-muted block">Below minimum</span>
          <span className="text-[22px] font-semibold text-amber tabular-nums block mt-1">
            {data.low_stock_count || 0}
          </span>
          <Link to="/items?low=true" className="text-[11px] text-amber hover:underline font-medium mt-1 inline-block">
            {data.low_stock_count} items need refill →
          </Link>
        </div>

        <div className="bg-surface p-4 rounded border border-line">
          <span className="text-[12px] font-medium text-ink-muted block">Open purchase orders</span>
          <span className="text-[22px] font-semibold text-ink tabular-nums block mt-1">
            {data.open_pos || 0}
          </span>
          <Link to="/purchase-orders" className="text-[11px] text-primary hover:underline font-medium mt-1 inline-block">
            Track shipments →
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
                <p className="text-[12px] text-ink-muted">Official notification visible across university stores portal</p>
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
