/**
 * Client-side baseline data for offline / static showcase deployments (e.g. GitHub Pages)
 * When a backend server is unreachable, this allows the full UI, filters, charts, and forms to operate seamlessly.
 */

export const MOCK_USERS = {
  'store@gbu.demo': { id: 'usr-store-01', name: 'Store Officer', email: 'store@gbu.demo', role: 'store', dept: 'Stores & Purchase' },
  'director@gbu.demo': { id: 'usr-dir-01', name: 'Director (S&P)', email: 'director@gbu.demo', role: 'approver', dept: 'Directorate of Stores & Purchase' },
  'dept@gbu.demo': { id: 'usr-dept-01', name: 'Department Staff', email: 'dept@gbu.demo', role: 'dept', dept: 'School of ICT' },
  'admin@gbu.demo': { id: 'usr-adm-01', name: 'System Admin', email: 'admin@gbu.demo', role: 'admin', dept: 'Central IT Cell' },
};

export const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'Stationery' },
  { id: 'cat-2', name: 'Computer Hardware' },
  { id: 'cat-3', name: 'Lab Consumables' },
  { id: 'cat-4', name: 'Electrical' },
  { id: 'cat-5', name: 'Cleaning' },
];

export const MOCK_VENDORS = [
  { id: 'ven-1', name: 'Sharma Stationers, Noida', phone: '9810000001', email: 'sharma@example.com' },
  { id: 'ven-2', name: 'Rajdhani Computers', phone: '9810000002', email: 'rajdhani@example.com' },
  { id: 'ven-3', name: 'Delta Electricals', phone: '9810000003', email: 'delta@example.com' },
  { id: 'ven-4', name: 'Clean Care Supplies', phone: '9810000004', email: 'cleancare@example.com' },
];

