import React from 'react';

/**
 * VerticalGlassPanels
 * Renders thin vertical grid lines across the hero and luminous translucent
 * glass panels on the right side with warm orange backlighting.
 */
export const VerticalGlassPanels: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* Vertical Grid Lines across entire width */}
      <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 h-full opacity-30">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-full border-r border-neutral-800/60 last:border-r-0"
          />
        ))}
      </div>

      {/* Right Side Vertical Glass Panels with Warm Orange Luminescence */}
      <div className="absolute top-0 right-0 bottom-0 w-1/3 sm:w-2/5 max-w-[560px] flex justify-end">
        {/* Intense Core Orange Glow behind glass */}
        <div className="absolute top-1/4 -right-16 w-80 sm:w-96 h-[500px] bg-gradient-to-l from-[#FF6A00] via-[#FF8A22]/70 to-transparent opacity-60 rounded-full blur-[110px]" />
        <div className="absolute top-1/2 right-0 w-64 h-[350px] bg-[#FF4500]/50 rounded-full blur-[90px]" />

        {/* Layered Glass Strips with subtle edge highlights */}
        <div className="relative h-full flex w-full">
          {/* Panel 1 */}
          <div className="flex-1 h-full border-l border-white/5 bg-gradient-to-r from-transparent to-[#FF6A00]/5 backdrop-blur-[1px]" />
          {/* Panel 2 */}
          <div className="flex-1 h-full border-l border-white/5 bg-gradient-to-r from-[#FF6A00]/5 to-[#FF8A22]/10 backdrop-blur-[2px]" />
          {/* Panel 3 */}
          <div className="flex-1 h-full border-l border-white/10 bg-gradient-to-r from-[#FF8A22]/10 to-[#FFA347]/15 backdrop-blur-[3px] shadow-[inset_1px_0_0_rgba(255,255,255,0.06)]" />
          {/* Panel 4 (Far Right - Brightest) */}
          <div className="w-20 sm:w-28 h-full border-l border-orange-400/20 bg-gradient-to-l from-[#FF6A00]/25 via-[#FF8A22]/20 to-transparent backdrop-blur-[4px] shadow-[inset_1px_0_0_rgba(255,255,255,0.12)]" />
        </div>
      </div>
    </div>
  );
};
