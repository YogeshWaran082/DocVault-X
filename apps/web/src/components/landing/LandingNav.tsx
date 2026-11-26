import React, { useState, useEffect } from 'react';
import { ShieldCheck, Menu, X } from 'lucide-react';

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
    { label: 'FAQ', href: '#faq' },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#030303]/90 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/80'
          : 'bg-[#030303]/50 backdrop-blur-md border-b border-white/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo with Orange Shield Icon */}
        <a
          href="#"
          className="flex items-center gap-3 group focus:outline-none rounded-lg p-1"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF7A00]/20 to-[#FF4500]/10 border border-[#FF6A00]/50 flex items-center justify-center text-white shadow-[0_0_15px_rgba(255,106,0,0.25)] group-hover:border-[#FF8A22] transition-all duration-300">
            <ShieldCheck className="w-5 h-5 text-[#FF7A00] transition-transform group-hover:scale-105 stroke-[2.2]" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white group-hover:text-white transition-colors">
                DocVault X
              </span>
              <span className="text-[10px] font-bold tracking-wide px-2.5 py-0.5 rounded-full bg-[#FF6A00] text-white shadow-sm">
                PDF Viewer
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 font-normal tracking-tight hidden sm:block">
              Privacy-Focused Universal Document Platform
            </span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.label}
              onClick={() => handleLinkClick(link.href)}
              className="px-3.5 py-1.5 text-xs font-normal text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-colors focus:outline-none"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Mobile Hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-xl bg-[#141418] text-neutral-300 hover:text-white border border-neutral-800 focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#030303]/98 backdrop-blur-2xl border-b border-white/10 px-4 pt-3 pb-6 space-y-3 shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleLinkClick(link.href)}
                className="text-left px-4 py-2 rounded-xl text-xs font-normal text-neutral-400 hover:bg-white/5 hover:text-white transition-colors"
              >
                {link.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};
