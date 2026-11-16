import React, { useState, useEffect } from 'react';
import { ShieldCheck, Menu, X, Download } from 'lucide-react';

interface LandingNavProps {
  isAuthenticated?: boolean;
}

export const LandingNav: React.FC<LandingNavProps> = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Supported Files', href: '#formats' },
    { label: 'Security', href: '#security' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Downloads', href: '#downloads' },
    { label: 'FAQ', href: '#faq' },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadClick = () => {
    setMobileMenuOpen(false);
    const element = document.querySelector('#downloads');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0A1222]/90 backdrop-blur-md border-b border-slate-800/80 shadow-xl shadow-black/40'
          : 'bg-[#0A1222]/40 backdrop-blur-sm border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <a
          href="#"
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/50 rounded-lg p-1"
        >
          <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#17253A] to-[#0A1222] border border-[#2DD4BF]/30 flex items-center justify-center text-[#2DD4BF] shadow-lg shadow-[#2DD4BF]/10 group-hover:border-[#2DD4BF]/60 transition-all duration-300">
            <ShieldCheck className="w-6 h-6 transition-transform group-hover:scale-110" />
            <div className="absolute inset-0 rounded-xl bg-[#2DD4BF]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-[#2DD4BF] transition-colors">
                DocVault <span className="text-[#2DD4BF]">X</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#17253A] text-[#2DD4BF] border border-[#2DD4BF]/30">
                PDF Viewer
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium tracking-wide">
              Zero-Trust Protected Document Platform
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleLinkClick(link.href)}
              className="px-3.5 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#17253A]/70 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/40"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Desktop Action: Download App CTA only */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={handleDownloadClick}
            className="relative group overflow-hidden flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-[#0A1222] bg-[#2DD4BF] hover:bg-[#14B8A6] shadow-lg shadow-[#2DD4BF]/25 transition-all duration-300 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF] focus:ring-offset-2 focus:ring-offset-[#0A1222]"
          >
            <Download className="w-4 h-4 text-[#0A1222] transition-transform group-hover:translate-y-0.5" />
            <span>Download App</span>
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </button>
        </div>

        {/* Mobile Hamburger & Quick Action */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={handleDownloadClick}
            className="sm:hidden flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#0A1222] bg-[#2DD4BF] shadow-md shadow-[#2DD4BF]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download App</span>
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-2.5 rounded-xl bg-[#17253A] text-slate-300 hover:text-white border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-[#2DD4BF]/40"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0A1222]/98 backdrop-blur-xl border-b border-slate-800 px-4 pt-4 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link.href)}
                className="text-left px-4 py-2.5 rounded-xl text-sm font-medium text-slate-200 hover:bg-[#17253A] hover:text-[#2DD4BF] transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={handleDownloadClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-[#0A1222] bg-[#2DD4BF] hover:bg-[#14B8A6] shadow-lg shadow-[#2DD4BF]/20 transition active:scale-98"
            >
              <Download className="w-4 h-4" />
              <span>Download App</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
