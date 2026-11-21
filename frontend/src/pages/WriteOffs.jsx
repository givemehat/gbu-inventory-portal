import React, { useEffect, useState } from 'react';
import {
  Trash2,
  Plus,
  AlertCircle,
  X,
  CheckCircle2,
  XCircle,
  Printer,
} from 'lucide-react';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import Combobox from '../components/Combobox';
import { useToast } from '../components/Toast';
import { assetUrl } from '../lib/utils';

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
  const [printWo, setPrintWo] = useState(null);

  // Decision Modal State
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    wo: null,
    isApprove: true,
  });

  const user = getCurrentUser() || {};
  const isApprover = ['approver', 'admin'].includes(user.role);
  const isStore = ['store', 'admin'].includes(user.role);
  const toast = useToast();

  const commonReasons = [
    'Damaged by moisture or water leakage',
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
      toast.success(`Write-off proposal ${res.no} submitted for Director sanction`);
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
      wo,
      isApprove,
    });
  };

  const handleConfirmDecision = async (remark) => {
    if (!decisionModal.wo) return;
    try {
      await api.decideWriteOff(decisionModal.wo.id, decisionModal.isApprove, remark);
      toast.success(
        `Write-off ${decisionModal.wo.no} ${decisionModal.isApprove ? 'sanctioned (stock deducted)' : 'rejected'}`
      );
      loadData();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium text-ink leading-tight">
            Condemnations & Write-offs
          </h1>
          <p className="text-[14px] text-ink-muted mt-1">
            Formal disposal protocol for expired, obsolete, or physically damaged store inventory.
          </p>
        </div>

        {isStore && (
          <button
            onClick={() => setIsRequestOpen(true)}
            className="h-9 px-4 rounded bg-red hover:bg-red/90 text-surface font-medium text-[14px] transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Propose write-off</span>
          </button>
        )}
      </div>

      {/* Protocol Note */}
      <div className="bg-paper border border-line rounded-panel p-4 text-[13px] text-ink flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-amber shrink-0 mt-0.5" />
        <div>
          <span className="font-medium text-ink">Stores audit protocol: </span>
          Inventory stock is not reduced upon raising a write-off proposal. Physical stock deduction and ledger entries occur strictly upon Director sanction.
        </div>
      </div>

      {/* Write-offs List */}
      {loading ? (
        <div className="py-20 text-center text-[13px] text-ink-muted">
          Loading write-off records...
        </div>
      ) : writeoffs.length === 0 ? (
        <div className="bg-surface rounded-panel border border-line p-12 text-center text-ink-muted">
          <Trash2 className="w-10 h-10 text-ink-subtle mx-auto mb-2 stroke-[1.5]" />
          <p className="text-[14px] font-medium text-ink">No write-off proposals</p>
          <p className="text-[12px] text-ink-muted mt-0.5">
            No damaged or expired goods proposals on record.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {writeoffs.map((wo) => (
            <div
              key={wo.id}
              className="bg-surface rounded-panel border border-line p-5 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] font-semibold text-ink px-2 py-0.5 rounded bg-paper border border-line">
                    {wo.no}
                  </span>
                  <StatusBadge status={wo.status} />
                  <span className="text-[13px] text-ink">
                    Item: <span className="font-medium">{wo.item}</span>
                  </span>
                </div>

                <div className="flex items-center gap-3 text-[12px] text-ink-muted">
                  <span className="text-[14px] font-semibold text-red tabular-nums">
                    -{wo.qty} {wo.unit}
                  </span>
                  <span>•</span>
                  <span>Proposed by: <span className="text-ink">{wo.by}</span></span>
                  <span>•</span>
                  <span className="tabular-nums">
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
              <div className="mt-3 space-y-2">
                <div className="p-3 bg-paper rounded border border-line text-[13px]">
                  <span className="font-medium text-ink">Reason for condemnation: </span>
                  <span className="text-ink-muted">{wo.reason}</span>
                </div>

                {wo.remark && (
                  <div className="p-3 bg-amber/5 rounded border border-amber/20 text-[13px] text-amber">
                    <span className="font-medium">Director decision remark: </span>
                    <span>{wo.remark}</span>
                    {wo.decided_by && (
                      <span className="text-[11px] text-ink-muted ml-2">({wo.decided_by})</span>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons footer */}
              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setPrintWo(wo)}
                  className="h-8 px-2.5 rounded border border-line text-ink hover:bg-paper text-[12px] font-medium transition-colors inline-flex items-center gap-1"
                  title="Print Condemnation Proposal (Form S&P-04)"
                >
                  <Printer className="w-3.5 h-3.5 text-primary" />
                  <span>Print proposal</span>
                </button>

                {isApprover && wo.status === 'PENDING' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenDecision(wo, false)}
                      className="h-8 px-3 rounded border border-line text-red hover:bg-red/5 text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject proposal</span>
                    </button>
                    <button
                      onClick={() => handleOpenDecision(wo, true)}
                      className="h-8 px-3.5 rounded bg-red hover:bg-red/90 text-surface text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sanction write-off</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Propose Write-off Modal */}
      {isRequestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-surface rounded-panel max-w-lg w-full border border-line shadow-sm overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[18px] font-semibold text-ink">Propose Material Write-off</h3>
                <p className="text-[12px] text-ink-muted">Submit condemnation request for Director sanction</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRequestOpen(false)}
                className="text-ink-muted hover:text-ink p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1.5">
                  Select store item
                </label>
                <Combobox
                  items={items}
                  value={selectedItemId}
                  onChange={(id) => setSelectedItemId(id)}
                  placeholder="Select item..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-medium text-ink-muted">Quantity to condemn</label>
                  {selectedItem && (
                    <span className="text-[12px] text-ink-muted">
                      In store: <span className="font-medium text-ink tabular-nums">{selectedItem.qty} {selectedItem.unit}</span>
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
                  placeholder={selectedItem ? `Max: ${selectedItem.qty}` : 'Quantity'}
                  className="w-full h-9 text-[14px] px-3 rounded border border-line focus:border-primary outline-none tabular-nums"
                />
                {isOverStock && (
                  <p className="text-[12px] text-red mt-1">
                    Cannot condemn {numericQty}. Only {selectedItem.qty} {selectedItem.unit} currently in stock.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Condemnation reason or justification
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {commonReasons.map((r, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReason(r)}
                      className="px-2 py-0.5 text-[11px] bg-paper hover:bg-line text-ink-muted rounded border border-line transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Inspection findings and cause for material condemnation..."
                  rows={3}
                  className="w-full text-[13px] p-2.5 rounded border border-line focus:border-primary outline-none placeholder:text-ink-subtle"
                />
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestOpen(false)}
                  className="h-9 px-4 text-[13px] font-medium text-ink-muted hover:bg-paper rounded border border-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || isOverStock || numericQty <= 0}
                  className="h-9 px-4 bg-red hover:bg-red/90 text-surface text-[13px] font-medium rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Propose write-off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      <ConfirmModal
        isOpen={decisionModal.isOpen}
        onClose={() => setDecisionModal({ ...decisionModal, isOpen: false, wo: null })}
        onConfirm={handleConfirmDecision}
        title={decisionModal.isApprove ? `Sanction Write-off ${decisionModal.wo?.no}` : `Reject Write-off ${decisionModal.wo?.no}`}
        summary={
          decisionModal.isApprove
            ? `Stock of ${decisionModal.wo?.item} will permanently reduce by ${decisionModal.wo?.qty} ${decisionModal.wo?.unit}. A ledger entry 'WRITEOFF' will be permanently recorded in the university stock register.`
            : `Proposal will be rejected. The items remain on store registers without change.`
        }
        confirmText={decisionModal.isApprove ? 'Sanction & deduct stock' : 'Reject proposal'}
        confirmVariant={decisionModal.isApprove ? 'danger' : 'primary'}
        remarkLabel="Director sanction remarks"
        remarkPlaceholder="e.g. Inspected by board, confirmed unserviceable and approved for disposal"
        requireRemark={!decisionModal.isApprove}
      />

      {/* Printable Condemnation Proposal Modal */}
      {printWo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-surface rounded-panel max-w-3xl w-full border border-line shadow-xl overflow-hidden my-6">
            <div className="no-print p-4 border-b border-line bg-paper flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-bold text-red bg-red/10 px-2 py-0.5 rounded border border-red/20">
                  FORM S&P-04
                </span>
                <span className="font-semibold text-ink text-[14px]">
                  Material Condemnation Proposal ({printWo.no})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded bg-primary hover:bg-primary-hover text-white text-[12px] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Proposal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintWo(null)}
                  className="p-1.5 text-ink-muted hover:text-ink rounded"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-8 sm:p-12 space-y-6 bg-surface print-container">
              {/* Header */}
              <div className="border-b-2 border-ink pb-4 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img
                    src={assetUrl('gbu-logo.jpg')}
                    alt="GBU Logo"
                    className="w-14 h-14 rounded-full object-contain border border-line"
                  />
                  <div className="text-left">
                    <h2 className="font-serif text-[22px] font-semibold text-ink tracking-tight leading-tight">
                      Gautam Buddha University
                    </h2>
                    <p className="text-[11px] text-ink-muted">
                      Opp. Yamuna Expressway, Greater Noida, Gautam Buddha Nagar, UP — 201312
                    </p>
                  </div>
                </div>
                <div className="mt-2 py-1 px-4 bg-paper rounded border border-line inline-block text-[12px] font-medium text-ink">
                  Stores & Purchase Department • Material Condemnation & Write-off Proposal (S&P-04 (sample))
                </div>
              </div>

              {/* Proposal Meta */}
              <div className="grid grid-cols-3 gap-4 text-[12px] text-ink pb-3 border-b border-line bg-paper/50 p-3 rounded">
                <div>
                  <span className="text-ink-muted block text-[11px]">Proposal ref no:</span>
                  <span className="font-mono font-bold text-red">{printWo.no}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Item description:</span>
                  <span className="font-semibold">{printWo.item}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Item code:</span>
                  <span className="font-mono font-medium">{printWo.item_code || '—'}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Date submitted:</span>
                  <span className="font-medium">
                    {new Date(printWo.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Proposed by:</span>
                  <span className="font-medium">{printWo.by}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Sanction status:</span>
                  <span className="font-bold text-ink">{printWo.status}</span>
                </div>
              </div>

              {/* Condemnation Particulars */}
              <div className="space-y-3 text-[12px]">
                <div className="p-3 bg-paper rounded border border-line">
                  <span className="font-semibold text-ink block text-[11px]">Quantity proposed for condemnation:</span>
                  <span className="font-mono font-bold text-[15px] text-red mt-1 block">
                    {printWo.qty} {printWo.unit}
                  </span>
                </div>

                <div className="p-3 bg-paper rounded border border-line">
                  <span className="font-semibold text-ink block text-[11px]">Cause / justification of condemnation:</span>
                  <p className="text-ink-muted mt-1 leading-relaxed">{printWo.reason}</p>
                </div>

                {printWo.remark && (
                  <div className="p-3 bg-amber/5 rounded border border-amber/20 text-amber">
                    <span className="font-semibold block text-[11px]">Competent authority (Director) remarks:</span>
                    <p className="mt-1 leading-relaxed">{printWo.remark}</p>
                    {printWo.decided_by && (
                      <span className="text-[11px] text-ink-muted block mt-1">Decided by: {printWo.decided_by}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Physical Verification Board Findings */}
              <div className="border border-line rounded p-4 text-[11px] space-y-2">
                <span className="font-semibold text-ink block">
                  Physical Verification & Condemnation Board Findings
                </span>
                <p className="text-ink-muted leading-relaxed">
                  The undersigned Inspection Board has physically verified the aforesaid material in the presence of the section custodian. The materials have been found unserviceable / unfit for university laboratory or administrative use beyond economical repair and are recommended for formal write-off and disposal by auction/destruction in accordance with store disposal procedures.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-line grid grid-cols-3 gap-6 text-center text-[11px]">
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink block">Section store keeper</span>
                  <span className="text-ink-muted block text-[10px]">Material Custodian</span>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink block">Store Officer (S&P)</span>
                  <span className="text-ink-muted block text-[10px]">Member Secretary, Board</span>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink block">Director (Stores & Purchase)</span>
                  <span className="text-ink-muted block text-[10px]">Sanctioning Authority</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[10px] text-ink-subtle">
                Sample format · Gautam Buddha University Stores & Purchase Prototype
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
