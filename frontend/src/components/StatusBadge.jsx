import React from 'react';

export default function StatusBadge({ status }) {
  const s = (status || '').toUpperCase();

  const configs = {
    PENDING: {
      label: 'Pending',
      className: 'border border-[#B45309] text-[#B45309] bg-[#FEF3C7]/40',
    },
    APPROVED: {
      label: 'Approved',
      className: 'border border-[#93C5FD] text-[#1F3A8A] bg-[#EFF6FF]',
    },
    ORDERED: {
      label: 'Ordered',
      className: 'border border-[#1F3A8A] text-[#1F3A8A] bg-white',
    },
    RECEIVED: {
      label: 'Received',
      className: 'border border-[#BBF7D0] text-[#15803D] bg-[#DCFCE7]',
    },
    PARTIAL: {
      label: 'Partial',
      className: 'border border-[#C4B5FD] text-[#6D28D9] bg-[#F5F3FF]',
    },
    OPEN: {
      label: 'Open',
      className: 'border border-[#93C5FD] text-[#1F3A8A] bg-white',
    },
    REJECTED: {
      label: 'Rejected',
      className: 'border border-[#FECACA] text-[#B91C1C] bg-[#FEE2E2]',
    },
    IN: {
      label: 'Stock in',
      className: 'border border-[#BBF7D0] text-[#15803D] bg-[#DCFCE7]',
    },
    OUT: {
      label: 'Issued out',
      className: 'border border-[#93C5FD] text-[#1F3A8A] bg-[#EFF6FF]',
    },
    WRITEOFF: {
      label: 'Written off',
      className: 'border border-[#FECACA] text-[#B91C1C] bg-[#FEE2E2]',
    },
  };

  const config = configs[s] || {
    label: s,
    className: 'border border-line text-ink-muted bg-paper',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium leading-none ${config.className}`}
    >
      {config.label}
    </span>
  );
}
