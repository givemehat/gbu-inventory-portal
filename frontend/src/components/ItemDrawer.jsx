import React, { useEffect, useState } from 'react';
import { X, History, Info, Package, ArrowUpRight, ClipboardList, Printer } from 'lucide-react';
import { api } from '../api';
import StatusBadge from './StatusBadge';
import StockLevelBar from './StockLevelBar';

export default function ItemDrawer({ item, isOpen, onClose, onActionClick }) {
  const [tab, setTab] = useState('details'); // 'details' | 'ledger'
  const [txns, setTxns] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && item?.id) {
      setLoadingTxns(true);
      api.getTransactions({ item_id: item.id })
        .then((data) => setTxns(data))
        .catch(() => setTxns([]))
        .finally(() => setLoadingTxns(false));
    }
  }, [isOpen, item?.id]);

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-ink/30 backdrop-blur-[1px]">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div
          role="dialog"
          aria-modal="true"
          className="w-screen max-w-lg bg-surface border-l border-line shadow-lg flex flex-col animate-drawer-in"
        >
          {/* Header */}
          <div className="p-4 border-b border-line bg-paper flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-semibold text-primary bg-primary-light px-1.5 py-0.5 rounded border border-blue-200">
                  {item.code}
                </span>
                <span className="text-[12px] text-ink-muted">{item.category}</span>
                {item.low && (
                  <span className="px-1.5 py-0.2 rounded text-[11px] font-semibold border border-amber text-amber bg-amber-light/30">
                    Low stock
                  </span>
                )}
              </div>
              <h3 className="font-serif text-[18px] font-semibold text-ink mt-1 leading-snug">
                {item.name}
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowPrintModal(true)}
                title="Print Bin Card / Material Ledger"
                className="h-8 px-2.5 rounded border border-line bg-surface hover:bg-paper text-ink text-[12px] font-medium transition-colors inline-flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5 text-primary" />
                <span className="hidden sm:inline">Print Bin Card</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="text-ink-muted hover:text-ink p-1.5 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center border-b border-line px-4 bg-surface text-[13px] font-medium">
            <button
              type="button"
              onClick={() => setTab('details')}
              className={`py-2.5 mr-6 border-b-2 transition-colors ${
                tab === 'details'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              Item details
            </button>
            <button
              type="button"
              onClick={() => setTab('ledger')}
              className={`py-2.5 border-b-2 transition-colors flex items-center gap-1.5 ${
                tab === 'ledger'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              <span>Stock ledger</span>
              <span className="text-[11px] bg-paper px-1.5 py-0.2 rounded text-ink-muted">
                {txns.length}
              </span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {tab === 'details' ? (
              <div className="space-y-4">
                {/* Stock position panel */}
                <div className="p-3.5 bg-paper rounded border border-line">
                  <span className="text-[11px] uppercase tracking-wide font-semibold text-ink-muted block mb-2">
                    Current stock level
                  </span>
                  <div className="flex items-center justify-between">
                    <StockLevelBar qty={item.qty} minStock={item.min_stock} unit={item.unit} />
                    <span className="text-[12px] text-ink-muted">
                      Minimum threshold: <strong className="text-ink">{item.min_stock} {item.unit}</strong>
                    </span>
                  </div>
                </div>

                {/* Valuation and Location grid */}
                <div className="grid grid-cols-2 gap-3 text-[13px]">
                  <div className="p-3 bg-surface rounded border border-line">
                    <span className="text-[12px] text-ink-muted block">Latest rate / unit</span>
                    <span className="font-semibold text-ink text-[16px] tabular-nums mt-0.5 block">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 bg-surface rounded border border-line">
                    <span className="text-[12px] text-ink-muted block">Total stock valuation</span>
                    <span className="font-semibold text-primary text-[16px] tabular-nums mt-0.5 block">
                      ₹{(item.value || item.qty * item.price).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="p-3 bg-surface rounded border border-line">
                    <span className="text-[12px] text-ink-muted block">Rack location</span>
                    <span className="font-medium text-ink mt-0.5 block">
                      {item.location || 'Central Stores'}
                    </span>
                  </div>

                  <div className="p-3 bg-surface rounded border border-line">
                    <span className="text-[12px] text-ink-muted block">Unit of measure</span>
                    <span className="font-medium text-ink mt-0.5 block">{item.unit}</span>
                  </div>
                </div>

                {/* Quick actions inside drawer */}
                {onActionClick && (
                  <div className="pt-2 border-t border-line flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onActionClick('issue', item)}
                      className="flex-1 h-9 px-3 bg-primary hover:bg-primary-hover text-white rounded text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Issue stock</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onActionClick('indent', item)}
                      className="flex-1 h-9 px-3 bg-paper hover:bg-slate-100 text-ink border border-line rounded text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>Raise indent</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[12px] text-ink-muted block">
                  Chronological material receipts, dispatches and write-offs.
                </span>

                {loadingTxns ? (
                  <div className="py-12 text-center text-[13px] text-ink-muted">
                    Loading ledger entries...
                  </div>
                ) : txns.length === 0 ? (
                  <div className="py-12 text-center text-[13px] text-ink-muted">
                    No movements recorded for this item yet.
                  </div>
                ) : (
                  <div className="border border-line rounded overflow-hidden">
                    <table className="w-full text-left text-[12px]">
                      <thead className="bg-paper border-b border-line text-ink-muted font-medium text-[11px]">
                        <tr>
                          <th className="px-2.5 py-2">Date</th>
                          <th className="px-2 py-2">Type</th>
                          <th className="px-2 py-2 text-right">Quantity</th>
                          <th className="px-2.5 py-2">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/60 text-ink">
                        {txns.map((t) => (
                          <tr key={t.id} className="hover:bg-paper/60">
                            <td className="px-2.5 py-2 whitespace-nowrap text-ink-muted font-mono text-[11px]">
                              {new Date(t.at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              <StatusBadge status={t.kind} />
                            </td>
                            <td className={`px-2 py-2 text-right tabular-nums font-semibold whitespace-nowrap ${
                              t.kind === 'IN' ? 'text-green' : 'text-ink'
                            }`}>
                              {t.kind === 'IN' ? `+${t.qty}` : `-${t.qty}`}
                            </td>
                            <td className="px-2.5 py-2 text-ink-muted max-w-[150px] truncate" title={t.note}>
                              {t.ref && <span className="font-mono text-[11px] text-ink mr-1">[{t.ref}]</span>}
                              {t.note || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Bin Card Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-ink/50 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-surface rounded-panel max-w-3xl w-full border border-line shadow-xl overflow-hidden my-6">
            {/* Modal Controls (Hidden in print) */}
            <div className="no-print p-4 border-b border-line bg-paper flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded border border-blue-200">
                  FORM S&P-05
                </span>
                <span className="font-semibold text-ink text-[14px]">
                  Stock Bin Card & Ledger ({item.code})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="h-8 px-3 rounded bg-primary hover:bg-primary-hover text-white text-[12px] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPrintModal(false)}
                  className="p-1.5 text-ink-muted hover:text-ink rounded"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official GBU Printable A4 Sheet */}
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
                    <h2 className="font-serif text-[22px] font-bold text-ink uppercase tracking-tight leading-tight">
                      Gautam Buddha University
                    </h2>
                    <p className="text-[11px] text-ink-muted uppercase tracking-wider">
                      Opp. Yamuna Expressway, Greater Noida, Gautam Buddha Nagar, UP — 201312
                    </p>
                  </div>
                </div>
                <div className="mt-2 py-1 px-4 bg-paper rounded border border-line inline-block text-[12px] font-semibold text-ink uppercase tracking-wider">
                  Stores & Purchase Department • Central Stock Bin Card (FORM S&P-05)
                </div>
              </div>

              {/* Item Metadata */}
              <div className="grid grid-cols-3 gap-4 text-[12px] text-ink pb-3 border-b border-line bg-paper/50 p-3 rounded">
                <div>
                  <span className="text-ink-muted block text-[11px]">Item Code / Ref:</span>
                  <span className="font-mono font-bold text-primary">{item.code}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Nomenclature / Description:</span>
                  <span className="font-semibold">{item.name}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Category:</span>
                  <span className="font-medium">{item.category}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Unit of Measure:</span>
                  <span className="font-medium">{item.unit}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Storage Rack / Bay:</span>
                  <span className="font-medium">{item.location || 'Central Stores'}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Re-order Threshold:</span>
                  <span className="font-medium text-amber font-mono">{item.min_stock} {item.unit}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Current Available Stock:</span>
                  <span className="font-mono font-bold text-ink text-[14px]">{item.qty} {item.unit}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Last Procurement Rate:</span>
                  <span className="font-mono font-medium">₹{item.price.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Total Book Valuation:</span>
                  <span className="font-mono font-bold text-ink">₹{(item.value || item.qty * item.price).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Movement History */}
              <div>
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-ink mb-2">
                  Chronological Transaction Ledger
                </h4>
                <table className="w-full text-left text-[11px] border border-line">
                  <thead className="bg-paper border-b border-line text-ink-muted uppercase">
                    <tr>
                      <th className="p-2 border-r border-line">Date</th>
                      <th className="p-2 border-r border-line">Voucher Type</th>
                      <th className="p-2 border-r border-line">Reference No.</th>
                      <th className="p-2 border-r border-line text-right">Inward (Qty)</th>
                      <th className="p-2 border-r border-line text-right">Outward (Qty)</th>
                      <th className="p-2">Note / Allocation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {txns.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-ink-muted">No recorded transactions.</td>
                      </tr>
                    ) : (
                      txns.map((t) => (
                        <tr key={t.id}>
                          <td className="p-2 border-r border-line font-mono whitespace-nowrap">
                            {new Date(t.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="p-2 border-r border-line font-semibold">{t.kind}</td>
                          <td className="p-2 border-r border-line font-mono">{t.ref || '—'}</td>
                          <td className="p-2 border-r border-line text-right font-mono font-semibold text-green">
                            {t.kind === 'IN' ? `+${t.qty}` : '—'}
                          </td>
                          <td className="p-2 border-r border-line text-right font-mono font-semibold text-red">
                            {t.kind !== 'IN' ? `-${t.qty}` : '—'}
                          </td>
                          <td className="p-2 text-ink-muted truncate max-w-[200px]">{t.note || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-8 border-t border-line grid grid-cols-3 gap-6 text-center text-[11px]">
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink uppercase block">Store Keeper (Section)</span>
                  <span className="text-ink-muted block text-[10px]">Physical Custodian</span>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink uppercase block">Verification Officer</span>
                  <span className="text-ink-muted block text-[10px]">Internal Audit / Stock Verification</span>
                </div>
                <div className="space-y-8">
                  <div className="border-b border-line pb-1"></div>
                  <span className="font-semibold text-ink uppercase block">Store Officer (S&P)</span>
                  <span className="text-ink-muted block text-[10px]">Authorized Signatory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
