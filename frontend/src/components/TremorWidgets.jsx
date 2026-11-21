import React from 'react';
import { formatInr } from '../lib/utils';
import { TrendingUp, ShieldCheck, AlertCircle } from 'lucide-react';

/**
 * Tremor-style Segmented Inventory Health Tracker
 */
export function TremorTracker({ data = [] }) {
  // data format: [{ key: 'healthy', label: 'Nominal stock', count: 22, color: 'bg-emerald-500' }, ...]
  const total = data.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-ink flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Inventory Health Distribution
        </span>
        <span className="text-ink-muted text-[11px] font-mono">{total} total tracked items</span>
      </div>

      {/* Segmented Bar */}
      <div className="w-full h-3 rounded-full bg-slate-100 flex overflow-hidden p-0.5 gap-0.5 border border-line">
        {data.map((item) => {
          const pct = Math.max(0, Math.round((item.count / total) * 100));
          if (pct === 0) return null;
          return (
            <div
              key={item.key}
              style={{ width: `${pct}%` }}
              title={`${item.label}: ${item.count} items (${pct}%)`}
              className={`h-full rounded-xs transition-all duration-300 ${item.color} hover:brightness-110 cursor-pointer`}
            />
          );
        })}
      </div>

      {/* Legend & Count row */}
      <div className="flex items-center justify-between text-[11px] text-ink-muted flex-wrap gap-2 pt-1">
        {data.map((item) => {
          const pct = Math.round((item.count / total) * 100);
          return (
            <div key={item.key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span>{item.label}: <strong className="text-ink font-mono">{item.count}</strong> ({pct}%)</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Tremor-style Proportional BarList for Department Allocations
 */
export function TremorBarList({ items = [] }) {
  // items format: [{ name: 'School of ICT', value: 240000, href: '/reports' }, ...]
  const maxValue = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const pct = Math.min(100, Math.max(6, Math.round((item.value / maxValue) * 100)));
        return (
          <div key={item.name || idx} className="group relative flex items-center justify-between py-1 px-2 rounded-md hover:bg-slate-50 transition-colors">
            {/* Background Proportional Bar */}
            <div
              style={{ width: `${pct}%` }}
              className="absolute left-0 top-0 bottom-0 bg-blue-50/80 rounded-md -z-0 transition-all duration-500 group-hover:bg-blue-100/80"
            />

            {/* Left Content */}
            <div className="relative z-10 flex items-center gap-2 min-w-0 pr-4">
              <span className="font-mono text-[11px] text-ink-subtle w-4">{idx + 1}.</span>
              <span className="text-[13px] font-medium text-ink truncate group-hover:text-primary transition-colors">
                {item.name}
              </span>
            </div>

            {/* Right Value */}
            <div className="relative z-10 text-right shrink-0">
              <span className="text-[12px] font-mono font-semibold text-ink">
                {formatInr(item.value)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
