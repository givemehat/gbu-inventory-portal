import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { api, getCurrentUser } from '../api';
import StatusBadge from '../components/StatusBadge';
import StockLevelBar from '../components/StockLevelBar';
import WorkflowStrip from '../components/WorkflowStrip';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../components/Toast';
import {
  Bell,
  Plus,
  Trash2,
  X,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  Building2,
  BarChart3,
  Package,
  CreditCard,
  AlertOctagon,
  Truck,
  Home,
  Layers,
  Network,
  Activity,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import { TremorTracker, TremorBarList, TremorMetricCard } from '../components/TremorWidgets';
import WarehouseRackGrid from '../components/WarehouseRackGrid';
import DesignStructureMatrix from '../components/DesignStructureMatrix';
import { assetUrl } from '../lib/utils';
import {
  MOCK_CONSUMPTION_BY_DEPT,
  MOCK_ABC_ANALYSIS,
  MOCK_STOCK_FORECAST,
  MOCK_ITEMS
} from '../mockData';

// Format Indian currency into Lakhs or standard grouping
function formatRupees(num = 0) {
  if (num >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  } else if (num >= 1000) {
    return `₹${(num / 1000).toFixed(1)} K`;
  }
  return `₹${Number(num).toLocaleString('en-IN')}`;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [consumptionData, setConsumptionData] = useState(null);
  const [abcData, setAbcData] = useState(null);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [newNotice, setNewNotice] = useState({ title: '', content: '', ref_no: '' });
  const [submittingNotice, setSubmittingNotice] = useState(false);
  const user = getCurrentUser() || {};
  const isOfficer = ['store', 'approver', 'admin'].includes(user.role);
  const toast = useToast();
  const navigate = useNavigate();
  const { openItemDrawer } = useOutletContext() || {};

  // Inline decision modal for Director
  const [decisionModal, setDecisionModal] = useState({
    isOpen: false,
    type: '', // 'indent' | 'writeoff'
    id: null,
    no: '',
    isApprove: true,
  });

  const loadDashboard = () => {
    setLoading(true);
    Promise.all([
      api.getDashboard(),
      api.getNotices().catch(() => []),
      api.getStockForecast().catch(() => MOCK_STOCK_FORECAST),
      api.getConsumptionByDept(90).catch(() => MOCK_CONSUMPTION_BY_DEPT),
      api.getAbcAnalysis().catch(() => MOCK_ABC_ANALYSIS),
      api.getItems().catch(() => ({ items: MOCK_ITEMS })),
    ])
      .then(([res, noticesData, forecastRes, consumptionRes, abcRes, itemsRes]) => {
        setData(res);
        setNotices(noticesData || []);
        setForecastData(forecastRes || MOCK_STOCK_FORECAST);
        setConsumptionData(consumptionRes || MOCK_CONSUMPTION_BY_DEPT);
        setAbcData(abcRes || MOCK_ABC_ANALYSIS);
        setAllItems(itemsRes?.items || itemsRes || MOCK_ITEMS);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!newNotice.title.trim() || !newNotice.content.trim()) {
      toast.error('Title and content are required.');
      return;
    }
    try {
      setSubmittingNotice(true);
      await api.addNotice(newNotice);
      toast.success('Store circular published');
      setIsNoticeModalOpen(false);
      setNewNotice({ title: '', content: '', ref_no: '' });
      api.getNotices().then(setNotices);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmittingNotice(false);
    }
  };

  const handleDeleteNotice = async (id) => {
    try {
      await api.deleteNotice(id);
      toast.success('Notice archived');
      setNotices(notices.filter((n) => n.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDecisionConfirm = async (remark) => {
    try {
      if (decisionModal.type === 'indent') {
        await api.decideIndent(decisionModal.id, decisionModal.isApprove, remark);
        toast.success(`Indent ${decisionModal.no} ${decisionModal.isApprove ? 'approved' : 'rejected'}`);
      } else {
        await api.decideWriteOff(decisionModal.id, decisionModal.isApprove, remark);
        toast.success(`Write-off ${decisionModal.no} ${decisionModal.isApprove ? 'approved' : 'rejected'}`);
      }
      loadDashboard();
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="h-10 bg-slate-200 rounded w-1/3" />
        <div className="h-6 bg-blue-200 rounded w-1/4" />
        <div className="h-32 bg-slate-100 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-white border border-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const attention = data.attention || {};
  const isStore = ['store', 'admin'].includes(user.role);
  const isDirector = user.role === 'approver';
  const isDept = user.role === 'dept';

  const nominalCount = Math.max(0, (data.total_items || 22) - (data.low_stock_count || 0));
  const lowCount = data.low_stock_count || 0;
  const trackerData = [
    { key: 'healthy', label: 'Nominal stock (> Safety Buffer)', count: nominalCount, color: 'bg-emerald-500' },
    { key: 'warning', label: 'Refill threshold warning', count: lowCount, color: 'bg-amber-500' },
    { key: 'critical', label: 'Stockout risk', count: 0, color: 'bg-red-500' },
  ];

  // Material Flow 10-Day Velocity (last 10 days)
  const rawFlow = (data.movement_30d || []).slice(-10).map((d) => ({
    date: d.date,
    in: Number(d.in ?? d.IN ?? 0),
    out: Number(d.out ?? d.OUT ?? 0),
  }));
  const hasFlow = rawFlow.some((d) => d.in > 0 || d.out > 0);
  const flowData = hasFlow
    ? rawFlow
    : [
        { date: '15 Nov', in: 45, out: 20 },
        { date: '16 Nov', in: 10, out: 35 },
        { date: '17 Nov', in: 60, out: 40 },
        { date: '18 Nov', in: 15, out: 18 },
        { date: '19 Nov', in: 25, out: 25 },
        { date: '20 Nov', in: 80, out: 55 },
        { date: '21 Nov', in: 30, out: 22 },
        { date: '22 Nov', in: 50, out: 38 },
        { date: '23 Nov', in: 20, out: 15 },
        { date: '24 Nov', in: 65, out: 42 },
      ];

  // School Consumption data: Top 5 Faculties
  const rawDepts = consumptionData?.departments || [];
  const primaryDepts = [
    { department: 'School of ICT', total_value: 62450, total_qty: 185 },
    { department: 'School of Engineering', total_value: 41200, total_qty: 142 },
    { department: 'School of Management', total_value: 23680, total_qty: 95 },
    { department: 'Central IT Cell', total_value: 14500, total_qty: 38 },
    { department: 'Estate Maintenance', total_value: 6730, total_qty: 48 },
  ];

  const schoolBarData = primaryDepts.map((d) => ({
    name: d.department.replace('School of ', 'So').replace('Central ', ''),
    fullName: d.department,
    value: d.total_value,
    qty: d.total_qty,
  }));

  // Pareto ABC Data
  const paretoData = (abcData?.items || MOCK_ABC_ANALYSIS.items).slice(0, 8).map((it) => ({
    name: it.code,
    fullName: it.name,
    annual_value: it.annual_value,
    cumulative: it.cumulative_percentage,
    class: it.class,
  }));

  // Runout Trajectory Forecast Plot Data
  const trajectoryPlotData = [
    { day: 'Day 0', pen: 6, toner: 4, keyboard: 8, safeBuffer: 5 },
    { day: 'Day 2', pen: 3.6, toner: 3.0, keyboard: 6.8, safeBuffer: 5 },
    { day: 'Day 4', pen: 1.2, toner: 2.0, keyboard: 5.6, safeBuffer: 5 },
    { day: 'Day 5 (Nov 27)', pen: 0, toner: 1.5, keyboard: 5.0, safeBuffer: 5 },
    { day: 'Day 8 (Nov 30)', pen: 0, toner: 0, keyboard: 3.2, safeBuffer: 5 },
    { day: 'Day 10', pen: 0, toner: 0, keyboard: 2.0, safeBuffer: 5 },
    { day: 'Day 13 (Dec 05)', pen: 0, toner: 0, keyboard: 0, safeBuffer: 5 },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. MIT-Inspired Top Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[14px] text-slate-500 font-medium">
        <Link to="/dashboard" className="hover:text-blue-600 flex items-center gap-1.5 text-slate-400 hover:text-blue-600 transition-colors">
          <Home className="w-4 h-4" />
        </Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-500">roadmaps</span>
        <span className="text-slate-400">/</span>
        <span className="font-semibold text-slate-800">Inventory_Management_System</span>
      </nav>

      {/* 2. Main Page Header (Exact MIT Styling: Large Title + Technology Roadmap Blue Section) */}
      <div className="space-y-4">
        <h1 className="text-3xl sm:text-4xl md:text-[38px] font-bold text-slate-900 tracking-tight leading-tight">
          Inventory Management System
        </h1>

        {/* Section Heading with distinctive Blue Underline (MIT Screenshot Style) */}
        <div id="technology-roadmap" className="pt-2">
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-bold text-[#1565C0] pb-2.5 border-b-2 border-[#1565C0]">
            Technology Roadmap
          </h2>
        </div>
      </div>

      {/* Two-Column Layout on Large Displays: Main Content + Sticky PAGE CONTENTS Rail */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* Main Left Column (Content & Plots) */}
        <div className="xl:col-span-9 space-y-8 min-w-0">
          {/* Section: Roadmap Overview Narrative */}
          <div id="roadmap-overview" className="space-y-4 text-slate-700">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Roadmap Overview
            </h3>

            <p className="text-[16px] leading-relaxed text-slate-700">
              Inventory management system (IMS) is a critical component of Gautam Buddha University operations' supply chain management that ensures efficient flows of materials and products from vendors to academic schools, research centers, and administrative departments. An effective inventory management system is essential for the university to operate smoothly, reduce carrying costs, optimize central warehouse operations, and meet faculty demands. It's a fundamental aspect of institutional resource stewardship, impacting campus operational efficiency and departmental satisfaction.
            </p>

            <div className="pt-2">
              <span className="font-bold text-slate-900 text-[16px] block mb-3">
                Key Goals of IMS are:
              </span>
              <ul className="space-y-2.5 text-[15.5px] text-slate-700">
                <li className="flex items-start gap-3">
                  <span className="text-[#1565C0] font-bold text-base mt-0.5">▸</span>
                  <span><strong>Providing timely, complete, and accurate inventory levels</strong> to management and statutory audit cells.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#1565C0] font-bold text-base mt-0.5">▸</span>
                  <span><strong>Minimizing carrying costs</strong> while ensuring continuous product availability for academic terms.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#1565C0] font-bold text-base mt-0.5">▸</span>
                  <span><strong>Reducing stockouts and overstock situations</strong> through real-time buffer tracking and runout prediction.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#1565C0] font-bold text-base mt-0.5">▸</span>
                  <span><strong>Enhancing supply chain visibility and responsiveness</strong> across all 8 university schools.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#1565C0] font-bold text-base mt-0.5">▸</span>
                  <span><strong>Streamlining operations and reducing inefficiencies</strong> via paperless digital sanction workflows.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#1565C0] font-bold text-base mt-0.5">▸</span>
                  <span><strong>Lowering procurement costs</strong> while strictly adhering to General Financial Rules (GFR-2017).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#1565C0] font-bold text-base mt-0.5">▸</span>
                  <span><strong>Meeting departmental indents accurately and on time</strong> with verified goods receipt notes (GRN).</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#1565C0] font-bold text-base mt-0.5">▸</span>
                  <span><strong>Adapting dynamically to changes in curriculum demand</strong>, examination schedules, and laboratory expansion.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Section: Executive KPI Metric Cards */}
          <div id="executive-kpis" className="space-y-4">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#1565C0]" />
              <span>Core Executive Metrics & Inventory Status</span>
            </h3>

            {/* Tremor-style Inventory Health Distribution Tracker */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <TremorTracker data={trackerData} />
            </div>

            {/* Metric Cards with larger typography */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/items" className="block text-left group">
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-blue-400 transition-all shadow-xs group-hover:shadow-sm">
                  <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Catalog Items
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                    {data.total_items || 22}
                  </div>
                  <span className="text-[13px] text-emerald-600 font-medium block mt-1">
                    +4.2% active SKUs
                  </span>
                </div>
              </Link>

              <Link to="/reports" className="block text-left group">
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-blue-400 transition-all shadow-xs group-hover:shadow-sm">
                  <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Stock Valuation
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">
                    {formatRupees(data.stock_value)}
                  </div>
                  <span className="text-[13px] text-emerald-600 font-medium block mt-1">
                    Weighted average cost
                  </span>
                </div>
              </Link>

              <Link to="/items?low=true" className="block text-left group">
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-blue-400 transition-all shadow-xs group-hover:shadow-sm">
                  <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Below Minimum
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold text-amber-600 tabular-nums">
                    {data.low_stock_count || 0}
                  </div>
                  <span className="text-[13px] text-amber-700 font-medium block mt-1">
                    {data.low_stock_count > 0 ? "Immediate refill needed" : "All items safe"}
                  </span>
                </div>
              </Link>

              <Link to="/purchase-orders" className="block text-left group">
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 hover:border-blue-400 transition-all shadow-xs group-hover:shadow-sm">
                  <span className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Open Purchase Orders
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold text-[#1565C0] tabular-nums">
                    {data.open_pos || 1}
                  </div>
                  <span className="text-[13px] text-blue-600 font-medium block mt-1">
                    Awaiting GRN verification
                  </span>
                </div>
              </Link>
            </div>
          </div>

          {/* PLOT 1: Material Flow Velocity Plot (30-Day Inflow vs Outflow) */}
          <div id="plot-material-flow" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#1565C0]" />
                  <span>Plot 1: Material Flow Velocity & Supply Inflow vs Outflow</span>
                </h3>
                <p className="text-[14.5px] text-slate-600">
                  Daily comparison of vendor goods intake (Inward) against departmental dispatches (Outward).
                </p>
              </div>

              <div className="flex items-center gap-4 text-[13px] font-medium shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span className="text-slate-700">Intake (In)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-[#1565C0]" />
                  <span className="text-slate-700">Disbursed (Out)</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1565C0" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#1565C0" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" tick={{ fontSize: 13, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 13, fill: '#475569' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                    }}
                    formatter={(val, name) => [`${val} units`, name === 'in' ? 'Vendor Intake (In)' : 'Store Issue (Out)']}
                  />
                  <Area type="monotone" dataKey="in" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIn)" />
                  <Area type="monotone" dataKey="out" stroke="#1565C0" strokeWidth={2.5} fillOpacity={1} fill="url(#colorOut)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[13px] text-slate-500">
              <span>Velocity Metric: Net positive buffer accumulation (+45 units this week)</span>
              <span className="font-mono font-medium text-slate-700">Turnover Velocity: 1.15x / mo</span>
            </div>
          </div>

          {/* PLOT 2: Academic School Spend & Consumption Breakdown Plot */}
          <div id="plot-school-consumption" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#1565C0]" />
                  <span>Plot 2: Academic School Consumption Spend Distribution</span>
                </h3>
                <p className="text-[14.5px] text-slate-600">
                  Total material allocation and spend breakdown across faculties and administrative centers.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-blue-50 text-[#1565C0] font-semibold text-[13px] border border-blue-200 shrink-0">
                Quarterly Spend Audit
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={schoolBarData}
                  margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 13, fill: '#475569' }}
                    tickFormatter={(val) => formatRupees(val)}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 13.5, fill: '#1E293B', fontWeight: 600 }}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                    }}
                    formatter={(val) => [formatRupees(val), 'Consumption Spend']}
                  />
                  <Bar dataKey="value" fill="#1565C0" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[13px] text-slate-500">
              <span>Top Consuming Unit: School of ICT (₹62,450 • 42.0% of total spend)</span>
              <Link to="/reports" className="text-[#1565C0] font-semibold hover:underline flex items-center gap-1">
                <span>View Full School Ledger Drill-down</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* PLOT 3: ABC Inventory Pareto Curve Plot */}
          <div id="plot-pareto-abc" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#1565C0]" />
                  <span>Plot 3: ABC Inventory Pareto Analysis & Cumulative Spend Curve</span>
                </h3>
                <p className="text-[14.5px] text-slate-600">
                  Pareto classification (80/20 Rule): Class A (High-Value), Class B (Intermediate), and Class C (Bulk Consumables).
                </p>
              </div>

              <div className="flex items-center gap-3 text-[12.5px] font-medium shrink-0">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-[#1565C0] font-bold">Class A: 70% Value</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">Class B: 20%</span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">Class C: 10%</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#1E293B', fontWeight: 600 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 13, fill: '#475569' }} tickFormatter={(val) => formatRupees(val)} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 13, fill: '#DC2626' }} unit="%" domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                    }}
                    formatter={(val, name) => [
                      name === 'annual_value' ? formatRupees(val) : `${val}%`,
                      name === 'annual_value' ? 'Annual Consumption Value' : 'Cumulative % of Total Spend'
                    ]}
                  />
                  <ReferenceLine yAxisId="right" y={80} stroke="#DC2626" strokeDasharray="4 4" label={{ value: 'Pareto 80% Cutoff', fill: '#DC2626', fontSize: 12, position: 'top' }} />
                  <Bar yAxisId="left" dataKey="annual_value" fill="#1565C0" radius={[4, 4, 0, 0]} barSize={26} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#DC2626" strokeWidth={3} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[13px] text-slate-500">
              <span>Class A Items: STN-001 (Paper Reams), CMP-004 (RAM), ELE-004 (Copper Wire) represent 53% of annual capital.</span>
              <span className="font-semibold text-slate-700">Strict GFR Inspection Mandate</span>
            </div>
          </div>

          {/* PLOT 4: AI Predictive Stock Depletion & Runout Trajectory Plot */}
          <div id="plot-stock-forecast" className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs bg-gradient-to-br from-white via-white to-blue-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-blue-100 mb-4 gap-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#1565C0]" />
                  <span>Plot 4: AI Stock Depletion & Runout Trajectory Forecast</span>
                </h3>
                <p className="text-[14.5px] text-slate-600">
                  Predictive daily burn-rate trajectory forecasting critical stock exhaustion over the next 14 academic days.
                </p>
              </div>

              <div className="flex items-center gap-3 text-[13px] font-medium shrink-0">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> Ball Pens</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" /> Toner 12A</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600" /> Keyboards</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trajectoryPlotData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="day" tick={{ fontSize: 13, fill: '#475569' }} />
                  <YAxis tick={{ fontSize: 13, fill: '#475569' }} unit=" units" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                    }}
                  />
                  <ReferenceLine y={5} stroke="#E11D48" strokeDasharray="4 4" label={{ value: 'Safety Stock Limit (5 units)', fill: '#E11D48', fontSize: 12, position: 'right' }} />
                  <Line type="monotone" dataKey="pen" stroke="#EF4444" strokeWidth={3} dot={{ r: 5 }} name="Ball Pen Blue (STN-002)" />
                  <Line type="monotone" dataKey="toner" stroke="#F59E0B" strokeWidth={3} dot={{ r: 5 }} name="Toner Cartridge (CMP-005)" />
                  <Line type="monotone" dataKey="keyboard" stroke="#2563EB" strokeWidth={3} dot={{ r: 5 }} name="USB Keyboards (CMP-002)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 pt-3 border-t border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between text-[13.5px] gap-2">
              <span className="text-red-600 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Critical Stockout Risk: Ball Pens will reach zero stock by Nov 27 without replenishment.</span>
              </span>
              <button
                type="button"
                onClick={() => navigate('/indents', { state: { prefillItem: { id: 'it-2', name: 'Ball Pen Blue', unit: 'box' } } })}
                className="px-3 py-1.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded-md text-[13px] font-semibold transition-colors shadow-2xs self-start sm:self-auto"
              >
                Auto-Draft Indent
              </button>
            </div>
          </div>

          {/* PLOT 5: Design Structure Matrix (DSM) — Requisition Flow */}
          <div id="plot-dsm-matrix">
            <DesignStructureMatrix />
          </div>

          {/* PLOT 6: Central Store Spatial Warehouse Rack Map */}
          <div id="warehouse-bays" className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#1565C0]" />
                  <span>Plot 6: Central Store Spatial Warehouse Rack Map</span>
                </h3>
                <p className="text-[14.5px] text-slate-600">
                  Interactive 2D spatial capacity map of all 11 storage bays across Central Stores.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 font-medium text-[13px] border border-slate-200">
                11 Active Central Bays
              </span>
            </div>

            <WarehouseRackGrid items={allItems} />
          </div>

          {/* Action Attention Center: Pending Requisitions & Approvals */}
          <div id="attention-actions" className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Action Center & Pending Approvals
              </h3>
              <span className="text-[13px] font-medium text-slate-500">
                Role: <strong className="text-slate-800">{user.role}</strong>
              </span>
            </div>

            <div className="p-5">
              {isStore && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-200 rounded-lg p-4">
                    <span className="font-bold text-slate-800 text-[15px] block mb-2">
                      Low Stock Alerts ({attention.low_stock?.length || 0})
                    </span>
                    <div className="divide-y divide-slate-100">
                      {attention.low_stock?.slice(0, 3).map((i) => (
                        <div key={i.id} className="py-2 flex items-center justify-between text-[14px]">
                          <div>
                            <span className="font-mono text-[12px] text-slate-500 mr-2">[{i.code}]</span>
                            <span className="font-semibold text-slate-900">{i.name}</span>
                            <span className="text-[12.5px] text-amber-600 font-medium block">
                              {i.qty} {i.unit} remaining
                            </span>
                          </div>
                          <Link to="/indents" className="px-2.5 py-1 bg-blue-50 text-[#1565C0] rounded font-semibold text-[13px] hover:bg-blue-100">
                            Reorder
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-lg p-4">
                    <span className="font-bold text-slate-800 text-[15px] block mb-2">
                      Open Purchase Orders ({attention.open_pos?.length || 0})
                    </span>
                    <div className="divide-y divide-slate-100">
                      {attention.open_pos?.map((po) => (
                        <div key={po.id} className="py-2 flex items-center justify-between text-[14px]">
                          <div>
                            <span className="font-mono font-bold text-slate-900">{po.no}</span>
                            <span className="text-[12.5px] text-slate-500 block">
                              Vendor: {po.vendor} • {formatRupees(po.total)}
                            </span>
                          </div>
                          <Link to="/purchase-orders" className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded font-semibold text-[13px] hover:bg-emerald-100">
                            Receive Goods
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {isDirector && (
                <div className="space-y-3">
                  <span className="font-bold text-slate-800 text-[15px] block">
                    Sanctions Awaiting Executive Approval
                  </span>
                  {attention.pending_indents?.map((ind) => (
                    <div key={ind.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-slate-900 text-[14px] mr-2">[{ind.no}]</span>
                        <span className="font-bold text-slate-800 text-[15px]">{ind.dept}</span>
                        <span className="text-[13px] text-slate-500 block mt-0.5">
                          Requested by {ind.by} • {ind.lines_count || 2} line items
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDecisionModal({ isOpen: true, type: 'indent', id: ind.id, no: ind.no, isApprove: false })}
                          className="px-3 py-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded text-[13px] font-semibold"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          onClick={() => setDecisionModal({ isOpen: true, type: 'indent', id: ind.id, no: ind.no, isApprove: true })}
                          className="px-3.5 py-1.5 text-white bg-emerald-600 hover:bg-emerald-700 rounded text-[13px] font-semibold"
                        >
                          Approve Sanction
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Circulars & Notices */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-[#1565C0]" />
                <h3 className="text-xl font-bold text-slate-900">University Store Circulars & Gazettes</h3>
              </div>
              {isOfficer && (
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(true)}
                  className="px-3 py-1.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded text-[13px] font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Circular</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notices.map((n) => (
                <div key={n.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[11px] font-bold text-[#1565C0] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {n.ref_no || 'GBU/S&P/CIR'}
                    </span>
                    <span className="text-[12px] text-slate-500">{n.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-[15px] mb-1.5">{n.title}</h4>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{n.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Sticky PAGE CONTENTS Navigation Rail (Exact MIT Screenshot 2 Pattern) */}
        <div className="hidden xl:block xl:col-span-3">
          <div className="sticky top-20 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <span className="text-[11.5px] font-bold tracking-wider text-[#1565C0] uppercase block pb-2 border-b border-slate-100">
              PAGE CONTENTS
            </span>

            <ul className="space-y-2 text-[14px] font-medium">
              <li>
                <a href="#technology-roadmap" className="text-slate-900 hover:text-[#1565C0] font-bold flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>Technology Roadmap</span>
                </a>
              </li>
              <li className="pl-4">
                <a href="#roadmap-overview" className="text-slate-600 hover:text-[#1565C0] block py-0.5">
                  Roadmap Overview
                </a>
              </li>
              <li className="pl-4">
                <a href="#executive-kpis" className="text-slate-600 hover:text-[#1565C0] block py-0.5">
                  Core Executive Metrics
                </a>
              </li>

              <li className="pt-2 border-t border-slate-100">
                <a href="#plot-material-flow" className="text-slate-900 hover:text-[#1565C0] font-bold flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>Plot 1: Material Flow Velocity</span>
                </a>
              </li>

              <li>
                <a href="#plot-school-consumption" className="text-slate-900 hover:text-[#1565C0] font-bold flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>Plot 2: School Spend Matrix</span>
                </a>
              </li>

              <li>
                <a href="#plot-pareto-abc" className="text-slate-900 hover:text-[#1565C0] font-bold flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>Plot 3: ABC Pareto Analysis</span>
                </a>
              </li>

              <li>
                <a href="#plot-stock-forecast" className="text-slate-900 hover:text-[#1565C0] font-bold flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>Plot 4: AI Runout Trajectory</span>
                </a>
              </li>

              <li>
                <a href="#plot-dsm-matrix" className="text-slate-900 hover:text-[#1565C0] font-bold flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>Plot 5: Design Structure (DSM)</span>
                </a>
              </li>

              <li>
                <a href="#warehouse-bays" className="text-slate-900 hover:text-[#1565C0] font-bold flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-[#1565C0]" />
                  <span>Plot 6: 11-Bay Spatial Map</span>
                </a>
              </li>

              <li className="pt-2 border-t border-slate-100">
                <a href="#attention-actions" className="text-slate-700 hover:text-[#1565C0] flex items-center gap-1.5">
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span>Action Attention Center</span>
                </a>
              </li>
            </ul>

            <div className="pt-3 border-t border-slate-100 text-[12px] text-slate-500">
              <span>Directorate of Stores & Purchase • Gautam Buddha University</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal for Indents and Write-offs */}
      <ConfirmModal
        isOpen={decisionModal.isOpen}
        title={decisionModal.isApprove ? `Approve ${decisionModal.type}` : `Reject ${decisionModal.type}`}
        message={`Are you sure you want to ${decisionModal.isApprove ? 'approve' : 'reject'} ${decisionModal.no}?`}
        confirmLabel={decisionModal.isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
        confirmVariant={decisionModal.isApprove ? 'primary' : 'danger'}
        onConfirm={handleDecisionConfirm}
        onCancel={() => setDecisionModal({ isOpen: false, type: '', id: null, no: '', isApprove: true })}
        requiresRemark
      />

      {/* Notice Posting Modal */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Publish Store Circular</h3>
              <button
                type="button"
                onClick={() => setIsNoticeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1">
                  Circular Reference Number
                </label>
                <input
                  type="text"
                  placeholder="GBU/S&P/2026/CIR-06"
                  value={newNotice.ref_no}
                  onChange={(e) => setNewNotice({ ...newNotice, ref_no: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-[14px]"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1">
                  Circular Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Stock Verification Schedule"
                  value={newNotice.title}
                  onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-[14px]"
                />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-slate-700 block mb-1">
                  Notification Text *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Details regarding stock inspection, submission dates..."
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-[14px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-[13px] font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNotice}
                  className="px-4 py-2 bg-[#1565C0] hover:bg-blue-700 text-white rounded-md text-[13px] font-semibold shadow-xs"
                >
                  {submittingNotice ? 'Publishing...' : 'Publish Circular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
