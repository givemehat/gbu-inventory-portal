import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, HelpCircle, Building2 } from 'lucide-react';
import { useTextSize } from '../context/TextSizeContext';

export default function UtilityBar() {
  const { textSize, setTextSize } = useTextSize();

  return (
    <div className="h-8 bg-[#14213D] text-slate-200 border-b border-[#0F1A2E] px-4 sm:px-6 flex items-center justify-between text-[11px] select-none shrink-0 z-20">
      {/* Left: Department & University Title */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-semibold text-white tracking-wide truncate">
          Stores & Purchase Department
        </span>
        <span className="text-slate-500 hidden sm:inline">•</span>
        <span className="text-slate-300 hidden sm:inline truncate">Gautam Buddha University</span>
      </div>

      {/* Right: Quick Links & Text Size Controls (A- / A / A+) */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Quick Resource Links (Hidden on small mobile) */}
        <div className="hidden md:flex items-center gap-3 text-slate-300">
          <Link
            to="/directory"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>Directory</span>
          </Link>
          <Link
            to="/forms"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Forms and slips</span>
          </Link>
          <Link
            to="/help"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Help</span>
          </Link>
        </div>

        <div className="hidden md:block h-3 w-px bg-slate-700" />

        {/* Text Size Scale Control: A- | A | A+ */}
        <div className="flex items-center gap-1 bg-black/30 rounded px-1.5 py-0.5 border border-white/10">
          <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Text size:</span>
          <button
            type="button"
            onClick={() => setTextSize('sm')}
            title="Small text"
            className={`px-1.5 py-0.2 rounded font-semibold text-[10px] transition-colors ${
              textSize === 'sm'
                ? 'bg-primary text-white font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => setTextSize('md')}
            title="Default text"
            className={`px-1.5 py-0.2 rounded font-semibold text-[11px] transition-colors ${
              textSize === 'md'
                ? 'bg-primary text-white font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            A
          </button>
          <button
            type="button"
            onClick={() => setTextSize('lg')}
            title="Large text"
            className={`px-1.5 py-0.2 rounded font-semibold text-[12px] transition-colors ${
              textSize === 'lg'
                ? 'bg-primary text-white font-bold'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}
