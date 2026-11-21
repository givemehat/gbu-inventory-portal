import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="no-print mt-auto border-t-2 border-[#14213D]/20 bg-surface py-4 px-4 sm:px-6 text-[12px] text-ink-muted">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        {/* Left: University address & office hours */}
        <div className="leading-snug min-w-0">
          <p className="font-medium text-ink">Gautam Buddha University</p>
          <p className="text-[11px] text-ink-muted">
            Opp. Yamuna Expressway, Greater Noida, Gautam Buddha Nagar, UP — 201312
          </p>
          <p className="text-[11px] text-ink-muted mt-0.5">
            Office hours: 9:30 AM to 5:30 PM (Mon–Fri) • University EPABX: 0120-2344200
          </p>
        </div>

        {/* Middle: Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-ink-muted shrink-0">
          <Link to="/directory" className="hover:text-primary transition-colors">
            Directory
          </Link>
          <span className="text-line">•</span>
          <Link to="/forms" className="hover:text-primary transition-colors">
            Forms and slips
          </Link>
          <span className="text-line">•</span>
          <Link to="/reports" className="hover:text-primary transition-colors">
            Stock reports
          </Link>
          <span className="text-line">•</span>
          <Link to="/help" className="hover:text-primary transition-colors">
            Help
          </Link>
        </div>

        {/* Right: Honest Attribution */}
        <div className="text-[12px] text-ink-muted leading-tight md:text-right shrink-0">
          <p>
            Prototype built by <span className="font-medium text-ink">Rajnish Singh</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