export const MOCK_ITEMS = [
  { id: 'it-1', code: 'STN-001', name: 'A4 Paper Ream (500 sheets)', category: 'Stationery', unit: 'ream', min_stock: 40, qty: 180, price: 285.0, value: 51300, location: 'Rack A1' },
  { id: 'it-2', code: 'STN-002', name: 'Ball Pen Blue (box of 50)', category: 'Stationery', unit: 'box', min_stock: 10, qty: 6, price: 240.0, value: 1440, location: 'Rack A1', low: true },
  { id: 'it-3', code: 'STN-003', name: 'Whiteboard Marker (Set of 4)', category: 'Stationery', unit: 'set', min_stock: 15, qty: 38, price: 110.0, value: 4180, location: 'Rack A2' },
  { id: 'it-4', code: 'STN-004', name: 'File Folder', category: 'Stationery', unit: 'pcs', min_stock: 100, qty: 340, price: 18.0, value: 6120, location: 'Rack A2' },
  { id: 'it-5', code: 'STN-005', name: 'Stapler No. 10 with Pins', category: 'Stationery', unit: 'pcs', min_stock: 8, qty: 14, price: 85.0, value: 1190, location: 'Rack A2' },
  { id: 'it-6', code: 'CMP-001', name: 'HDMI Cable 1.5m', category: 'Computer Hardware', unit: 'pcs', min_stock: 10, qty: 14, price: 220.0, value: 3080, location: 'Rack B1' },
  { id: 'it-7', code: 'CMP-002', name: 'USB Keyboard', category: 'Computer Hardware', unit: 'pcs', min_stock: 10, qty: 8, price: 450.0, value: 3600, location: 'Rack B1', low: true },
  { id: 'it-8', code: 'CMP-003', name: 'Optical Mouse', category: 'Computer Hardware', unit: 'pcs', min_stock: 15, qty: 31, price: 260.0, value: 8060, location: 'Rack B1' },
  { id: 'it-9', code: 'CMP-004', name: 'DDR4 RAM 8GB', category: 'Computer Hardware', unit: 'pcs', min_stock: 5, qty: 12, price: 2400.0, value: 28800, location: 'Rack B2' },
  { id: 'it-10', code: 'CMP-005', name: 'Toner Cartridge 12A', category: 'Computer Hardware', unit: 'pcs', min_stock: 6, qty: 4, price: 3100.0, value: 12400, location: 'Rack B2', low: true },
  { id: 'it-11', code: 'LAB-001', name: 'Digital Multimeter', category: 'Lab Consumables', unit: 'pcs', min_stock: 5, qty: 18, price: 850.0, value: 15300, location: 'Rack C1' },
  { id: 'it-12', code: 'LAB-002', name: 'Breadboard 830 pts', category: 'Lab Consumables', unit: 'pcs', min_stock: 20, qty: 64, price: 120.0, value: 7680, location: 'Rack C1' },
  { id: 'it-13', code: 'LAB-003', name: 'Jumper Wire Set', category: 'Lab Consumables', unit: 'set', min_stock: 30, qty: 90, price: 95.0, value: 8550, location: 'Rack C2' },
  { id: 'it-14', code: 'LAB-004', name: 'Solder Wire 100g', category: 'Lab Consumables', unit: 'roll', min_stock: 10, qty: 7, price: 210.0, value: 1470, location: 'Rack C2', low: true },
  { id: 'it-15', code: 'LAB-005', name: 'Isopropyl Alcohol 1L', category: 'Lab Consumables', unit: 'btl', min_stock: 10, qty: 25, price: 380.0, value: 9500, location: 'Rack C3' },
  { id: 'it-16', code: 'ELE-001', name: 'LED Tube Light 18W', category: 'Electrical', unit: 'pcs', min_stock: 30, qty: 120, price: 160.0, value: 19200, location: 'Rack D1' },
  { id: 'it-17', code: 'ELE-002', name: 'Extension Board 5 Socket', category: 'Electrical', unit: 'pcs', min_stock: 15, qty: 40, price: 350.0, value: 14000, location: 'Rack D1' },
  { id: 'it-18', code: 'ELE-003', name: 'MCB 16A', category: 'Electrical', unit: 'pcs', min_stock: 10, qty: 9, price: 280.0, value: 2520, location: 'Rack D2', low: true },
  { id: 'it-19', code: 'ELE-004', name: 'Copper Wire 1.5mm (90m)', category: 'Electrical', unit: 'coil', min_stock: 6, qty: 15, price: 1850.0, value: 27750, location: 'Rack D2' },
  { id: 'it-20', code: 'CLN-001', name: 'Phenyl 5L', category: 'Cleaning', unit: 'can', min_stock: 20, qty: 48, price: 310.0, value: 14880, location: 'Rack E1' },
  { id: 'it-21', code: 'CLN-002', name: 'Hand Wash 5L', category: 'Cleaning', unit: 'can', min_stock: 15, qty: 11, price: 420.0, value: 4620, location: 'Rack E1', low: true },
  { id: 'it-22', code: 'CLN-003', name: 'Dustbin 20L', category: 'Cleaning', unit: 'pcs', min_stock: 10, qty: 26, price: 190.0, value: 4940, location: 'Rack E2' },
];

export const MOCK_DASHBOARD = {
  total_items: 22,
  stock_value: 239080,
  low_stock_count: 6,
  open_pos: 1,
  category_breakdown: [
    { category: 'Stationery', value: 64230 },
    { category: 'Computer Hardware', value: 55880 },
    { category: 'Lab Consumables', value: 42500 },
    { category: 'Electrical', value: 63520 },
    { category: 'Cleaning', value: 24440 },
  ],
  movement_30d: [
    { date: '15 Nov', in: 45, out: 20 },
    { date: '16 Nov', in: 0, out: 35 },
    { date: '17 Nov', in: 60, out: 40 },
    { date: '18 Nov', in: 12, out: 18 },
    { date: '19 Nov', in: 0, out: 25 },
    { date: '20 Nov', in: 80, out: 55 },
    { date: '21 Nov', in: 20, out: 15 },
  ],
  attention: {
    low_stock: [
      { id: 'it-2', name: 'Ball Pen Blue (box of 50)', code: 'STN-002', qty: 6, min_stock: 10, unit: 'box' },
      { id: 'it-7', name: 'USB Keyboard', code: 'CMP-002', qty: 8, min_stock: 10, unit: 'pcs' },
      { id: 'it-10', name: 'Toner Cartridge 12A', code: 'CMP-005', qty: 4, min_stock: 6, unit: 'pcs' },
      { id: 'it-18', name: 'MCB 16A', code: 'ELE-003', qty: 9, min_stock: 10, unit: 'pcs' },
      { id: 'it-21', name: 'Hand Wash 5L', code: 'CLN-002', qty: 11, min_stock: 15, unit: 'can' },
    ],
    open_pos: [
      { id: 'po-1', no: 'PO/2026-27/0001', vendor: 'Rajdhani Computers', total: 30500, status: 'OPEN', date: '2026-11-20' },
    ],
    pending_indents: [
      { id: 'ind-1', no: 'IND/2026-27/0001', by: 'Prof. Alok Sharma', dept: 'School of ICT', status: 'PENDING', date: '2026-11-21', items_count: 2 },
    ],
    pending_writeoffs: [
      { id: 'wo-1', no: 'WO/2026-27/0001', item: 'Whiteboard 4x3 ft', qty: 2, status: 'PENDING', reason: 'Damaged during relocation' },
    ],
  },
};

