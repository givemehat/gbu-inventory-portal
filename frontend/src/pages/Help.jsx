import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Mail, Phone, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Help() {
  const [openIdx, setOpenIdx] = useState(0);

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
          Stores & Purchase Help & FAQ
        </h1>
        <p className="text-[14px] text-ink-muted mt-1">
          Essential guidelines on material requisitions, procurement workflows, goods inward, and store audit protocols.
        </p>
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
