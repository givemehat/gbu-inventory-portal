import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  XCircle,
  FileCheck2,
  Trash2,
  Filter,
  Layers,
  Calendar,
  User,
  Building2,
  MessageSquare,
  X
} from 'lucide-react';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';

export default function Indents() {
  const [indents, setIndents] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Approval modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    indentId: null,
    isApprove: true,
    indentNo: '',
  });

  // Create form state
  const [deptName, setDeptName] = useState('');
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
        if (!deptName) {
          setDeptName(user.dept || 'School of ICT');
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus]);

  // Form line helpers
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
      toast.success(`Indent ${res.no} raised successfully!`);
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
      indentId: indent.id,
      isApprove,
      indentNo: indent.no,
    });
  };

  const handleConfirmDecision = async (remark) => {
    try {
      await api.decideIndent(confirmModal.indentId, confirmModal.isApprove, remark);
      toast.success(
        `Indent ${confirmModal.indentNo} has been ${confirmModal.isApprove ? 'APPROVED' : 'REJECTED'}.`
      );
      loadData();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Material Requisitions (Indents)</h2>
          <p className="text-xs text-slate-500">
            {user.role === 'dept'
              ? 'Your departmental requisitions awaiting approval and procurement.'
              : 'University requisitions raised by academic schools and administrative units.'}
          </p>
        </div>

        <button
          onClick={() => {
            if (items.length > 0 && !lines[0]?.item_id) {
              setLines([{ item_id: items[0].id, qty: 10 }]);
            }
            setIsCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gbu-900 hover:bg-gbu-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-gbu-950/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Raise New Indent</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
        {[
          { label: 'All Indents', value: '' },
          { label: 'Pending Approval', value: 'PENDING' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'PO Created', value: 'ORDERED' },
          { label: 'Rejected', value: 'REJECTED' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedStatus(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedStatus === tab.value
                ? 'bg-gbu-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Indents List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-6 h-6 border-2 border-gbu-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Fetching indents...</span>
        </div>
      ) : indents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Indents Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {selectedStatus ? `No indents with status "${selectedStatus}".` : 'No requisitions have been raised yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {indents.map((ind) => (
            <div
              key={ind.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {ind.no}
                      </span>
                      <StatusBadge status={ind.status} />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Dept: <strong className="text-slate-800">{ind.dept}</strong> • Raised by: {ind.by}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-xs text-slate-400 flex sm:flex-col items-center sm:items-end justify-between">
                  <span>
                    {new Date(ind.at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {ind.decided_by && (
                    <span className="text-[11px] text-slate-500 font-medium">
                      Decided by: <strong>{ind.decided_by}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Note / Remarks if any */}
              {ind.note && (
                <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <strong className="text-slate-700">Requisition Note:</strong> {ind.note}
                </p>
              )}

              {ind.remark && (
                <p className="mt-2 text-xs text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60">
                  <strong className="text-amber-800">Director Remark:</strong> {ind.remark}
                </p>
              )}

              {/* Line items table */}
              <div className="mt-3.5 border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-semibold text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="px-3 py-2">Item Name</th>
                      <th className="px-3 py-2 text-right">Requested Quantity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {ind.lines.map((l, i) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2 font-medium">{l.item}</td>
                        <td className="px-3 py-2 text-right font-bold text-slate-900">
                          {l.qty} {l.unit}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action buttons footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-slate-400 font-medium">
                  {ind.lines.length} material requirement lines
                </span>

                <div className="flex items-center gap-2">
                  {/* Approver actions on PENDING */}
                  {isApprover && ind.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleOpenDecision(ind, false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                      <button
                        onClick={() => handleOpenDecision(ind, true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Indent</span>
                      </button>
                    </>
                  )}

                  {/* Store Officer action on APPROVED indent: Create PO */}
                  {isStore && ind.status === 'APPROVED' && (
                    <button
                      onClick={() => navigate('/purchase-orders', { state: { createFromIndent: ind } })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition-all"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Create Purchase Order →</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Raise Material Indent (Requisition)</h3>
                <p className="text-xs text-slate-500">Requires sanction by the Director, Stores & Purchase</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Requesting School / Department *</label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="e.g. School of ICT, Exam Cell"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Notes</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. End-semester examination papers, toners and lab consumables"
                  rows={2}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Multi-line items table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Required Material Items ({lines.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gbu-50 hover:bg-gbu-100 text-gbu-800 text-xs font-semibold border border-gbu-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {lines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1">
                        <select
                          required
                          value={line.item_id}
                          onChange={(e) => handleLineChange(idx, 'item_id', e.target.value)}
                          className="w-full text-xs py-2 px-2.5 rounded-lg border border-slate-300 bg-white focus:border-gbu-600 outline-none"
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
                          className="w-full text-xs text-center py-2 px-2 rounded-lg border border-slate-300 focus:border-gbu-600 outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        disabled={lines.length <= 1}
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gbu-900 hover:bg-gbu-800 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Approvals/Rejections */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={handleConfirmDecision}
        title={confirmModal.isApprove ? `Approve Indent ${confirmModal.indentNo}` : `Reject Indent ${confirmModal.indentNo}`}
        message={
          confirmModal.isApprove
            ? `Are you sure you want to approve indent ${confirmModal.indentNo}? Stores will be permitted to raise a Purchase Order against this requisition.`
            : `Are you sure you want to reject indent ${confirmModal.indentNo}? Please provide remarks for the requesting department.`
        }
        confirmText={confirmModal.isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
        confirmVariant={confirmModal.isApprove ? 'success' : 'danger'}
        remarkLabel="Director Remarks / Budget Sanction Reference"
        remarkPlaceholder={confirmModal.isApprove ? 'e.g. Sanctioned against academic year budget head' : 'e.g. Budget limit exhausted, please resubmit in next quarter'}
      />
    </div>
  );
}