export const MOCK_NOTICES = [
  { id: 'not-1', title: 'Annual Stock Physical Verification for Session 2026-2027', content: 'All academic schools are requested to verify their respective laboratory stock registers before the upcoming semester audit.', ref_no: 'GBU/S&P/2026/CIR-04', date: '2026-11-20' },
  { id: 'not-2', title: 'Schedule for Central Stationery Distribution (Quarter 3)', content: 'Quarterly stationery issue window is open for administrative and faculty indents from 9:30 AM to 4:30 PM.', ref_no: 'GBU/S&P/2026/CIR-05', date: '2026-11-18' },
];

export const MOCK_POS = [
  {
    id: 'po-1',
    no: 'PO/2026-27/0001',
    vendor: 'Rajdhani Computers',
    by: 'Store Officer',
    status: 'OPEN',
    date: '2026-11-20',
    total: 30500,
    lines: [
      { id: 'pol-1', item: 'DDR4 RAM 8GB', qty: 10, got: 0, price: 2400.0 },
      { id: 'pol-2', item: 'USB Keyboard', qty: 15, got: 0, price: 433.33 },
    ],
  },
];

export const MOCK_INDENTS = [
  {
    id: 'ind-1',
    no: 'IND/2026-27/0001',
    dept: 'School of ICT',
    by: 'Prof. Alok Sharma',
    status: 'PENDING',
    date: '2026-11-21',
    items_count: 2,
    purpose: 'Computer programming laboratory requirements for term practical exams',
    lines: [
      { id: 'indl-1', item: 'HDMI Cable 1.5m', qty: 5, unit: 'pcs', current_stock: 14 },
      { id: 'indl-2', item: 'USB Keyboard', qty: 10, unit: 'pcs', current_stock: 8 },
    ],
  },
  {
    id: 'ind-2',
    no: 'IND/2026-27/0002',
    dept: 'School of Engineering',
    by: 'Dr. Neha Verma',
    status: 'APPROVED',
    date: '2026-11-19',
    items_count: 1,
    purpose: 'Digital electronics fabrication workshop',
    lines: [
      { id: 'indl-3', item: 'Breadboard 830 pts', qty: 20, unit: 'pcs', current_stock: 64 },
    ],
  },
];

export const MOCK_WRITEOFFS = [
  {
    id: 'wo-1',
    no: 'WO/2026-27/0001',
    item: 'Whiteboard 4x3 ft',
    item_code: 'FUR-003',
    qty: 2,
    reason: 'Damaged surface during relocation between campus halls',
    status: 'PENDING',
    proposed_by: 'Store Officer',
    date: '2026-11-20',
  },
];

