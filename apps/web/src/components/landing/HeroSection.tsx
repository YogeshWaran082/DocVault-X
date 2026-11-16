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

// Official OpenAI Vector Logo for Receipt Header
const OpenAILogo = () => (
  <svg className="w-12 h-12 text-black fill-current" viewBox="0 0 24 24">
    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6669zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
  </svg>
);

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreFeatures,
}) => {
  const [mockZoom, setMockZoom] = useState<number>(187);
  const [mockPage, setMockPage] = useState<number>(1);
  const [mockWatermark, setMockWatermark] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  return (
    <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[480px] bg-[#2DD4BF]/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[450px] h-[320px] bg-sky-600/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Eyebrow & Headline Block */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#17253A] border border-[#2DD4BF]/30 shadow-lg shadow-[#2DD4BF]/5 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-[#2DD4BF]">
              SECURE DOCUMENT VIEWING PLATFORM
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] sm:leading-[1.1]">
            Your Documents.{' '}
            <span className="block mt-1 bg-gradient-to-r from-white via-slate-100 to-[#2DD4BF] bg-clip-text text-transparent">
              Your Control.
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Open PDFs and protected documents with privacy-focused viewing, secure access controls, and flexible document management.
          </p>

          {/* CTA Buttons - Download App is the primary action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                const el = document.getElementById('downloads');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="w-full sm:w-auto relative group overflow-hidden flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-bold text-[#0A1222] bg-[#2DD4BF] hover:bg-[#14B8A6] shadow-xl shadow-[#2DD4BF]/25 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]"
            >
              <Download className="w-5 h-5 text-[#0A1222]" />
              <span>Download App</span>
              <ArrowRight className="w-4 h-4 text-[#0A1222] transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
            </button>

            <button
              onClick={onExploreFeatures}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-4 rounded-xl text-base font-semibold text-slate-200 bg-[#17253A]/90 hover:bg-[#17253A] border border-slate-700/80 hover:border-[#2DD4BF]/40 transition-all duration-200 active:scale-95"
            >
              <span>Explore Features</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Highlights Mini Row */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
              <span>Zero-Knowledge Decryption</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
              <span>Dynamic Forensic Watermarks</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
              <span>Anti-Print CSS Shield</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
              <span>Universal PDF Compatibility</span>
            </div>
          </div>
        </div>

        {/* ULTRA-REALISTIC CORPORATE PDF VIEWER MOCKUP (StripesShop Sales Invoice) */}
        <div className="mt-14 relative max-w-6xl mx-auto">
          {/* Outer Glow Halo */}
          <div className="absolute -inset-1 bg-gradient-to-r from-[#2DD4BF]/25 via-sky-500/20 to-teal-500/25 rounded-3xl blur-2xl opacity-70" />

          {/* Main Viewer Shell Container */}
          <div className="relative rounded-2xl bg-[#1E232B] border border-slate-700/90 shadow-2xl overflow-hidden text-slate-200">
            {/* Top Toolbar matching Image 2: StripesShop_Sales_Invoice_9000000001.pdf */}
            <div className="h-13 px-4 py-2 bg-[#262B34] border-b border-slate-700/80 flex items-center justify-between gap-2 select-none text-xs">
              {/* Left Group: Menu toggle & File Title */}
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className={`p-1.5 rounded-lg border transition ${
                    sidebarOpen
                      ? 'bg-slate-700 border-slate-600 text-white'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                  title="Toggle Thumbnails Panel"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono font-medium text-slate-200 text-xs sm:text-sm truncate">
                    Receipt-2819-7625-3984.pdf
                  </span>
                </div>
              </div>

              {/* Center Controls: Pagination & Zoom */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Pagination: < 1 / 1 > */}
                <div className="flex items-center gap-1 bg-[#1A1F26] px-2 py-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setMockPage((p) => Math.max(1, p - 1))}
                    disabled={mockPage <= 1}
                    className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1 font-mono font-bold text-white text-xs">
                    {mockPage}
                  </span>
                  <span className="text-slate-500 text-xs">/</span>
                  <span className="px-1 font-mono text-slate-400 text-xs">1</span>
                  <button
                    onClick={() => setMockPage((p) => Math.min(1, p + 1))}
                    disabled={mockPage >= 1}
                    className="p-0.5 text-slate-400 hover:text-white disabled:opacity-30"
                    title="Next Page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Zoom: - 187% + */}
                <div className="hidden xs:flex items-center gap-1 bg-[#1A1F26] px-2 py-1 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setMockZoom((z) => Math.max(75, z - 15))}
                    className="p-0.5 text-slate-400 hover:text-white"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 font-mono font-medium text-white text-xs min-w-[46px] text-center">
                    {mockZoom}%
                  </span>
                  <button
                    onClick={() => setMockZoom((z) => Math.min(220, z + 15))}
                    className="p-0.5 text-slate-400 hover:text-white"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Auxiliary Icons: Fullscreen, Rotate */}
                <div className="hidden md:flex items-center gap-1 text-slate-400 pl-1 border-l border-slate-700">
                  <button
                    onClick={() => setMockZoom(187)}
                    className="p-1 hover:text-white hover:bg-slate-700/50 rounded"
                    title="Reset to 187%"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1 hover:text-white hover:bg-slate-700/50 rounded"
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
                  className={`hidden sm:inline-flex items-center px-2 py-1 rounded text-[11px] font-mono font-medium border transition ${
                    mockWatermark
                      ? 'bg-[#2DD4BF]/20 text-[#2DD4BF] border-[#2DD4BF]/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle Forensic Watermark"
                >
                  Watermark: {mockWatermark ? 'ON' : 'OFF'}
                </button>

                {/* Authentic Green 'Protected' Badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-400 text-[11px] font-medium font-sans shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold tracking-wide">Protected</span>
                </div>

                {/* Download App Toolbar CTA */}
                <button
                  onClick={() => {
                    const el = document.getElementById('downloads');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-[#2DD4BF] hover:bg-[#14B8A6] text-[#0A1222] font-bold rounded-lg transition text-xs shadow-md shadow-[#2DD4BF]/20 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-[#0A1222]" />
                  <span>Download App</span>
                </button>
              </div>
            </div>

            {/* Viewer Workspace Layout: Left Sidebar + Main Document Viewport */}
            <div className="flex min-h-[580px] sm:min-h-[720px] bg-[#2E3440] relative overflow-hidden">
              {/* Left Sidebar: Thumbnails (1) */}
              {sidebarOpen && (
                <div className="w-48 sm:w-56 bg-[#21252D] border-r border-slate-700/80 p-3 shrink-0 flex flex-col justify-start space-y-3 animate-in slide-in-from-left duration-200">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-semibold text-slate-300 pb-2 border-b border-slate-700">
                    <FileText className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    <span>Thumbnails (1)</span>
                  </div>

                  {/* Thumbnail Card with Active Blue Outline */}
                  <div className="flex flex-col items-center">
                    <div className="w-full p-1.5 rounded-lg border-2 border-blue-500 bg-white shadow-md relative group cursor-pointer overflow-hidden">
                      {/* Mini Preview of OpenAI Receipt */}
                      <div className="w-full aspect-[1/1.4] bg-white overflow-hidden p-2 text-[5px] text-slate-800 leading-tight select-none">
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="font-extrabold text-[8px] text-black">Receipt</span>
                          <div className="w-3 h-3 bg-black rounded-full flex items-center justify-center text-[5px] text-white">❖</div>
                        </div>
                        <div className="space-y-0.5 text-[4px] text-slate-500">
                          <div>AADNBWQB-0001</div>
                          <div>2819-7625-3984</div>
                        </div>
                        <div className="mt-2 text-[6px] font-bold text-black">₹0.00 paid</div>
                        <div className="space-y-0.5 mt-2">
                          <div className="w-full h-0.5 bg-slate-200" />
                          <div className="w-5/6 h-0.5 bg-slate-200" />
                          <div className="w-4/6 h-0.5 bg-slate-200" />
                        </div>
                      </div>
                    </div>
                    {/* Active Page Badge */}
                    <span className="mt-1 px-2.5 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-[10px]">
                      1
                    </span>
                  </div>
                </div>
              )}

              {/* Main Document Viewport (Deep Neutral Canvas) */}
              <div className="flex-1 p-4 sm:p-8 flex items-center justify-center overflow-auto bg-[#3B4252]/40 relative">
                {/* Authentic Document Sheet (OpenAI Receipt - Receipt-2819-7625-3984.pdf) */}
                <div
                  className="relative w-full max-w-2xl bg-white text-slate-900 rounded-sm shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] p-6 sm:p-12 transition-transform duration-300 select-none overflow-hidden border border-slate-200/60"
                  style={{ transform: `scale(${mockZoom / 100})`, transformOrigin: 'top center' }}
                >
                  {/* Dynamic Forensic Watermark Overlay (Image 3: designer2.rthinfotech@gmail.com • IP: 157.49.201.12) */}
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

                  {/* Document Header: Receipt title & OpenAI swirl Logo */}
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight font-sans">
                        Receipt
                      </h2>
                      <div className="mt-4 space-y-1.5 text-xs text-slate-900">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-900 w-32">Invoice number</span>
                          <span className="font-medium text-slate-800">AADNBWQB-0001</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-900 w-32">Receipt number</span>
                          <span className="font-medium text-slate-800">2819-7625-3984</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-slate-900 w-32">Date paid</span>
                          <span className="text-slate-800">October 23, 2026</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-1">
                      <OpenAILogo />
                    </div>
                  </div>

                  {/* Two-Column Addresses: OpenAI OpCo, LLC & Bill to Danel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 text-xs text-slate-800">
                    {/* OpenAI Address */}
                    <div className="space-y-1 leading-relaxed">
                      <div className="font-bold text-black text-sm">OpenAI OpCo, LLC</div>
                      <div>1455 3rd Street</div>
                      <div>San Francisco, California 94158</div>
                      <div>United States</div>
                      <div className="text-slate-700">ar@openai.com</div>
                      <div className="text-[11px] text-slate-600 pt-1 font-mono">IN GST 9925USA29095OS3</div>
                    </div>

                    {/* Bill To */}
                    <div className="space-y-1 leading-relaxed">
                      <div className="font-bold text-black text-sm">Bill to</div>
                      <div className="font-medium text-black">Danel</div>
                      <div>49a, 3rd St</div>
                      <div>Elumalai Nagar, Annai Theresa Nagar, Madipakkam</div>
                      <div>Chennai 600091</div>
                      <div>Tamil Nadu</div>
                      <div>India</div>
                      <div className="text-slate-700 font-medium">designer2.rthinfotech@gmail.com</div>
                    </div>
                  </div>

                  {/* Total Paid Headline */}
                  <div className="my-8 pt-4 pb-2">
                    <div className="text-2xl sm:text-3xl font-extrabold text-black font-sans">
                      ₹0.00 paid on October 23, 2026
                    </div>
                  </div>

                  {/* Subscription Line Items Table */}
                  <div className="my-6">
                    {/* Table Header with thin bottom border */}
                    <div className="pb-2 border-b border-slate-300 flex justify-between items-center text-xs text-slate-600 font-medium">
                      <span className="w-1/2">Description</span>
                      <span className="w-1/6 text-center">Qty</span>
                      <span className="w-1/6 text-right">Unit price</span>
                      <span className="w-1/6 text-right">Amount</span>
                    </div>

                    {/* Table Row */}
                    <div className="py-3 flex justify-between items-start text-xs text-slate-900 border-b border-slate-100">
                      <div className="w-1/2 pr-2">
                        <div className="font-medium text-black">ChatGPT Plus Subscription (per seat)</div>
                        <div className="text-[11px] text-slate-500">Oct 23–Nov 23, 2026</div>
                      </div>
                      <div className="w-1/6 text-center text-slate-800">1</div>
                      <div className="w-1/6 text-right text-slate-800">₹1,694.07</div>
                      <div className="w-1/6 text-right font-medium text-black">₹1,694.07</div>
                    </div>

                    {/* Subtotals & Free Trial Discount */}
                    <div className="mt-4 flex flex-col items-end text-xs space-y-1.5">
                      <div className="flex justify-between w-64 text-slate-700 py-0.5 border-b border-slate-100">
                        <span>Subtotal</span>
                        <span className="font-medium text-black">₹1,694.07</span>
                      </div>
                      <div className="flex justify-between w-full max-w-md text-slate-700 py-0.5 border-b border-slate-100">
                        <span className="text-right flex-1 pr-3">ChatGPT Plus - 1 Month Free Trial (100% off)</span>
                        <span className="font-medium text-black">-₹1,694.07</span>
                      </div>
                      <div className="flex justify-between w-64 text-slate-950 font-bold text-sm pt-1">
                        <span>Total</span>
                        <span>₹0.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment History Section */}
                  <div className="mt-12 pt-6">
                    <h3 className="text-lg font-bold text-black mb-4">
                      Payment history
                    </h3>
                    <div className="pb-2 border-b border-slate-900 flex justify-between items-center text-xs text-slate-700 font-medium">
                      <span className="w-1/4">Payment method</span>
                      <span className="w-1/4 text-center">Date</span>
                      <span className="w-1/4 text-center">Amount paid</span>
                      <span className="w-1/4 text-right">Receipt number</span>
                    </div>
                  </div>

                  {/* Bottom Page Number */}
                  <div className="mt-28 flex justify-end text-[11px] text-slate-500">
                    <span>Page 1 of 1</span>
                  </div>
                </div>

                {/* Floating Security Badge 1: Top Right */}
                <div className="absolute top-4 right-4 hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#17253A]/90 backdrop-blur-md border border-[#2DD4BF]/30 shadow-xl text-xs text-white">
                  <ShieldCheck className="w-4 h-4 text-[#2DD4BF]" />
                  <div>
                    <div className="font-semibold text-[11px]">Privacy Shield Armed</div>
                    <div className="text-[10px] text-slate-400">Defocus screen blur active</div>
                  </div>
                </div>

                {/* Floating Security Badge 2: Bottom Left */}
                <div className="absolute bottom-4 left-4 hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-[#17253A]/90 backdrop-blur-md border border-slate-700/80 shadow-xl text-xs text-white">
                  <HardDrive className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="font-semibold text-[11px]">Zero Disk Footprint</div>
                    <div className="text-[10px] text-slate-400">RAM-only buffer execution</div>
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
