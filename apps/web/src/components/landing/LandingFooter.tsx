import React, { useRef } from 'react';
import {
  ShieldCheck,
  ArrowUp
} from 'lucide-react';

interface LandingFooterProps {
  onTriggerAdmin: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onTriggerAdmin,
}) => {
  const clickCountRef = useRef<number>(0);
  const timerRef = useRef<any>(null);

  // Secret Admin Access: 3 continuous clicks on Facebook logo opens Admin login directly
  const handleFacebookClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    clickCountRef.current += 1;

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      // Direct silent transition to Admin Auth
      onTriggerAdmin();
    } else {
      // Reset after 1.5s if not completed
      timerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1500);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#070D18] border-t border-slate-800 text-slate-400 text-xs relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1 & 2: Brand & Mission */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#17253A] border border-[#2DD4BF]/30 flex items-center justify-center text-[#2DD4BF]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-white tracking-tight">
                DocVault <span className="text-[#2DD4BF]">X</span> PDF Viewer
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              Universal, high-assurance document viewer for reading PDFs and protected containers with hardware-accelerated privacy, dynamic forensic watermarks, and zero unencrypted disk footprint.
            </p>

            <div className="pt-2 text-[11px] font-mono text-slate-400 space-y-1">
              <div>Cryptographic Standard: AES-256-GCM AEAD</div>
              <div>Digital Signatures: Ed25519 Verified Policies</div>
            </div>

            {/* Social Icons with innocent Facebook logo as secret admin gate */}
            <div className="pt-2 flex items-center gap-3">
              {/* Facebook Logo (Secret: 3 clicks triggers admin) - No title, no aria-label tooltip, no focus ring */}
              <button
                type="button"
                onClick={handleFacebookClick}
                className="w-9 h-9 rounded-xl bg-[#17253A] border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 flex items-center justify-center transition-colors outline-none focus:outline-none focus:ring-0 focus:border-slate-700 active:outline-none select-none ring-0 shadow-none"
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <svg className="w-4 h-4 fill-current pointer-events-none" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              {/* Twitter / X */}
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-xl bg-[#17253A] border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-colors outline-none focus:outline-none focus:ring-0 select-none ring-0 shadow-none"
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <svg className="w-3.5 h-3.5 fill-current pointer-events-none" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-xl bg-[#17253A] border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-colors outline-none focus:outline-none focus:ring-0 select-none ring-0 shadow-none"
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <svg className="w-4 h-4 fill-current pointer-events-none" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  />
                </svg>
              </button>

              {/* LinkedIn */}
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="w-9 h-9 rounded-xl bg-[#17253A] border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 transition-colors outline-none focus:outline-none focus:ring-0 select-none ring-0 shadow-none"
                style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
              >
                <svg className="w-3.5 h-3.5 fill-current pointer-events-none" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Col 3: Product Navigation */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#downloads" className="hover:text-white transition hover:underline">
                  Download Desktop & Mobile App
                </a>
              </li>
              <li>
                <a href="#formats" className="hover:text-white transition hover:underline">
                  .DVX Encrypted Container
                </a>
              </li>
              <li>
                <a href="#formats" className="hover:text-white transition hover:underline">
                  Supported Formats
                </a>
              </li>
              <li>
                <a href="#downloads" className="hover:text-white transition hover:underline">
                  Native OS Shielding
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition hover:underline">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Security & Compliance */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Security Architecture</h4>
            <ul className="space-y-2">
              <li>
                <a href="#security" className="hover:text-white transition hover:underline">
                  Zero-Knowledge Decryption
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition hover:underline">
                  Forensic Watermarking
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition hover:underline">
                  Screen Capture Matrix
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition hover:underline">
                  Anti-Print Hardening
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition hover:underline">
                  Security FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal & Privacy */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide">Legal & Privacy</h4>
            <ul className="space-y-2">
              <li>
                <a href="#faq" className="hover:text-white transition hover:underline">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition hover:underline">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition hover:underline">
                  Whistleblower Defense
                </a>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition hover:underline">
                  Cryptographic Specifications
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-300">
          <div>
            &copy; {new Date().getFullYear()} DocVault X Platform. All cryptographic standards and architectural rights reserved.
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#17253A] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
