import React, { useEffect, useState } from 'react';
import { X, ArrowDownLeft, ArrowUpRight, AlertOctagon, History, Package } from 'lucide-react';
import { api } from '../api';
import StatusBadge from './StatusBadge';

export default function ItemLedgerModal({ item, isOpen, onClose }) {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && item?.id) {
      setLoading(true);
      api.getTransactions({ item_id: item.id })
        .then((data) => setTxns(data))
        .catch(() => setTxns([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded bg-primary text-white flex items-center justify-center font-bold">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded">
                  {item.code}
                </span>
                <span className="text-xs text-slate-500 font-medium">{item.category}</span>
                {item.low && (
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    Low Stock
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{item.name}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Stat Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-white border-b border-slate-200 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block font-medium">Current Stock</span>
            <span className="text-base font-bold text-slate-900">
              {item.qty} <span className="text-xs font-normal text-slate-600">{item.unit}</span>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block font-medium">Min Threshold</span>
            <span className="text-base font-bold text-slate-900">
              {item.min_stock} <span className="text-xs font-normal text-slate-600">{item.unit}</span>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block font-medium">Unit Price</span>
            <span className="text-base font-bold text-slate-900">₹{item.price.toLocaleString()}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-slate-500 block font-medium">Inventory Value</span>
            <span className="text-base font-bold text-primary">₹{(item.qty * item.price).toLocaleString()}</span>
          </div>
        </div>

        {/* Ledger Transactions Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-4 h-4 text-primary" />
              Stock Movement History
            </h4>
            <span className="text-xs text-slate-500 font-medium">{txns.length} records</span>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-medium">Loading stock ledger...</span>
            </div>
          ) : txns.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No stock transactions found for this item yet.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-3 py-2.5">Date & Time</th>
                      <th className="px-3 py-2.5">Type</th>
                      <th className="px-3 py-2.5 text-right">Quantity</th>
                      <th className="px-3 py-2.5">Reference</th>
                      <th className="px-3 py-2.5">Remarks / Details</th>
                      <th className="px-3 py-2.5">User</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {txns.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                          {new Date(t.at).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <StatusBadge status={t.kind} />
                        </td>
                        <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${
                          t.kind === 'IN' ? 'text-emerald-700' : 'text-slate-800'
                        }`}>
                          {t.kind === 'IN' ? `+${t.qty}` : `-${t.qty}`} {t.unit}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {t.ref || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate" title={t.note}>
                          {t.note || '—'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap font-medium">
                          {t.by}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Rack Location: <strong className="text-slate-700">{item.location || 'Central Stores'}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
