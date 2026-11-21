import React, { useState } from 'react';
import { Layers, MapPin, Box, Check, ChevronRight } from 'lucide-react';

/**
 * Origin UI-inspired Interactive Warehouse Rack Visualizer
 * Maps GBU Central Stores Aisles, Racks, and Bins with live fullness percentages.
 */
export default function WarehouseRackGrid({ items = [], onSelectRack, activeRack = null }) {
  // Aggregate items by rack location
  const racks = [
    { id: 'Rack A1', bay: 'Bay A (Stationery)', maxCapacity: 250, desc: 'Paper Reams, Registers & Envelopes' },
    { id: 'Rack A2', bay: 'Bay A (Stationery)', maxCapacity: 450, desc: 'Pens, Folders & Office Fasteners' },
    { id: 'Rack B1', bay: 'Bay B (Computing)', maxCapacity: 120, desc: 'HDMI, Ethernet, Keyboard & Peripherals' },
    { id: 'Rack B2', bay: 'Bay B (Computing)', maxCapacity: 80, desc: 'RAM, SSD, Drives & Components' },
    { id: 'Rack C1', bay: 'Bay C (Lab Sciences)', maxCapacity: 200, desc: 'Multimeters, Breadboards & Circuits' },
    { id: 'Rack C2', bay: 'Bay C (Lab Sciences)', maxCapacity: 150, desc: 'Glassware, Beakers & Pipettes' },
    { id: 'Rack C3', bay: 'Bay C (Lab Sciences)', maxCapacity: 100, desc: 'Reagents & Chemistry Solvents' },
    { id: 'Rack D1', bay: 'Bay D (Electricals)', maxCapacity: 180, desc: 'Sockets, Plugs, Extension Boards' },
    { id: 'Rack D2', bay: 'Bay D (Electricals)', maxCapacity: 90, desc: 'Wiring Coils, Relays & Circuit Breakers' },
    { id: 'Rack E1', bay: 'Bay E (Maintenance)', maxCapacity: 120, desc: 'Soaps, Sanitizers & Handwash Cans' },
    { id: 'Rack E2', bay: 'Bay E (Maintenance)', maxCapacity: 80, desc: 'Dustbins, Brooms & Cleaning Tools' },
  ];

  // Calculate items in each rack
  const rackStats = racks.map((rack) => {
    const matching = items.filter((it) => it.location === rack.id);
    const totalUnits = matching.reduce((sum, it) => sum + (it.qty ?? it.current_qty ?? 0), 0);
    const skuCount = matching.length;
    const occupancyPct = Math.min(100, Math.round((totalUnits / rack.maxCapacity) * 100));

    let status = 'nominal';
    if (occupancyPct >= 85) status = 'full';
    else if (occupancyPct <= 20) status = 'low';

    return {
      ...rack,
      totalUnits,
      skuCount,
      occupancyPct,
      status,
      items: matching,
    };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-[13px] font-semibold text-ink">
            Central Stores Bay & Rack Visualizer
          </h3>
        </div>
        <span className="text-[11px] text-ink-muted">
          11 Active Racks • Capacity-tracked
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {rackStats.map((rack) => {
          const isSelected = activeRack === rack.id;
          return (
            <button
              key={rack.id}
              type="button"
              onClick={() => onSelectRack?.(isSelected ? null : rack.id)}
              className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden group ${
                isSelected
                  ? 'border-primary ring-2 ring-primary/20 bg-blue-50/50 shadow-xs'
                  : 'border-line bg-surface hover:border-slate-300 hover:bg-paper/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-[12px] font-bold text-ink">
                  {rack.id}
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  rack.status === 'full' 
                    ? 'bg-amber-50 text-amber border border-amber-200' 
                    : rack.status === 'low'
                    ? 'bg-slate-100 text-ink-muted'
                    : 'bg-emerald-50 text-green border border-green-200'
                }`}>
                  {rack.occupancyPct}%
                </span>
              </div>

              <span className="text-[11px] text-ink-muted block truncate mb-2">
                {rack.desc}
              </span>

              {/* Occupancy bar */}
              <div className="w-full h-1.5 bg-line rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    rack.status === 'full' ? 'bg-amber' : 'bg-primary'
                  }`}
                  style={{ width: `${rack.occupancyPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-ink-subtle mt-2 pt-1.5 border-t border-line/60">
                <span>{rack.skuCount} SKUs</span>
                <span className="font-mono">{rack.totalUnits} / {rack.maxCapacity} units</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
