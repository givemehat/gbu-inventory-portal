import React from 'react';

/**
 * Origin UI / Shadcn-style Status Badge with Glowing Semantic Dot Indicator
 */
export default function StatusBadge({ status }) {
  const s = (status || '').toUpperCase();

  const configs = {
    PENDING: {
      label: 'Pending',
      className: 'border border-amber-300 text-amber-800 bg-amber-50/70',
      dot: 'bg-amber-500 animate-pulse',
    },
    APPROVED: {
      label: 'Approved',
      className: 'border border-blue-200 text-primary bg-blue-50/70',
      dot: 'bg-blue-600',
    },
    ORDERED: {
      label: 'Ordered',
      className: 'border border-blue-300 text-primary bg-white',
      dot: 'bg-primary',
    },
    RECEIVED: {
      label: 'Received (GRN)',
      className: 'border border-emerald-300 text-emerald-800 bg-emerald-50/70',
      dot: 'bg-emerald-500',
    },
    PARTIAL: {
      label: 'Partial Delivery',
      className: 'border border-amber-300 text-amber-800 bg-amber-50/60',
      dot: 'bg-amber-500',
    },
    OPEN: {
      label: 'Open',
      className: 'border border-blue-200 text-primary bg-white',
      dot: 'bg-blue-500',
    },
    REJECTED: {
      label: 'Rejected',
      className: 'border border-rose-300 text-rose-800 bg-rose-50/70',
      dot: 'bg-rose-500',
    },
    IN: {
      label: 'Stock In',
      className: 'border border-emerald-300 text-emerald-800 bg-emerald-50/70',
      dot: 'bg-emerald-500',
    },
    OUT: {
      label: 'Issued Out',
      className: 'border border-blue-200 text-primary bg-blue-50/60',
      dot: 'bg-primary',
    },
    WRITEOFF: {
      label: 'Written Off',
      className: 'border border-rose-300 text-rose-800 bg-rose-50/70',
      dot: 'bg-rose-500',
    },
  };

  const config = configs[s] || {
    label: s,
    className: 'border border-line text-ink-muted bg-paper',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium leading-none shadow-2xs ${config.className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 shrink-0 ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
}
