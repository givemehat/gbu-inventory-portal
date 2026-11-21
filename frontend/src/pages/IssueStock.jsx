import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Clock, AlertCircle } from 'lucide-react';
import { api } from '../api';
import Combobox from '../components/Combobox';
import { useToast } from '../components/Toast';
import { DEPARTMENT_NAMES } from '../constants/departments';

export default function IssueStock() {
  const [items, setItems] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [qty, setQty] = useState('');
  const [dept, setDept] = useState(DEPARTMENT_NAMES[0] || 'School of Information & Communication Technology');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const toast = useToast();

  const universityDepts = DEPARTMENT_NAMES;

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
  const isZeroOrNegative = touched && numericQty <= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!selectedItem) {
      toast.error('Please select an inventory item.');
      return;
    }
    if (numericQty <= 0) {
      toast.error('Quantity to issue must be greater than zero.');
      return;
    }
    if (isOverLimit) {
      toast.error(`Only ${selectedItem.qty} ${selectedItem.unit} of ${selectedItem.name} in stock. Enter ${selectedItem.qty} or fewer.`);
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
      toast.success(`Issued ${numericQty} ${selectedItem.unit} of ${selectedItem.name} to ${dept}`);
      setQty('');
      setNote('');
      setTouched(false);
      loadData();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-[28px] font-medium text-ink leading-tight">
          Issue Stock
        </h1>
        <p className="text-[14px] text-ink-muted mt-1">
          Disburse store materials to university departments with immediate stock register debit.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Issue Form (Left Column, 7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-surface rounded-panel border border-line p-5 sm:p-6 shadow-none">
            <h2 className="text-[16px] font-medium text-ink pb-3 mb-4 border-b border-line">
              Issue Voucher
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Item Selection via Combobox */}
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1.5">
                  Store item
                </label>
                <Combobox
                  items={items}
                  value={selectedItemId}
                  onChange={(id) => {
                    setSelectedItemId(id);
                    setTouched(false);
                  }}
                  placeholder="Search item by code or name..."
                />
              </div>

              {/* Current stock context */}
              {selectedItem && (
                <div className="p-3 rounded bg-paper border border-line text-[13px] flex items-center justify-between">
                  <div>
                    <span className="font-medium text-ink block">{selectedItem.name}</span>
                    <span className="text-[12px] text-ink-muted">
                      Rack {selectedItem.location || 'Central Stores'} • Category: {selectedItem.category}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="tabular-nums font-semibold text-[14px] text-ink block">
                      {selectedItem.qty} {selectedItem.unit}
                    </span>
                    <span className="text-[11px] text-ink-muted">Available stock</span>
                  </div>
                </div>
              )}

              {/* Quantity to Issue */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[12px] font-medium text-ink-muted">
                    Quantity to issue
                  </label>
                  {selectedItem && (
                    <span className="text-[12px] text-ink-muted">
                      Unit: <span className="font-medium text-ink">{selectedItem.unit}</span>
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  value={qty}
                  onBlur={() => setTouched(true)}
                  onChange={(e) => {
                    setQty(e.target.value);
                    setTouched(true);
                  }}
                  placeholder={selectedItem ? `Enter quantity (max ${selectedItem.qty})` : 'Enter quantity'}
                  className={`w-full h-9 text-[14px] px-3 rounded border outline-none transition-colors tabular-nums ${
                    isOverLimit || isZeroOrNegative
                      ? 'border-red bg-paper focus:border-red'
                      : 'border-line focus:border-primary bg-surface'
                  }`}
                />
                {isOverLimit && (
                  <p className="mt-1 text-[12px] text-red flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    Only {selectedItem.qty} {selectedItem.unit} of {selectedItem.name} in stock. Enter {selectedItem.qty} or fewer.
                  </p>
                )}
                {selectedItem && !isOverLimit && numericQty > 0 && (
                  <p className="mt-1 text-[12px] text-green">
                    Stock after issue: <span className="tabular-nums font-medium">{(selectedItem.qty - numericQty).toFixed(1)} {selectedItem.unit}</span>
                  </p>
                )}
              </div>

              {/* Receiving Department */}
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1.5">
                  Receiving school or department
                </label>
                <select
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full h-9 text-[14px] px-3 rounded border border-line bg-surface text-ink outline-none focus:border-primary"
                >
                  {universityDepts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes / Purpose */}
              <div>
                <label className="block text-[12px] font-medium text-ink-muted mb-1.5">
                  Requisition reference or purpose
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. End-semester exams requirement, Dept office supplies"
                  rows={2}
                  className="w-full text-[14px] p-2.5 rounded border border-line bg-surface text-ink outline-none focus:border-primary placeholder:text-ink-subtle"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting || isOverLimit || !selectedItem || selectedItem.qty <= 0}
                  className="h-9 px-5 rounded bg-primary hover:bg-primary-hover text-surface text-[14px] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    'Recording...'
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Issue stock</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Dispatches Stream (Right Column, 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface rounded-panel border border-line p-5 shadow-none">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-line">
              <h2 className="text-[14px] font-medium text-ink flex items-center gap-2">
                <Clock className="w-4 h-4 text-ink-muted" />
                <span>Recent stock dispatches</span>
              </h2>
              <span className="text-[12px] text-ink-muted">Last 10 issues</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-[13px] text-ink-muted">Loading register entries...</div>
            ) : recentIssues.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-ink-muted">No stock dispatches recorded yet.</div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {recentIssues.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded border border-line bg-paper/60 hover:bg-paper transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="truncate">
                        <span className="font-medium text-[13px] text-ink block truncate">
                          {t.item}
                        </span>
                        <span className="text-[12px] text-ink-muted block mt-0.5 truncate">
                          {t.note}
                        </span>
                      </div>
                      <span className="text-[12px] font-medium text-ink tabular-nums shrink-0 px-1.5 py-0.5 rounded bg-surface border border-line">
                        -{t.qty} {t.unit}
                      </span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-line/60 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>Issued by: {t.by}</span>
                      <span className="tabular-nums">
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