export const MOCK_TRANSACTIONS = [
  { id: 'txn-1', kind: 'IN', item_name: 'A4 Paper Ream (500 sheets)', qty: 100, unit: 'ream', ref: 'PO/2026-27/0001', note: 'Goods received from Sharma Stationers', at: '2026-11-20T10:30:00Z' },
  { id: 'txn-2', kind: 'OUT', item_name: 'A4 Paper Ream (500 sheets)', qty: 20, unit: 'ream', ref: 'ISS-1021', note: 'Issued To School of ICT. Requisition by Prof. Sharma', at: '2026-11-21T11:15:00Z' },
  { id: 'txn-3', kind: 'OUT', item_name: 'Ball Pen Blue (box of 50)', qty: 4, unit: 'box', ref: 'ISS-1022', note: 'Issued To School of Management. Exam Cell requirement', at: '2026-11-21T14:00:00Z' },
  { id: 'txn-4', kind: 'IN', item_name: 'LED Tube Light 18W', qty: 50, unit: 'pcs', ref: 'PO/2026-27/0002', note: 'Electrical maintenance intake', at: '2026-11-19T09:00:00Z' },
  { id: 'txn-5', kind: 'WRITEOFF', item_name: 'Whiteboard 4x3 ft', qty: 2, unit: 'pcs', ref: 'WO-001', note: 'Damaged surface during relocation', at: '2026-11-18T16:20:00Z' },
];

export const MOCK_CONSUMPTION_BY_DEPT = {
  period_days: 90,
  total_issues: 42,
  total_consumption_value: 148560.0,
  departments: [
    {
      department: 'School of ICT',
      issues_count: 14,
      total_qty: 185.0,
      total_value: 62450.0,
      pct: 42.0,
      top_items: [
        { name: 'A4 Paper Ream (500 sheets)', unit: 'ream', qty: 65, value: 18525.0 },
        { name: 'HDMI Cable 1.5m', unit: 'pcs', qty: 12, value: 2640.0 },
        { name: 'Optical Mouse', unit: 'pcs', qty: 15, value: 3900.0 },
        { name: 'Toner Cartridge 12A', unit: 'pcs', qty: 8, value: 24800.0 },
      ],
      recent_vouchers: [
        { id: 'v-1', ref: 'ISS-1021', date: '2026-11-21', item: 'A4 Paper Ream (500 sheets)', qty: 20, unit: 'ream', value: 5700.0, note: 'End-term exam papers printing' },
        { id: 'v-2', ref: 'ISS-1014', date: '2026-11-17', item: 'Toner Cartridge 12A', qty: 2, unit: 'pcs', value: 6200.0, note: 'Lab 3 laser printer refit' },
      ],
    },
    {
      department: 'School of Engineering',
      issues_count: 11,
      total_qty: 142.0,
      total_value: 41200.0,
      pct: 27.7,
      top_items: [
        { name: 'Breadboard 830 pts', unit: 'pcs', qty: 45, value: 5400.0 },
        { name: 'Digital Multimeter', unit: 'pcs', qty: 6, value: 5100.0 },
        { name: 'Copper Wire 1.5mm (90m)', unit: 'coil', qty: 8, value: 14800.0 },
      ],
      recent_vouchers: [
        { id: 'v-3', ref: 'ISS-1019', date: '2026-11-19', item: 'Breadboard 830 pts', qty: 20, unit: 'pcs', value: 2400.0, note: 'B.Tech ECE practicals' },
      ],
    },
    {
      department: 'School of Management',
      issues_count: 8,
      total_qty: 95.0,
      total_value: 23680.0,
      pct: 15.9,
      top_items: [
        { name: 'A4 Paper Ream (500 sheets)', unit: 'ream', qty: 40, value: 11400.0 },
        { name: 'Whiteboard Marker (Set of 4)', unit: 'set', qty: 25, value: 2750.0 },
        { name: 'File Folder', unit: 'pcs', qty: 120, value: 2160.0 },
      ],
      recent_vouchers: [
        { id: 'v-4', ref: 'ISS-1022', date: '2026-11-21', item: 'Ball Pen Blue (box of 50)', qty: 4, unit: 'box', value: 960.0, note: 'MBA case study distribution' },
      ],
    },
    {
      department: 'Central IT Cell',
      issues_count: 5,
      total_qty: 38.0,
      total_value: 14500.0,
      pct: 9.8,
      top_items: [
        { name: 'HDMI Cable 1.5m', unit: 'pcs', qty: 8, value: 1760.0 },
        { name: 'USB Keyboard', unit: 'pcs', qty: 6, value: 2700.0 },
      ],
      recent_vouchers: [],
    },
    {
      department: 'Estate Maintenance Cell',
      issues_count: 4,
      total_qty: 48.0,
      total_value: 6730.0,
      pct: 4.5,
      top_items: [
        { name: 'LED Tube Light 18W', unit: 'pcs', qty: 25, value: 4000.0 },
        { name: 'MCB 16A', unit: 'pcs', qty: 5, value: 1400.0 },
      ],
      recent_vouchers: [],
    },
  ],
};

