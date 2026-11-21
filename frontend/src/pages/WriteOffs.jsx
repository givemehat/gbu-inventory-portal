import React, { useEffect, useState } from 'react';
import {
  Trash2,
  Plus,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Package,
  Calendar,
  Layers,
  FileText,
  X,
  ShieldAlert
} from 'lucide-react';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

export default function WriteOffs() {
  const [writeoffs, setWriteoffs] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Request Modal State
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    woId: null,
    isApprove: true,
    woNo: '',
  });

  const user = getCurrentUser() || {};
  const isApprover = ['approver', 'admin'].includes(user.role);
  const isStore = ['store', 'admin'].includes(user.role);
  const toast = useToast();

  const commonReasons = [
    'Damaged by moisture / water leakage',
    'Shelf-life expired / dried up',
    'Damaged during physical handling',
    'Obsolete specification / unserviceable',
  ];

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getWriteOffs(),
      api.getItems(),
    ])
      .then(([woData, itemsData]) => {
        setWriteoffs(woData);
        setItems(itemsData);
        if (itemsData.length > 0 && !selectedItemId) {
          setSelectedItemId(itemsData[0].id);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedItem = items.find((i) => i.id === Number(selectedItemId));
  const numericQty = Number(qty) || 0;
  const isOverStock = selectedItem && numericQty > selectedItem.qty;

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) {
      toast.error('Please select an item.');
      return;
    }
    if (numericQty <= 0) {
      toast.error('Quantity to write off must be greater than zero.');
      return;
    }
    if (isOverStock) {
      toast.error(`Only ${selectedItem.qty} ${selectedItem.unit} in stock.`);
      return;
    }
    if (!reason.trim()) {
      toast.error('Please specify a valid condemnation reason.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createWriteOff({
        item_id: selectedItem.id,
        qty: numericQty,
        reason: reason.trim(),
      });
      toast.success(`Write-off proposal ${res.no} submitted for Director sanction.`);
      setIsRequestOpen(false);
      setQty('');
      setReason('');
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDecision = (wo, isApprove) => {
    setDecisionModal({
      isOpen: true,
      woId: wo.id,
      isApprove,
      woNo: wo.no,
    });
  };

  const handleConfirmDecision = async (remark) => {
    try {
      await api.decideWriteOff(decisionModal.woId, decisionModal.isApprove, remark);
      toast.success(
        `Write-off ${decisionModal.woNo} has been ${decisionModal.isApprove ? 'APPROVED (Stock deducted)' : 'REJECTED'}.`
      );
      loadData();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const pendingCount = writeoffs.filter((w) => w.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Material Condemnation & Write-offs</h2>
          <p className="text-xs text-slate-500">
            Formal disposal protocol for expired, obsolete, or physically damaged store items.
          </p>
        </div>

        {isStore && (
          <button
            onClick={() => setIsRequestOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-900/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Request Write-off</span>
          </button>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-900">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-amber-950">University Stores Audit Rule:</p>
          <p className="mt-0.5 text-amber-800 leading-relaxed">
            Store inventory is NOT reduced upon raising a write-off proposal. The system ledger entry and physical deduction occur strictly upon Director sanction.
          </p>
        </div>
      </div>

      {/* Write-offs List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-6 h-6 border-2 border-gbu-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Loading write-off records...</span>
        </div>
      ) : writeoffs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Trash2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Write-off Proposals</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No damaged or expired goods proposals on record.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {writeoffs.map((wo) => (
            <div
              key={wo.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {wo.no}
                      </span>
                      <StatusBadge status={wo.status} />
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Material: <strong className="text-slate-900">{wo.item}</strong> • Proposed by: {wo.by}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-base font-extrabold text-rose-700 block">
                    {wo.qty} {wo.unit}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {new Date(wo.at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Reason / Remarks */}
              <div className="mt-3.5 space-y-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-700">Reason for Condemnation:</span>
                  <p className="text-slate-600 mt-0.5">{wo.reason}</p>
                </div>

                {wo.remark && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                    <span className="font-semibold text-amber-800">
                      Director Decision Remark ({wo.decided_by || 'Director S&P'}):
                    </span>
                    <p className="mt-0.5 text-amber-950">{wo.remark}</p>
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              {isApprover && wo.status === 'PENDING' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => handleOpenDecision(wo, false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject Proposal</span>
                  </button>
                  <button
                    onClick={() => handleOpenDecision(wo, true)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve & Write Off Stock</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Request Write-off Modal */}
      {isRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Propose Material Write-off</h3>
                <p className="text-xs text-slate-500">Requires sanction from Director, Stores & Purchase</p>
              </div>
              <button onClick={() => setIsRequestOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-5 sm:p-6 space-y-4">
              {/* Item Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Store Item *</label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none bg-white"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      [{i.code}] {i.name} ({i.qty} {i.unit} in stock)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Quantity to Condemn *</label>
                  {selectedItem && (
                    <span className="text-[11px] text-slate-500">
                      Available in Store: <strong className="text-slate-800">{selectedItem.qty} {selectedItem.unit}</strong>
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0.1"
                  max={selectedItem?.qty || 999999}
                  step="any"
                  required
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder={`Max: ${selectedItem?.qty || 0}`}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                />
                {isOverStock && (
                  <p className="text-xs text-rose-600 mt-1">
                    Cannot condemn {numericQty}. Only {selectedItem.qty} {selectedItem.unit} currently in stock.
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condemnation Justification / Reason *</label>
                {/* Quick tags */}
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {commonReasons.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReason(r)}
                      className="px-2 py-0.5 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Detailed inspection findings and cause of material condemnation..."
                  rows={3}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRequestOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isOverStock || numericQty <= 0}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      <ConfirmModal
        isOpen={decisionModal.isOpen}
        onClose={() => setDecisionModal({ ...decisionModal, isOpen: false })}
        onConfirm={handleConfirmDecision}
        title={decisionModal.isApprove ? `Sanction Write-off ${decisionModal.woNo}` : `Reject Write-off ${decisionModal.woNo}`}
        message={
          decisionModal.isApprove
            ? `Sanctioning this condemnation will immediately deduct the items from central university inventory and log a permanent WRITEOFF ledger transaction.`
            : `Are you sure you want to reject write-off ${decisionModal.woNo}? Physical items will remain on store books.`
        }
        confirmText={decisionModal.isApprove ? 'Sanction & Deduct Stock' : 'Confirm Rejection'}
        confirmVariant={decisionModal.isApprove ? 'danger' : 'primary'}
        remarkLabel="Director Sanction / Rejection Remark"
        remarkPlaceholder="e.g. Inspected by board on 24 Nov 2026, confirmed unserviceable"
      />
    </div>
  );
}
