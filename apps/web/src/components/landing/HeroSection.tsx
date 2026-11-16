import React, { useState } from 'react';
import {
  ShieldCheck,
  Download,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  HardDrive,
  Menu,
  RotateCw,
  Maximize2
} from 'lucide-react';

interface HeroSectionProps {
  onExploreFeatures: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreFeatures,
}) => {
  const [mockZoom, setMockZoom] = useState<number>(187);
  const [mockPage, setMockPage] = useState<number>(1);
  const [mockWatermark, setMockWatermark] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Ambient Glows - Apple Style Subtle Luminescence */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-[#0071e3]/12 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[450px] h-[300px] bg-[#2997ff]/8 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow & Headline Block */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1d1d1f] border border-[#424245] text-[#2997ff] text-xs font-medium tracking-wide shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2997ff] animate-pulse" />
            <span className="uppercase text-[11px] font-semibold">
              SECURE DOCUMENT VIEWING PLATFORM
            </span>
          </div>

          {/* Main Heading - Apple Typographic Hierarchy */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-[#f5f5f7] leading-[1.08]">
            Your Documents.{' '}
            <span className="block mt-1 bg-gradient-to-r from-white via-[#f5f5f7] to-[#86868b] bg-clip-text text-transparent">
              Your Control.
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-base sm:text-xl text-[#86868b] max-w-2xl mx-auto font-normal leading-relaxed">
            Open PDFs and protected documents with privacy-focused viewing, secure access controls, and flexible document management.
          </p>

          {/* CTA Buttons - Apple Pill Style */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            <button
              onClick={() => {
                const el = document.getElementById('downloads');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] shadow-md transition-all duration-200 active:scale-95 focus:outline-none"
            >
              <Download className="w-4 h-4 text-white" />
              <span>Download App</span>
              <ArrowRight className="w-3.5 h-3.5 text-white/80" />
            </button>

            <button
              onClick={onExploreFeatures}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-[#2997ff] bg-[#1d1d1f] hover:bg-[#252528] border border-[#424245] transition-all duration-200 active:scale-95"
            >
              <span>Explore Features</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#2997ff]" />
            </button>
          </div>

          {/* Highlights Mini Row */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-[#86868b] font-normal">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2997ff]" />
              <span>Zero-Knowledge Decryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2997ff]" />
              <span>Dynamic Forensic Watermarks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2997ff]" />
              <span>Anti-Print CSS Shield</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2997ff]" />
              <span>Universal PDF Compatibility</span>
            </div>
          </div>
        </div>

        {/* ULTRA-REALISTIC CORPORATE PDF VIEWER MOCKUP - Mac Window Design */}
        <div className="mt-14 relative max-w-5xl mx-auto">
          {/* Subtle Outer Glow Halo */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#0071e3]/20 via-[#2997ff]/15 to-[#0071e3]/20 rounded-3xl blur-2xl opacity-60 pointer-events-none" />

          {/* Main Viewer Shell Container */}
          <div className="relative rounded-2xl bg-[#161617] border border-[#333336] shadow-2xl overflow-hidden text-[#f5f5f7]">
            {/* Top Toolbar with macOS Traffic Light Window Controls */}
            <div className="h-12 px-4 bg-[#1d1d1f] border-b border-[#333336] flex items-center justify-between gap-3 select-none text-xs">
              {/* Left Group: Traffic Lights + Menu Toggle + Title */}
              <div className="flex items-center gap-3 min-w-0">
                {/* macOS Window Controls */}
                <div className="flex items-center gap-1.5 pr-2 border-r border-[#333336]">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                </div>

                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-1.5 rounded-md border transition ${
                    sidebarOpen
                      ? 'bg-[#2d2d2f] border-[#424245] text-white'
                      : 'bg-transparent border-transparent text-[#86868b] hover:text-white hover:bg-white/5'
                  }`}
                  title="Toggle Thumbnails Panel"
                >
                  <Menu className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono font-medium text-[#f5f5f7] text-xs truncate">
                    Sales_Invoice_9000000001.pdf
                  </span>
                </div>
              </div>

              {/* Center Controls: Pagination & Zoom */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Pagination: < 1 / 1 > */}
                <div className="flex items-center gap-1 bg-[#161617] px-2 py-1 rounded-md border border-[#333336]">
                  <button
                    onClick={() => setMockPage((p) => Math.max(1, p - 1))}
                    disabled={mockPage <= 1}
                    className="p-0.5 text-[#86868b] hover:text-white disabled:opacity-30"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 font-mono font-semibold text-white text-xs">
                    {mockPage}
                  </span>
                  <span className="text-[#6e6e73] text-xs">/</span>
                  <span className="px-1 font-mono text-[#86868b] text-xs">1</span>
                  <button
                    onClick={() => setMockPage((p) => Math.min(1, p + 1))}
                    disabled={mockPage >= 1}
                    className="p-0.5 text-[#86868b] hover:text-white disabled:opacity-30"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Zoom: - 187% + */}
                <div className="hidden xs:flex items-center gap-1 bg-[#161617] px-2 py-1 rounded-md border border-[#333336]">
                  <button
                    onClick={() => setMockZoom((z) => Math.max(75, z - 15))}
                    className="p-0.5 text-[#86868b] hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 font-mono font-medium text-white text-xs min-w-[44px] text-center">
                    {mockZoom}%
                  </span>
                  <button
                    onClick={() => setMockZoom((z) => Math.min(220, z + 15))}
                    className="p-0.5 text-[#86868b] hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Auxiliary Icons: Fullscreen, Rotate */}
                <div className="hidden md:flex items-center gap-1 text-[#86868b] pl-1 border-l border-[#333336]">
                  <button
                    onClick={() => setMockZoom(187)}
                    className="p-1 hover:text-white hover:bg-white/5 rounded"
                    title="Reset to 187%"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1 hover:text-white hover:bg-white/5 rounded"
                    title="Rotate Clockwise"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Controls: Protected Badge & Actions */}
              <div className="flex items-center gap-2">
                {/* Watermark Toggle */}
                <button
                  onClick={() => setMockWatermark(!mockWatermark)}
                  className={`hidden sm:inline-flex items-center px-2 py-1 rounded-md text-[11px] font-mono font-medium border transition ${
                    mockWatermark
                      ? 'bg-[#0071e3]/20 text-[#2997ff] border-[#0071e3]/40'
                      : 'bg-[#161617] text-[#86868b] border-[#333336]'
                  }`}
                  title="Toggle Forensic Watermark"
                >
                  Watermark: {mockWatermark ? 'ON' : 'OFF'}
                </button>

                {/* Authentic Green 'Protected' Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 text-[11px] font-medium font-sans">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span className="font-medium tracking-wide">Protected</span>
                </div>

                {/* Download App Toolbar CTA */}
                <button
                  onClick={() => {
                    const el = document.getElementById('downloads');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-[#0071e3] hover:bg-[#0077ed] text-white font-medium rounded-full transition text-xs shadow-sm active:scale-95"
                >
                  <Download className="w-3 h-3 text-white" />
                  <span>Download App</span>
                </button>
              </div>
            </div>

            {/* Viewer Workspace Layout: Left Sidebar + Main Document Viewport */}
            <div className="flex min-h-[580px] sm:min-h-[720px] bg-[#0d0d0e] relative overflow-hidden">
              {/* Left Sidebar: Thumbnails (1) */}
              {sidebarOpen && (
                <div className="w-48 sm:w-56 bg-[#161617] border-r border-[#333336] p-3 shrink-0 flex flex-col justify-start space-y-3 animate-in slide-in-from-left duration-200">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-medium text-[#a1a1a6] pb-2 border-b border-[#333336]">
                    <FileText className="w-3.5 h-3.5 text-[#2997ff]" />
                    <span>Thumbnails (1)</span>
                  </div>

                  {/* Thumbnail Card with Active Blue Outline */}
                  <div className="flex flex-col items-center">
                    <div className="w-full p-1 rounded-lg border-2 border-[#0071e3] bg-white shadow-md relative group cursor-pointer overflow-hidden">
                      <div className="w-full aspect-[1/1.4] bg-white overflow-hidden select-none">
                        <img
                          src="/stripesshop-sales-invoice.jpg"
                          alt="Invoice Preview"
                          className="w-full h-full object-cover object-top select-none pointer-events-none"
                        />
                      </div>
                    </div>
                    {/* Active Page Badge */}
                    <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#0071e3] text-white font-mono font-semibold text-[10px]">
                      1
                    </span>
                  </div>
                </div>
              )}

              {/* Main Document Viewport */}
              <div className="flex-1 p-4 sm:p-8 flex items-center justify-center overflow-auto bg-[#0a0a0c] relative">
                {/* Authentic Document Sheet (StripesShop Sales Invoice) */}
                <div
                  className="relative w-full max-w-2xl bg-white text-slate-900 rounded-sm shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] transition-transform duration-300 select-none overflow-hidden border border-slate-200/60"
                  style={{ transform: `scale(${mockZoom / 100})`, transformOrigin: 'top center' }}
                >
                  {/* Dynamic Forensic Watermark Overlay */}
                  {mockWatermark && (
                    <div className="absolute inset-0 pointer-events-none z-30 flex flex-col justify-around opacity-[0.16] select-none transform -rotate-[22deg] scale-125">
                      {[1, 2, 3, 4, 5, 6].map((row) => (
                        <div
                          key={row}
                          className="text-center font-mono font-bold tracking-widest text-slate-900 text-xs sm:text-sm whitespace-nowrap"
                        >
                          CONFIDENTIAL • designer2.rthinfotech@gmail.com • IP: 157.49.201.12 • DO NOT DISTRIBUTE
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Rendered Invoice Image */}
                  <img
                    src="/stripesshop-sales-invoice.jpg"
                    alt="Sales Invoice #9000000001"
                    className="w-full h-auto block select-none pointer-events-none"
                  />
                </div>

                {/* Floating Security Badge 1: Top Right - Apple Frosted Style */}
                <div className="absolute top-4 right-4 hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#1d1d1f]/90 backdrop-blur-xl border border-white/10 shadow-2xl text-xs text-white">
                  <ShieldCheck className="w-4 h-4 text-[#2997ff]" />
                  <div>
                    <div className="font-medium text-[11px] text-[#f5f5f7]">Privacy Shield Armed</div>
                    <div className="text-[10px] text-[#86868b]">Defocus screen blur active</div>
                  </div>
                </div>

                {/* Floating Security Badge 2: Bottom Left - Apple Frosted Style */}
                <div className="absolute bottom-4 left-4 hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-[#1d1d1f]/90 backdrop-blur-xl border border-white/10 shadow-2xl text-xs text-white">
                  <HardDrive className="w-4 h-4 text-[#2997ff]" />
                  <div>
                    <div className="font-medium text-[11px] text-[#f5f5f7]">Zero Disk Footprint</div>
                    <div className="text-[10px] text-[#86868b]">RAM-only buffer execution</div>
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
