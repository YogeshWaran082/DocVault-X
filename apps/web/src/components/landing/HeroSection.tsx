import React, { useState } from 'react';
import {
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  HardDrive,
  Menu,
  RotateCw,
  Maximize2
} from 'lucide-react';
import { HeroBackground } from './HeroBackground';
import { HeroContent } from './HeroContent';

interface HeroSectionProps {
  onExploreFeatures: () => void;
  onTryApp: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreFeatures,
  onTryApp,
}) => {
  const [mockZoom, setMockZoom] = useState<number>(187);
  const [mockPage, setMockPage] = useState<number>(1);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  return (
    <section className="hero-section relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-[#030303]">
      {/* 1. Cyber-Security Hero Background (Vertical Glass Panels + Orange Waves + Ambient Glows) */}
      <HeroBackground />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20">
        {/* 2. Centered Hero Content (Eyebrow, Heading, Subtitle, CTAs, Highlights) */}
        <HeroContent
          onExploreFeatures={onExploreFeatures}
          onTryApp={onTryApp}
        />

        {/* 3. Floating PDF Viewer Mockup (Positioned gracefully below waves, overlapping lower hero) */}
        <div className="mt-12 sm:mt-16 relative max-w-5xl mx-auto">
          {/* Subtle Outer Orange Glow Halo */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#FF6A00]/25 via-[#FFA040]/20 to-[#FF4500]/25 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

          {/* Main Viewer Shell Container */}
          <div className="relative rounded-2xl bg-[#0e0e11] border border-neutral-800 shadow-[0_20px_70px_rgba(0,0,0,0.8)] overflow-hidden text-[#f5f5f7]">
            {/* Top Toolbar with macOS Traffic Light Window Controls */}
            <div className="h-12 px-4 bg-[#141418] border-b border-neutral-800 flex items-center justify-between gap-3 select-none text-xs">
              {/* Left Group: Traffic Lights + Menu Toggle + Title */}
              <div className="flex items-center gap-3 min-w-0">
                {/* macOS Window Controls */}
                <div className="flex items-center gap-1.5 pr-2 border-r border-neutral-800">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                </div>

                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-1.5 rounded-md border transition ${
                    sidebarOpen
                      ? 'bg-[#222228] border-neutral-700 text-white'
                      : 'bg-transparent border-transparent text-neutral-400 hover:text-white hover:bg-white/5'
                  }`}
                  title="Toggle Thumbnails Panel"
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono font-medium text-neutral-200 text-xs truncate">
                    Sales_Invoice_9000000001.pdf
                  </span>
                </div>
              </div>

              {/* Center Controls: Pagination & Zoom */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Pagination: < 1 / 1 > */}
                <div className="flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded-md border border-neutral-800">
                  <button
                    onClick={() => setMockPage((p) => Math.max(1, p - 1))}
                    disabled={mockPage <= 1}
                    className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-30"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 font-mono font-semibold text-white text-xs">
                    {mockPage}
                  </span>
                  <span className="text-neutral-600 text-xs">/</span>
                  <span className="px-1 font-mono text-neutral-400 text-xs">1</span>
                  <button
                    onClick={() => setMockPage((p) => Math.min(1, p + 1))}
                    disabled={mockPage >= 1}
                    className="p-0.5 text-neutral-400 hover:text-white disabled:opacity-30"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Zoom: - 187% + */}
                <div className="hidden xs:flex items-center gap-1 bg-[#09090b] px-2 py-1 rounded-md border border-neutral-800">
                  <button
                    onClick={() => setMockZoom((z) => Math.max(75, z - 15))}
                    className="p-0.5 text-neutral-400 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 font-mono font-medium text-white text-xs min-w-[44px] text-center">
                    {mockZoom}%
                  </span>
                  <button
                    onClick={() => setMockZoom((z) => Math.min(220, z + 15))}
                    className="p-0.5 text-neutral-400 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Auxiliary Icons: Fullscreen, Rotate */}
                <div className="hidden md:flex items-center gap-1 text-neutral-400 pl-1 border-l border-neutral-800">
                  <button
                    onClick={() => setMockZoom(187)}
                    className="p-1 hover:text-white hover:bg-white/5 rounded"
                    title="Reset Zoom"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setMockZoom(100)}
                    className="p-1 hover:text-white hover:bg-white/5 rounded"
                    title="Fit to Screen"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Status Controls & Protected Session Badge */}
              <div className="flex items-center gap-2">
                {/* Protected Shield Pill */}
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 font-mono text-[11px] font-medium">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Protected</span>
                </div>

                <button
                  onClick={onTryApp}
                  className="flex items-center gap-1.5 px-3.5 py-1 bg-white hover:bg-neutral-100 text-black font-semibold rounded-full transition text-xs shadow-sm active:scale-95"
                >
                  <span>Try the App</span>
                </button>

              </div>
            </div>

            {/* Viewer Workspace Layout: Left Sidebar + Main Document Viewport */}
            <div className="flex h-[clamp(340px,42vw,450px)] bg-[#08080a] relative overflow-hidden">
              {/* Left Sidebar: Thumbnails (1) */}
              {sidebarOpen && (
                <div className="w-48 sm:w-56 bg-[#101014] border-r border-neutral-800 p-3 shrink-0 flex flex-col justify-start space-y-3 animate-in slide-in-from-left duration-200">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-neutral-400 pb-2 border-b border-neutral-800">
                    <FileText className="w-3.5 h-3.5 text-[#FF7A00]" />
                    <span>Thumbnails (1)</span>
                  </div>

                  {/* Thumbnail Card with Active Orange Outline */}
                  <div className="flex flex-col items-center">
                    <div className="w-full p-1 rounded-lg border-2 border-[#FF6A00] bg-white shadow-md relative group cursor-pointer overflow-hidden">
                      <div className="w-full aspect-[1/1.4] bg-white overflow-hidden select-none">
                        <img
                          src="/stripesshop-sales-invoice.jpg"
                          alt="Invoice Preview"
                          className="w-full h-full object-cover object-top select-none pointer-events-none"
                        />
                      </div>
                    </div>
                    {/* Active Page Badge */}
                    <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#FF6A00] text-white font-mono font-semibold text-[10px]">
                      1
                    </span>
                  </div>
                </div>
              )}

              {/* Main Document Viewport */}
              <div className="flex-1 flex items-start justify-center overflow-hidden bg-[#050507] relative">
                {/* Authentic Document Sheet (StripesShop Sales Invoice) */}
                <div
                  className="relative w-full max-w-2xl bg-white text-slate-900 rounded-sm shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] transition-transform duration-300 select-none overflow-hidden border border-neutral-200/60"
                  style={{ transform: `scale(${mockZoom / 100})`, transformOrigin: 'top center' }}
                >
                  {/* Rendered Invoice Image */}
                  <img
                    src="/stripesshop-sales-invoice.jpg"
                    alt="Sales Invoice #9000000001"
                    className="w-full h-auto block select-none pointer-events-none"
                  />
                </div>

                {/* Floating Security Badge 1: Top Right */}
                <div className="absolute top-4 right-4 hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#141418]/90 backdrop-blur-xl border border-white/10 shadow-2xl text-xs text-white">
                  <ShieldCheck className="w-4 h-4 text-[#FF7A00]" />
                  <div>
                    <div className="font-medium text-[11px] text-white">Privacy Shield Armed</div>
                    <div className="text-[10px] text-neutral-400">Defocus screen blur active</div>
                  </div>
                </div>

                {/* Floating Security Badge 2: Bottom Left */}
                <div className="absolute bottom-4 left-4 hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#141418]/90 backdrop-blur-xl border border-white/10 shadow-2xl text-xs text-white">
                  <HardDrive className="w-4 h-4 text-[#FF7A00]" />
                  <div>
                    <div className="font-medium text-[11px] text-white">Zero Disk Footprint</div>
                    <div className="text-[10px] text-neutral-400">RAM-only buffer execution</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
