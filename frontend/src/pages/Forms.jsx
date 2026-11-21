import React, { useState, useEffect } from 'react';
import { Printer, Eye, X, FileText, Database } from 'lucide-react';
import { api } from '../api';
import { assetUrl } from '../lib/utils';

export default function Forms() {
  const [selectedForm, setSelectedForm] = useState(null);
  const [fillRecordType, setFillRecordType] = useState('blank'); // 'blank' | recordId
  const [recentRecords, setRecentRecords] = useState({
    indents: [],
    pos: [],
    writeoffs: [],
  });

  useEffect(() => {
    // Load recent records for "Fill from a record" option
    Promise.all([
      api.getIndents('', { page_size: 5 }).catch(() => ({ items: [] })),
      api.getPOs({ page_size: 5 }).catch(() => ({ items: [] })),
      api.getWriteOffs({ page_size: 5 }).catch(() => ({ items: [] })),
    ]).then(([indentsRes, posRes, writeoffsRes]) => {
      setRecentRecords({
        indents: indentsRes?.items || (Array.isArray(indentsRes) ? indentsRes : []),
        pos: posRes?.items || (Array.isArray(posRes) ? posRes : []),
        writeoffs: writeoffsRes?.items || (Array.isArray(writeoffsRes) ? writeoffsRes : []),
      });
    });
  }, []);

  const sampleForms = [
    {
      id: 'sp-01',
      code: 'S&P-01 (sample)',
      title: 'Material Requisition Indent',
      whenToUse: 'When a department or lab requests stationery, consumable materials, or lab supplies.',
      type: 'indent',
      authority: 'Department Head → Store Officer → Director (S&P)',
    },
    {
      id: 'sp-02',
      code: 'S&P-02 (sample)',
      title: 'Store Issue Voucher',
      whenToUse: 'When materials are physically disbursed from the central stores counter to department staff.',
      type: 'issue',
      authority: 'Store Custodian & Receiving Staff',
    },
    {
      id: 'sp-03',
      code: 'S&P-03 (sample)',
      title: 'Goods Receipt Note (GRN)',
      whenToUse: 'When goods delivered by a vendor against a purchase order are inspected and accepted into stock.',
      type: 'po',
      authority: 'Store Officer & Inspection Committee',
    },
    {
      id: 'sp-04',
      code: 'S&P-04 (sample)',
      title: 'Material Condemnation & Write-Off Proposal',
      whenToUse: 'When obsolete, broken, or unserviceable goods are inspected for disposal and stock write-off.',
      type: 'writeoff',
      authority: 'Survey Board & Director (S&P)',
    },
  ];

  // Find currently selected record object if any
  let activeRecord = null;
  if (fillRecordType.startsWith('indent:')) {
    const id = Number(fillRecordType.split(':')[1]);
    activeRecord = recentRecords.indents.find((r) => r.id === id);
  } else if (fillRecordType.startsWith('po:')) {
    const id = Number(fillRecordType.split(':')[1]);
    activeRecord = recentRecords.pos.find((r) => r.id === id);
  } else if (fillRecordType.startsWith('writeoff:')) {
    const id = Number(fillRecordType.split(':')[1]);
    activeRecord = recentRecords.writeoffs.find((r) => r.id === id);
  }

  const handlePrint = () => {
    window.print();
  };

  const openPreview = (form) => {
    setSelectedForm(form);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="font-serif text-[26px] sm:text-[28px] font-medium text-ink leading-tight">
          Forms and slips
        </h1>
        <p className="text-[13px] text-ink-muted mt-1">
          Sample formats prepared for this prototype. Final formats are decided by the Stores & Purchase Department.
        </p>
      </div>

      {/* Top Banner Notice */}
      <div className="no-print p-3.5 bg-paper rounded border border-line text-[12px] text-ink-muted flex items-start gap-2.5">
        <span className="font-semibold text-ink shrink-0">Sample notice:</span>
        <span>
          These vouchers and slips represent standard institutional formats. They can be printed blank for manual hand-filling, or pre-filled directly from a database transaction.
        </span>
      </div>

      {/* Control: Fill from a record */}
      <div className="no-print bg-surface p-4 rounded-panel border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
        <div className="flex items-center gap-2.5">
          <Database className="w-4 h-4 text-primary shrink-0" />
          <label htmlFor="record-selector" className="font-medium text-ink">Fill from a record:</label>
          <select
            id="record-selector"
            value={fillRecordType}
            onChange={(e) => setFillRecordType(e.target.value)}
            className="h-8.5 px-3 rounded border border-line bg-surface text-ink text-[12px] outline-none focus:border-primary max-w-xs sm:max-w-md truncate"
          >
            <option value="blank">Blank form (for hand-filling)</option>
            {recentRecords.indents.length > 0 && (
              <optgroup label="Recent Indents">
                {recentRecords.indents.map((ind) => (
                  <option key={`indent:${ind.id}`} value={`indent:${ind.id}`}>
                    {ind.no} — {ind.dept} ({ind.status})
                  </option>
                ))}
              </optgroup>
            )}
            {recentRecords.pos.length > 0 && (
              <optgroup label="Recent Purchase Orders">
                {recentRecords.pos.map((p) => (
                  <option key={`po:${p.id}`} value={`po:${p.id}`}>
                    {p.no} — {p.vendor} ({p.status})
                  </option>
                ))}
              </optgroup>
            )}
            {recentRecords.writeoffs.length > 0 && (
              <optgroup label="Recent Write-Off Proposals">
                {recentRecords.writeoffs.map((w) => (
                  <option key={`writeoff:${w.id}`} value={`writeoff:${w.id}`}>
                    {w.no} — {w.item} ({w.qty} {w.unit})
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>

        {activeRecord && (
          <span className="text-[12px] text-primary font-medium">
            Pre-filling from record: <strong className="font-mono">{activeRecord.no}</strong>
          </span>
        )}
      </div>

      {/* Forms Table (Desktop) / Cards (Mobile) */}
      <div className="bg-surface rounded-panel border border-line overflow-hidden">
        <table className="w-full text-left text-[13px] hidden sm:table">
          <thead className="bg-paper border-b border-line text-ink font-semibold text-[12px]">
            <tr>
              <th className="px-4 py-3">Form name & sample code</th>
              <th className="px-4 py-3">When to use it</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line text-ink">
            {sampleForms.map((form) => (
              <tr key={form.id} className="hover:bg-paper/40 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-ink">{form.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-paper border border-line text-ink-muted">
                      {form.code}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      Sample
                    </span>
                  </div>
                  <span className="text-[11px] text-ink-muted block mt-0.5">
                    Authority: {form.authority}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-ink-muted text-[12px] leading-snug max-w-md">
                  {form.whenToUse}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openPreview(form)}
                      className="h-7.5 px-2.5 rounded border border-line bg-surface hover:bg-paper text-ink text-[12px] font-medium transition-colors inline-flex items-center gap-1 shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-ink-muted" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedForm(form);
                        setTimeout(() => window.print(), 200);
                      }}
                      className="h-7.5 px-2.5 rounded bg-primary hover:bg-primary-hover text-surface text-[12px] font-medium transition-colors inline-flex items-center gap-1 shadow-xs"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Stacked Rows on Mobile (< 640px) */}
        <div className="divide-y divide-line sm:hidden">
          {sampleForms.map((form) => (
            <div key={form.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink text-[14px]">{form.title}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-paper border border-line text-ink-muted">
                  {form.code}
                </span>
              </div>
              <p className="text-[12px] text-ink-muted leading-relaxed">
                {form.whenToUse}
              </p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => openPreview(form)}
                  className="flex-1 h-8 rounded border border-line bg-surface text-ink text-[12px] font-medium inline-flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedForm(form);
                    setTimeout(() => window.print(), 200);
                  }}
                  className="flex-1 h-8 rounded bg-primary text-white text-[12px] font-medium inline-flex items-center justify-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* A4 Printable Modal Sheet */}
      {selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-[2px] overflow-y-auto">
          <div className="bg-surface rounded-panel max-w-3xl w-full border border-line shadow-xl overflow-hidden my-6">
            {/* Modal Controls (Hidden during print) */}
            <div className="no-print p-4 border-b border-line bg-paper flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded border border-blue-200">
                  {selectedForm.code}
                </span>
                <span className="font-semibold text-ink text-[13px]">
                  {selectedForm.title} (A4 Print Preview)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="h-8 px-3 rounded bg-primary hover:bg-primary-hover text-white text-[12px] font-medium transition-colors inline-flex items-center gap-1.5 shadow-sm"
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

            {/* A4 Document Body */}
            <div className="p-8 sm:p-12 space-y-6 bg-surface print-container text-ink">
              {/* Header with University Logo */}
              <div className="border-b-2 border-ink pb-4 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <img
                    src={assetUrl('gbu-logo.jpg')}
                    alt="GBU Logo"
                    className="w-14 h-14 rounded-full object-contain border border-line"
                  />
                  <div className="text-left">
                    <h2 className="font-serif text-[22px] font-semibold text-ink tracking-tight leading-tight">
                      Gautam Buddha University
                    </h2>
                    <p className="text-[11px] text-ink-muted">
                      Opp. Yamuna Expressway, Greater Noida, Gautam Buddha Nagar, UP — 201312
                    </p>
                  </div>
                </div>
                <div className="mt-2 py-1 px-4 bg-paper rounded border border-line inline-block text-[12px] font-medium text-ink">
                  Stores & Purchase Department • {selectedForm.title} ({selectedForm.code})
                </div>
              </div>

              {/* Document Meta Row */}
              <div className="grid grid-cols-3 gap-4 text-[12px] pb-3 border-b border-line">
                <div>
                  <span className="text-ink-muted block text-[11px]">Voucher ref. no:</span>
                  <span className="font-mono font-medium">
                    {activeRecord?.no || 'GBU/S&P/2026/______'}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted block text-[11px]">Date:</span>
                  <span className="font-medium">
                    {activeRecord?.at ? new Date(activeRecord.at).toLocaleDateString('en-IN') : '____ / ____ / 2026'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-ink-muted block text-[11px]">Academic session:</span>
                  <span className="font-medium">2026-2027</span>
                </div>
              </div>

              {/* Department & Particulars */}
              <div className="text-[12px] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Requisitioning Department / Academic School:</span>
                  <span className="font-medium text-ink">
                    {activeRecord?.dept || '...........................................................................'}
                  </span>
                </div>
                {activeRecord?.note && (
                  <div className="text-[11px] text-ink-muted bg-paper p-2 rounded border border-line">
                    Purpose / note: {activeRecord.note}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-[11px] border border-ink/40">
                <thead className="bg-paper border-b border-ink/40 font-semibold">
                  <tr>
                    <th className="p-2 border-r border-ink/40 w-10 text-center">S.No.</th>
                    <th className="p-2 border-r border-ink/40">Item nomenclature & specification</th>
                    <th className="p-2 border-r border-ink/40 w-24 text-right">Qty</th>
                    <th className="p-2 border-r border-ink/40 w-28 text-right">Unit rate (₹)</th>
                    <th className="p-2 w-32 text-center">Status / remark</th>
                  </tr>
                </thead>
                <tbody>
                  {activeRecord?.lines && activeRecord.lines.length > 0 ? (
                    activeRecord.lines.map((line, idx) => (
                      <tr key={idx} className="border-b border-ink/20 h-9">
                        <td className="p-2 border-r border-ink/40 text-center text-ink-muted">{idx + 1}</td>
                        <td className="p-2 border-r border-ink/40 font-medium">
                          {line.item || `Item #${line.item_id}`}
                        </td>
                        <td className="p-2 border-r border-ink/40 text-right font-mono">
                          {line.qty} {line.unit || ''}
                        </td>
                        <td className="p-2 border-r border-ink/40 text-right font-mono">
                          {line.rate ? `₹${line.rate}` : '—'}
                        </td>
                        <td className="p-2 text-center text-ink-muted text-[10px]">
                          {line.approved_qty !== undefined ? `Approved: ${line.approved_qty}` : (activeRecord.status || 'Verified')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    [1, 2, 3, 4, 5].map((row) => (
                      <tr key={row} className="border-b border-ink/20 h-9">
                        <td className="p-2 border-r border-ink/40 text-center text-ink-muted">{row}</td>
                        <td className="p-2 border-r border-ink/40"></td>
                        <td className="p-2 border-r border-ink/40"></td>
                        <td className="p-2 border-r border-ink/40"></td>
                        <td className="p-2"></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Signatures Block */}
              <div className="pt-8 mt-6 border-t border-ink/30 grid grid-cols-3 gap-6 text-center text-[11px] text-ink">
                <div>
                  <div className="border-b border-ink/40 pb-6 w-3/4 mx-auto mb-1 font-medium">
                    {activeRecord?.by || ''}
                  </div>
                  <p className="font-semibold">Requisitioner / Department Head</p>
                  <p className="text-[10px] text-ink-muted">School / Section Incharge</p>
                </div>

                <div className="flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-full border border-dashed border-line flex items-center justify-center text-[9px] text-ink-muted uppercase">
                    Department Seal
                  </div>
                </div>

                <div>
                  <div className="border-b border-ink/40 pb-6 w-3/4 mx-auto mb-1 font-medium">
                    {activeRecord?.decided_by || ''}
                  </div>
                  <p className="font-semibold">Director (Stores & Purchase)</p>
                  <p className="text-[10px] text-ink-muted">Sanctioning Authority</p>
                </div>
              </div>

              {/* Light Sample Watermark Footer */}
              <div className="pt-4 border-t border-line text-center text-[10px] text-ink-subtle">
                Sample format · Gautam Buddha University Stores & Purchase Prototype (Not an official university publication)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
