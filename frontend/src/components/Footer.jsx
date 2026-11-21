import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="no-print mt-auto border-t border-line bg-surface py-4 px-4 sm:px-6 text-[12px] text-ink-muted">
      <div className="max-w-[1240px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left">
        {/* Left: University address & office hours */}
        <div className="leading-snug">
          <p className="font-medium text-ink">Gautam Buddha University</p>
          <p className="text-[11px] text-ink-subtle">
            Opp. Yamuna Expressway, Greater Noida, Gautam Buddha Nagar, UP — 201312
          </p>
          <p className="text-[11px] text-ink-subtle mt-0.5">
            Office hours: 9:30 AM to 5:30 PM (Mon–Fri) • EPABX: 0120-2344200
          </p>
        </div>

        {/* Middle: Quick Links */}
        <div className="flex items-center gap-3 text-[11px]">
          <Link to="/directory" className="hover:text-primary transition-colors">
            University Directory
          </Link>
          <span className="text-line">•</span>
          <Link to="/forms" className="hover:text-primary transition-colors">
            Printable Forms
          </Link>
          <span className="text-line">•</span>
          <Link to="/reports" className="hover:text-primary transition-colors">
            Stock Reports
          </Link>
          <span className="text-line">•</span>
          <Link to="/help" className="hover:text-primary transition-colors">
            Stores FAQ
          </Link>
        </div>

        {/* Right: Technical attribution */}
        <div className="text-[11px] text-ink-subtle leading-tight md:text-right">
          <p>
            Prototype designed & built by <span className="font-medium text-ink">Rajnish Singh</span>
          </p>
          <p className="text-[10px] text-ink-subtle mt-0.5">
            Stores & Purchase Department • Aligned with CCC Portal Guidelines (2026)
          </p>
        </div>
      </div>
    </footer>
  );
}
