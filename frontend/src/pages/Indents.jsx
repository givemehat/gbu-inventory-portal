import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  FileCheck2,
  Trash2,
  X,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Printer,
} from 'lucide-react';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import WorkflowStrip from '../components/WorkflowStrip';
import Combobox from '../components/Combobox';
import { useToast } from '../components/Toast';
import { DEPARTMENT_NAMES } from '../constants/departments';

export default function Indents() {
  const [indents, setIndents] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [printIndent, setPrintIndent] = useState(null);

  // Approval modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    indent: null,
    isApprove: true,
  });

  // Create form state
  const [deptName, setDeptName] = useState(DEPARTMENT_NAMES[0]);
  const [note, setNote] = useState('');
  const [lines, setLines] = useState([{ item_id: '', qty: 10 }]);

  const user = getCurrentUser() || {};
  const isApprover = ['approver', 'admin'].includes(user.role);
  const isStore = ['store', 'admin'].includes(user.role);
  const toast = useToast();
  const navigate = useNavigate();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getIndents(selectedStatus),
      api.getItems(),
    ])
      .then(([indentsData, itemsData]) => {
        setIndents(indentsData);
        setItems(itemsData);
        if (!deptName || deptName === 'School of ICT') {
          setDeptName(user.dept || DEPARTMENT_NAMES[0]);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  const handleAddLine = () => {
    const firstItemId = items[0]?.id || '';
    setLines([...lines, { item_id: firstItemId, qty: 10 }]);
  };

  const handleRemoveLine = (idx) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx, field, val) => {
    const updated = [...lines];
    updated[idx][field] = val;
    setLines(updated);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) {
      toast.error('Department name is required.');
      return;
    }

    const validLines = lines.map((l) => ({
      item_id: Number(l.item_id || items[0]?.id),
      qty: Number(l.qty),
    }));

    if (validLines.some((l) => !l.item_id || l.qty <= 0)) {
      toast.error('All indent lines must have a selected item and quantity > 0.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createIndent({
        dept: deptName.trim(),
        note: note.trim(),
        lines: validLines,
      });
      toast.success(`Indent ${res.no} raised successfully`);
      setIsCreateOpen(false);
      setNote('');
      setLines([{ item_id: items[0]?.id || '', qty: 10 }]);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDecision = (indent, isApprove) => {
    setConfirmModal({
      isOpen: true,
      indent,
      isApprove,
    });
  };

  const handleConfirmDecision = async (remark) => {
    if (!confirmModal.indent) return;
    try {
      await api.decideIndent(confirmModal.indent.id, confirmModal.isApprove, remark);
      toast.success(
        `Indent ${confirmModal.indent.no} ${confirmModal.isApprove ? 'approved' : 'rejected'}`
      );
      loadData();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium text-ink leading-tight">
            Material Requisitions
          </h1>
          <p className="text-[14px] text-ink-muted mt-1">
            Departmental indents submitted to Stores & Purchase for administrative approval.
          </p>
        </div>

        <button
          onClick={() => {
            if (items.length > 0 && !lines[0]?.item_id) {
              setLines([{ item_id: items[0].id, qty: 10 }]);
            }
            setIsCreateOpen(true);
          }}
          className="h-9 px-4 rounded bg-primary hover:bg-primary-hover text-surface font-medium text-[14px] transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Raise indent</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-surface rounded border border-line overflow-x-auto">
        {[
          { label: 'All indents', value: '' },
          { label: 'Pending approval', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Ordered', value: 'ORDERED' },
          { label: 'Rejected', value: 'REJECTED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-3 py-1.5 rounded text-[13px] font-medium whitespace-nowrap transition-colors ${
              selectedStatus === tab.value
                ? 'bg-ink text-surface'
                : 'text-ink-muted hover:text-ink hover:bg-paper'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Indents List */}
      {loading ? (
        <div className="py-20 text-center text-[13px] text-ink-muted">
          Loading requisitions...
        </div>
      ) : indents.length === 0 ? (
        <div className="bg-surface rounded-panel border border-line p-12 text-center text-ink-muted">
          <ClipboardList className="w-10 h-10 text-ink-subtle mx-auto mb-2 stroke-[1.5]" />
          <p className="text-[14px] font-medium text-ink">No requisitions found</p>
          <p className="text-[12px] text-ink-muted mt-0.5">
            {selectedStatus ? `No indents matching filter "${selectedStatus}".` : 'No material requisitions on record.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {indents.map((ind) => (
            <div
              key={ind.id}
              className="bg-surface rounded-panel border border-line p-5 transition-colors"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[13px] font-semibold text-ink px-2 py-0.5 rounded bg-paper border border-line">
                    {ind.no}
                  </span>
                  <StatusBadge status={ind.status} />
                  <span className="text-[13px] text-ink-muted">
                    Dept: <span className="font-medium text-ink">{ind.dept}</span>
                  </span>
                </div>

                <div className="text-[12px] text-ink-muted flex items-center gap-3">
                  <span>Raised by: <span className="text-ink">{ind.by}</span></span>
                  <span>•</span>
                  <span className="tabular-nums">
                    {new Date(ind.at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Progress Flow */}
              <div className="py-2">
                <WorkflowStrip status={ind.status} compact />
              </div>

              {/* Note / Remarks if any */}
              {ind.note && (
                <div className="text-[13px] text-ink-muted bg-paper p-2.5 rounded border border-line my-2">
                  <span className="font-medium text-ink">Purpose: </span>
                  {ind.note}
                </div>
              )}

              {ind.remark && (
                <div className="text-[13px] text-amber bg-amber/5 p-2.5 rounded border border-amber/20 my-2">
                  <span className="font-medium">Director remark: </span>
                  {ind.remark}
                  {ind.decided_by && (
                    <span className="text-[11px] text-ink-muted ml-2">({ind.decided_by})</span>
                  )}
                </div>
              )}

              {/* Line items table */}
              <div className="mt-3 border border-line rounded overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-paper text-ink-muted font-medium border-b border-line text-[12px]">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Requested quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {ind.lines.map((l, i) => (
                      <tr key={i} className="hover:bg-paper/40">
                        <td className="px-3 py-2">{l.item}</td>
                        <td className="px-3 py-2 text-right font-medium tabular-nums">
                          {l.qty} {l.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer action bar */}
              <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <span className="text-[12px] text-ink-muted">
                  {ind.lines.length} {ind.lines.length === 1 ? 'item' : 'items'} requisitioned
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPrintIndent(ind)}
                    className="h-8 px-3 rounded border border-line text-ink hover:bg-paper text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-primary" />
                    <span>Print slip</span>
                  </button>

                  {/* Approver actions on PENDING */}
                  {isApprover && ind.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleOpenDecision(ind, false)}
                        className="h-8 px-3 rounded border border-line text-red hover:bg-red/5 text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleOpenDecision(ind, true)}
                        className="h-8 px-3.5 rounded bg-primary hover:bg-primary-hover text-surface text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve indent</span>
                      </button>
                    </>
                  )}

                  {/* Store Officer action on APPROVED: Create PO */}
                  {isStore && ind.status === 'APPROVED' && (
                    <button
                      onClick={() => navigate('/purchase-orders', { state: { createFromIndent: ind } })}
                      className="h-8 px-3.5 rounded bg-primary hover:bg-primary-hover text-surface text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Create purchase order →</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Raise New Indent Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-surface rounded-panel max-w-xl w-full border border-line shadow-sm overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[18px] font-semibold text-ink">Raise Material Indent</h3>
                <p className="text-[12px] text-ink-muted">Requisition for Stores & Purchase approval</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-ink-muted hover:text-ink p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Requesting school or department
                </label>
                <select
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full h-9 text-[13px] px-3 rounded border border-line bg-surface text-ink outline-none focus:border-primary"
                >
                  {DEPARTMENT_NAMES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Purpose / Requisition justification
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Department requirement for end-semester laboratory sessions"
                  rows={2}
                  className="w-full text-[14px] p-2.5 rounded border border-line focus:border-primary outline-none placeholder:text-ink-subtle"
                />
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[12px] font-medium text-ink-muted">
                    Requested items ({lines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-[12px] font-medium text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-paper rounded border border-line">
                      <div className="flex-1">
                        <select
                          required
                          value={line.item_id}
                          onChange={(e) => handleLineChange(idx, 'item_id', e.target.value)}
                          className="w-full h-8 text-[13px] px-2 rounded border border-line bg-surface text-ink outline-none focus:border-primary"
                        >
                          {items.map((i) => (
                            <option key={i.id} value={i.id}>
                              [{i.code}] {i.name} ({i.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          required
                          value={line.qty}
                          onChange={(e) => handleLineChange(idx, 'qty', e.target.value)}
                          placeholder="Qty"
                          className="w-full h-8 text-[13px] text-right px-2 rounded border border-line focus:border-primary outline-none tabular-nums"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={lines.length <= 1}
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1 text-ink-muted hover:text-red disabled:opacity-30 rounded"
                        title="Remove line"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="h-9 px-4 text-[13px] font-medium text-ink-muted hover:bg-paper rounded border border-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 bg-primary hover:bg-primary-hover text-surface text-[13px] font-medium rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Decision Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false, indent: null })}
        onConfirm={handleConfirmDecision}
        title={confirmModal.isApprove ? `Approve Indent ${confirmModal.indent?.no}` : `Reject Indent ${confirmModal.indent?.no}`}
        summary={
          confirmModal.isApprove
            ? `Approving ${confirmModal.indent?.no} will authorize Stores & Purchase to raise a Purchase Order against university vendors.`
            : `Rejecting ${confirmModal.indent?.no} will terminate this requisition. The requesting department will see your remarks.`
        }
        confirmText={confirmModal.isApprove ? 'Approve indent' : 'Reject indent'}
        confirmVariant={confirmModal.isApprove ? 'primary' : 'danger'}
        remarkLabel="Director remarks"
        remarkPlaceholder={
          confirmModal.isApprove
            ? 'e.g. Sanctioned under 2026-27 departmental operating budget'
            : 'e.g. Current stock adequate or quota exceeded'
        }
        requireRemark={!confirmModal.isApprove}
      />

      {/* Printable Indent Requisition Slip Modal */}
      {printIndent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-surface rounded-panel max-w-3xl w-full border border-line shadow-xl overflow-hidden my-6">
            <div className="no-print p-4 border-b border-line bg-paper flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded border border-blue-200">
                  FORM S&P-01
                </span>
                <span className="font-semibold text-ink text-[14px]">
                  Material Requisition Indent ({printIndent.no})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded bg-primary hover:bg-primary-hover text-white text-[12px] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintIndent(null)}
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
                    src="/gbu-logo.jpg"
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
                  Stores & Purchase Department • Material Requisition Indent (S&P-01 (sample))
                </div>
              </div>

              {/* Indent Meta */}
              <div className="grid grid-cols-3 gap-4 text-[12px] text-ink pb-3 border-b border-line bg-paper/50 p-3 rounded">
                <div>
                  <span className="text-ink-muted block text-[11px]">Requisition slip no:</span>
                  <span className="font-mono font-bold text-primary">{printIndent.no}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Requisitioning department / school:</span>
                  <span className="font-semibold">{printIndent.dept}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Date of submission:</span>
                  <span className="font-medium">
                    {new Date(printIndent.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Requisitioned by:</span>
                  <span className="font-medium">{printIndent.by}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Sanction status:</span>
                  <span className="font-bold text-ink">{printIndent.status}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Sanction authority:</span>
                  <span className="font-medium">{printIndent.decided_by || 'Director (Stores & Purchase)'}</span>
                </div>
              </div>

              {/* Purpose / Remarks */}
              <div className="text-[12px] text-ink space-y-2">
                <div className="p-2.5 bg-paper rounded border border-line">
                  <span className="font-semibold text-ink block text-[11px]">Purpose / requisition justification:</span>
                  <span className="text-ink-muted mt-0.5 block">{printIndent.note || 'General departmental store requirement.'}</span>
                </div>
                {printIndent.remark && (
                  <div className="p-2.5 bg-amber/5 rounded border border-amber/20 text-amber">
                    <span className="font-semibold block text-[11px]">Sanctioning remarks:</span>
                    <span className="mt-0.5 block">{printIndent.remark}</span>
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-[12px] font-semibold text-ink mb-2">
                  Bill of Requisitioned Material
                </h4>
                <table className="w-full text-left text-[11px] border border-line">
                  <thead className="bg-paper border-b border-line text-ink-muted font-medium">
                    <tr>
                      <th className="p-2 border-r border-line w-12 text-center">S.No.</th>
                      <th className="p-2 border-r border-line">Item Description / Nomenclature</th>
                      <th className="p-2 border-r border-line text-right w-36">Quantity Requested</th>
                      <th className="p-2 text-right w-36">Sanctioned Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {printIndent.lines.map((l, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-r border-line text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-line font-medium">{l.item}</td>
                        <td className="p-2 border-r border-line text-right font-mono font-semibold">
                          {l.qty} {l.unit}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold text-primary">
                          {printIndent.status === 'APPROVED' ? `${l.qty} ${l.unit}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-line grid grid-cols-3 gap-6 text-center text-[11px]">
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink block">Indenting official / HoD</span>
                  <span className="text-ink-muted block text-[10px]">{printIndent.dept}</span>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink block">Store Officer (S&P)</span>
                  <span className="text-ink-muted block text-[10px]">Stock Availability Checked</span>
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
