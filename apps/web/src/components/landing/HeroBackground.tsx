import React from 'react';

/**
 * A restrained, perspective-led hero field inspired by secure infrastructure
 * consoles. The orange horizon keeps the DocVault identity while the central
 * vanishing point directs attention toward the headline and viewer.
 */
export const HeroBackground: React.FC = () => {
  const perspectiveRays = [-220, -80, 80, 240, 400, 560, 680, 760, 880, 1040, 1200, 1360, 1520, 1660];
  const depthLines = [238, 288, 348, 420, 506, 608, 728, 866, 1022];

  return (
    <div className="hero-background absolute inset-0 overflow-hidden pointer-events-none select-none bg-[#030504]">
      {/* Quiet top illumination and edge vignette. */}
      <div className="absolute inset-x-0 top-0 h-[38rem] bg-[radial-gradient(ellipse_at_50%_4%,rgba(255,139,43,0.13),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,rgba(0,0,0,0.72)_100%)]" />

      {/* Central secure-core capsule. */}
      <div className="absolute left-1/2 top-[4.25rem] z-20 -translate-x-1/2">
        <div className="absolute inset-[-1.25rem] rounded-full bg-[#ff7a1a]/15 blur-2xl" />
        <div className="hero-core-float relative flex h-[3.75rem] w-[6.25rem] items-center justify-center rounded-[1.45rem] border border-white/15 bg-[#0b0d0c]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-10px_24px_rgba(255,106,0,0.08),0_0_0_5px_rgba(255,255,255,0.025),0_0_38px_rgba(255,106,0,0.22)] backdrop-blur-xl">
          <div className="absolute inset-[0.3rem] rounded-[1.15rem] border border-[#ff9a4d]/20" />
          <svg width="27" height="31" viewBox="0 0 27 31" fill="none" aria-hidden="true">
            <path d="M13.5 1.8 24 6.2v8.1c0 6.9-4.2 12.2-10.5 14.9C7.2 26.5 3 21.2 3 14.3V6.2L13.5 1.8Z" fill="url(#core-fill)" stroke="#ffad69" strokeWidth="1.2" />
            <path d="m14.8 7.2-5.7 8h4l-1 7.2 5.8-8.7h-4.1l1-6.5Z" fill="#fff5eb" />
            <defs>
              <linearGradient id="core-fill" x1="5" y1="3" x2="22" y2="27" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ff9b45" />
                <stop offset="1" stopColor="#ff4f00" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Vanishing-point wireframe. */}
      <svg
        viewBox="0 0 1440 1120"
        preserveAspectRatio="none"
        className="hero-grid-breathe absolute inset-x-0 top-10 h-[78%] w-full opacity-65"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="grid-stroke" x1="720" y1="120" x2="720" y2="1060" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffad69" stopOpacity="0.05" />
            <stop offset="0.48" stopColor="#ff842f" stopOpacity="0.26" />
            <stop offset="1" stopColor="#ff5a0b" stopOpacity="0.04" />
          </linearGradient>
          <radialGradient id="grid-bloom" cx="0" cy="0" r="1" gradientTransform="translate(720 595) rotate(90) scale(430 740)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff6a00" stopOpacity="0.17" />
            <stop offset="1" stopColor="#ff6a00" stopOpacity="0" />
          </radialGradient>
          <filter id="grid-soften" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="0.35" />
          </filter>
        </defs>

        <ellipse cx="720" cy="650" rx="730" ry="430" fill="url(#grid-bloom)" />

        <g stroke="url(#grid-stroke)" strokeWidth="1" filter="url(#grid-soften)">
          {perspectiveRays.map((x) => (
            <path key={x} d={`M720 108 L${x} 1080`} />
          ))}
          {depthLines.map((y, index) => {
            const width = 170 + index * 128;
            const curve = 16 + index * 11;
            return (
              <path
                key={y}
                d={`M${720 - width} ${y} Q720 ${y + curve} ${720 + width} ${y}`}
              />
            );
          })}
        </g>

        <path d="M720 108C520 113 330 122 140 151L5 279" stroke="#ff984d" strokeOpacity="0.12" />
        <path d="M720 108C920 113 1110 122 1300 151L1435 279" stroke="#ff984d" strokeOpacity="0.12" />
        <path d="M720 121C522 128 348 143 176 174L34 310" stroke="#ff6a00" strokeOpacity="0.08" />
        <path d="M720 121C918 128 1092 143 1264 174L1406 310" stroke="#ff6a00" strokeOpacity="0.08" />
      </svg>

      {/* Technical dot mesh that becomes denser toward the horizon. */}
      <div className="absolute inset-x-0 top-[18rem] h-[35rem] opacity-40 [background-image:radial-gradient(rgba(255,132,47,0.38)_0.65px,transparent_0.65px)] [background-size:5px_5px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_72%)]" />

      {/* Layered planetary horizon. The viewer overlaps this region. */}
      <div className="hero-horizon-float absolute left-1/2 top-[47%] h-[34rem] w-[118%] -translate-x-1/2 rounded-[50%] border border-[#ffab66]/55 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,195,120,0.96)_0%,rgba(255,112,20,0.84)_13%,rgba(255,74,0,0.48)_31%,rgba(63,15,1,0.12)_58%,transparent_72%)] shadow-[0_-18px_70px_rgba(255,106,0,0.25),inset_0_20px_55px_rgba(255,214,166,0.18)]" />
      <div className="absolute left-1/2 top-[52.5%] h-[31rem] w-[108%] -translate-x-1/2 rounded-[50%] border-t border-[#ffd0a6]/50 bg-[radial-gradient(ellipse_at_50%_-8%,rgba(255,157,73,0.78),rgba(255,78,0,0.24)_37%,rgba(11,6,3,0.08)_70%)] shadow-[0_-10px_44px_rgba(255,119,24,0.35)]" />
      <div className="absolute left-1/2 top-[58%] h-[27rem] w-[99%] -translate-x-1/2 rounded-[50%] border-t border-[#ffb477]/35 bg-[#070706]/45 shadow-[0_-8px_32px_rgba(255,89,0,0.2)]" />

      {/* Subtle grain, then a final center-safe vignette for legibility. */}
      <div className="absolute inset-0 opacity-[0.055] mix-blend-screen [background-image:url('data:image/svg+xml,%3Csvg_viewBox=%220_0_160_160%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22n%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.85%22_numOctaves=%223%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22100%25%22_height=%22100%25%22_filter=%22url(%23n)%22_opacity=%220.7%22/%3E%3C/svg%3E')]" />
      <div className="absolute inset-x-0 top-24 h-[30rem] bg-[radial-gradient(ellipse_at_center,rgba(3,5,4,0.34),rgba(3,5,4,0.04)_48%,transparent_72%)]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-[#030303] via-[#030303]/70 to-transparent" />
    </div>
  );
};
