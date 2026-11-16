import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'What document formats are natively supported in DocVault X?',
      answer:
        'DocVault X natively renders standard PDF documents and proprietary encrypted .dvx containers directly in the browser using an isolated WebAssembly hardware canvas pipeline. Other enterprise file formats—including Microsoft Word (.docx), Excel (.xlsx), PowerPoint (.pptx), images (.png, .jpg), and plain text—are processed via our zero-retention vault ingestion engine into secure vector streams before presentation.',
    },
    {
      question: 'How does secure, expiring, and revocable document sharing work?',
      answer:
        'When you share a document, DocVault X generates an ephemeral signed link with an associated cryptographic policy. You can set time-to-live expirations (e.g., 2 hours, 7 days) or limit opens to a single recipient. At any time, owners can trigger an instant kill-switch revocation, which destroys the active Data Encryption Key (DEK) mapping and immediately freezes all open viewer sessions.',
    },
    {
      question: 'Can DocVault X prevent 100% of screenshots and recordings?',
      answer:
        'In standard web browsers (Chrome, Safari, Edge), Operating System shortcuts (like Windows Snipping Tool, Mac Cmd+Shift+4, or external smartphone cameras) cannot be completely blocked by any website due to browser sandbox boundaries. DocVault X counters this with active defense: automatic canvas blur whenever the browser window defocuses, print media nullification, and persistent dynamic forensic watermarks (recipient email, IP, and UTC timestamp stenciled across all pages) ensuring definitive whistleblower attribution. For true hardware OS-level capture blocking, our native desktop (WDA_MONITOR) and mobile (FLAG_SECURE) applications completely prevent OS capture.',
    },
    {
      question: 'What happens when a document access policy expires?',
      answer:
        'Once the expiration timestamp passes or the maximum open count is reached, access authorization is immediately denied. Even if an encrypted .dvx file remains on the recipient’s hard drive, it cannot be decrypted because the decryption lease has expired and the key cannot be derived without valid server-signed authorization.',
    },
    {
      question: 'How does offline file access work with .dvx containers?',
      answer:
        'A .dvx container is an encrypted binary file using AES-256-GCM. When configured for offline mode, the sender issues a cryptographically signed lease token with a strict offline expiration window (e.g., 24 hours). The recipient client caches the temporary key in encrypted local memory, enabling reading without active internet access until the lease counter expires.',
    },
    {
      question: 'How are unauthorized file downloads and printing restricted?',
      answer:
        'DocVault X streams document buffers directly into WebAssembly memory without exposing direct download URLs or blob links. Standard browser context menus (right-click save) are disabled. Furthermore, our hardened CSS print shielding completely suppresses DOM elements during print commands (Ctrl+P / Cmd+P) and replaces the page with a protected document advisory notice.',
    },
  ];

  return (
    <section id="faq" className="py-24 bg-[#000000] border-t border-white/10 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1d1d1f] border border-[#424245] text-[#2997ff] text-xs font-medium tracking-wide">
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="uppercase text-[11px] font-semibold">CLARITY & ARCHITECTURE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-[#f5f5f7] tracking-tight">
            Frequently Asked Questions
          </h2>

          <p className="text-base sm:text-lg text-[#86868b]">
            Clear technical answers regarding document privacy, cryptographic standards, and platform capabilities.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-3xl bg-[#161617] border border-[#333336] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-[#f5f5f7] text-base sm:text-lg">
                    {faq.question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full bg-[#1d1d1f] border border-[#424245] flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#2997ff] border-[#2997ff]/40' : 'text-[#86868b]'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-[#a1a1a6] leading-relaxed border-t border-[#333336] animate-in fade-in duration-200">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
