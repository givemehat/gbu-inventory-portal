import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, HelpCircle, PhoneCall, Building2, Mail, ExternalLink } from 'lucide-react';
import { useTextSize } from '../context/TextSizeContext';

export default function UtilityBar() {
  const { textSize, setTextSize } = useTextSize();

  return (
    <div className="h-8 bg-[#5C132B] text-rose-100 border-b border-[#440D1F] px-4 sm:px-6 flex items-center justify-between text-[11px] select-none shrink-0 z-40">
      {/* Left: Department & University Title (Desktop) */}
      <div className="hidden sm:flex items-center gap-2">
        <span className="font-semibold text-white tracking-wide">
          Stores & Purchase Department
        </span>
        <span className="text-rose-300/60">•</span>
        <span className="text-rose-100">Gautam Buddha University</span>
      </div>

      {/* Mobile Title (abbreviated) */}
      <div className="sm:hidden font-medium text-white">
        GBU Stores & Purchase
      </div>

      {/* Right: Quick Links & Text Size Controls (A- / A / A+) */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Quick Resource Links (Hidden on small mobile) */}
        <div className="hidden md:flex items-center gap-3 text-rose-100">
          <Link
            to="/directory"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <Building2 className="w-3 h-3 text-rose-200" />
            <span>Directory</span>
          </Link>
          <Link
            to="/forms"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <FileText className="w-3 h-3 text-rose-200" />
            <span>Forms</span>
          </Link>
          <Link
            to="/help"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3 text-rose-200" />
            <span>Help</span>
          </Link>
          <a
            href="mailto:stores@gbu.ac.in"
            title="Email Central Stores Office (stores@gbu.ac.in)"
            className="text-amber-300 hover:text-amber-100 transition-colors flex items-center gap-1"
          >
            <Mail className="w-3 h-3 fill-amber-300/20" />
            <span className="hidden lg:inline text-[10px]">stores@gbu.ac.in</span>
          </a>
        </div>

        <div className="hidden md:block h-3 w-px bg-rose-900/60" />

        {/* Text Size Scale Control: A- | A | A+ (matching GBU Admission portal) */}
        <div className="flex items-center gap-1 bg-black/25 rounded px-1.5 py-0.5 border border-white/15">
          <span className="text-[10px] text-rose-200 mr-1 hidden sm:inline">Text:</span>
          <button
            type="button"
            onClick={() => setTextSize('sm')}
            title="Small text"
            className={`px-1.5 py-0.2 rounded font-semibold text-[10px] transition-colors ${
              textSize === 'sm'
                ? 'bg-white text-[#5C132B] font-bold'
                : 'text-rose-100 hover:text-white hover:bg-white/10'
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
                ? 'bg-white text-[#5C132B] font-bold'
                : 'text-rose-100 hover:text-white hover:bg-white/10'
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
                ? 'bg-white text-[#5C132B] font-bold'
                : 'text-rose-100 hover:text-white hover:bg-white/10'
            }`}
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}
