import React, { useEffect, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { api, getCurrentUser } from '../api';
import { useToast } from '../components/Toast';

export default function Reports() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('');
  const [downloadingStock, setDownloadingStock] = useState(false);
  const [downloadingTxn, setDownloadingTxn] = useState(false);

  const user = getCurrentUser() || {};
  const toast = useToast();

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getItems(), api.getCategories()])
      .then(([itemsData, catsData]) => {
        setItems(itemsData);
        setCategories(catsData);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDownloadStock = async () => {
    try {
      setDownloadingStock(true);
      await api.downloadStockReport();
      toast.success('Stock report downloaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloadingStock(false);
    }
  };

  const handleDownloadTxn = async () => {
    try {
      setDownloadingTxn(true);
      await api.downloadTxnReport();
      toast.success('Transactions ledger downloaded');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDownloadingTxn(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredItems = selectedCat
    ? items.filter((i) => i.category_id === Number(selectedCat))
    : items;

  const totalQty = filteredItems.reduce((acc, i) => acc + i.qty, 0);
  const totalValue = filteredItems.reduce((acc, i) => acc + (i.value || i.qty * i.price), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-medium text-ink leading-tight">
            Inventory Reports & Stock Statements
          </h1>
          <p className="text-[14px] text-ink-muted mt-1">
            Export structured CSV datasets for spreadsheet audits or generate official verified print statements.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleDownloadStock}
            disabled={downloadingStock}
            className="h-9 px-3 rounded border border-line bg-surface hover:bg-paper text-ink text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-ink-muted" />
            <span>{downloadingStock ? 'Downloading...' : 'Export stock CSV'}</span>
          </button>

          <button
            onClick={handleDownloadTxn}
            disabled={downloadingTxn}
            className="h-9 px-3 rounded border border-line bg-surface hover:bg-paper text-ink text-[13px] font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-ink-muted" />
            <span>{downloadingTxn ? 'Downloading...' : 'Export ledger CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="h-9 px-4 rounded bg-primary hover:bg-primary-hover text-surface text-[14px] font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print statement</span>
          </button>
        </div>
      </div>

      {/* Filter Header in web view */}
      <div className="no-print bg-surface p-4 rounded-panel border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label htmlFor="cat-filter" className="text-[13px] font-medium text-ink-muted">Filter category:</label>
          <select
            id="cat-filter"
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="h-8 text-[13px] px-2.5 rounded border border-line bg-surface text-ink outline-none focus:border-primary"
          >
            <option value="">All categories ({items.length} items)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[13px] text-ink-muted">
          Showing <span className="font-medium text-ink tabular-nums">{filteredItems.length}</span> items • Total valuation: <span className="font-medium text-ink tabular-nums">₹{totalValue.toLocaleString('en-IN')}</span>
        </span>
      </div>

      {/* Printable Statement Container */}
      <div className="print-container bg-surface rounded-panel border border-line p-6 sm:p-10 space-y-6">
        {/* University Header */}
        <div className="border-b-2 border-ink pb-5 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <img
              src="/gbu-logo.jpg"
              alt="Gautam Buddha University Logo"
              className="w-14 h-14 rounded-full object-contain border border-line"
            />
            <div className="text-left">
              <h2 className="font-serif text-[22px] sm:text-[26px] font-semibold text-ink uppercase tracking-tight leading-tight">
                Gautam Buddha University
              </h2>
              <p className="text-[11px] text-ink-muted uppercase tracking-wider">
                Greater Noida, Gautam Buddha Nagar, Uttar Pradesh — 201312
              </p>
            </div>
          </div>
          <div className="mt-2 py-1 px-4 bg-paper rounded border border-line inline-block text-[13px] font-medium text-ink uppercase tracking-wider">
            Stores & Purchase Department • Official Stock Position Statement
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-[12px] text-ink-muted border-t border-line pt-2 gap-2">
            <span>
              Report date: <strong className="text-ink">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
            </span>
            <span>
              Academic session: <strong className="text-ink">2026-2027</strong>
            </span>
            <span>
              Generated by: <strong className="text-ink">{user.name} ({user.role})</strong>
            </span>
          </div>
        </div>

        {/* Statement Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-paper text-ink font-semibold border-y border-line text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-3 py-2 text-center w-12">S.No.</th>
                <th className="px-3 py-2">Item code</th>
                <th className="px-3 py-2">Nomenclature & specifications</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Physical qty</th>
                <th className="px-3 py-2 text-right">Min level</th>
                <th className="px-3 py-2 text-right">Unit rate (₹)</th>
                <th className="px-3 py-2 text-right">Asset value (₹)</th>
                <th className="px-3 py-2 text-center">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-ink">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-paper/40">
                  <td className="px-3 py-2 text-center text-ink-muted font-mono">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono font-medium text-ink">{item.code}</td>
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2 text-ink-muted">{item.category}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    {item.qty} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-right text-ink-muted tabular-nums">
                    {item.min_stock} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    ₹{item.price.toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-ink">
                    ₹{(item.value || item.qty * item.price).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 text-center text-ink-muted">{item.location || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-ink bg-paper text-ink font-medium text-[12px]">
              <tr>
                <td colSpan={4} className="px-3 py-2.5 uppercase tracking-wide">
                  Total Valuation Summary ({filteredItems.length} items)
                </td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                  {totalQty.toLocaleString()} units
                </td>
                <td colSpan={2}></td>
                <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-ink text-[13px]">
                  ₹{totalValue.toLocaleString('en-IN')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* University Signatures Block */}
        <div className="pt-12 mt-8 border-t border-line grid grid-cols-3 gap-8 text-center text-[12px] text-ink-muted">
          <div>
            <div className="border-b border-ink/40 pb-1 w-3/4 mx-auto mb-1.5 font-medium text-ink">
              {user.role === 'store' ? user.name : 'Store Officer'}
            </div>
            <p className="font-medium text-ink">Store Officer / Custodian</p>
            <p className="text-[11px] text-ink-muted">Stores & Purchase Department</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-dashed border-line flex items-center justify-center text-[10px] text-ink-muted uppercase">
              Official Seal
            </div>
          </div>

          <div>
            <div className="border-b border-ink/40 pb-1 w-3/4 mx-auto mb-1.5 font-medium text-ink">
              Prof. (Dr.) Director (S&P)
            </div>
            <p className="font-medium text-ink">Director, Stores & Purchase</p>
            <p className="text-[11px] text-ink-muted">Gautam Buddha University</p>
          </div>
        </div>
      </div>
    </div>
  );
}
