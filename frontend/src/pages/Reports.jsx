import React, { useEffect, useState } from 'react';
import { Download, Printer, Calendar, BarChart3, Layers, Building, Users, RefreshCw } from 'lucide-react';
import { api, getCurrentUser } from '../api';
import { useToast } from '../components/Toast';
import { assetUrl } from '../lib/utils';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'bincard' | 'consumption' | 'abc' | 'vendor'
  const [loading, setLoading] = useState(false);

  // Stock Statement State
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [asOfDate, setAsOfDate] = useState('');
  const [historicalData, setHistoricalData] = useState(null);

  // Bin Card State
  const [selectedItemId, setSelectedItemId] = useState('');
  const [binCardData, setBinCardData] = useState(null);
  const [binCardFrom, setBinCardFrom] = useState('');
  const [binCardTo, setBinCardTo] = useState('');

  // Department Consumption State
  const [consumptionDays, setConsumptionDays] = useState(90);
  const [consumptionData, setConsumptionData] = useState(null);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('ALL');
  const [expandedDept, setExpandedDept] = useState(null);

  // ABC Analysis State
  const [abcData, setAbcData] = useState(null);

  // Vendor Performance State
  const [vendorData, setVendorData] = useState(null);

  const [downloadingStock, setDownloadingStock] = useState(false);
  const [downloadingTxn, setDownloadingTxn] = useState(false);

  const user = getCurrentUser() || {};
  const toast = useToast();

  // Load basic items & categories on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([api.getItems(), api.getCategories()])
      .then(([itemsData, catsData]) => {
        setItems(itemsData);
        setCategories(catsData);
        if (itemsData.length > 0) {
          setSelectedItemId(String(itemsData[0].id));
        }
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch data when switching tabs
  useEffect(() => {
    if (activeTab === 'consumption' && !consumptionData) {
      loadConsumption();
    } else if (activeTab === 'abc' && !abcData) {
      loadAbc();
    } else if (activeTab === 'vendor' && !vendorData) {
      loadVendor();
    } else if (activeTab === 'bincard' && selectedItemId && !binCardData) {
      loadBinCard();
    }
  }, [activeTab]);

  const loadStockAsOf = async (dateStr) => {
    if (!dateStr) {
      setHistoricalData(null);
      return;
    }
    try {
      setLoading(true);
      const res = await api.getStockAsOf(dateStr);
      setHistoricalData(res);
      toast.success(`Ledger replayed as of ${res.as_of_date}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadBinCard = async () => {
    if (!selectedItemId) return;
    try {
      setLoading(true);
      const res = await api.getBinCard(selectedItemId, binCardFrom, binCardTo);
      setBinCardData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadConsumption = async () => {
    try {
      setLoading(true);
      const res = await api.getConsumptionByDept(consumptionDays);
      setConsumptionData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadAbc = async () => {
    try {
      setLoading(true);
      const res = await api.getAbcAnalysis();
      setAbcData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadVendor = async () => {
    try {
      setLoading(true);
      const res = await api.getVendorPerformance();
      setVendorData(res);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

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

  // Stock Statement Display Items
  const activeStockList = historicalData ? historicalData.items : items;
  const filteredItems = selectedCat
    ? activeStockList.filter((i) => i.category_id === Number(selectedCat) || i.category === categories.find(c => c.id === Number(selectedCat))?.name)
    : activeStockList;

  const totalQty = filteredItems.reduce((acc, i) => acc + (Number(i.qty) || 0), 0);
  const totalValue = filteredItems.reduce((acc, i) => acc + (Number(i.value) || Number(i.qty) * Number(i.price) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Primary Actions (hidden on print) */}
      <div className="no-print space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
              Inventory Reports & Statements
            </h1>
            <div className="pt-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1565C0] pb-2 border-b-2 border-[#1565C0]">
                Analytical Ledgers & Consumption Statements
              </h2>
            </div>
            <p className="text-[15.5px] text-slate-600 mt-2">
              Statutory stock registers, historical audits, school-wise consumption plots, Pareto ABC analysis, and vendor ratings.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              onClick={handleDownloadStock}
              disabled={downloadingStock}
              className="h-9 px-3.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13.5px] font-semibold transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>{downloadingStock ? 'Downloading...' : 'Export Stock CSV'}</span>
            </button>

            <button
              onClick={handleDownloadTxn}
              disabled={downloadingTxn}
              className="h-9 px-3.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13.5px] font-semibold transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>{downloadingTxn ? 'Downloading...' : 'Export Transactions CSV'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="h-9 px-4 rounded-md bg-[#1565C0] hover:bg-blue-700 text-white text-[13.5px] font-semibold transition-colors inline-flex items-center gap-2 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Statement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (hidden on print) */}
      <div className="no-print border-b border-line flex items-center gap-1 overflow-x-auto text-[13px] font-medium">
        <button
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'stock'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Stock Position Statement</span>
        </button>

        <button
          onClick={() => setActiveTab('bincard')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'bincard'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Bin Card (Item Ledger)</span>
        </button>

        <button
          onClick={() => setActiveTab('consumption')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'consumption'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Department Consumption</span>
        </button>

        <button
          onClick={() => setActiveTab('abc')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'abc'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <span className="font-bold text-[12px] px-1 bg-amber-light text-amber rounded border border-amber-border">
            ABC
          </span>
          <span>ABC Pareto Analysis</span>
        </button>

        <button
          onClick={() => setActiveTab('vendor')}
          className={`px-4 py-2.5 border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'vendor'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Vendor Performance</span>
        </button>
      </div>

      {/* ==================== TAB 1: STOCK POSITION STATEMENT ==================== */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="no-print bg-surface p-4 rounded-panel border border-line flex flex-col md:flex-row md:items-center justify-between gap-3 text-[13px]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label htmlFor="cat-filter" className="font-medium text-ink-muted">Category:</label>
                <select
                  id="cat-filter"
                  value={selectedCat}
                  onChange={(e) => setSelectedCat(e.target.value)}
                  className="h-8 text-[13px] px-2.5 rounded border border-line bg-surface text-ink outline-none focus:border-primary"
                >
                  <option value="">All Categories ({activeStockList.length})</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Historical "As of Date" audit filter */}
              <div className="flex items-center gap-2 pl-2 border-l border-line">
                <label htmlFor="as-of-date" className="font-medium text-ink-muted flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>Audit date (As of):</span>
                </label>
                <input
                  id="as-of-date"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => {
                    setAsOfDate(e.target.value);
                    loadStockAsOf(e.target.value);
                  }}
                  className="h-8 text-[13px] px-2.5 rounded border border-line bg-surface text-ink outline-none focus:border-primary"
                />
                {asOfDate && (
                  <button
                    onClick={() => {
                      setAsOfDate('');
                      setHistoricalData(null);
                    }}
                    className="text-[12px] text-red hover:underline"
                  >
                    Reset to Live
                  </button>
                )}
              </div>
            </div>

            <div className="text-ink-muted text-right">
              {historicalData ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[12px] font-medium">
                  Historical View as of {historicalData.as_of_date}
                </span>
              ) : (
                <span>
                  Live Position • Valuation: <strong className="text-ink font-semibold">₹{totalValue.toLocaleString('en-IN')}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Printable Statement Container */}
          <div className="print-container bg-surface rounded-panel border border-line p-6 sm:p-10 space-y-6">
            <div className="border-b-2 border-ink pb-4 text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <img
                  src={assetUrl('gbu-logo.jpg')}
                  alt="GBU Logo"
                  className="w-14 h-14 rounded-full object-contain border border-line"
                />
                <div className="text-left">
                  <h2 className="font-serif text-[22px] sm:text-[24px] font-semibold text-ink tracking-tight leading-tight">
                    Gautam Buddha University
                  </h2>
                  <p className="text-[11px] text-ink-muted">
                    Greater Noida, Gautam Buddha Nagar, Uttar Pradesh — 201312
                  </p>
                </div>
              </div>
              <div className="mt-2 py-1 px-4 bg-paper rounded border border-line inline-block text-[13px] font-medium text-ink">
                Stores & Purchase Department • Stock Position Statement (Sample format)
              </div>

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between text-[12px] text-ink-muted border-t border-line pt-2 gap-2">
                <span>
                  Statement Date: <strong className="text-ink">{asOfDate ? asOfDate : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>
                </span>
                <span>
                  Academic Session: <strong className="text-ink">2026-2027</strong>
                </span>
                <span>
                  Generated by: <strong className="text-ink">{user.name} ({user.role})</strong>
                </span>
              </div>
            </div>

            {/* Statement Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-paper text-ink font-semibold border-y border-line text-[11px]">
                  <tr>
                    <th className="px-3 py-2 text-center w-12">S.No.</th>
                    <th className="px-3 py-2">Item Code</th>
                    <th className="px-3 py-2">Nomenclature & Specifications</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Physical Qty</th>
                    <th className="px-3 py-2 text-right">Min Level</th>
                    <th className="px-3 py-2 text-right">Unit Rate (₹)</th>
                    <th className="px-3 py-2 text-right">Asset Value (₹)</th>
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
                        ₹{Number(item.price).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular-nums text-ink">
                        ₹{(Number(item.value) || Number(item.qty) * Number(item.price)).toLocaleString('en-IN')}
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
            <div className="pt-10 mt-6 border-t border-line grid grid-cols-3 gap-8 text-center text-[12px] text-ink-muted">
              <div>
                <div className="border-b border-ink/40 pb-1 w-3/4 mx-auto mb-1.5 font-medium text-ink">
                  {user.role === 'store' ? user.name : 'Store Officer'}
                </div>
                <p className="font-medium text-ink">Store Officer / Custodian</p>
                <p className="text-[11px] text-ink-muted">Stores & Purchase Department</p>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border border-dashed border-line flex items-center justify-center text-[10px] text-ink-muted uppercase">
                  Seal
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

            <div className="pt-2 text-center text-[10px] text-ink-subtle">
              Sample format · Gautam Buddha University Stores & Purchase Prototype
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: BIN CARD (ITEM LEDGER) ==================== */}
      {activeTab === 'bincard' && (
        <div className="space-y-4">
          <div className="no-print bg-surface p-4 rounded-panel border border-line flex flex-wrap items-center gap-3 text-[13px]">
            <div className="flex items-center gap-2">
              <label htmlFor="bincard-item-select" className="font-medium text-ink-muted">Select Item:</label>
              <select
                id="bincard-item-select"
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setBinCardData(null);
                }}
                className="h-8.5 px-3 rounded border border-line bg-surface text-ink font-medium outline-none focus:border-primary max-w-xs"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    [{it.code}] {it.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pl-2 border-l border-line">
              <label htmlFor="bincard-from-date" className="font-medium text-ink-muted">From:</label>
              <input
                id="bincard-from-date"
                type="date"
                value={binCardFrom}
                onChange={(e) => setBinCardFrom(e.target.value)}
                className="h-8.5 px-2 rounded border border-line bg-surface text-ink text-[12px]"
              />
              <label htmlFor="bincard-to-date" className="font-medium text-ink-muted">To:</label>
              <input
                id="bincard-to-date"
                type="date"
                value={binCardTo}
                onChange={(e) => setBinCardTo(e.target.value)}
                className="h-8.5 px-2 rounded border border-line bg-surface text-ink text-[12px]"
              />
            </div>

            <button
              onClick={loadBinCard}
              disabled={loading}
              className="h-8.5 px-3 rounded bg-primary hover:bg-primary-hover text-surface text-[12px] font-medium transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Load Bin Card</span>
            </button>
          </div>

          {binCardData && (
            <div className="print-container bg-surface rounded-panel border border-line p-6 sm:p-10 space-y-6">
              <div className="border-b-2 border-ink pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-[22px] font-semibold text-ink">
                      Bin Card — S&P-05 (Sample format)
                    </h2>
                    <p className="text-[12px] text-ink-muted">
                      Central Stores & Purchase • Gautam Buddha University
                    </p>
                  </div>
                  <div className="text-right text-[12px]">
                    <span className="block font-mono font-semibold text-ink text-[14px]">
                      {binCardData.item.code}
                    </span>
                    <span className="text-ink-muted">Location: {binCardData.item.location || 'Central Rack'}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-paper p-3 rounded border border-line text-[12px]">
                  <div>
                    <span className="text-ink-muted block text-[11px]">Item Nomenclature</span>
                    <strong className="text-ink text-[13px]">{binCardData.item.name}</strong>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Unit of Measure</span>
                    <strong className="text-ink">{binCardData.item.unit}</strong>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Opening Balance</span>
                    <strong className="text-ink font-mono">{binCardData.opening_balance}</strong>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Closing Balance</span>
                    <strong className="text-primary font-mono text-[14px]">{binCardData.closing_balance}</strong>
                  </div>
                </div>
              </div>

              {/* Ledger Entries Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-paper text-ink font-semibold border-y border-line text-[11px]">
                    <tr>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Doc / Ref No.</th>
                      <th className="px-3 py-2">Particulars / Department</th>
                      <th className="px-3 py-2 text-right">Receipt (In)</th>
                      <th className="px-3 py-2 text-right">Issue (Out)</th>
                      <th className="px-3 py-2 text-right">Balance Qty</th>
                      <th className="px-3 py-2">Authorized By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    <tr className="bg-blue-50/40 text-blue-900 font-medium">
                      <td className="px-3 py-2">{binCardData.from_date}</td>
                      <td className="px-3 py-2 font-mono">B/F</td>
                      <td className="px-3 py-2">Balance Brought Forward</td>
                      <td className="px-3 py-2 text-right">—</td>
                      <td className="px-3 py-2 text-right">—</td>
                      <td className="px-3 py-2 text-right font-mono font-bold">{binCardData.opening_balance}</td>
                      <td className="px-3 py-2 text-ink-muted">Audit</td>
                    </tr>
                    {binCardData.entries.map((e) => (
                      <tr key={e.id} className="hover:bg-paper/40">
                        <td className="px-3 py-2 font-mono">{e.date}</td>
                        <td className="px-3 py-2 font-mono font-medium">{e.ref || '—'}</td>
                        <td className="px-3 py-2">{e.particulars}</td>
                        <td className="px-3 py-2 text-right font-mono text-green font-medium">
                          {e.receipt_qty > 0 ? `+${e.receipt_qty}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-ink font-medium">
                          {e.issue_qty > 0 ? `-${e.issue_qty}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold text-ink">
                          {e.balance_qty}
                        </td>
                        <td className="px-3 py-2 text-ink-muted">{e.by}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-ink bg-paper font-semibold text-[12px]">
                    <tr>
                      <td colSpan={3} className="px-3 py-2">Period Totals</td>
                      <td className="px-3 py-2 text-right font-mono text-green">
                        +{binCardData.total_receipts}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-ink">
                        -{binCardData.total_issues}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-primary text-[13px]">
                        {binCardData.closing_balance} {binCardData.item.unit}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== TAB 3: DEPARTMENT CONSUMPTION ==================== */}
      {activeTab === 'consumption' && consumptionData && (
        <div className="space-y-4">
          <div className="no-print bg-surface p-4 rounded-panel border border-line flex items-center justify-between text-[13px]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink-muted">Analysis Window:</span>
              {[30, 60, 90, 180, 0].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setConsumptionDays(d);
                    loadConsumption();
                  }}
                  className={`px-2.5 py-1 rounded text-[12px] font-medium transition-colors ${
                    consumptionDays === d
                      ? 'bg-primary text-white'
                      : 'bg-paper text-ink hover:bg-line'
                  }`}
                >
                  {d === 0 ? 'All Time' : `${d} Days`}
                </button>
              ))}
            </div>

            {/* School Filter Selector */}
            <div className="flex items-center gap-2">
              <label htmlFor="school-filter" className="text-[12px] font-medium text-ink-muted">Filter School:</label>
              <select
                id="school-filter"
                value={selectedSchoolFilter}
                onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                className="h-8 px-2.5 rounded border border-line bg-surface text-ink text-[12px] outline-none focus:border-primary max-w-xs truncate"
              >
                <option value="ALL">All University Schools ({consumptionData.departments.length})</option>
                {consumptionData.departments.map((d) => (
                  <option key={d.department} value={d.department}>
                    {d.department} (₹{d.total_value.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-ink-muted">
              Total Consumption Value: <strong className="text-ink font-semibold">₹{consumptionData.total_consumption_value.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="bg-surface rounded-panel border border-line p-5 space-y-4">
            <div>
              <h2 className="font-serif text-[20px] font-medium text-ink">
                Individual School Spend & Material Consumption Breakdown
              </h2>
              <p className="text-[13px] text-ink-muted mt-0.5">
                Detailed audit of store issues, top items consumed, and voucher history across academic schools.
              </p>
            </div>

            <div className="space-y-3">
              {consumptionData.departments
                .filter((d) => selectedSchoolFilter === 'ALL' || d.department === selectedSchoolFilter)
                .map((dept, idx) => {
                  const isExpanded = expandedDept === dept.department || selectedSchoolFilter !== 'ALL';
                  return (
                    <div
                      key={idx}
                      className="rounded border border-line bg-surface overflow-hidden transition-all duration-200 shadow-2xs"
                    >
                      {/* Department Summary Row */}
                      <button
                        type="button"
                        onClick={() => setExpandedDept(isExpanded && selectedSchoolFilter === 'ALL' ? null : dept.department)}
                        aria-expanded={isExpanded}
                        className="w-full text-left p-3.5 bg-paper/40 hover:bg-paper cursor-pointer flex items-center justify-between gap-4 transition-colors focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-ink text-[14px] block truncate">
                              {dept.department}
                            </span>
                            <span className="text-[11px] text-ink-muted">
                              {dept.issues_count} requisitions • {dept.total_qty.toLocaleString()} total units drawn
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <strong className="text-[15px] font-mono font-bold text-ink block">
                              ₹{dept.total_value.toLocaleString('en-IN')}
                            </strong>
                            <span className="text-[11px] text-primary font-medium">
                              {dept.pct}% of store budget
                            </span>
                          </div>

                          <span className="text-[12px] text-primary font-medium hover:underline hidden sm:inline-block">
                            {isExpanded ? 'Hide items' : 'View consumed items'} →
                          </span>
                        </div>
                      </button>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 bg-line overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(dept.pct, 100)}%` }}
                        />
                      </div>

                      {/* Expandable Individual School Details */}
                      {isExpanded && (
                        <div className="p-4 bg-surface border-t border-line space-y-4 animate-in fade-in duration-150">
                          {/* Top Consumed Items Table */}
                          <div>
                            <span className="text-[12px] font-semibold text-ink-muted block mb-2">
                              Top Consumed Materials by {dept.department}
                            </span>
                            {(!dept.top_items || dept.top_items.length === 0) ? (
                              <p className="text-[12px] text-ink-muted italic">No itemized breakdown recorded.</p>
                            ) : (
                              <div className="overflow-x-auto border border-line rounded">
                                <table className="w-full text-left text-[12px]">
                                  <thead className="bg-paper border-b border-line text-ink font-semibold text-[11px]">
                                    <tr>
                                      <th className="p-2">Item Nomenclature</th>
                                      <th className="p-2 text-right">Units Consumed</th>
                                      <th className="p-2 text-right">Valuation (₹)</th>
                                      <th className="p-2 text-right">% of School Spend</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-line/60 text-ink">
                                    {dept.top_items.map((item, iIdx) => {
                                      const itemPct = dept.total_value > 0 ? ((item.value / dept.total_value) * 100).toFixed(1) : 0;
                                      return (
                                        <tr key={iIdx} className="hover:bg-paper/30">
                                          <td className="p-2 font-medium">{item.name}</td>
                                          <td className="p-2 text-right font-mono">{item.qty} {item.unit}</td>
                                          <td className="p-2 text-right font-mono font-semibold">₹{item.value.toLocaleString('en-IN')}</td>
                                          <td className="p-2 text-right font-mono text-ink-muted">{itemPct}%</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>

                          {/* Recent Issue Slips */}
                          {dept.recent_vouchers && dept.recent_vouchers.length > 0 && (
                            <div>
                              <span className="text-[12px] font-semibold text-ink-muted block mb-2">
                                Recent Store Issue Vouchers ({dept.recent_vouchers.length})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                {dept.recent_vouchers.map((v) => (
                                  <div key={v.id} className="p-2 bg-paper rounded border border-line flex items-center justify-between">
                                    <div>
                                      <span className="font-mono font-semibold text-primary">[{v.ref}]</span>
                                      <span className="font-medium text-ink ml-1.5">{v.item}</span>
                                      <span className="text-ink-muted block mt-0.5">{v.qty} {v.unit} • {v.date}</span>
                                    </div>
                                    <strong className="font-mono text-ink">₹{v.value.toLocaleString('en-IN')}</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: ABC ANALYSIS ==================== */}
      {activeTab === 'abc' && abcData && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-surface p-4 rounded-panel border border-line">
              <span className="text-[12px] text-ink-muted block">Annual Turnover Value</span>
              <strong className="text-[20px] font-serif text-ink mt-0.5 block">
                ₹{abcData.grand_total_value.toLocaleString('en-IN')}
              </strong>
            </div>
            <div className="bg-surface p-4 rounded-panel border border-line">
              <span className="text-[12px] text-red block font-medium">Category A (High Value)</span>
              <strong className="text-[20px] font-serif text-ink mt-0.5 block">
                {abcData.summary.class_a_count} items
              </strong>
              <span className="text-[11px] text-ink-muted">~70% of total spend</span>
            </div>
            <div className="bg-surface p-4 rounded-panel border border-line">
              <span className="text-[12px] text-amber block font-medium">Category B (Moderate)</span>
              <strong className="text-[20px] font-serif text-ink mt-0.5 block">
                {abcData.summary.class_b_count} items
              </strong>
              <span className="text-[11px] text-ink-muted">~20% of total spend</span>
            </div>
            <div className="bg-surface p-4 rounded-panel border border-line">
              <span className="text-[12px] text-blue-700 block font-medium">Category C (Bulk / Low)</span>
              <strong className="text-[20px] font-serif text-ink mt-0.5 block">
                {abcData.summary.class_c_count} items
              </strong>
              <span className="text-[11px] text-ink-muted">~10% of total spend</span>
            </div>
          </div>

          <div className="bg-surface rounded-panel border border-line p-6 space-y-4">
            <div>
              <h2 className="font-serif text-[20px] font-medium text-ink">
                ABC Pareto Classification Register
              </h2>
              <p className="text-[13px] text-ink-muted mt-0.5">
                Items ranked by annual consumption value. High-value Class A items require strict physical verification.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-paper text-ink font-semibold border-y border-line text-[11px]">
                  <tr>
                    <th className="px-3 py-2 text-center w-12">Class</th>
                    <th className="px-3 py-2">Item Code</th>
                    <th className="px-3 py-2">Item Name</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2 text-right">Unit Rate (₹)</th>
                    <th className="px-3 py-2 text-right">Annual Turn (₹)</th>
                    <th className="px-3 py-2 text-right">Cumulative %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line text-ink">
                  {abcData.items.map((it) => (
                    <tr key={it.id} className="hover:bg-paper/40">
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-block w-6 py-0.5 text-center rounded font-bold text-[11px] ${
                            it.class === 'A'
                              ? 'bg-red-light text-red border border-red-border'
                              : it.class === 'B'
                              ? 'bg-amber-light text-amber border border-amber-border'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {it.class}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono font-medium">{it.code}</td>
                      <td className="px-3 py-2 font-medium">{it.name}</td>
                      <td className="px-3 py-2 text-ink-muted">{it.category}</td>
                      <td className="px-3 py-2 text-right font-mono">₹{it.unit_price}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        ₹{it.annual_value.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-ink-muted">
                        {it.cumulative_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: VENDOR PERFORMANCE ==================== */}
      {activeTab === 'vendor' && vendorData && (
        <div className="bg-surface rounded-panel border border-line p-6 space-y-4">
          <div>
            <h2 className="font-serif text-[20px] font-medium text-ink">
              Registered Vendor Scorecard & Delivery Metrics
            </h2>
            <p className="text-[13px] text-ink-muted mt-0.5">
              Tracks purchase order volume, fulfillment rates (GRN vs PO), and spend per empanelled supplier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vendorData.vendors.map((v) => (
              <div key={v.id} className="p-4 rounded border border-line bg-paper/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-[15px] text-ink">{v.name}</h3>
                    <p className="text-[12px] text-ink-muted">{v.contact}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[12px] font-bold ${
                      v.rating === 'A'
                        ? 'bg-green-light text-green border border-green-border'
                        : 'bg-amber-light text-amber border border-amber-border'
                    }`}
                  >
                    Rating: {v.rating}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-surface p-2.5 rounded border border-line text-center text-[12px]">
                  <div>
                    <span className="text-ink-muted block text-[11px]">Total POs</span>
                    <strong className="text-ink text-[14px]">{v.po_count}</strong>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Fulfillment</span>
                    <strong className="text-ink text-[14px]">{v.fill_rate_percentage}%</strong>
                  </div>
                  <div>
                    <span className="text-ink-muted block text-[11px]">Total Spend</span>
                    <strong className="text-ink text-[14px]">₹{v.total_spend.toLocaleString('en-IN')}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-ink-muted">
                  <span>Fulfilled: {v.completed_pos}</span>
                  <span>Pending Inward: {v.pending_pos}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
