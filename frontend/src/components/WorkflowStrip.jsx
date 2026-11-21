import React from 'react';
import { Check } from 'lucide-react';

export default function WorkflowStrip({ status = 'PENDING', compact = false }) {
  const s = (status || '').toUpperCase();

  const steps = [
    { key: 'RAISED', label: 'Raised' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'ORDERED', label: 'Ordered' },
    { key: 'RECEIVED', label: 'Received' },
  ];

  let currentIdx = 0;
  if (s === 'PENDING') currentIdx = 0;
  else if (s === 'APPROVED') currentIdx = 1;
  else if (s === 'ORDERED' || s === 'OPEN' || s === 'PARTIAL') currentIdx = 2;
  else if (s === 'RECEIVED') currentIdx = 3;
  else if (s === 'REJECTED') currentIdx = -1;

  if (s === 'REJECTED') {
    return (
      <span className="inline-flex items-center text-[12px] font-medium text-red">
        Rejected by sanctioning authority
      </span>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-[11px] font-medium text-ink-muted">
        {steps.map((st, i) => {
          const isDone = i < currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <React.Fragment key={st.key}>
              <span
                className={`px-1.5 py-0.5 rounded ${
                  isCurrent
                    ? 'text-primary font-semibold bg-primary-light border border-blue-200'
                    : isDone
                    ? 'text-green font-medium'
                    : 'text-ink-subtle'
                }`}
              >
                {st.label}
              </span>
              {i < steps.length - 1 && <span className="text-[#CBD5E1]">→</span>}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full py-2 border-y border-line my-3">
      {steps.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;

        return (
          <div key={step.key} className="flex items-center gap-2">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                isDone
                  ? 'bg-green text-white'
                  : isCurrent
                  ? 'bg-primary text-white ring-2 ring-blue-100'
                  : 'bg-[#E3E6EC] text-ink-muted'
              }`}
            >
              {isDone ? <Check className="w-3 h-3 stroke-[2.5]" /> : idx + 1}
            </div>
            <span
              className={`text-[13px] ${
                isCurrent
                  ? 'font-semibold text-primary'
                  : isDone
                  ? 'font-medium text-ink'
                  : 'text-ink-subtle'
              }`}
            >
              {step.label}
            </span>
            {idx < steps.length - 1 && (
              <div className="w-8 sm:w-16 h-0.5 bg-line mx-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
