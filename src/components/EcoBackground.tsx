import React from 'react';

export function EcoBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Deep dark olive gradient canvas */}
      <div className="absolute inset-0 bg-[#0d140e] bg-gradient-to-b from-[#0f1710] via-[#121c13] to-[#0a0f0b]" />

      {/* SVG Monochromatic pattern with solar and ecological symbols */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.07] text-[#86efac]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="solar-eco-pattern"
            width="160"
            height="160"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(5)"
          >
            {/* Symbol 1: Solar Panel Grid */}
            <g transform="translate(15, 15)" stroke="white" strokeWidth="1.2" fill="none">
              <rect x="0" y="0" width="36" height="24" rx="2" stroke="#86efac" />
              <line x1="12" y1="0" x2="12" y2="24" stroke="#86efac" />
              <line x1="24" y1="0" x2="24" y2="24" stroke="#86efac" />
              <line x1="0" y1="12" x2="36" y2="12" stroke="#86efac" />
              {/* Stand */}
              <path d="M12 24 L8 30 M24 24 L28 30 M5 30 L31 30" stroke="white" strokeWidth="1" />
            </g>

            {/* Symbol 2: Ecological Leaf / Sprout */}
            <g transform="translate(100, 20)" fill="none" stroke="white" strokeWidth="1.2">
              <path d="M12 28 C12 28 12 18 22 12 C22 12 14 10 8 16 C4 20 6 26 12 28 Z" stroke="#86efac" fill="#86efac" fillOpacity="0.3" />
              <path d="M12 28 C12 20 8 16 2 16" stroke="white" strokeWidth="1" />
              <path d="M12 28 L12 34" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </g>

            {/* Symbol 3: Radiant Sun with Clean Energy Rays */}
            <g transform="translate(25, 95)" stroke="white" strokeWidth="1.2" fill="none">
              <circle cx="16" cy="16" r="7" stroke="#86efac" fill="#86efac" fillOpacity="0.25" />
              {/* Sun rays */}
              <line x1="16" y1="3" x2="16" y2="6" stroke="white" strokeLinecap="round" />
              <line x1="16" y1="26" x2="16" y2="29" stroke="white" strokeLinecap="round" />
              <line x1="3" y1="16" x2="6" y2="16" stroke="white" strokeLinecap="round" />
              <line x1="26" y1="16" x2="29" y2="16" stroke="white" strokeLinecap="round" />
              <line x1="7" y1="7" x2="9" y2="9" stroke="white" strokeLinecap="round" />
              <line x1="23" y1="23" x2="25" y2="25" stroke="white" strokeLinecap="round" />
              <line x1="7" y1="25" x2="9" y2="23" stroke="white" strokeLinecap="round" />
              <line x1="23" y1="9" x2="25" y2="7" stroke="white" strokeLinecap="round" />
            </g>

            {/* Symbol 4: Renewable Loop / Circular Energy Arrows */}
            <g transform="translate(95, 95)" stroke="white" strokeWidth="1.2" fill="none">
              <path d="M6 16 A10 10 0 0 1 24 10" stroke="#86efac" strokeLinecap="round" />
              <polyline points="21 7 25 10 22 14" stroke="#86efac" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M26 16 A10 10 0 0 1 8 22" stroke="white" strokeLinecap="round" />
              <polyline points="11 25 7 22 10 18" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
              {/* Inner tiny leaf */}
              <circle cx="16" cy="16" r="2.5" fill="#86efac" fillOpacity="0.4" stroke="none" />
            </g>

            {/* Tiny accent spark dots */}
            <circle cx="75" cy="70" r="1.5" fill="white" opacity="0.6" />
            <circle cx="150" cy="140" r="1.5" fill="#86efac" opacity="0.6" />
            <circle cx="10" cy="145" r="1" fill="white" opacity="0.4" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#solar-eco-pattern)" />
      </svg>

      {/* Atmospheric ambient glow spots (deep olive & soft warm solar) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-lime-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-96 h-96 bg-emerald-950/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-olive-900/15 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}
