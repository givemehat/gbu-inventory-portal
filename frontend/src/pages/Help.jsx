import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  TrendingUp,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Help() {
  const [openIdx, setOpenIdx] = useState(0);

  const lifecycleModules = [
    {
      num: '01',
      title: 'Raising of Purchase Requisition',
      screen: '/indents',
      badge: 'Operational',
      desc: 'Academic schools and administrative departments submit digital indents with item specifications, quantities, and academic justifications.',
      doc: 'S&P-01 Requisition Indent',
    },
    {
      num: '02',
      title: 'Store Indent Generation',
      screen: '/indents',
      badge: 'Operational',
      desc: 'System generates consolidated store indents with serialized university numbers (IND/2026-27/xxxx) and routing for sanction.',
      doc: 'S&P-01 Store Indent',
    },
    {
      num: '03',
      title: 'Placing of Enquiry to Various Parties',
      screen: '/purchase-orders',
      badge: 'Operational',
      desc: 'Limited Tender Enquiry (LTE) and Request for Quotations (RFQ) issued to university-empanelled vendors under GFR-2017 procurement guidelines.',
      doc: 'S&P-05 RFQ Enquiry Notice',
    },
    {
      num: '04',
      title: 'Comparative Statement Generation',
      screen: '/purchase-orders',
      badge: 'Operational',
      desc: 'Evaluation of supplier bids, rate analysis, technical specification compliance, and determination of lowest responsive bidder (L1).',
      doc: 'S&P-06 Comparative Statement (CS)',
    },
    {
      num: '05',
      title: 'Purchase Order through Approved Quotation',
      screen: '/purchase-orders',
      badge: 'Operational',
      desc: 'Issuance of formal Purchase Orders linked directly to sanctioned indents with negotiated rates, delivery terms, and PO/2026-27/xxxx series.',
      doc: 'PO Master Record',
    },
    {
      num: '06',
      title: 'Amendment of Approved Purchase Order',
      screen: '/purchase-orders',
      badge: 'Operational',
      desc: 'Tracks contractual modifications, delivery timeline extensions, and line quantity adjustments with complete immutable audit trails.',
      doc: 'S&P-11 PO Amendment Advice',
    },
    {
      num: '07',
      title: 'Goods Receipt and Material Inspection',
      screen: '/purchase-orders',
      badge: 'Operational',
      desc: 'Technical Inspection Board verifies consignments against delivery challan & PO lines, generating an official Goods Receipt Note (GRN/2026-27/xxxx).',
      doc: 'S&P-03 GRN Certificate',
    },
    {
      num: '08',
      title: 'Purchase Return',
      screen: '/purchase-orders',
      badge: 'Operational',
      desc: 'Rejection of substandard or damaged supplies during inward inspection with formal rejection memos and vendor return vouchers.',
      doc: 'S&P-07 Purchase Return Memo',
    },
    {
      num: '09',
      title: 'Bill Passing with FAS Integration',
      screen: '/reports',
      badge: 'Operational',
      desc: 'Financial Accounting System (FAS) integration where three-way matching (PO + GRN + Vendor Invoice) sanctions supplier payment vouchers.',
      doc: 'S&P-08 Bill Passing Voucher',
    },
    {
      num: '10',
      title: 'Material Issue / Receipt',
      screen: '/issue-stock',
      badge: 'Operational',
      desc: 'Physical disbursement of stock to faculties and laboratories via Store Issue Slips with recipient acknowledgment and ledger debit.',
      doc: 'S&P-02 Store Issue Voucher',
    },
    {
      num: '11',
      title: 'Material Transfer In/Out to Other Stores/Locations',
      screen: '/dashboard',
      badge: 'Operational',
      desc: 'Inter-store warehouse bay transfers (Bays A1 through E2) and inter-departmental transfers with location tracking in the central register.',
      doc: 'S&P-09 Transfer Note',
    },
    {
      num: '12',
      title: 'Physical Stock Verification & Adjustment Voucher',
      screen: '/write-offs',
      badge: 'Operational',
      desc: 'Annual physical stock-taking, discrepancy reconciliation, write-offs of unserviceable materials, and condemnation survey board vouchers.',
      doc: 'S&P-04 Condemnation Voucher',
    },
    {
      num: '13',
      title: 'Item Repair',
      screen: '/write-offs',
      badge: 'Operational',
      desc: 'Equipment repair ledger, dispatch to authorized workshop via returnable gate pass, and return to service upon repair completion.',
      doc: 'S&P-10 Repair Gate Pass',
    },
    {
      num: '14',
      title: 'Store Valuation on Weighted Average Methodology',
      screen: '/items',
      badge: 'Operational Engine',
      desc: 'Real-time Weighted Average Cost (WAC) formula recalculated on every GRN receipt: (Old Qty × Old Avg + Inward Qty × Rate) ÷ Total Qty.',
      doc: 'S&P-12 Valuation Statement',
    },
  ];

  const faqs = [
    {
      q: 'How do I raise a departmental indent (material requisition)?',
      a: 'Any academic school or administrative department staff can submit an indent by navigating to "Material Requisitions" in the sidebar and clicking "Raise indent". Select required items, specify quantities, and provide the requisition purpose (e.g. laboratory practicals or office requirements). Once submitted, the indent moves to "PENDING" status awaiting administrative sanction.',
    },
    {
      q: 'Who approves the indent, and what is the approval authority?',
      a: 'All university requisitions must be sanctioned by the Director, Stores & Purchase. The Director reviews item justifications and budget heads. Upon approval, Stores & Purchase receives authorization to issue a formal Purchase Order (PO) to empanelled university vendors.',
    },
    {
      q: 'What is a Goods Receipt Note (GRN) and how does inventory update?',
      a: 'When an empanelled vendor delivers materials against an approved Purchase Order, the Store Officer inspects the consignment and records a Goods Receipt Note (GRN). Partial shipments are fully supported. The received quantity is automatically credited to central inventory balances, and the item catalog unit rate updates to the latest negotiated purchase price.',
    },
    {
      q: 'What happens to inventory when a write-off is proposed vs sanctioned?',
      a: 'Under University Stores Audit regulations, stock balances are NOT reduced when a Store Officer submits a write-off proposal. The proposal undergoes physical inspection by the condemnation board. Only after the Director formally sanctions the proposal does the system deduct the stock and write an immutable "WRITEOFF" ledger entry.',
    },
    {
      q: 'Why does the system prevent issuing more stock than the available balance?',
      a: 'The portal operates as an immutable digital stock register. Stock balances can never be negative. If a department requests 10 units but only 6 are physically in the rack, the system prevents overdraft to preserve accurate ledger accounting. The department must raise an indent to procure additional stock.',
    },
    {
      q: 'Who do I contact for emergency procurement or physical stock verification?',
      a: 'For urgent semester requirements or audit verification queries, contact the Central Stores & Purchase Office located on the Ground Floor of the Administrative Building, or call EPABX: 0120-2344297 (Office Hours: 9:30 AM to 5:30 PM, Monday–Friday). You may also check the University Directory for school store coordinators.',
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-serif text-[28px] font-medium text-ink leading-tight">
          Stores & Purchase Lifecycle Manual & FAQ
        </h1>
        <p className="text-[14px] text-ink-muted mt-1">
          Complete statutory procurement and inventory lifecycle under General Financial Rules (GFR-2017) & University Stores Regulations.
        </p>
      </div>

      {/* 14-Stage Stores & Purchase Lifecycle Compliance Matrix */}
      <div className="bg-surface rounded-panel border border-line p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-serif text-[18px] font-bold text-ink">
                Stores & Purchase Operational Lifecycle Matrix
              </h2>
              <span className="text-[12px] text-ink-muted">
                14 statutory stages tracked from initial departmental indent to final balance-sheet store valuation.
              </span>
            </div>
          </div>
          <Link
            to="/forms"
            className="hidden sm:inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary hover:underline"
          >
            <span>View University Forms & Slips</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
          {lifecycleModules.map((m) => (
            <div
              key={m.num}
              className="p-3.5 rounded-lg border border-line bg-paper/30 hover:bg-paper/70 transition-colors flex flex-col justify-between gap-2"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      STAGE {m.num}
                    </span>
                    <h3 className="font-semibold text-ink text-[13.5px] leading-snug">
                      {m.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                    {m.badge}
                  </span>
                </div>
                <p className="text-[12px] text-ink-muted leading-relaxed mt-1">
                  {m.desc}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-line/50 text-[11.5px]">
                <span className="font-mono text-ink-muted">
                  Doc: <strong className="text-ink">{m.doc}</strong>
                </span>
                <Link
                  to={m.screen}
                  className="font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1"
                >
                  <span>Open module</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-surface rounded-panel border border-line overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-paper/50 transition-colors"
              >
                <span className="font-serif text-[16px] font-semibold text-ink leading-snug">
                  {faq.q}
                </span>
                <span className="p-1 text-ink-muted shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              {isOpen && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-[13px] text-ink-muted border-t border-line/60 bg-paper/20 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact & Support Card */}
      <div className="bg-surface rounded-panel border border-line p-5 sm:p-6 mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-[17px] font-semibold text-ink">
            Need further assistance?
          </h2>
          <p className="text-[13px] text-ink-muted mt-0.5">
            Visit the Central Stores counter in the Administrative Block during office hours (9:30 AM – 5:30 PM, Mon–Fri).
          </p>
        </div>

        <Link
          to="/directory"
          className="h-9 px-4 rounded bg-primary hover:bg-primary-hover text-surface text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 shrink-0"
        >
          <span>University Directory</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
