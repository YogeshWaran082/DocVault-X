import React, { useState } from 'react';
import {
  FileUp,
  ShieldCheck,
  Eye,
  CheckCircle2,
  KeyRound,
  Clock
} from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);

  const steps = [
    {
      step: 1,
      title: 'Open your document.',
      subtitle: 'Zero-Knowledge Ingestion',
      description:
        'Select any standard PDF or encrypted .dvx container. Files are processed entirely in memory—unencrypted data is never leaked or stored in temporary disk caches.',
      icon: <FileUp className="w-6 h-6 text-[#2997ff]" />,
      details: [
        'Drag-and-drop any standard PDF or DVX package',
        'Automatic MIME detection and format validation',
        'SHA-256 integrity hash verification in WebAssembly',
      ],
    },
    {
      step: 2,
      title: 'Verify access when required.',
      subtitle: 'Cryptographic Policy Validation',
      description:
        'For protected documents, our zero-trust policy engine validates the Ed25519 signature, expiration countdown, and recipient credentials before releasing the ephemeral DEK.',
      icon: <KeyRound className="w-6 h-6 text-[#2997ff]" />,
      details: [
        'Ed25519 digital signature authenticity check',
        'Time-To-Live (TTL) countdown validation',
        'Device-bound offline lease authorization',
      ],
    },
    {
      step: 3,
      title: 'View in a protected workspace.',
      subtitle: 'Hardened Display & Forensics',
      description:
        'Read your document with high-DPI hardware canvas rendering, dynamic user-bound forensic watermarks, automatic print neutralization, and window blur privacy shielding.',
      icon: <Eye className="w-6 h-6 text-[#2997ff]" />,
      details: [
        'Sub-millisecond page caching via WebWorker',
        'Dynamic forensic watermark with recipient metadata',
        'Hardened anti-print and privacy screen shielding',
      ],
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#000000] border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1d1d1f] border border-[#424245] text-[#2997ff] text-xs font-medium tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="uppercase text-[11px] font-semibold">SIMPLE & SECURE PROTOCOL</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-[#f5f5f7] tracking-tight">
            How DocVault X Works
          </h2>

          <p className="text-base sm:text-lg text-[#86868b]">
            A frictionless, high-assurance workflow delivering total document privacy without complex software installation.
          </p>
        </div>

        {/* 3-Step Interactive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Step Selectors (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((item) => (
              <div
                key={item.step}
                onClick={() => setActiveStep(item.step)}
                className={`cursor-pointer rounded-3xl p-6 transition-all duration-300 border text-left ${
                  activeStep === item.step
                    ? 'bg-[#1d1d1f] border-[#0071e3] shadow-xl shadow-[#0071e3]/10 scale-[1.01]'
                    : 'bg-[#161617] border-[#333336] hover:border-[#424245]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-semibold text-sm transition-colors shrink-0 ${
                      activeStep === item.step
                        ? 'bg-[#0071e3] text-white shadow-sm'
                        : 'bg-[#1d1d1f] text-[#86868b] border border-[#333336]'
                    }`}
                  >
                    0{item.step}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#2997ff]">
                        {item.subtitle}
                      </span>
                      {activeStep === item.step && (
                        <span className="w-2 h-2 rounded-full bg-[#2997ff] animate-pulse" />
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-[#f5f5f7] mt-1">{item.title}</h3>
                    <p className="text-xs text-[#a1a1a6] mt-1.5 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Dynamic Interactive Visual Display (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl bg-[#161617] border border-[#333336] p-6 sm:p-8 shadow-2xl min-h-[420px] flex flex-col justify-between overflow-hidden">
              {/* Top Bar Indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-[#333336] relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0071e3]" />
                  <span className="font-mono text-xs font-semibold text-[#f5f5f7] uppercase">
                    Stage {activeStep} / 3 Execution Visualizer
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#86868b]">
                  {steps[activeStep - 1].subtitle}
                </span>
              </div>

              {/* Dynamic Content by Step */}
              <div className="py-8 relative z-10 flex-1 flex flex-col justify-center">
                {activeStep === 1 && (
                  <div className="space-y-6 text-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-[#1d1d1f] border border-[#0071e3]/40 mx-auto flex items-center justify-center text-[#2997ff] shadow-sm">
                      <FileUp className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#f5f5f7]">Client-Side Document Ingestion</h4>
                      <p className="text-xs text-[#86868b] max-w-md mx-auto mt-1">
                        Files are verified within an isolated client runtime. Zero bytes are uploaded to remote servers without explicit envelope encryption.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="p-3 rounded-2xl bg-[#1d1d1f] border border-[#333336] text-xs">
                        <div className="text-[10px] text-[#86868b] font-mono">Format Ingested</div>
                        <div className="font-medium text-[#f5f5f7] mt-0.5">PDF & .DVX Containers</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#1d1d1f] border border-[#333336] text-xs">
                        <div className="text-[10px] text-[#86868b] font-mono">Hash Verification</div>
                        <div className="font-medium text-[#2997ff] mt-0.5">SHA-256 AEAD Verified</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#1d1d1f] border border-[#333336] text-xs">
                        <div className="text-[10px] text-[#86868b] font-mono">Storage Footprint</div>
                        <div className="font-medium text-[#f5f5f7] mt-0.5">0 Bytes on Disk (RAM)</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-[#1d1d1f] border border-[#34c759]/40 mx-auto flex items-center justify-center text-[#34c759] shadow-sm">
                      <KeyRound className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-[#f5f5f7]">Cryptographic Policy Validation</h4>
                      <p className="text-xs text-[#86868b] max-w-md mx-auto mt-1">
                        Verifies signatures and authorizations prior to decrypting chunks in memory.
                      </p>
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <div className="p-3 rounded-2xl bg-[#1d1d1f] border border-[#333336] flex items-center justify-between text-xs">
                        <span className="text-[#86868b]">Ed25519 Policy Signature:</span>
                        <span className="font-mono text-[#34c759] font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid & Untampered
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#1d1d1f] border border-[#333336] flex items-center justify-between text-xs">
                        <span className="text-[#86868b]">Access TTL Expiration:</span>
                        <span className="font-mono text-[#2997ff] font-medium flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 23h 59m Remaining
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#1d1d1f] border border-[#333336] flex items-center justify-between text-xs">
                        <span className="text-[#86868b]">Device Offline Lease:</span>
                        <span className="font-mono text-[#2997ff] font-medium">Authorized Session</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-6 text-center animate-in fade-in duration-300">
                    <div className="w-16 h-16 rounded-2xl bg-[#1d1d1f] border border-[#0071e3]/40 mx-auto flex items-center justify-center text-[#2997ff] shadow-sm">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#f5f5f7]">Protected Workspace Active</h4>
                      <p className="text-xs text-[#86868b] max-w-md mx-auto mt-1">
                        Display pipeline armed with dynamic forensic watermark stencils and anti-capture shields.
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#1d1d1f] border border-[#333336] max-w-md mx-auto relative overflow-hidden">
                      <div className="text-[10px] font-mono text-[#2997ff] mb-1 font-semibold">
                        ACTIVE FORENSIC WATERMARK OVERLAY
                      </div>
                      <div className="font-mono text-xs text-[#f5f5f7] py-1 bg-[#161617] rounded-lg border border-[#333336]">
                        CONFIDENTIAL • designer2.rthinfotech@gmail.com • IP: 157.49.201.12
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-[#86868b]">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#2997ff]" /> CSS Anti-Print
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#2997ff]" /> Defocus Blur
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Checklist */}
              <div className="pt-4 border-t border-[#333336] relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-[#86868b]">
                <span className="font-normal text-[#86868b]">Guaranteed Invariants:</span>
                <div className="flex flex-wrap gap-4">
                  {steps[activeStep - 1].details.map((detail) => (
                    <span key={detail} className="flex items-center gap-1.5 text-[#f5f5f7]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2997ff]" />
                      {detail}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
