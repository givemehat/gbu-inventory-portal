import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileCheck2,
  Plus,
  PackageCheck,
  Building,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  IndianRupee,
  X,
  Truck,
  User
} from 'lucide-react';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';

export default function PurchaseOrders() {
  const [pos, setPos] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [approvedIndents, setApprovedIndents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Expanded PO lines accordion
  const [expandedPoId, setExpandedPoId] = useState(null);

  // Create PO Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedIndentId, setSelectedIndentId] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [poLines, setPoLines] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // GRN (Receive Goods) Modal
  const [grnModal, setGrnModal] = useState({
    isOpen: false,
    po: null,
    lines: [], // { line_id, item_name, unit, ordered, got, pending, receiveQty }
  });

  // Quick Vendor Add Modal
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', phone: '', email: '' });

  const location = useLocation();
  const user = getCurrentUser() || {};
  const isStore = ['store', 'admin'].includes(user.role);
  const toast = useToast();

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getPOs(),
      api.getVendors(),
      api.getIndents('APPROVED'),
    ])
      .then(([posData, vendorsData, indentsData]) => {
        setPos(posData);
        setVendors(vendorsData);
        setApprovedIndents(indentsData);

        // Check if navigated from Indents screen with pre-selected indent
        if (location.state?.createFromIndent) {
          const preIndent = location.state.createFromIndent;
          handleOpenCreateWithIndent(preIndent, vendorsData);
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateWithIndent = (indent, vList = vendors) => {
    setSelectedIndentId(indent.id);
    setSelectedVendorId(vList[0]?.id || '');
    setPoLines(
      indent.lines.map((l) => ({
        item_id: l.item_id,
        item_name: l.item,
        unit: l.unit,
        qty: l.qty,
        rate: 100, // default placeholder
      }))
    );
    setIsCreateOpen(true);
  };

  const handleIndentSelect = (indentId) => {
    setSelectedIndentId(indentId);
    const indent = approvedIndents.find((i) => i.id === Number(indentId));
    if (indent) {
      setPoLines(
        indent.lines.map((l) => ({
          item_id: l.item_id,
          item_name: l.item,
          unit: l.unit,
          qty: l.qty,
          rate: 100,
        }))
      );
    } else {
      setPoLines([]);
    }
  };

  const handleRateChange = (idx, rate) => {
    const updated = [...poLines];
    updated[idx].rate = Math.max(0, Number(rate));
    setPoLines(updated);
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    if (!selectedVendorId) {
      toast.error('Please select an authorized university vendor.');
      return;
    }
    if (!selectedIndentId) {
      toast.error('PO must be linked to an approved indent.');
      return;
    }
    if (poLines.length === 0) {
      toast.error('PO must have at least one item line.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createPO({
        vendor_id: Number(selectedVendorId),
        indent_id: Number(selectedIndentId),
        lines: poLines.map((l) => ({
          item_id: l.item_id,
          qty: Number(l.qty),
          rate: Number(l.rate),
        })),
      });
      toast.success(`Purchase Order ${res.no} created successfully!`);
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Open GRN Modal
  const handleOpenGrn = (po) => {
    const grnLines = po.lines.map((l) => {
      const pending = Math.max(0, l.qty - l.got);
      return {
        line_id: l.id,
        item_name: l.item,
        unit: l.unit,
        ordered: l.qty,
        got: l.got,
        pending,
        receiveQty: pending, // default to receive remaining
      };
    });

    setGrnModal({
      isOpen: true,
      po,
      lines: grnLines,
    });
  };

  const handleGrnLineQtyChange = (idx, val) => {
    const updated = [...grnModal.lines];
    updated[idx].receiveQty = Math.max(0, Number(val));
    setGrnModal({ ...grnModal, lines: updated });
  };

  const handleConfirmGrn = async (e) => {
    e.preventDefault();
    const receiveLines = grnModal.lines
      .filter((l) => l.receiveQty > 0)
      .map((l) => ({
        line_id: l.line_id,
        qty: Number(l.receiveQty),
      }));

    if (receiveLines.length === 0) {
      toast.error('Please enter receiving quantity greater than 0 for at least one line.');
      return;
    }

    // Validate no line receives more than pending
    for (const l of grnModal.lines) {
      if (l.receiveQty > l.pending) {
        toast.error(`Cannot receive ${l.receiveQty} for ${l.item_name}. Only ${l.pending} pending.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const updatedPo = await api.receiveGoods(grnModal.po.id, receiveLines);
      toast.success(`Goods received against ${updatedPo.no}! Status: ${updatedPo.status}. Stock updated.`);
      setGrnModal({ isOpen: false, po: null, lines: [] });
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Add Vendor
  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!newVendor.name.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.addVendor(newVendor);
      toast.success(`Vendor "${res.name}" registered.`);
      const updatedV = await api.getVendors();
      setVendors(updatedV);
      setSelectedVendorId(res.id);
      setIsVendorOpen(false);
      setNewVendor({ name: '', phone: '', email: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPoValue = pos.reduce((acc, p) => acc + (p.total || 0), 0);
  const openPoCount = pos.filter((p) => ['OPEN', 'PARTIAL'].includes(p.status)).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Purchase Orders & Goods Receipt (GRN)</h2>
          <p className="text-xs text-slate-500">
            {pos.length} orders on file • {openPoCount} active shipments • Total PO Commitment:{' '}
            <strong className="text-gbu-900">₹{totalPoValue.toLocaleString('en-IN')}</strong>
          </p>
        </div>

        {isStore && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsVendorOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <Truck className="w-4 h-4 text-slate-500" />
              <span>Register Vendor</span>
            </button>
            <button
              onClick={() => {
                if (approvedIndents.length === 0) {
                  toast.error('No approved indents available. Raise and approve an indent first!');
                  return;
                }
                handleIndentSelect(approvedIndents[0].id);
                setSelectedVendorId(vendors[0]?.id || '');
                setIsCreateOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gbu-900 hover:bg-gbu-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-gbu-950/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create PO from Indent</span>
            </button>
          </div>
        )}
      </div>

      {/* PO List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-6 h-6 border-2 border-gbu-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-medium">Loading purchase orders...</span>
        </div>
      ) : pos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Purchase Orders Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Purchase Orders are created against Director-sanctioned indents.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pos.map((po) => {
            const isExpanded = expandedPoId === po.id;
            const canReceive = isStore && ['OPEN', 'PARTIAL'].includes(po.status);

            return (
              <div
                key={po.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
              >
                {/* PO Card Header */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                      <FileCheck2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {po.no}
                        </span>
                        <StatusBadge status={po.status} />
                        {po.indent_no && (
                          <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            Requisition: {po.indent_no}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Vendor: <strong className="text-slate-900">{po.vendor}</strong> • Ordered by: {po.by || 'Stores'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Value</span>
                      <span className="text-base font-extrabold text-slate-900 block leading-tight">
                        ₹{(po.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {canReceive && (
                        <button
                          onClick={() => handleOpenGrn(po)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                        >
                          <PackageCheck className="w-4 h-4" />
                          <span>Receive Goods (GRN)</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Hide items' : 'View line items'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* PO Lines Accordion */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-200 p-4 sm:p-5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                      Purchase Order Bill of Quantities ({po.lines.length} items)
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Item Description</th>
                            <th className="px-3 py-2 text-right">Ordered Qty</th>
                            <th className="px-3 py-2 text-right">Unit Rate (₹)</th>
                            <th className="px-3 py-2 text-right">Received (GRN)</th>
                            <th className="px-3 py-2 text-right">Pending</th>
                            <th className="px-3 py-2 text-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {po.lines.map((line) => {
                            const pending = Math.max(0, line.qty - line.got);
                            return (
                              <tr key={line.id} className="hover:bg-slate-50/60">
                                <td className="px-3 py-2 font-medium">{line.item}</td>
                                <td className="px-3 py-2 text-right">
                                  {line.qty} {line.unit}
                                </td>
                                <td className="px-3 py-2 text-right">₹{line.rate.toLocaleString('en-IN')}</td>
                                <td className="px-3 py-2 text-right font-bold text-emerald-700">
                                  {line.got} {line.unit}
                                </td>
                                <td className={`px-3 py-2 text-right font-semibold ${pending > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                                  {pending} {line.unit}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-slate-900">
                                  ₹{(line.qty * line.rate).toLocaleString('en-IN')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create PO Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Create Official Purchase Order</h3>
                <p className="text-xs text-slate-500">Tied directly to an approved university requisition</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Indent Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Approved Indent (Requisition) *
                </label>
                <select
                  required
                  value={selectedIndentId}
                  onChange={(e) => handleIndentSelect(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none bg-white"
                >
                  <option value="">-- Choose an Approved Indent --</option>
                  {approvedIndents.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      [{ind.no}] Dept: {ind.dept} ({ind.lines.length} items) — {ind.note || 'No note'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Vendor Selection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Contracted University Vendor *</label>
                  <button
                    type="button"
                    onClick={() => setIsVendorOpen(true)}
                    className="text-xs text-gbu-700 hover:underline font-semibold"
                  >
                    + Register New Vendor
                  </button>
                </div>
                <select
                  required
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none bg-white"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.phone ? `(${v.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Line items with Rates */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Sanctioned Items & Negotiated Rates
                </label>
                {poLines.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 border border-dashed rounded-xl text-center">
                    Select an approved indent above to load requisitioned items.
                  </p>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2 text-right">Quantity</th>
                          <th className="px-3 py-2 text-right">Negotiated Rate (₹)</th>
                          <th className="px-3 py-2 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {poLines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2 font-medium">{line.item_name}</td>
                            <td className="px-3 py-2 text-right font-bold">
                              {line.qty} {line.unit}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={line.rate}
                                onChange={(e) => handleRateChange(idx, e.target.value)}
                                className="w-24 text-right text-xs py-1 px-2 border border-slate-300 rounded-lg focus:border-gbu-600 outline-none"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-bold text-gbu-900">
                              ₹{(line.qty * line.rate).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">Total Purchase Order Commitment:</span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{poLines.reduce((acc, l) => acc + (l.qty * l.rate || 0), 0).toLocaleString('en-IN')}
                </span>
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
                  disabled={submitting || poLines.length === 0}
                  className="px-5 py-2 bg-gbu-900 hover:bg-gbu-800 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Creating PO...' : 'Issue Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN (Receive Goods) Modal */}
      {grnModal.isOpen && grnModal.po && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">Goods Receipt Note (GRN)</h3>
                  <span className="font-mono text-xs font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                    {grnModal.po.no}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vendor: <strong>{grnModal.po.vendor}</strong> • Partial receipts supported
                </p>
              </div>
              <button
                onClick={() => setGrnModal({ isOpen: false, po: null, lines: [] })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmGrn} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900">
                <p className="font-semibold">Automated Inventory Update:</p>
                <p className="mt-0.5 text-blue-800/80">
                  Received quantities will be immediately added to inventory stock, and item catalog prices will be updated to the PO rate.
                </p>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Ordered</th>
                      <th className="px-3 py-2 text-right">Received</th>
                      <th className="px-3 py-2 text-right">Pending</th>
                      <th className="px-3 py-2 text-right">Qty Received Now</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {grnModal.lines.map((l, idx) => (
                      <tr key={l.line_id} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2 font-medium">{l.item_name}</td>
                        <td className="px-3 py-2 text-right">
                          {l.ordered} {l.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-emerald-700 font-semibold">
                          {l.got} {l.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-amber-700 font-bold">
                          {l.pending} {l.unit}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <input
                            type="number"
                            min="0"
                            max={l.pending}
                            step="any"
                            value={l.receiveQty}
                            onChange={(e) => handleGrnLineQtyChange(idx, e.target.value)}
                            disabled={l.pending <= 0}
                            className="w-24 text-right text-xs py-1 px-2 border border-slate-300 rounded-lg focus:border-gbu-600 outline-none font-bold text-slate-900"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setGrnModal({ isOpen: false, po: null, lines: [] })}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{submitting ? 'Recording GRN...' : 'Confirm Goods Inward'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Vendor Modal */}
      {isVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Register University Vendor</h3>
              <button onClick={() => setIsVendorOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddVendor} className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor / Firm Name *</label>
                <input
                  type="text"
                  required
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="e.g. Apex Office Supplies, Delhi"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  placeholder="e.g. 9811002233"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                  placeholder="e.g. sales@apexsupplies.com"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVendorOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gbu-900 hover:bg-gbu-800 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
