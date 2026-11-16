import React from 'react';

/**
 * OrangeEnergyWaves
 * Renders multiple layered, smoothly curved orange energy waves
 * with gradients, Gaussian blur, and ambient optical bloom.
 */
export const OrangeEnergyWaves: React.FC = () => {
  return (
    <div className="absolute left-0 right-0 bottom-0 pointer-events-none select-none z-10 overflow-hidden h-[340px] sm:h-[420px] md:h-[480px] animate-wave-drift">
      <svg
        viewBox="0 0 1440 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full object-cover"
      >
        <defs>
          {/* Main Glowing Gradient */}
          <linearGradient id="waveGlowGrad1" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FF3D00" stopOpacity="0.1" />
            <stop offset="25%" stopColor="#FF6A00" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#FF8A22" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#FFA726" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FF5500" stopOpacity="0.4" />
          </linearGradient>

          {/* Secondary Ribbon Gradient */}
          <linearGradient id="waveGlowGrad2" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FF3D00" stopOpacity="0.05" />
            <stop offset="30%" stopColor="#FF7A00" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#FFA000" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FF6A00" stopOpacity="0.2" />
          </linearGradient>

          {/* Ambient Fill Gradient */}
          <linearGradient id="waveFillGrad" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#FF5500" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#030303" stopOpacity="0" />
          </linearGradient>

          {/* High Intensity Optical Glow Filter */}
          <filter id="waveBloom" x="-20%" y="-40%" width="140%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft Deep Glow Filter */}
          <filter id="softGlow" x="-20%" y="-40%" width="140%" height="200%">
            <feGaussianBlur stdDeviation="28" />
          </filter>
        </defs>

        {/* 1. Deep Ambient Glow Ribbon (Bottom Base) */}
        <path
          d="M -50 380 Q 240 440 520 370 T 1100 320 T 1500 240 L 1500 460 L -50 460 Z"
          fill="url(#waveFillGrad)"
          filter="url(#softGlow)"
          className="opacity-70 animate-pulse"
          style={{ animationDuration: '8s' }}
        />

        {/* 2. Secondary Ambient Curved Wave with Broad Bloom */}
        <path
          d="M -40 370 C 220 420 460 440 700 360 C 940 280 1200 240 1480 280"
          stroke="url(#waveGlowGrad2)"
          strokeWidth="12"
          strokeLinecap="round"
          filter="url(#waveBloom)"
          className="opacity-40"
        />

        {/* 3. Primary Energy Ribbon Body (Gradient Fill Band) */}
        <path
          d="M -40 330 C 260 260 480 430 760 380 C 1040 330 1280 200 1480 270 L 1480 340 C 1280 270 1040 390 760 430 C 480 470 260 330 -40 380 Z"
          fill="url(#waveFillGrad)"
          className="opacity-60"
        />

        {/* 4. Main Foreground Glowing Energy Line (Crest Wave) */}
        <path
          d="M -40 320 C 240 250 480 420 760 370 C 1020 320 1260 190 1480 260"
          stroke="url(#waveGlowGrad1)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#waveBloom)"
        />

        {/* 5. Crossing Accent Filament Wave (Intertwining Ribbon) */}
        <path
          d="M -40 410 C 280 440 540 330 820 380 C 1090 430 1290 280 1480 210"
          stroke="url(#waveGlowGrad2)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#waveBloom)"
          className="opacity-80"
        />

        {/* 6. Razor Fine Core Energy Strand */}
        <path
          d="M -40 321 C 240 251 480 421 760 371 C 1020 321 1260 191 1480 261"
          stroke="#FFFFFF"
          strokeWidth="1"
          strokeOpacity="0.45"
          strokeLinecap="round"
        />

        {/* 7. Floating Square Cyber-Security Spark Accents */}
        <g className="animate-pulse" style={{ animationDuration: '4s' }}>
          <rect x="160" y="270" width="7" height="7" rx="1.5" fill="#FF8A22" opacity="0.8" />
          <rect x="220" y="340" width="9" height="9" rx="2" fill="#FFA726" opacity="0.9" />
          <rect x="420" y="380" width="6" height="6" rx="1" fill="#FF7A00" opacity="0.75" />
          <rect x="1260" y="290" width="8" height="8" rx="1.5" fill="#FFA726" opacity="0.85" />
        </g>
      </svg>
    </div>
  );
};
