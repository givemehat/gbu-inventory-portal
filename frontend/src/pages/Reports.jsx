import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Layers,
  Building,
  CheckCircle2,
  FileText,
  Search,
  Filter
} from 'lucide-react';
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
      toast.success('Stock Report downloaded successfully.');
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
      toast.success('Transactions Ledger downloaded successfully.');
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
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">University Inventory Reports & Audit Statements</h2>
          <p className="text-xs text-slate-500">
            Export structured CSV datasets for spreadsheet audits or generate verified print statements.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadStock}
            disabled={downloadingStock}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gbu-800" />
            <span>{downloadingStock ? 'Downloading...' : 'Export Stock CSV'}</span>
          </button>

          <button
            onClick={handleDownloadTxn}
            disabled={downloadingTxn}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gbu-800" />
            <span>{downloadingTxn ? 'Downloading...' : 'Export Ledger CSV'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gbu-900 hover:bg-gbu-800 text-white text-xs font-bold shadow-md shadow-gbu-950/20 transition-all print-include"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement</span>
          </button>
        </div>
      </div>

      {/* Filter Header in web view */}
      <div className="no-print bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600">Filter Category for Statement:</span>
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 outline-none"
          >
            <option value="">All Categories ({items.length} items)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredItems.length} items • Subtotal Valuation: <strong>₹{totalValue.toLocaleString('en-IN')}</strong>
        </span>
      </div>

      {/* Printable University Statement Container */}
      <div className="print-container bg-white rounded-3xl border border-slate-200 shadow-lg p-6 sm:p-10 space-y-6">
        {/* University Official Header */}
        <div className="border-b-2 border-slate-900 pb-5 text-center relative">
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-xl bg-gbu-900 text-amber-400 flex items-center justify-center font-black text-xl border border-gbu-800 shadow-sm">
              GBU
            </div>
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase">
                Gautam Buddha University
              </h1>
              <p className="text-xs text-slate-600 font-semibold tracking-wider uppercase">
                Greater Noida, Gautam Buddha Nagar, Uttar Pradesh - 201312
              </p>
            </div>
          </div>
          <div className="mt-3 py-1 bg-gbu-900 text-white rounded-lg font-bold text-xs sm:text-sm uppercase tracking-widest inline-block px-6">
            Stores & Purchase Department • Official Stock Position Statement
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2">
            <span>
              Report Date:{' '}
              <strong className="text-slate-800">
                {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
            </span>
            <span>
              Academic Session: <strong className="text-slate-800">2026-2027</strong>
            </span>
            <span>
              Generated by: <strong className="text-slate-800">{user.name} ({user.role})</strong>
            </span>
          </div>
        </div>

        {/* Statement Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-y-2 border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2 text-center w-12">S.No.</th>
                <th className="px-3 py-2">Item Code</th>
                <th className="px-3 py-2">Nomenclature & Specifications</th>
                <th className="px-3 py-2">Category</th>
                <th className="px-3 py-2 text-right">Physical Qty</th>
                <th className="px-3 py-2 text-right">Min Level</th>
                <th className="px-3 py-2 text-right">Unit Rate (₹)</th>
                <th className="px-3 py-2 text-right">Asset Value (₹)</th>
                <th className="px-3 py-2 text-center">Rack Loc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {filteredItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 text-center font-mono text-slate-500">{idx + 1}</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-900">{item.code}</td>
                  <td className="px-3 py-2 font-medium">{item.name}</td>
                  <td className="px-3 py-2 text-slate-600">{item.category}</td>
                  <td className="px-3 py-2 text-right font-bold">
                    {item.qty} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500 font-medium">
                    {item.min_stock} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-right">₹{item.price.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-2 text-right font-bold text-slate-950">
                    ₹{(item.value || item.qty * item.price).toLocaleString('en-IN')}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-500">{item.location || '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-slate-900 bg-slate-50 text-slate-900 font-bold text-xs">
              <tr>
                <td colSpan={4} className="px-3 py-2.5 uppercase tracking-wider">
                  Total Valuation Summary ({filteredItems.length} items)
                </td>
                <td className="px-3 py-2.5 text-right font-extrabold">{totalQty.toLocaleString()} units</td>
                <td colSpan={2}></td>
                <td className="px-3 py-2.5 text-right text-sm font-black text-gbu-950">
                  ₹{totalValue.toLocaleString('en-IN')}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Official University Signature & Stamp Block */}
        <div className="pt-14 mt-10 border-t border-slate-200 grid grid-cols-3 gap-8 text-center text-xs text-slate-700">
          <div>
            <div className="border-b border-slate-400 pb-1 w-3/4 mx-auto mb-1.5 font-bold text-slate-900">
              {user.role === 'store' ? user.name : 'Store Officer'}
            </div>
            <p className="font-semibold text-slate-800">Store Officer / Custodian</p>
            <p className="text-[11px] text-slate-500">Central Stores & Purchase Dept</p>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 uppercase font-semibold">
              Official Seal
            </div>
          </div>

          <div>
            <div className="border-b border-slate-400 pb-1 w-3/4 mx-auto mb-1.5 font-bold text-slate-900">
              Prof. (Dr.) Director (S&P)
            </div>
            <p className="font-semibold text-slate-800">Director, Stores & Purchase</p>
            <p className="text-[11px] text-slate-500">Gautam Buddha University</p>
          </div>
        </div>
      </div>
    </div>
  );
}
