import React from 'react';
import { VerticalGlassPanels } from './VerticalGlassPanels';
import { OrangeEnergyWaves } from './OrangeEnergyWaves';

/**
 * HeroBackground
 * Combines deep black base (#030303), ambient orange glows,
 * vertical translucent glass panels, and flowing energy wave SVGs.
 */
export const HeroBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none bg-[#030303]">
      {/* 1. Deep Core Ambient Radial Glows */}
      {/* Right Edge Intense Glow */}
      <div className="absolute top-1/4 -right-10 w-[550px] sm:w-[750px] h-[650px] bg-gradient-to-l from-[#FF6A00]/30 via-[#FF8A22]/20 to-transparent rounded-full blur-[140px]" />
      
      {/* Center-Right Warm Fill */}
      <div className="absolute top-1/3 right-1/4 w-[450px] h-[450px] bg-[#FF5500]/15 rounded-full blur-[120px]" />

      {/* Bottom Center Subtle Glow for Wave Highlighting */}
      <div className="absolute -bottom-10 left-1/3 w-[600px] h-[300px] bg-[#FF7A00]/20 rounded-full blur-[130px]" />

      {/* 2. Vertical Glass Panels & Grid Lines */}
      <VerticalGlassPanels />

      {/* 3. Flowing Orange Energy Waves */}
      <OrangeEnergyWaves />

      {/* 4. Subtle Floating Orange Cyber Particle Spark Accents */}
      <div className="absolute top-1/2 left-[12%] w-2 h-2 rounded-[2px] bg-[#FF8A22] shadow-[0_0_12px_#FF8A22] opacity-80 animate-ping" style={{ animationDuration: '6s' }} />
      <div className="absolute top-[60%] left-[18%] w-2.5 h-2.5 rounded-[2px] bg-[#FFA726] shadow-[0_0_15px_#FFA726] opacity-90" />
      <div className="absolute top-[35%] right-[22%] w-1.5 h-1.5 rounded-[1px] bg-[#FF7A00] opacity-60" />
      <div className="absolute bottom-[28%] right-[10%] w-2 h-2 rounded-[2px] bg-[#FFA726] shadow-[0_0_10px_#FFA726] opacity-85" />
    </div>
  );
};
