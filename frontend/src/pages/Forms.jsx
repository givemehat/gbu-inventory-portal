import React, { useState } from 'react';
import { FileText, Printer, Download, CheckCircle, ArrowRight, X } from 'lucide-react';

export default function Forms() {
  const [selectedForm, setSelectedForm] = useState(null);

  const officialForms = [
    {
      code: 'FORM S&P-01',
      title: 'Material Requisition Indent Form',
      description: 'Used by academic schools and administrative departments to request consumable stores, lab supplies, or equipment sanction.',
      purpose: 'Requisition & Sanction',
      fields: ['Requisition No.', 'Department / School', 'Head of Account / Budget Head', 'Item Nomenclature', 'Required Quantity', 'Stock In Hand', 'Justification / Purpose', 'Signatures: Requisitioner, Head of School, Store Officer, Director (S&P)'],
    },
    {
      code: 'FORM S&P-02',
      title: 'Store Issue Voucher (Disbursal Slip)',
      description: 'Official store disburse voucher signed upon physical collection of items from the central store counter.',
      purpose: 'Material Disbursal & Stock Ledger Debit',
      fields: ['Issue Voucher No.', 'Issued To (Department)', 'Requisition Reference', 'Item Code & Name', 'Quantity Issued', 'Unit Rate & Total Valuation', 'Signatures: Store Custodian, Receiving Official'],
    },
    {
      code: 'FORM S&P-03',
      title: 'Goods Receipt Note (GRN)',
      description: 'Formal inward inspection register record for university shipments delivered by contracted suppliers against an official PO.',
      purpose: 'Goods Inward & Asset Capitalization',
      fields: ['GRN Number', 'Purchase Order Ref.', 'Supplier / Firm Name', 'Challan / Invoice No. & Date', 'Inspected Quantity', 'Accepted Quantity', 'Stock Register Page No.', 'Signatures: Technical Inspection Committee, Store Officer'],
    },
    {
      code: 'FORM S&P-04',
      title: 'Material Condemnation & Write-Off Proposal',
      description: 'Formal condemnation petition for unserviceable, moisture-damaged, or obsolete laboratory chemicals and IT assets.',
      purpose: 'Board Inspection & Physical Disposal',
      fields: ['Proposal Reference No.', 'Location / Custody Section', 'Item Code & Description', 'Book Value at Acquisition', 'Cause of Condemnation', 'Physical Verification Board Findings', 'Signatures: Inspection Board Members, Director (S&P)'],
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-[28px] font-medium text-ink leading-tight">
          Official University Forms & Slips
        </h1>
        <p className="text-[14px] text-ink-muted mt-1">
          Standardized printable stationery, vouchers, and requisition slips for Gautam Buddha University Stores & Purchase.
        </p>
      </div>

      {/* Forms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {officialForms.map((form) => (
          <div
            key={form.code}
            className="bg-surface rounded-panel border border-line p-5 flex flex-col justify-between hover:border-slate-300 transition-colors shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="font-mono text-[11px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded border border-blue-200">
                  {form.code}
                </span>
                <span className="text-[11px] font-medium text-ink-muted px-2 py-0.5 rounded bg-paper border border-line">
                  {form.purpose}
                </span>
              </div>

              <h2 className="font-serif text-[18px] font-semibold text-ink leading-snug">
                {form.title}
              </h2>
              <p className="text-[13px] text-ink-muted mt-2 leading-relaxed">
                {form.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
              <span className="text-[11px] text-ink-subtle">
                A4 Standard Print Format
              </span>
              <button
                type="button"
                onClick={() => setSelectedForm(form)}
                className="h-8 px-3.5 rounded bg-primary hover:bg-primary-hover text-surface text-[12px] font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Preview & Print</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Printable Preview Dialog */}
      {selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-surface rounded-panel max-w-3xl w-full border border-line shadow-xl overflow-hidden my-6">
            {/* Modal Controls (Hidden during print) */}
            <div className="no-print p-4 border-b border-line bg-paper flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[12px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded border border-blue-200">
                  {selectedForm.code}
                </span>
                <span className="font-semibold text-ink text-[14px]">
                  {selectedForm.title} (A4 Print Preview)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="h-8 px-3 rounded bg-primary hover:bg-primary-hover text-white text-[12px] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedForm(null)}
                  className="p-1.5 text-ink-muted hover:text-ink rounded"
                  title="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Official GBU Printable A4 Sheet */}
            <div className="p-8 sm:p-12 space-y-6 bg-surface print-container">
              {/* University Header with Logo */}
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
                  Stores & Purchase Department • {selectedForm.title} ({selectedForm.code})
                </div>
              </div>

              {/* Document Meta Row */}
              <div className="grid grid-cols-3 gap-4 text-[12px] text-ink pb-3 border-b border-line">
                <div>
                  <span className="text-ink-muted block text-[11px]">Voucher Ref. No:</span>
                  <span className="font-mono font-medium">GBU/S&P/2026/______</span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Date of Issue:</span>
                  <span className="font-medium">____ / ____ / 2026</span>
                </div>
                <div className="text-right">
                  <span className="text-ink-muted block text-[11px]">Academic Session:</span>
                  <span className="font-medium">2026-2027</span>
                </div>
              </div>

              {/* Form Content / Table Template */}
              <div className="space-y-4">
                <div className="text-[12px] text-ink">
                  <p className="font-semibold mb-1">Requisitioning Department / Academic School:</p>
                  <div className="h-8 border-b border-dashed border-ink/40" />
                </div>

                <table className="w-full text-left text-[11px] border border-ink/40">
                  <thead className="bg-paper border-b border-ink/40 uppercase font-semibold">
                    <tr>
                      <th className="p-2 border-r border-ink/40 w-10 text-center">S.No.</th>
                      <th className="p-2 border-r border-ink/40">Item Description & Specifications</th>
                      <th className="p-2 border-r border-ink/40 w-24 text-right">Required Qty</th>
                      <th className="p-2 border-r border-ink/40 w-24 text-right">Stock In Hand</th>
                      <th className="p-2 w-32">Purpose / Head</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5].map((row) => (
                      <tr key={row} className="border-b border-ink/20 h-10">
                        <td className="p-2 border-r border-ink/40 text-center text-ink-muted">{row}</td>
                        <td className="p-2 border-r border-ink/40"></td>
                        <td className="p-2 border-r border-ink/40"></td>
                        <td className="p-2 border-r border-ink/40"></td>
                        <td className="p-2"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Official Signatures Block */}
              <div className="pt-10 mt-8 border-t border-ink/30 grid grid-cols-3 gap-6 text-center text-[11px] text-ink">
                <div>
                  <div className="border-b border-ink/40 pb-6 w-3/4 mx-auto mb-1 font-medium" />
                  <p className="font-semibold">Requisitioner / Department Head</p>
                  <p className="text-[10px] text-ink-muted">School / Section Incharge</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full border border-dashed border-line flex items-center justify-center text-[9px] text-ink-muted uppercase">
                    Department Seal
                  </div>
                </div>

                <div>
                  <div className="border-b border-ink/40 pb-6 w-3/4 mx-auto mb-1 font-medium" />
                  <p className="font-semibold">Director (Stores & Purchase)</p>
                  <p className="text-[10px] text-ink-muted">Sanctioning Authority</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