export const MOCK_ABC_ANALYSIS = {
  grand_total_value: 239080.0,
  summary: {
    class_a_count: 5,
    class_b_count: 8,
    class_c_count: 9,
    total_items: 22,
  },
  items: [
    { id: 'it-1', code: 'STN-001', name: 'A4 Paper Ream (500 sheets)', category: 'Stationery', annual_qty: 180, unit_price: 285.0, annual_value: 51300.0, cumulative_percentage: 21.46, class: 'A' },
    { id: 'it-9', code: 'CMP-004', name: 'DDR4 RAM 8GB', category: 'Computer Hardware', annual_qty: 12, unit_price: 2400.0, annual_value: 28800.0, cumulative_percentage: 33.50, class: 'A' },
    { id: 'it-19', code: 'ELE-004', name: 'Copper Wire 1.5mm (90m)', category: 'Electrical', annual_qty: 15, unit_price: 1850.0, annual_value: 27750.0, cumulative_percentage: 45.11, class: 'A' },
    { id: 'it-16', code: 'ELE-001', name: 'LED Tube Light 18W', category: 'Electrical', annual_qty: 120, unit_price: 160.0, annual_value: 19200.0, cumulative_percentage: 53.14, class: 'A' },
    { id: 'it-11', code: 'LAB-001', name: 'Digital Multimeter', category: 'Lab Consumables', annual_qty: 18, unit_price: 850.0, annual_value: 15300.0, cumulative_percentage: 59.54, class: 'A' },
    { id: 'it-20', code: 'CLN-001', name: 'Phenyl 5L', category: 'Cleaning', annual_qty: 48, unit_price: 310.0, annual_value: 14880.0, cumulative_percentage: 65.77, class: 'B' },
    { id: 'it-17', code: 'ELE-002', name: 'Extension Board 5 Socket', category: 'Electrical', annual_qty: 40, unit_price: 350.0, annual_value: 14000.0, cumulative_percentage: 71.63, class: 'B' },
    { id: 'it-10', code: 'CMP-005', name: 'Toner Cartridge 12A', category: 'Computer Hardware', annual_qty: 4, unit_price: 3100.0, annual_value: 12400.0, cumulative_percentage: 76.82, class: 'B' },
    { id: 'it-15', code: 'LAB-005', name: 'Isopropyl Alcohol 1L', category: 'Lab Consumables', annual_qty: 25, unit_price: 380.0, annual_value: 9500.0, cumulative_percentage: 80.79, class: 'B' },
    { id: 'it-13', code: 'LAB-003', name: 'Jumper Wire Set', category: 'Lab Consumables', annual_qty: 90, unit_price: 95.0, annual_value: 8550.0, cumulative_percentage: 84.37, class: 'B' },
    { id: 'it-8', code: 'CMP-003', name: 'Optical Mouse', category: 'Computer Hardware', annual_qty: 31, unit_price: 260.0, annual_value: 8060.0, cumulative_percentage: 87.74, class: 'B' },
    { id: 'it-12', code: 'LAB-002', name: 'Breadboard 830 pts', category: 'Lab Consumables', annual_qty: 64, unit_price: 120.0, annual_value: 7680.0, cumulative_percentage: 90.95, class: 'B' },
    { id: 'it-4', code: 'STN-004', name: 'File Folder', category: 'Stationery', annual_qty: 340, unit_price: 18.0, annual_value: 6120.0, cumulative_percentage: 93.51, class: 'C' },
    { id: 'it-22', code: 'CLN-003', name: 'Dustbin 20L', category: 'Cleaning', annual_qty: 26, unit_price: 190.0, annual_value: 4940.0, cumulative_percentage: 95.58, class: 'C' },
    { id: 'it-21', code: 'CLN-002', name: 'Hand Wash 5L', category: 'Cleaning', annual_qty: 11, unit_price: 420.0, annual_value: 4620.0, cumulative_percentage: 97.51, class: 'C' },
    { id: 'it-3', code: 'STN-003', name: 'Whiteboard Marker (Set of 4)', category: 'Stationery', annual_qty: 38, unit_price: 110.0, annual_value: 4180.0, cumulative_percentage: 99.26, class: 'C' },
  ],
};

