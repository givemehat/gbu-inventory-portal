import React, { useState } from 'react';
import { Network, Info, ArrowRight, ShieldCheck, Layers } from 'lucide-react';

/**
 * Design Structure Matrix (DSM) for Gautam Buddha University Inventory
 * Inspired by MIT Technology Roadmaps DSM Analysis
 * Maps inter-departmental supply chain flow & material dependency density.
 */
export default function DesignStructureMatrix() {
  const departments = [
    { id: 'CS', code: 'CS', name: 'Central Stores & Purchase Directorate' },
    { id: 'ICT', code: 'SoICT', name: 'School of Information & Comm. Technology' },
    { id: 'SOE', code: 'SoE', name: 'School of Engineering' },
    { id: 'SOM', code: 'SoM', name: 'School of Management' },
    { id: 'SOBT', code: 'SoBT', name: 'School of Biotechnology' },
    { id: 'CIT', code: 'CIT', name: 'Central IT Cell & Network Infrastructure' },
    { id: 'EM', code: 'EM', name: 'Estate Maintenance & Works Division' },
  ];

  // Matrix dependency relations [Row: Consumer, Col: Provider/Co-dependent]
  // Value: 0 (none), 1 (low), 2 (medium), 3 (high/critical), 'self' (diagonal)
  const matrixData = [
    // CS,   ICT,  SOE,  SOM,  SOBT, CIT,  EM
    ['self', 3,    3,    2,    2,    3,    3], // CS (Central Stores coordinates all)
    [3,     'self', 2,    1,    1,    3,    1], // SoICT (ICT consumes high hardware from CS & IT)
    [3,      2,   'self', 1,    2,    1,    3], // SoE (Engineering consumes lab consumables & works with EM)
    [2,      1,    1,   'self', 1,    1,    1], // SoM (Management consumes stationery & exam supplies)
    [3,      1,    2,    1,   'self', 1,    2], // SoBT (Biotech consumes lab reagents & cold storage)
    [3,      3,    2,    1,    1,   'self', 2], // CIT (Central IT manages university computing infrastructure)
    [3,      1,    3,    1,    2,    2,   'self'], // EM (Estate manages lighting, power, maintenance)
  ];

  const relationDetails = {
    'CS-ICT': { title: 'Central Stores ↔ School of ICT', desc: '14 Indents in past 90 days. Primary items: Toner Cartridges, A4 Paper, USB Keyboards, HDMI cables.', val: '₹62,450' },
    'CS-SOE': { title: 'Central Stores ↔ School of Engineering', desc: '11 Indents. Breadboards, Digital Multimeters, Copper Wiring, Relays.', val: '₹41,200' },
    'CS-SOM': { title: 'Central Stores ↔ School of Management', desc: '8 Indents. Blue Ballpoint pens, Whiteboard markers, File folders.', val: '₹23,680' },
    'CS-CIT': { title: 'Central Stores ↔ Central IT Cell', desc: 'Campus server room upgrades, DDR4 RAM modules, bulk patch cords.', val: '₹14,500' },
    'CS-EM': { title: 'Central Stores ↔ Estate Maintenance', desc: 'LED tube lights, MCB switches, phenyl cans, sanitation equipment.', val: '₹6,730' },
    'ICT-CIT': { title: 'School of ICT ↔ Central IT Cell', desc: 'Joint lab networking, server virtualization, licensed software indents.', val: 'Co-dependent' },
    'SOE-EM': { title: 'School of Engineering ↔ Estate Maintenance', desc: 'Heavy workshop 3-phase power line maintenance and ventilation.', val: 'High Synergy' },
  };

  const [selectedCell, setSelectedCell] = useState(relationDetails['CS-ICT']);

  const getCellBg = (val) => {
    if (val === 'self') return 'bg-slate-800 text-slate-400 font-mono';
    if (val === 3) return 'bg-[#1565C0] text-white hover:bg-blue-700 cursor-pointer shadow-2xs font-semibold';
    if (val === 2) return 'bg-blue-200 text-blue-900 hover:bg-blue-300 cursor-pointer font-medium';
    if (val === 1) return 'bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer';
    return 'bg-white text-slate-300';
  };

  const handleCellClick = (rIdx, cIdx) => {
    const rCode = departments[rIdx].id;
    const cCode = departments[cIdx].id;
    const key1 = `${rCode}-${cCode}`;
    const key2 = `${cCode}-${rCode}`;
    const info = relationDetails[key1] || relationDetails[key2] || {
      title: `${departments[rIdx].name} ↔ ${departments[cIdx].name}`,
      desc: 'Standard quarterly requisition and consumable exchange channel under Central Store GFR guidelines.',
      val: 'Routine Exchange',
    };
    setSelectedCell(info);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 mb-5 gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded bg-blue-50 text-[#1565C0]">
              <Network className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Design Structure Matrix (DSM) — Requisition & Material Flow
            </h3>
          </div>
          <p className="text-[14.5px] text-slate-600">
            Cross-departmental dependency analysis mapping how material flows between Central Stores and academic schools.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[12.5px] shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#1565C0]" />
            <span className="text-slate-700 font-medium">Critical (3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-blue-200" />
            <span className="text-slate-700 font-medium">Moderate (2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-200" />
            <span className="text-slate-700 font-medium">Standard (1)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-slate-800" />
            <span className="text-slate-700 font-medium">Self</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Matrix Grid */}
        <div className="lg:col-span-8 overflow-x-auto">
          <div className="sm:hidden mb-2 px-2.5 py-1.5 bg-blue-50 border border-blue-200/80 rounded-md text-[12px] text-blue-800 flex items-center justify-between font-medium">
            <span>👉 Swipe horizontally to view full matrix</span>
            <span className="font-mono text-[10px] uppercase font-bold text-blue-600">7 x 7</span>
          </div>
          <table className="w-full border-collapse text-center select-none">
            <thead>
              <tr>
                <th className="p-2 text-left text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                  Consumer \ Provider
                </th>
                {departments.map((d) => (
                  <th key={d.id} className="p-2 text-[12.5px] font-bold text-slate-800 font-mono">
                    {d.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {departments.map((rowDept, rIdx) => (
                <tr key={rowDept.id} className="border-t border-slate-100">
                  <td className="p-2 text-left font-mono font-bold text-[13px] text-slate-800 bg-slate-50 border-r border-slate-200 whitespace-nowrap">
                    {rIdx + 1}. {rowDept.code}
                  </td>
                  {departments.map((colDept, cIdx) => {
                    const val = matrixData[rIdx][cIdx];
                    return (
                      <td key={colDept.id} className="p-1">
                        <button
                          type="button"
                          onClick={() => val !== 'self' && handleCellClick(rIdx, cIdx)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md flex items-center justify-center text-[13px] transition-transform active:scale-95 ${getCellBg(
                            val
                          )}`}
                          title={`${rowDept.name} consumes from ${colDept.name}`}
                        >
                          {val === 'self' ? '—' : val}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[12px] text-slate-500 mt-3 italic">
            * Click any colored matrix cell above to inspect the material dependency relationship between the two departments.
          </p>
        </div>

        {/* Selected Relation Inspector */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200 mb-3">
            <Info className="w-4 h-4 text-[#1565C0]" />
            <span className="text-[12px] font-bold uppercase tracking-wider text-slate-600">
              Dependency Detail
            </span>
          </div>

          {selectedCell ? (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-[15.5px]">
                {selectedCell.title}
              </h4>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                {selectedCell.desc}
              </p>
              <div className="p-3 bg-white rounded border border-slate-200 flex items-center justify-between">
                <span className="text-[12.5px] text-slate-500 font-medium">Requisition Volume:</span>
                <span className="font-bold text-[#1565C0] font-mono text-[14px]">{selectedCell.val}</span>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-slate-500">Click any matrix cell to inspect.</p>
          )}

          <div className="mt-4 pt-3 border-t border-slate-200 text-[12px] text-slate-500">
            <span>Aligned with GBU Stores & Purchase Requisition Framework</span>
          </div>
        </div>
      </div>
    </div>
  );
}
