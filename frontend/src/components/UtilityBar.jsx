import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, HelpCircle, PhoneCall, Building2 } from 'lucide-react';
import { useTextSize } from '../context/TextSizeContext';

export default function UtilityBar() {
  const { textSize, setTextSize } = useTextSize();

  return (
    <div className="h-8 bg-[#0F1E36] text-slate-200 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between text-[11px] select-none shrink-0 z-40">
      {/* Left: Department & University Title (Desktop) */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="font-semibold text-white tracking-wide">
          Stores & Purchase Department
        </span>
        <span className="text-slate-400">•</span>
        <span className="text-slate-300">Gautam Buddha University</span>
      </div>

      {/* Mobile Title (abbreviated) */}
      <div className="sm:hidden font-medium text-slate-300">
        GBU Stores & Purchase
      </div>

      {/* Right: Quick Links & Text Size Controls (A- / A / A+) */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Resource Links (Hidden on small mobile) */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/directory"
            className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
          >
            <Building2 className="w-3 h-3 text-slate-400" />
            <span>Directory</span>
          </Link>
          <Link
            to="/forms"
            className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
          >
            <FileText className="w-3 h-3 text-slate-400" />
            <span>Forms</span>
          </Link>
          <Link
            to="/help"
            className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-slate-400" />
            <span>Help</span>
          </Link>
        </div>

        <div className="hidden md:block h-3 w-px bg-slate-700" />

        {/* Text Size Scale Control: A- | A | A+ (matching GBU Admission portal) */}
        <div className="flex items-center gap-1 bg-slate-900/60 rounded px-1.5 py-0.5 border border-slate-700/60">
          <span className="text-[10px] text-slate-400 mr-1 hidden sm:inline">Text size:</span>
          <button
            type="button"
            onClick={() => setTextSize('sm')}
            title="Small text"
            className={`px-1.5 py-0.2 rounded font-semibold text-[10px] transition-colors ${
              textSize === 'sm'
                ? 'bg-primary text-white font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
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
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
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
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}
