import React from 'react';

/**
 * Enterprise SVG Illustrations inspired by Storyset & unDraw
 * (from developer design resource collections)
 * Uses Tailwind theme tokens (#1F3A8A primary, #14213D ink, #E3E6EC line, #EFF6FF light blue)
 */

export function EmptyBoxIllustration({ className = "w-40 h-40", message = "No records found" }) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <svg
        className={className}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Soft background halo */}
        <circle cx="100" cy="100" r="75" fill="#EFF6FF" />
        <ellipse cx="100" cy="155" rx="60" ry="12" fill="#E2E8F0" />
        
        {/* Open Storage Box Base */}
        <path
          d="M55 90 L100 115 L145 90 L145 135 L100 160 L55 135 Z"
          fill="#DBEAFE"
          stroke="#1F3A8A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        {/* Box Interior / Sides */}
        <path
          d="M55 90 L100 115 L100 160 L55 135 Z"
          fill="#BFDBFE"
          stroke="#1F3A8A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M100 115 L145 90 L145 135 L100 160 Z"
          fill="#93C5FD"
          stroke="#1F3A8A"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Box Flaps */}
        <path
          d="M55 90 L35 75 L75 62 L100 78 Z"
          fill="#DBEAFE"
          stroke="#1F3A8A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M145 90 L165 75 L125 62 L100 78 Z"
          fill="#BFDBFE"
          stroke="#1F3A8A"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Floating Document / Requisition Slip */}
        <g transform="translate(75, 45)">
          <rect
            x="0"
            y="0"
            width="50"
            height="60"
            rx="3"
            fill="#FFFFFF"
            stroke="#1F3A8A"
            strokeWidth="2"
            transform="rotate(6 25 30)"
          />
          <line x1="8" y1="14" x2="35" y2="14" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="8" y1="24" x2="42" y2="24" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <line x1="8" y1="32" x2="38" y2="32" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
          <circle cx="34" cy="45" r="5" fill="#3B82F6" />
        </g>

        {/* Subtle sparkle accents */}
        <path d="M45 55 L48 50 L51 55 L56 58 L51 61 L48 66 L45 61 L40 58 Z" fill="#F59E0B" />
        <path d="M155 120 L157 116 L159 120 L163 122 L159 124 L157 128 L155 124 L151 122 Z" fill="#3B82F6" />
      </svg>
      {message && (
        <p className="mt-2 text-[13px] font-medium text-ink-muted max-w-xs">
          {message}
        </p>
      )}
    </div>
  );
}

export function AuditShieldIllustration({ className = "w-36 h-36" }) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg
        className={className}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="80" cy="80" r="65" fill="#F0FDF4" />
        <ellipse cx="80" cy="135" rx="45" ry="8" fill="#E2E8F0" />
        
        {/* Shield */}
        <path
          d="M80 30 C105 30 120 40 120 70 C120 100 95 122 80 128 C65 122 40 100 40 70 C40 40 55 30 80 30 Z"
          fill="#DCFCE7"
          stroke="#15803D"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Inner Shield Badge */}
        <path
          d="M80 40 C98 40 110 48 110 72 C110 96 90 112 80 118 C70 112 50 96 50 72 C50 48 62 40 80 40 Z"
          fill="#FFFFFF"
        />
        {/* Checkmark */}
        <path
          d="M66 75 L76 85 L96 63"
          stroke="#15803D"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Stars */}
        <circle cx="35" cy="50" r="3" fill="#10B981" />
        <circle cx="125" cy="50" r="3" fill="#10B981" />
      </svg>
    </div>
  );
}

export function DeliveryBoxIllustration({ className = "w-36 h-36" }) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg
        className={className}
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <circle cx="80" cy="80" r="60" fill="#FEF3C7" />
        <ellipse cx="80" cy="130" rx="40" ry="7" fill="#E2E8F0" />
        
        {/* Package Carton */}
        <rect x="45" y="60" width="70" height="55" rx="4" fill="#FDE68A" stroke="#B45309" strokeWidth="2.5" />
        <line x1="80" y1="60" x2="80" y2="115" stroke="#B45309" strokeWidth="2.5" strokeDasharray="4 3" />
        <rect x="70" y="60" width="20" height="55" fill="#F59E0B" fillOpacity="0.3" />
        
        {/* Barcode Sticker */}
        <rect x="52" y="70" width="20" height="14" rx="1" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
        <line x1="56" y1="73" x2="56" y2="81" stroke="#1E293B" strokeWidth="1.5" />
        <line x1="60" y1="73" x2="60" y2="81" stroke="#1E293B" strokeWidth="1" />
        <line x1="63" y1="73" x2="63" y2="81" stroke="#1E293B" strokeWidth="1.5" />
        <line x1="67" y1="73" x2="67" y2="81" stroke="#1E293B" strokeWidth="1" />

        {/* Fragile / Arrow Up Icon */}
        <path d="M102 75 L102 85 M99 78 L102 75 L105 78" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
