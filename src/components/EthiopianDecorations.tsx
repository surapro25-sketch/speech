import React from 'react';

export const EthiopianDecorations: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none" aria-hidden="true">
      {/* Deep Midnight Blue Tint & Vignette */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020512]/60 via-[#03081e]/75 to-[#020614]/90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-[#01030a]/80" />

      {/* Traditional Ethiopian Glowing Gold Geometric Borders - Left Side */}
      <div className="hidden md:flex flex-col items-center justify-between absolute top-0 bottom-0 left-0 w-8 lg:w-12 py-10 opacity-70 hover:opacity-90 transition-opacity">
        <svg
          viewBox="0 0 40 800"
          className="w-full h-full text-amber-500 fill-current drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
          preserveAspectRatio="none"
        >
          <pattern id="tilet-pattern-left" x="0" y="0" width="40" height="80" patternUnits="userSpaceOnUse">
            {/* Traditional Ethiopian Meskel / Tilet Geometric Lattice */}
            <path
              d="M20 0 L40 20 L20 40 L0 20 Z"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <path
              d="M20 10 L30 20 L20 30 L10 20 Z"
              fill="#d97706"
              fillOpacity="0.4"
            />
            <path
              d="M20 40 L40 60 L20 80 L0 60 Z"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <path
              d="M20 50 L30 60 L20 70 L10 60 Z"
              fill="#d97706"
              fillOpacity="0.4"
            />
            <line x1="20" y1="0" x2="20" y2="80" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 2" />
            <circle cx="20" cy="20" r="3" fill="#fef08a" />
            <circle cx="20" cy="60" r="3" fill="#fef08a" />
            <path d="M0 40 L40 40" stroke="#f59e0b" strokeWidth="2" />
          </pattern>
          <rect x="0" y="0" width="40" height="800" fill="url(#tilet-pattern-left)" />
        </svg>
      </div>

      {/* Traditional Ethiopian Glowing Gold Geometric Borders - Right Side */}
      <div className="hidden md:flex flex-col items-center justify-between absolute top-0 bottom-0 right-0 w-8 lg:w-12 py-10 opacity-70 hover:opacity-90 transition-opacity">
        <svg
          viewBox="0 0 40 800"
          className="w-full h-full text-amber-500 fill-current drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]"
          preserveAspectRatio="none"
        >
          <pattern id="tilet-pattern-right" x="0" y="0" width="40" height="80" patternUnits="userSpaceOnUse">
            <path
              d="M20 0 L40 20 L20 40 L0 20 Z"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <path
              d="M20 10 L30 20 L20 30 L10 20 Z"
              fill="#d97706"
              fillOpacity="0.4"
            />
            <path
              d="M20 40 L40 60 L20 80 L0 60 Z"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
            <path
              d="M20 50 L30 60 L20 70 L10 60 Z"
              fill="#d97706"
              fillOpacity="0.4"
            />
            <line x1="20" y1="0" x2="20" y2="80" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4 2" />
            <circle cx="20" cy="20" r="3" fill="#fef08a" />
            <circle cx="20" cy="60" r="3" fill="#fef08a" />
            <path d="M0 40 L40 40" stroke="#f59e0b" strokeWidth="2" />
          </pattern>
          <rect x="0" y="0" width="40" height="800" fill="url(#tilet-pattern-right)" />
        </svg>
      </div>

      {/* Flowing Multi-Colored Neon Rainbow Soundwave Ribbon at the Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none overflow-hidden">
        <svg
          viewBox="0 0 1440 160"
          preserveAspectRatio="none"
          className="w-full h-full opacity-90 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]"
        >
          <defs>
            <linearGradient id="neon-wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="20%" stopColor="#00f0ff" />
              <stop offset="40%" stopColor="#10b981" />
              <stop offset="60%" stopColor="#fbbf24" />
              <stop offset="80%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="neon-wave-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#eab308" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            d="M0,110 C200,60 400,140 600,85 C800,30 1000,120 1200,75 C1320,50 1400,90 1440,80 L1440,160 L0,160 Z"
            fill="url(#neon-wave-glow)"
            opacity="0.25"
          />
          <path
            d="M0,110 C200,60 400,140 600,85 C800,30 1000,120 1200,75 C1320,50 1400,90 1440,80"
            fill="none"
            stroke="url(#neon-wave-gradient)"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M0,120 C180,80 380,150 580,95 C780,40 980,130 1180,85 C1300,60 1380,100 1440,90"
            fill="none"
            stroke="url(#neon-wave-gradient)"
            strokeWidth="2"
            opacity="0.75"
          />
          <path
            d="M0,100 C220,50 420,130 620,75 C820,20 1020,110 1220,65 C1340,40 1410,80 1440,70"
            fill="none"
            stroke="url(#neon-wave-gradient)"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </svg>
      </div>
    </div>
  );
};