export const MOCK_VENDOR_PERFORMANCE = [
  { id: 'ven-1', name: 'Sharma Stationers, Noida', po_count: 8, completed: 8, pending: 0, fulfillment_rate: 100.0, total_spend: 84500.0, avg_delivery_days: 3.2 },
  { id: 'ven-2', name: 'Rajdhani Computers', po_count: 5, completed: 4, pending: 1, fulfillment_rate: 80.0, total_spend: 112000.0, avg_delivery_days: 5.8 },
  { id: 'ven-3', name: 'Delta Electricals', po_count: 6, completed: 6, pending: 0, fulfillment_rate: 100.0, total_spend: 68400.0, avg_delivery_days: 4.1 },
  { id: 'ven-4', name: 'Clean Care Supplies', po_count: 4, completed: 4, pending: 0, fulfillment_rate: 100.0, total_spend: 32000.0, avg_delivery_days: 2.5 },
];

export const MOCK_STOCK_FORECAST = {
  total_analyzed: 22,
  critical_count: 2,
  warning_count: 4,
  healthy_count: 12,
  dormant_count: 4,
  forecasts: [
    {
      item_id: 'it-2',
      item_code: 'STN-002',
      name: 'Ball Pen Blue (box of 50)',
      category: 'Stationery',
      current_stock: 6,
      min_stock: 10,
      burn_rate_daily: 1.2,
      runout_days: 5,
      runout_date: '2026-11-27',
      urgency: 'CRITICAL',
      recommended_reorder_qty: 30,
      safety_stock: 12,
    },
    {
      item_id: 'it-10',
      item_code: 'CMP-005',
      name: 'Toner Cartridge 12A',
      category: 'Computer Hardware',
      current_stock: 4,
      min_stock: 6,
      burn_rate_daily: 0.5,
      runout_days: 8,
      runout_date: '2026-11-30',
      urgency: 'CRITICAL',
      recommended_reorder_qty: 15,
      safety_stock: 8,
    },
    {
      item_id: 'it-7',
      item_code: 'CMP-002',
      name: 'USB Keyboard',
      category: 'Computer Hardware',
      current_stock: 8,
      min_stock: 10,
      burn_rate_daily: 0.6,
      runout_days: 13,
      runout_date: '2026-12-05',
      urgency: 'WARNING',
      recommended_reorder_qty: 25,
      safety_stock: 10,
    },
  ],
  anomalies: [
    {
      item_id: 'it-7',
      item_code: 'CMP-002',
      name: 'USB Keyboard',
      departments: ['School of ICT', 'School of Management'],
      total_requested: 25,
      suggestion: 'Consolidate multiple departmental indents into single bulk purchase order for bulk discount.',
    },
  ],
};

export const MOCK_AUDIT_LOGS = [
  { id: 'aud-1', actor: 'Store Officer', action: 'PO_CREATE', target: 'PO/2026-27/0001', timestamp: '2026-11-20T11:45:00Z', details: 'Created PO for Rajdhani Computers (₹30,500)' },
  { id: 'aud-2', actor: 'Prof. Alok Sharma', action: 'INDENT_SUBMIT', target: 'IND/2026-27/0001', timestamp: '2026-11-21T09:12:00Z', details: 'Requisition submitted for School of ICT labs' },
  { id: 'aud-3', actor: 'Store Officer', action: 'STOCK_ISSUE', target: 'STN-001', timestamp: '2026-11-21T11:15:00Z', details: 'Issued 20 reams to School of ICT (Ref: ISS-1021)' },
  { id: 'aud-4', actor: 'Director (S&P)', action: 'INDENT_APPROVE', target: 'IND/2026-27/0002', timestamp: '2026-11-19T16:00:00Z', details: 'Sanctioned 20 breadboards for School of Engineering' },
];
