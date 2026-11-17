import React from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface HeroContentProps {
  onExploreFeatures: () => void;
  onTryApp: () => void;
}

export const HeroContent: React.FC<HeroContentProps> = ({
  onExploreFeatures,
  onTryApp,
}) => {
  return (
    <div className="hero-content text-center max-w-4xl mx-auto space-y-6 pt-4">
      {/* 1. Eyebrow Badge: Orange SECURE VIEWING + Universal Document Platform */}
      <div className="inline-flex items-center gap-2 p-1 pl-1 pr-3 rounded-full bg-[#121214]/90 border border-neutral-800/80 backdrop-blur-md shadow-lg shadow-black/40 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF4500] text-white font-bold text-[10px] tracking-wider uppercase shadow-sm">
          SECURE VIEWING
        </span>
        <span className="text-neutral-300 text-xs font-medium tracking-tight">
          Universal Document Platform
        </span>
      </div>

      {/* 2. Main Hero Heading */}
      <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08] select-none">
        Your Documents.
        <span className="block mt-1">
          Your{' '}
          <span className="bg-gradient-to-r from-[#FFA040] via-[#FF6A00] to-[#FF3D00] bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(255,106,0,0.45)]">
            Control.
          </span>
        </span>
      </h1>

      {/* 3. Subtitle Description */}
      <p className="text-base sm:text-lg text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed">
        Open PDFs and protected documents with privacy-focused viewing, secure access controls, and flexible document management.
      </p>

      {/* 4. Action CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
        <button
          onClick={onTryApp}
          className="hero-primary-cta w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-black bg-white hover:bg-neutral-100 shadow-[0_4px_24px_rgba(255,255,255,0.18)] transition-all duration-200 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF7A00]"
        >
          <span>Try the App</span>
          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
        </button>

        <button
          onClick={onExploreFeatures}
          className="hero-secondary-cta w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-white bg-[#121215]/90 hover:bg-[#1a1a1f] border border-neutral-700/80 hover:border-neutral-500 shadow-md transition-all duration-200 active:scale-95 focus:outline-none"
        >
          <span>Explore Features</span>
          <ArrowRight className="w-3.5 h-3.5 text-neutral-300" />
        </button>
      </div>

      {/* 5. Feature Highlights Row */}
      <div className="pt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs text-neutral-300 font-normal">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#FF7A00]" />
          <span>Zero-Knowledge Decryption</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#FF7A00]" />
          <span>Dynamic Forensic Watermarks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#FF7A00]" />
          <span>Anti-Print CSS Shield</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#FF7A00]" />
          <span>Universal PDF Compatibility</span>
        </div>
      </div>
    </div>
  );
};
