import React from 'react';
import { Check, Clock, Truck, PackageCheck, FileCheck, ArrowRight } from 'lucide-react';

/**
 * Magic UI-style Visual Shipment & Goods Receipt Milestone Stepper
 */
export default function ShipmentTracker({ status = 'OPEN', poNumber = '', vendorName = '', date = '' }) {
  // Determine active step index
  // 0: PO Created, 1: Vendor Dispatched, 2: Dock Inspection, 3: GRN Booked
  let currentStep = 1;
  if (status === 'RECEIVED') currentStep = 3;
  else if (status === 'PARTIAL') currentStep = 2;
  else if (status === 'OPEN') currentStep = 1;

  const steps = [
    { label: 'PO Sanctioned', desc: 'Indents approved & PO generated', icon: FileCheck },
    { label: 'Vendor Transit', desc: `${vendorName || 'Supplier'} dispatch`, icon: Truck },
    { label: 'Dock Inspection', desc: 'Stores physical verification', icon: Clock },
    { label: 'GRN Inward', desc: 'Ledger updated & stock credited', icon: PackageCheck },
  ];

  return (
    <div className="p-3.5 bg-paper/60 border border-line rounded-lg space-y-3">
      <div className="flex items-center justify-between text-[12px]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-ink font-mono">{poNumber}</span>
          <span className="text-ink-muted">•</span>
          <span className="text-ink-muted">{vendorName}</span>
        </div>
        <span className="text-[11px] font-mono text-ink-subtle">{date}</span>
      </div>

      {/* Stepper Line */}
      <div className="grid grid-cols-4 gap-2 relative">
        {steps.map((step, idx) => {
          const isComplete = idx < currentStep;
          const isCurrent = idx === currentStep;
          const isPending = idx > currentStep;
          const Icon = step.icon;

          return (
            <div key={idx} className="relative flex flex-col items-center text-center">
              {/* Connector line behind */}
              {idx < steps.length - 1 && (
                <div
                  className={`absolute top-3.5 left-1/2 w-full h-0.5 -z-0 ${
                    idx < currentStep ? 'bg-primary' : 'bg-line'
                  }`}
                />
              )}

              {/* Node Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center relative z-10 transition-colors ${
                  isComplete
                    ? 'bg-primary text-white shadow-2xs'
                    : isCurrent
                    ? 'bg-primary-light text-primary border-2 border-primary ring-2 ring-primary/20'
                    : 'bg-surface text-ink-subtle border border-line'
                }`}
              >
                {isComplete ? (
                  <Check className="w-3.5 h-3.5 stroke-3" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Text labels */}
              <span className={`text-[11px] font-semibold mt-1.5 block ${
                isCurrent ? 'text-primary' : isComplete ? 'text-ink' : 'text-ink-subtle'
              }`}>
                {step.label}
              </span>
              <span className="text-[10px] text-ink-muted hidden sm:block truncate max-w-[100px]">
                {step.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
