import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Package,
  Building,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Search
} from 'lucide-react';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';

export default function IssueStock() {
  const [items, setItems] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState('');
  const [dept, setDept] = useState('School of ICT');
  const [note, setNote] = useState('');
  const toast = useToast();

  const universityDepts = [
    'School of ICT',
    'School of Engineering',
    'School of Management',
    'School of Biotechnology',
    'School of Humanities',
    'School of Vocational Studies',
    'School of Law, Justice & Governance',
    'Registrar Office',
    'Finance & Accounts Department',
    'Examination Cell',
    'Stores & Purchase Central Office',
    'Central Computer Centre (CCC)',
    'Central Library',
    'Estate & Maintenance Department',
    'Hostel Administration Block',
  ];

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.getItems(),
      api.getTransactions({ kind: 'OUT', limit: 10 }),
    ])
      .then(([itemsData, txnsData]) => {
        setItems(itemsData);
        setRecentIssues(txnsData);
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
  const isOverLimit = selectedItem && numericQty > selectedItem.qty;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) {
      toast.error('Please select an inventory item.');
      return;
    }
    if (numericQty <= 0) {
      toast.error('Quantity to issue must be greater than zero.');
      return;
    }
    if (isOverLimit) {
      toast.error(`Only ${selectedItem.qty} ${selectedItem.unit} of ${selectedItem.name} in stock.`);
      return;
    }

    try {
      setSubmitting(true);
      await api.issueStock({
        item_id: selectedItem.id,
        qty: numericQty,
        dept,
        note: note.trim() || `Material issued to ${dept}`,
      });
      toast.success(`Successfully issued ${numericQty} ${selectedItem.unit} to ${dept}!`);
      setQty('');
      setNote('');
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Material Issue Counter</h2>
        <p className="text-xs text-slate-500">
          Disburse store materials to academic schools and administrative departments with live ledger tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Issue Form (Left Column, 7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-sm">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">New Material Issuance</h3>
                <p className="text-xs text-slate-500">Instant stock deduction upon submission</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Item Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Item from Stores *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-gbu-600 focus:ring-2 focus:ring-gbu-600/20 outline-none bg-white"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      [{i.code}] {i.name} — ({i.qty} {i.unit} in stock)
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Availability Status Card */}
              {selectedItem && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    selectedItem.qty <= 0
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : isOverLimit
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : selectedItem.low
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 shrink-0" />
                    <div>
                      <span className="font-semibold block">{selectedItem.name}</span>
                      <span className="text-[11px] opacity-80">
                        Category: {selectedItem.category} • Location: {selectedItem.location || 'Central Stores'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm block">
                      {selectedItem.qty} {selectedItem.unit}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">
                      {selectedItem.qty <= 0
                        ? 'Out of Stock'
                        : isOverLimit
                        ? 'Insufficient Stock'
                        : selectedItem.low
                        ? 'Low Stock'
                        : 'Available'}
                    </span>
                  </div>
                </div>
              )}

              {/* Quantity to Issue */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Quantity to Issue *
                  </label>
                  {selectedItem && (
                    <span className="text-[11px] text-slate-500">
                      Unit: <strong className="text-slate-800">{selectedItem.unit}</strong>
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder={`Enter quantity to issue (Max: ${selectedItem?.qty || 0})`}
                  className={`w-full text-sm px-3.5 py-2.5 rounded-xl border outline-none transition-all ${
                    isOverLimit
                      ? 'border-rose-400 bg-rose-50/50 text-rose-900 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 focus:border-gbu-600 focus:ring-2 focus:ring-gbu-600/20'
                  }`}
                />
                {isOverLimit && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Cannot issue {numericQty} {selectedItem.unit}. Maximum available is {selectedItem.qty} {selectedItem.unit}.
                  </p>
                )}
                {selectedItem && !isOverLimit && numericQty > 0 && (
                  <p className="mt-1 text-xs text-emerald-700 font-medium">
                    Remaining balance after issue: {(selectedItem.qty - numericQty).toFixed(1)} {selectedItem.unit}
                  </p>
                )}
              </div>

              {/* Receiving Department */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Receiving School / Department *
                </label>
                <div className="space-y-2">
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none bg-white"
                  >
                    {universityDepts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes / Purpose */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Requisition Purpose / Notes
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. End-semester examination supplies, Lab 3 practicals requirement..."
                  rows={2}
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-300 focus:border-gbu-600 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || isOverLimit || !selectedItem || selectedItem.qty <= 0}
                  className="w-full py-3 px-4 rounded-xl bg-gbu-900 hover:bg-gbu-800 text-white font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-gbu-950/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Recording Issuance...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Confirm Stock Issue</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Dispatches Stream (Right Column, 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gbu-800" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Dispatches
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Last 10 issues</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading history...</div>
            ) : recentIssues.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No stock dispatches recorded yet.</div>
            ) : (
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {recentIssues.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-xs text-slate-900 block truncate max-w-[200px]">
                          {t.item}
                        </span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {t.note}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shrink-0">
                        -{t.qty} {t.unit}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                      <span>By: {t.by}</span>
                      <span>
                        {new Date(t.at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
