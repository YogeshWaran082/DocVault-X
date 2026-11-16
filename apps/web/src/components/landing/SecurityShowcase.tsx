import React from 'react';
import {
  ShieldCheck,
  Lock,
  Clock,
  Ban,
  FileKey2,
  Download,
  Printer,
  Fingerprint,
  EyeOff,
  AlertTriangle,
  Monitor,
  Smartphone,
  Globe,
  CheckCircle2
} from 'lucide-react';

export const SecurityShowcase: React.FC = () => {

  const securityFeatures = [
    {
      title: 'Secure Document Access',
      icon: <Lock className="w-5 h-5 text-[#2997ff]" />,
      description:
        'Zero-trust access verification requiring verified identity or single-use authentication tokens before decrypting payload data.',
    },
    {
      title: 'Expiring Access Links',
      icon: <Clock className="w-5 h-5 text-[#2997ff]" />,
      description:
        'Time-to-live policies enforce hard expiration dates and maximum open counts. Expired tokens are immediately invalidated across all nodes.',
    },
    {
      title: 'Instant Revocable Sharing',
      icon: <Ban className="w-5 h-5 text-[#ff453a]" />,
      description:
        'One-click emergency kill-switch revokes active share tokens, terminating live reading sessions and invalidating offline licenses.',
    },
    {
      title: 'Encrypted Document Storage',
      icon: <FileKey2 className="w-5 h-5 text-[#2997ff]" />,
      description:
        'Military-grade AES-256-GCM cipher with independent 256-bit DEKs per document version, wrapped via KMS envelope encryption.',
    },
    {
      title: 'Restricted Download Controls',
      icon: <Download className="w-5 h-5 text-[#2997ff]" />,
      description:
        'Documents stream into ephemeral WebAssembly memory. Right-click save, blob URL extraction, and disk persistence are actively blocked.',
    },
    {
      title: 'Restricted Printing Controls',
      icon: <Printer className="w-5 h-5 text-[#ff9f0a]" />,
      description:
        'Hardened CSS anti-print shielding cascades trigger instantly upon Ctrl+P / Cmd+P or print media query, rendering pages blank.',
    },
    {
      title: 'Dynamic Forensic Watermarks',
      icon: <Fingerprint className="w-5 h-5 text-[#2997ff]" />,
      description:
        'Dynamic diagonal stenciling of recipient email, IP address, and UTC timestamp across all canvas layers ensures whistleblower traceability.',
    },
    {
      title: 'Privacy Shielding (Screen Defocus)',
      icon: <EyeOff className="w-5 h-5 text-[#34c759]" />,
      description:
        'Automatic hardware-accelerated Gaussian blur triggers the microsecond the browser window loses focus, defending against shoulder surfing.',
    },
  ];

  return (
    <section id="security" className="py-24 bg-[#000000] border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1d1d1f] border border-[#424245] text-[#2997ff] text-xs font-medium tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="uppercase text-[11px] font-semibold">ENTERPRISE-GRADE ASSURANCE</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-[#f5f5f7] tracking-tight">
            Security Features & Controls
          </h2>

          <p className="text-base sm:text-lg text-[#86868b]">
            Multi-tiered defense architecture safeguarding your most sensitive files from unauthorized distribution, extraction, and capture.
          </p>
        </div>

        {/* 8 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {securityFeatures.map((feat) => (
            <div
              key={feat.title}
              className="rounded-3xl bg-[#161617] border border-[#333336] p-6 hover:border-[#424245] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#1d1d1f] border border-[#424245] flex items-center justify-center mb-4 shadow-sm">
                {feat.icon}
              </div>
              <h3 className="text-base font-semibold text-[#f5f5f7] mb-2">{feat.title}</h3>
              <p className="text-xs text-[#a1a1a6] leading-relaxed font-normal">{feat.description}</p>
            </div>
          ))}
        </div>

        {/* SPECIAL SHOWCASE: Screenshot & Screen-Recording Protection Matrix */}
        <div className="rounded-3xl bg-[#161617] border border-[#333336] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1d1d1f] border border-[#424245] text-[#2997ff] text-xs font-mono font-medium mb-3">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SCREEN CAPTURE PROTECTION ANALYSIS</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-[#f5f5f7]">
              Platform-Specific Screen Capture Protection Matrix
            </h3>
            <p className="text-xs sm:text-sm text-[#86868b] mt-2 leading-relaxed">
              We believe in rigorous cryptographic honesty. The boundary between operating system display pipelines and web browsers determines the scope of capture protection. Below is our verified architectural comparison:
            </p>
          </div>

          {/* Matrix Comparison Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Desktop Native App */}
            <div className="rounded-2xl bg-[#1d1d1f] border border-[#333336] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-base">
                  <Monitor className="w-5 h-5 text-[#2997ff]" />
                  <span>Desktop Native App</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#34c759] border border-[#34c759]/30">
                  Hardware Level
                </span>
              </div>
              <p className="text-xs text-[#86868b]">
                macOS & Windows clients built with Tauri 2 + Rust secure window affinity.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-start gap-2 text-[#f5f5f7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <span><strong>OS Window Affinity:</strong> `WDA_MONITOR` blocks Windows Snipping Tool & screen recordings.</span>
                </div>
                <div className="flex items-start gap-2 text-[#f5f5f7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <span><strong>macOS Window Protection:</strong> App window turns pure black during Cmd+Shift+4 or QuickTime recording.</span>
                </div>
                <div className="flex items-start gap-2 text-[#f5f5f7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <span><strong>Forensic Watermarking:</strong> Active on all display buffers.</span>
                </div>
              </div>
            </div>

            {/* Mobile Native App */}
            <div className="rounded-2xl bg-[#1d1d1f] border border-[#333336] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-base">
                  <Smartphone className="w-5 h-5 text-[#2997ff]" />
                  <span>Mobile Native App</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#34c759]/10 text-[#34c759] border border-[#34c759]/30">
                  Hardware Level
                </span>
              </div>
              <p className="text-xs text-[#86868b]">
                Android & iOS builds running on native secure framework runtimes.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-start gap-2 text-[#f5f5f7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <span><strong>Android FLAG_SECURE:</strong> Hardware prohibits screenshots and hides preview in recent apps.</span>
                </div>
                <div className="flex items-start gap-2 text-[#f5f5f7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <span><strong>iOS Secure Enclave:</strong> AirPlay mirroring blocked and screen recording produces blank video.</span>
                </div>
                <div className="flex items-start gap-2 text-[#f5f5f7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <span><strong>Biometric Verification:</strong> FaceID / Fingerprint re-authentication required.</span>
                </div>
              </div>
            </div>

            {/* Standard Web Browser */}
            <div className="rounded-2xl bg-[#1d1d1f] border border-[#424245] p-6 space-y-4 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-semibold text-base">
                  <Globe className="w-5 h-5 text-[#2997ff]" />
                  <span>Standard Web Browser</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ff9f0a]/10 text-[#ff9f0a] border border-[#ff9f0a]/30">
                  Sandboxed Shield
                </span>
              </div>
              <p className="text-xs text-[#86868b]">
                Chrome, Safari, Firefox, and Edge running on standard web standards.
              </p>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex items-start gap-2 text-[#f5f5f7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <span><strong>Anti-Print Shield:</strong> Automatic DOM suppression on print shortcuts and media queries.</span>
                </div>
                <div className="flex items-start gap-2 text-[#f5f5f7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <span><strong>Focus Defocus Blur:</strong> Canvas instantly blurs whenever user clicks outside or launches snipping tools.</span>
                </div>
                <div className="flex items-start gap-2 text-[#f5f5f7]">
                  <CheckCircle2 className="w-4 h-4 text-[#34c759] shrink-0 mt-0.5" />
                  <span><strong>Forensic Traceability:</strong> Dynamic watermark guarantees leaker identification if captured.</span>
                </div>
                <div className="flex items-start gap-2 text-[#ff9f0a]">
                  <AlertTriangle className="w-4 h-4 text-[#ff9f0a] shrink-0 mt-0.5" />
                  <span><strong>Browser Limitation:</strong> Standard web APIs cannot block external OS screen capture shortcuts (e.g. Mac Cmd+Shift+4).</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Security Guarantee */}
          <div className="mt-8 p-4 rounded-2xl bg-[#1d1d1f] border border-[#333336] flex items-start gap-3 text-xs text-[#a1a1a6]">
            <ShieldCheck className="w-5 h-5 text-[#2997ff] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#f5f5f7]">Our Zero-Deception Commitment:</strong> No software can prevent external optical photography (a camera pointed at a monitor). DocVault X combines hardware OS flags on native clients with dynamic, persistent forensic watermarking across all platforms—ensuring every document leak carries undeniable cryptographic proof of source.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
