import React from 'react';
import { formatInr } from '../lib/utils';
import { TrendingUp, ShieldCheck, AlertCircle } from 'lucide-react';
import NumberTicker from './NumberTicker';

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

/**
 * Tremor-style Metric Card with Sparkline & Delta Badge
 */
export function TremorMetricCard({
  title,
  value,
  delta,
  deltaType = 'increase', // 'increase' | 'decrease' | 'neutral'
  subtext = 'vs. previous cycle',
  sparklineData = [35, 42, 40, 58, 62, 70, 75],
  icon: Icon,
}) {
  const isPositive = deltaType === 'increase';
  const points = sparklineData.map((val, idx) => {
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData) || 1;
    const x = (idx / (sparklineData.length - 1)) * 60;
    const y = 20 - ((val - min) / (max - min || 1)) * 16;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="p-4 bg-surface border border-line rounded-panel shadow-2xs hover:shadow-xs transition-shadow space-y-2">
      <div className="flex items-center justify-between text-[12px] text-ink-muted">
        <span className="font-medium truncate">{title}</span>
        {Icon && <Icon className="w-4 h-4 text-ink-subtle" />}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[22px] sm:text-[24px] font-bold text-ink tabular-nums">
          {typeof value === 'number' ? <NumberTicker value={value} /> : value}
        </span>

        {/* Micro Sparkline */}
        <div className="shrink-0 w-16 h-6 flex items-center justify-end">
          <svg className="w-14 h-5 overflow-visible" viewBox="0 0 60 20">
            <polyline
              fill="none"
              stroke={isPositive ? '#10B981' : '#F59E0B'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </svg>
        </div>
      </div>

      {/* Delta badge */}
      <div className="flex items-center gap-1.5 text-[11px] pt-0.5">
        <span className={`px-1.5 py-0.2 rounded font-mono font-semibold flex items-center gap-0.5 ${
          isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {isPositive ? '↑' : '↓'} {delta}
        </span>
        <span className="text-ink-subtle truncate">{subtext}</span>
      </div>
    </div>
  );
}
