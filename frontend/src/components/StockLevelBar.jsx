import React from 'react';

export default function StockLevelBar({ qty = 0, minStock = 0, unit = 'pcs' }) {
  const isLow = qty <= minStock;
  // Calculate percentage relative to 2x minStock or current qty
  const targetMax = Math.max(minStock * 2, qty, 1);
  const percent = Math.min(100, Math.max(4, Math.round((qty / targetMax) * 100)));

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#E3E6EC] rounded-full overflow-hidden shrink-0">
        <div
          className={`h-full rounded-full transition-all duration-150 ${
            isLow ? 'bg-[#B45309]' : 'bg-[#1F3A8A]'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <span className="tabular-nums font-medium text-[13px] text-ink whitespace-nowrap">
        {qty} <span className="text-[12px] text-ink-muted">{unit}</span>
      </span>

      {isLow && (
        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-semibold border border-[#B45309] text-[#B45309] bg-[#FEF3C7]/40 leading-none">
          Low
        </span>
      )}
    </div>
  );
}
