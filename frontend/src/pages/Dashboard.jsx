import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  IndianRupee,
  AlertTriangle,
  ClipboardList,
  Trash2,
  FileCheck2,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Clock,
  ChevronRight,
  Activity
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import ItemLedgerModal from '../components/ItemLedgerModal';
import { useToast } from '../components/Toast';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const user = getCurrentUser() || {};
  const toast = useToast();

  const loadData = () => {
    setLoading(true);
    api.getDashboard()
      .then((res) => setData(res))
      .catch((err) => toast.error(`Failed to load dashboard: ${err.message}`))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-gbu-800 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-medium">Loading university dashboard metrics...</span>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      label: 'Total Catalog Items',
      value: data.total_items,
      sub: 'Across 6 University Categories',
      icon: Package,
      color: 'bg-blue-500/10 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white',
      link: '/items',
    },
    {
      label: 'Inventory Valuation',
      value: `₹${(data.stock_value || 0).toLocaleString('en-IN')}`,
      sub: 'Current physical assets in store',
      icon: IndianRupee,
      color: 'bg-emerald-500/10 text-emerald-800 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white',
      link: '/reports',
    },
    {
      label: 'Low-Stock Alerts',
      value: data.low_stock_count || (data.low_stock ? data.low_stock.length : 0),
      sub: 'Items below minimum threshold',
      icon: AlertTriangle,
      color: 'bg-rose-500/10 text-rose-800 border-rose-200',
      iconBg: 'bg-rose-600 text-white',
      badge: (data.low_stock_count > 0) ? 'Action Required' : 'Healthy',
      link: '/items?low=true',
    },
    {
      label: 'Pending Indents',
      value: data.pending_indents || 0,
      sub: 'Awaiting Director S&P approval',
      icon: ClipboardList,
      color: 'bg-amber-500/10 text-amber-800 border-amber-200',
      iconBg: 'bg-amber-600 text-white',
      link: '/indents',
    },
    {
      label: 'Pending Write-offs',
      value: data.pending_writeoffs || 0,
      sub: 'Damaged/expired goods review',
      icon: Trash2,
      color: 'bg-purple-500/10 text-purple-800 border-purple-200',
      link: '/write-offs',
      iconBg: 'bg-purple-600 text-white',
    },
    {
      label: 'Active Purchase Orders',
      value: data.open_pos || 0,
      sub: 'Open / Partially received GRN',
      icon: FileCheck2,
      color: 'bg-indigo-500/10 text-indigo-800 border-indigo-200',
      iconBg: 'bg-indigo-600 text-white',
      link: '/purchase-orders',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-r from-gbu-900 to-gbu-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl shadow-gbu-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Stores & Purchase Portal Live
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Welcome back, {user.name}
          </h2>
          <p className="text-xs sm:text-sm text-gbu-200 mt-0.5">
            Role: <strong className="text-white capitalize">{user.role}</strong> • Department: {user.dept || 'Stores & Purchase'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            title="Refresh dashboard data"
            className="p-2.5 rounded-xl bg-gbu-800 hover:bg-gbu-700 text-gbu-200 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {['store', 'admin'].includes(user.role) && (
            <Link
              to="/issue-stock"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Issue Stock</span>
            </Link>
          )}
          {['dept', 'store', 'admin'].includes(user.role) && (
            <Link
              to="/indents"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-colors border border-white/20"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Raise Indent</span>
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              to={card.link}
              className={`p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between ${card.color}`}
            >
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                {card.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                    {card.badge}
                  </span>
                )}
              </div>
              <div className="mt-3">
                <span className="text-2xl font-black tracking-tight text-slate-900 block leading-tight">
                  {card.value}
                </span>
                <span className="text-xs font-semibold text-slate-700 block mt-0.5 leading-snug">
                  {card.label}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1 line-clamp-1">
                  {card.sub}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Visual Analytics Row: Category Valuation Bar Chart + 30-Day Movement Area Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Valuation Bar Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">Stock Valuation by Category</h3>
              <p className="text-xs text-slate-500">Total value in Rupees (Qty × Latest Unit Price)</p>
            </div>
            <span className="text-xs font-bold text-gbu-800 bg-gbu-50 px-2.5 py-1 rounded-lg border border-gbu-100">
              ₹{(data.stock_value || 0).toLocaleString('en-IN')} Total
            </span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.value_by_category} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Valuation']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#1e3a8a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 30-Day Stock Movement Timeline Chart */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">30-Day Material Movement</h3>
              <p className="text-xs text-slate-500">Physical inward, issuance, and condemnation trends</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> In: {data.flow_30d?.IN || 0}
              </span>
              <span className="flex items-center gap-1.5 text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> Out: {data.flow_30d?.OUT || 0}
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> W/O: {data.flow_30d?.WRITEOFF || 0}
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.movement_30d || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} interval={4} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="IN" name="Stock In" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                <Area type="monotone" dataKey="OUT" name="Stock Out" stroke="#2563eb" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Two-Column Tables: Low-Stock Alerts + Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low-Stock Alert Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-rose-50/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Low Stock Threshold Warnings</h3>
                <p className="text-xs text-slate-500">Current Qty ≤ Minimum Reorder Level</p>
              </div>
            </div>
            <Link
              to="/items?low=true"
              className="text-xs font-semibold text-rose-700 hover:text-rose-800 flex items-center gap-1"
            >
              View All ({data.low_stock?.length || 0})
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Item & Code</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5 text-center">In Stock</th>
                  <th className="px-3 py-2.5 text-center">Min Level</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!data.low_stock || data.low_stock.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      All item inventory levels are above minimum reorder threshold!
                    </td>
                  </tr>
                ) : (
                  data.low_stock.slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="text-left font-semibold text-slate-900 hover:text-gbu-800 truncate block max-w-xs"
                        >
                          {item.name}
                        </button>
                        <span className="font-mono text-[10px] text-slate-500">{item.code}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">{item.category}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-rose-700 bg-rose-50/60 rounded">
                        {item.qty} {item.unit}
                      </td>
                      <td className="px-3 py-2.5 text-center text-slate-500 font-medium">
                        {item.min_stock} {item.unit}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-gbu-800 bg-gbu-50 hover:bg-gbu-100 rounded-lg transition-colors border border-gbu-200"
                        >
                          Ledger
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Store Activity</h3>
                <p className="text-xs text-slate-500">Live feed of inward, outward and condemnations</p>
              </div>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-gbu-800 hover:text-gbu-900 flex items-center gap-1"
            >
              Export Log
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Item</th>
                  <th className="px-3 py-2.5 text-right">Qty</th>
                  <th className="px-3 py-2.5">Reference / Notes</th>
                  <th className="px-3 py-2.5">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!data.recent || data.recent.length === 0) ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No stock activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  data.recent.slice(0, 6).map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <StatusBadge status={txn.kind} />
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-900 block truncate max-w-xs">{txn.item}</span>
                        <span className="font-mono text-[10px] text-slate-500">{txn.code}</span>
                      </td>
                      <td className={`px-3 py-2.5 text-right font-bold whitespace-nowrap ${
                        txn.kind === 'IN' ? 'text-emerald-700' : 'text-slate-800'
                      }`}>
                        {txn.kind === 'IN' ? `+${txn.qty}` : `-${txn.qty}`} {txn.unit}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 max-w-xs truncate" title={txn.note}>
                        <span className="font-mono text-[11px] text-slate-700 font-medium mr-1.5">{txn.ref}</span>
                        {txn.note}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">
                        {txn.by}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Item Ledger Modal for quick inspection */}
      <ItemLedgerModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
