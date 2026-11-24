import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileCheck2,
  Plus,
  PackageCheck,
  ChevronDown,
  ChevronUp,
  X,
  Truck,
  Printer,
} from 'lucide-react';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import WorkflowStrip from '../components/WorkflowStrip';
import { useToast } from '../components/Toast';
import ShipmentTracker from '../components/ShipmentTracker';
import { assetUrl } from '../lib/utils';

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
    lines: [],
  });

  // Quick Vendor Add Modal
  const [isVendorOpen, setIsVendorOpen] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', phone: '', email: '' });
  const [printPo, setPrintPo] = useState(null);

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
        rate: 100,
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
      toast.success(`Purchase Order ${res.no} created`);
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenGrn = (po) => {
    const grnLines = po.lines.map((l) => {
      const pending = Math.max(0, l.qty - l.got);
      return {
        line_id: l.id,
        item_id: l.item_id,
        item_name: l.item,
        unit: l.unit,
        ordered: l.qty,
        got: l.got,
        pending,
        receiveQty: pending,
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
      toast.error('Enter received quantity greater than 0 for at least one line.');
      return;
    }

    for (const l of grnModal.lines) {
      if (l.receiveQty > l.pending) {
        toast.error(`Cannot receive ${l.receiveQty} for ${l.item_name}. Only ${l.pending} pending.`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const updatedPo = await api.receiveGoods(grnModal.po.id, receiveLines);
      toast.success(`Goods inward recorded against ${updatedPo.no}. Stock updated.`);
      setGrnModal({ isOpen: false, po: null, lines: [] });
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    if (!newVendor.name.trim()) return;
    try {
      setSubmitting(true);
      const res = await api.addVendor(newVendor);
      toast.success(`Vendor "${res.name}" registered`);
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
      {/* Header (MIT Style) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Purchase Orders & Goods Receipt (GRN)
            </h1>
            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1565C0] pb-2 border-b-2 border-[#1565C0]">
                Vendor Procurement & Physical Inspection
              </h2>
            </div>
            <p className="text-[15.5px] text-slate-600 mt-2">
              <span className="tabular-nums font-semibold">{pos.length}</span> orders on record • <span className="tabular-nums font-semibold text-blue-600">{openPoCount}</span> open • Total university commitment: <span className="tabular-nums font-bold text-slate-900">₹{totalPoValue.toLocaleString('en-IN')}</span>
            </p>
          </div>

          {isStore && (
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setIsVendorOpen(true)}
                className="h-10 px-3.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13.5px] font-semibold transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                <Truck className="w-4 h-4 text-slate-500" />
                <span>Register Vendor</span>
              </button>
              <button
                onClick={() => {
                  if (approvedIndents.length === 0) {
                    toast.error('No approved indents available. Raise and approve an indent first.');
                    return;
                  }
                  handleIndentSelect(approvedIndents[0].id);
                  setSelectedVendorId(vendors[0]?.id || '');
                  setIsCreateOpen(true);
                }}
                className="h-10 px-4 rounded-md bg-[#1565C0] hover:bg-blue-700 text-white text-[14px] font-semibold transition-colors inline-flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Create Purchase Order</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PO List */}
      {loading ? (
        <div className="py-20 text-center text-[13px] text-ink-muted">
          Loading purchase orders...
        </div>
      ) : pos.length === 0 ? (
        <div className="bg-surface rounded-panel border border-line p-12 text-center text-ink-muted">
          <FileCheck2 className="w-10 h-10 text-ink-subtle mx-auto mb-2 stroke-[1.5]" />
          <p className="text-[14px] font-medium text-ink">No purchase orders on file</p>
          <p className="text-[12px] text-ink-muted mt-0.5">
            Purchase orders are generated against Director-sanctioned indents.
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
                className="bg-surface rounded-panel border border-line overflow-hidden transition-colors"
              >
                <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-[13px] font-semibold text-ink px-2 py-0.5 rounded bg-paper border border-line">
                        {po.no}
                      </span>
                      <StatusBadge status={po.status} />
                      {po.indent_no && (
                        <span className="text-[12px] font-mono text-ink-muted bg-paper px-2 py-0.5 rounded border border-line">
                          Requisition: {po.indent_no}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] text-ink-muted mt-1.5">
                      Vendor: <span className="font-medium text-ink">{po.vendor}</span> • Placed by: {po.by || 'Stores'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-line">
                    <div className="text-left sm:text-right">
                      <span className="text-[11px] text-ink-muted block uppercase tracking-wide">PO total</span>
                      <span className="text-[16px] font-semibold text-ink tabular-nums block leading-tight">
                        ₹{(po.total || 0).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPrintPo(po)}
                        className="h-8 px-2.5 rounded border border-line text-ink hover:bg-paper text-[12px] font-medium transition-colors inline-flex items-center gap-1"
                        title="Print Official Purchase Order"
                      >
                        <Printer className="w-3.5 h-3.5 text-primary" />
                        <span>Print PO</span>
                      </button>

                      {canReceive && (
                        <button
                          onClick={() => handleOpenGrn(po)}
                          className="h-8 px-3.5 rounded bg-primary hover:bg-primary-hover text-surface text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>Receive goods</span>
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedPoId(isExpanded ? null : po.id)}
                        className="p-1.5 text-ink-muted hover:text-ink rounded transition-colors"
                        title={isExpanded ? 'Collapse' : 'Expand lines'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Milestone Stepper (Magic UI / Origin UI Style) */}
                <div className="px-5 pb-4">
                  <ShipmentTracker
                    status={po.status}
                    poNumber={po.no}
                    vendorName={po.vendor}
                    date={po.date}
                  />
                </div>

                {/* Bill of Quantities Accordion */}
                {isExpanded && (
                  <div className="bg-paper border-t border-line p-5">
                    <h3 className="text-[12px] font-medium text-ink-muted uppercase tracking-wider mb-2.5">
                      Purchase order line items ({po.lines.length})
                    </h3>
                    <div className="border border-line rounded overflow-hidden bg-surface">
                      <table className="w-full text-left text-[13px]">
                        <thead className="bg-paper text-ink-muted font-medium border-b border-line text-[12px]">
                          <tr>
                            <th className="px-3 py-2">Item</th>
                            <th className="px-3 py-2 text-right">Ordered</th>
                            <th className="px-3 py-2 text-right">Unit rate</th>
                            <th className="px-3 py-2 text-right">Received (GRN)</th>
                            <th className="px-3 py-2 text-right">Pending</th>
                            <th className="px-3 py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-line text-ink">
                          {po.lines.map((line) => {
                            const pending = Math.max(0, line.qty - line.got);
                            return (
                              <tr key={line.id} className="hover:bg-paper/30">
                                <td className="px-3 py-2">{line.item}</td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  {line.qty} {line.unit}
                                </td>
                                <td className="px-3 py-2 text-right tabular-nums">
                                  ₹{line.rate.toLocaleString('en-IN')}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-green tabular-nums">
                                  {line.got} {line.unit}
                                </td>
                                <td className={`px-3 py-2 text-right tabular-nums ${pending > 0 ? 'text-amber font-medium' : 'text-ink-subtle'}`}>
                                  {pending} {line.unit}
                                </td>
                                <td className="px-3 py-2 text-right font-medium tabular-nums text-ink">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-surface rounded-panel max-w-2xl w-full border border-line shadow-sm overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[18px] font-semibold text-ink">Create Purchase Order</h3>
                <p className="text-[12px] text-ink-muted">Generate formal order against approved requisition</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-ink-muted hover:text-ink p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Sanctioned indent (requisition)
                </label>
                <select
                  required
                  value={selectedIndentId}
                  onChange={(e) => handleIndentSelect(e.target.value)}
                  className="w-full h-9 text-[14px] px-3 rounded border border-line bg-surface text-ink outline-none focus:border-primary"
                >
                  <option value="">-- Choose an approved indent --</option>
                  {approvedIndents.map((ind) => (
                    <option key={ind.id} value={ind.id}>
                      [{ind.no}] Dept: {ind.dept} ({ind.lines.length} items)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[12px] font-medium text-ink-muted">Authorized vendor</label>
                  <button
                    type="button"
                    onClick={() => setIsVendorOpen(true)}
                    className="text-[12px] text-primary hover:underline"
                  >
                    + Register new vendor
                  </button>
                </div>
                <select
                  required
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-full h-9 text-[14px] px-3 rounded border border-line bg-surface text-ink outline-none focus:border-primary"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} {v.phone ? `(${v.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items Table */}
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-2">
                  Bill of materials & negotiated unit rates
                </label>
                {poLines.length === 0 ? (
                  <p className="text-[13px] text-ink-muted p-4 border border-dashed border-line rounded text-center">
                    Select an approved indent to populate requisitioned items.
                  </p>
                ) : (
                  <div className="border border-line rounded overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                      <thead className="bg-paper text-ink-muted font-medium border-b border-line text-[12px]">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2 text-right">Quantity</th>
                          <th className="px-3 py-2 text-right">Negotiated rate (₹)</th>
                          <th className="px-3 py-2 text-right">Line total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-ink">
                        {poLines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-paper/40">
                            <td className="px-3 py-2 font-medium">{line.item_name}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
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
                                className="w-24 h-7 text-right text-[13px] px-2 border border-line rounded focus:border-primary outline-none tabular-nums"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium tabular-nums text-ink">
                              ₹{(line.qty * line.rate).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="p-3 bg-paper rounded border border-line flex items-center justify-between text-[13px]">
                <span className="text-ink-muted">Total purchase commitment:</span>
                <span className="text-[16px] font-semibold text-ink tabular-nums">
                  ₹{poLines.reduce((acc, l) => acc + (l.qty * l.rate || 0), 0).toLocaleString('en-IN')}
                </span>
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
                  disabled={submitting || poLines.length === 0}
                  className="h-9 px-4 bg-primary hover:bg-primary-hover text-surface text-[13px] font-medium rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create purchase order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GRN (Receive Goods) Modal */}
      {grnModal.isOpen && grnModal.po && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-surface rounded-panel max-w-2xl w-full border border-line shadow-sm overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <div>
                <h3 className="font-serif text-[18px] font-semibold text-ink">
                  Goods Receipt Note (GRN) — {grnModal.po.no}
                </h3>
                <p className="text-[12px] text-ink-muted">
                  Vendor: {grnModal.po.vendor} • Record delivery into central stores
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGrnModal({ isOpen: false, po: null, lines: [] })}
                className="text-ink-muted hover:text-ink p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmGrn} className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="p-3 bg-paper border border-line rounded text-[13px] text-ink">
                <span className="font-semibold block text-[11px] uppercase tracking-wide text-ink-muted mb-0.5">
                  Stock update summary
                </span>
                Received quantities will be added to store stock immediately, and item catalog rates will update to the PO purchase price.
              </div>

              <div className="border border-line rounded overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-paper text-ink-muted font-medium border-b border-line text-[12px]">
                    <tr>
                      <th className="px-3 py-2">Item</th>
                      <th className="px-3 py-2 text-right">Ordered</th>
                      <th className="px-3 py-2 text-right">Received</th>
                      <th className="px-3 py-2 text-right">Pending</th>
                      <th className="px-3 py-2 text-right">Qty received now</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {grnModal.lines.map((l, idx) => (
                      <tr key={l.line_id} className="hover:bg-paper/40">
                        <td className="px-3 py-2 font-medium">{l.item_name}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {l.ordered} {l.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-green font-medium tabular-nums">
                          {l.got} {l.unit}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-amber tabular-nums">
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
                            className="w-24 h-7 text-right text-[13px] px-2 border border-line rounded focus:border-primary outline-none tabular-nums font-semibold"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGrnModal({ isOpen: false, po: null, lines: [] })}
                  className="h-9 px-4 text-[13px] font-medium text-ink-muted hover:bg-paper rounded border border-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-4 bg-primary hover:bg-primary-hover text-surface text-[13px] font-medium rounded transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Recording...' : 'Receive goods'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Vendor Modal */}
      {isVendorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-[2px]">
          <div className="bg-surface rounded-panel max-w-sm w-full border border-line shadow-sm overflow-hidden">
            <div className="p-4 border-b border-line flex items-center justify-between">
              <h3 className="font-serif text-[18px] font-semibold text-ink">Register Vendor</h3>
              <button
                type="button"
                onClick={() => setIsVendorOpen(false)}
                className="text-ink-muted hover:text-ink p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddVendor} className="p-4 space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Vendor or firm name
                </label>
                <input
                  type="text"
                  required
                  value={newVendor.name}
                  onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                  placeholder="e.g. Apex Office Supplies"
                  className="w-full h-9 text-[13px] px-3 rounded border border-line focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Contact telephone
                </label>
                <input
                  type="text"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor({ ...newVendor, phone: e.target.value })}
                  placeholder="e.g. 9811002233"
                  className="w-full h-9 text-[13px] px-3 rounded border border-line focus:border-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1">
                  Email address
                </label>
                <input
                  type="email"
                  value={newVendor.email}
                  onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
                  placeholder="e.g. sales@apexsupplies.com"
                  className="w-full h-9 text-[13px] px-3 rounded border border-line focus:border-primary outline-none"
                />
              </div>
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVendorOpen(false)}
                  className="h-8 px-3 text-[13px] text-ink-muted hover:bg-paper rounded border border-line"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-8 px-4 bg-primary hover:bg-primary-hover text-surface text-[13px] font-medium rounded disabled:opacity-50"
                >
                  Save vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Purchase Order Modal */}
      {printPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-surface rounded-panel max-w-3xl w-full border border-line shadow-xl overflow-hidden my-6">
            <div className="no-print p-4 border-b border-line bg-paper flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded border border-blue-200">
                  PO VOUCHER
                </span>
                <span className="font-semibold text-ink text-[14px]">
                  Purchase Order ({printPo.no})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded bg-primary hover:bg-primary-hover text-white text-[12px] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print PO</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintPo(null)}
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
                  Stores & Purchase Department • Purchase Order (Sample format)
                </div>
              </div>

              {/* PO Meta */}
              <div className="grid grid-cols-3 gap-4 text-[12px] text-ink pb-3 border-b border-line bg-paper/50 p-3 rounded">
                <div>
                  <span className="text-ink-muted block text-[11px]">Purchase Order No:</span>
                  <span className="font-mono font-bold text-primary">{printPo.no}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Authorized Vendor / Firm:</span>
                  <span className="font-semibold">{printPo.vendor}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Sanctioned Indent Ref:</span>
                  <span className="font-mono font-medium">{printPo.indent_no || '—'}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Order Date:</span>
                  <span className="font-medium">
                    {new Date(printPo.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Fulfillment Status:</span>
                  <span className="font-bold text-ink">{printPo.status}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Issued By:</span>
                  <span className="font-medium">{printPo.by || 'Stores & Purchase'}</span>
                </div>
              </div>

              {/* Bill of Quantities */}
              <div>
                <h4 className="text-[12px] font-semibold text-ink mb-2">
                  Bill of Quantities & Contracted Rates
                </h4>
                <table className="w-full text-left text-[11px] border border-line">
                  <thead className="bg-paper border-b border-line text-ink-muted font-medium">
                    <tr>
                      <th className="p-2 border-r border-line w-10 text-center">#</th>
                      <th className="p-2 border-r border-line">Item Description</th>
                      <th className="p-2 border-r border-line text-right w-24">Ordered</th>
                      <th className="p-2 border-r border-line text-right w-24">Unit Rate</th>
                      <th className="p-2 border-r border-line text-right w-24">Received (GRN)</th>
                      <th className="p-2 text-right w-28">Total Valuation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {printPo.lines.map((l, idx) => (
                      <tr key={l.id || idx}>
                        <td className="p-2 border-r border-line text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-line font-medium">{l.item}</td>
                        <td className="p-2 border-r border-line text-right font-mono font-semibold">
                          {l.qty} {l.unit}
                        </td>
                        <td className="p-2 border-r border-line text-right font-mono">
                          ₹{l.rate.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2 border-r border-line text-right font-mono text-green font-semibold">
                          {l.got} {l.unit}
                        </td>
                        <td className="p-2 text-right font-mono font-semibold">
                          ₹{(l.qty * l.rate).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-paper font-bold border-t border-line text-[12px]">
                      <td colSpan={5} className="p-2 text-right uppercase tracking-wider text-ink">
                        Grand Contract Value:
                      </td>
                      <td className="p-2 text-right font-mono text-primary">
                        ₹{(printPo.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Delivery Terms */}
              <div className="p-3 bg-paper rounded border border-line text-[11px] text-ink-muted space-y-1">
                <span className="font-semibold text-ink block text-[11px]">Standard delivery terms:</span>
                <p>1. Delivery must be made to Central Stores, Gautam Buddha University, Greater Noida within 15 working days.</p>
                <p>2. Physical inspection will be conducted by the University Technical Inspection Committee upon arrival prior to GRN entry.</p>
                <p>3. Invoices must reference this PO number in all correspondence and billing submissions.</p>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-line grid grid-cols-3 gap-6 text-center text-[11px]">
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink block">Vendor acknowledgement</span>
                  <span className="text-ink-muted block text-[10px]">{printPo.vendor}</span>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink block">Store Officer (S&P)</span>
                  <span className="text-ink-muted block text-[10px]">Procurement Section</span>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink block">Finance Officer / Registrar</span>
                  <span className="text-ink-muted block text-[10px]">Financial Concurrence</span>
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
