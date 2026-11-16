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
      icon: <FileUp className="w-6 h-6 text-[#2DD4BF]" />,
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
      icon: <KeyRound className="w-6 h-6 text-[#2DD4BF]" />,
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
      icon: <Eye className="w-6 h-6 text-[#2DD4BF]" />,
      details: [
        'Sub-millisecond page caching via WebWorker',
        'Dynamic forensic watermark with recipient metadata',
        'Hardened anti-print and privacy screen shielding',
      ],
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#0A1222] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#17253A] border border-[#2DD4BF]/30 text-[#2DD4BF] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SIMPLE & SECURE PROTOCOL</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            How DocVault X Works
          </h2>

          <p className="text-base sm:text-lg text-slate-300">
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
                className={`cursor-pointer rounded-2xl p-6 transition-all duration-300 border text-left ${
                  activeStep === item.step
                    ? 'bg-[#17253A] border-[#2DD4BF] shadow-xl shadow-[#2DD4BF]/10 scale-[1.02]'
                    : 'bg-[#17253A]/40 border-slate-800 hover:border-slate-700 hover:bg-[#17253A]/60'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base transition-colors shrink-0 ${
                      activeStep === item.step
                        ? 'bg-[#2DD4BF] text-[#0A1222]'
                        : 'bg-[#0A1222] text-slate-400 border border-slate-700'
                    }`}
                  >
                    0{item.step}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#2DD4BF]">
                        {item.subtitle}
                      </span>
                      {activeStep === item.step && (
                        <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-pulse" />
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">{item.title}</h3>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Dynamic Interactive Visual Display (7 cols) */}
          <div className="lg:col-span-7">
            <div className="relative rounded-3xl bg-[#17253A]/80 border border-slate-700 p-6 sm:p-8 shadow-2xl min-h-[420px] flex flex-col justify-between overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#2DD4BF]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Top Bar Indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2DD4BF]" />
                  <span className="font-mono text-xs font-bold text-slate-200 uppercase">
                    Stage {activeStep} / 3 Execution Visualizer
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {steps[activeStep - 1].subtitle}
                </span>
              </div>

              {/* Dynamic Content by Step */}
              <div className="py-8 relative z-10 flex-1 flex flex-col justify-center">
                {activeStep === 1 && (
                  <div className="space-y-6 text-center animate-in fade-in duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-[#0A1222] border-2 border-dashed border-[#2DD4BF]/60 mx-auto flex items-center justify-center text-[#2DD4BF] shadow-lg shadow-[#2DD4BF]/10">
                      <FileUp className="w-9 h-9" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Client-Side Document Ingestion</h4>
                      <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                        Files are verified within an isolated client runtime. Zero bytes are uploaded to remote servers without explicit envelope encryption.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="p-3 rounded-xl bg-[#0A1222] border border-slate-800 text-xs">
                        <div className="text-[10px] text-slate-400 font-mono">Format Ingested</div>
                        <div className="font-bold text-white mt-0.5">PDF & .DVX Containers</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0A1222] border border-slate-800 text-xs">
                        <div className="text-[10px] text-slate-400 font-mono">Hash Verification</div>
                        <div className="font-bold text-teal-400 mt-0.5">SHA-256 AEAD Verified</div>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0A1222] border border-slate-800 text-xs">
                        <div className="text-[10px] text-slate-400 font-mono">Storage Footprint</div>
                        <div className="font-bold text-white mt-0.5">0 Bytes on Disk (RAM)</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-[#0A1222] border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                      <KeyRound className="w-9 h-9" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-bold text-white">Cryptographic Policy Validation</h4>
                      <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                        Verifies signatures and authorizations prior to decrypting chunks in memory.
                      </p>
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <div className="p-3 rounded-xl bg-[#0A1222] border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Ed25519 Policy Signature:</span>
                        <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Valid & Untampered
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0A1222] border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Access TTL Expiration:</span>
                        <span className="font-mono text-sky-400 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> 23h 59m Remaining
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#0A1222] border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Device Offline Lease:</span>
                        <span className="font-mono text-[#2DD4BF] font-bold">Authorized Session</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="space-y-6 text-center animate-in fade-in duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-[#0A1222] border border-[#2DD4BF]/50 mx-auto flex items-center justify-center text-[#2DD4BF] shadow-lg shadow-[#2DD4BF]/10">
                      <ShieldCheck className="w-9 h-9" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Protected Workspace Active</h4>
                      <p className="text-xs text-slate-300 max-w-md mx-auto mt-1">
                        Display pipeline armed with dynamic forensic watermark stencils and anti-capture shields.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0A1222] border border-slate-800 max-w-md mx-auto relative overflow-hidden">
                      <div className="text-[10px] font-mono text-[#2DD4BF] mb-1 font-bold">
                        ACTIVE FORENSIC WATERMARK OVERLAY
                      </div>
                      <div className="font-mono text-xs text-slate-300 py-1 bg-slate-900/80 rounded border border-slate-800">
                        CONFIDENTIAL • user@enterprise.org • IP: 198.51.100.42 • 2026-11-16
                      </div>
                      <div className="mt-2 flex items-center justify-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#2DD4BF]" /> CSS Anti-Print
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-[#2DD4BF]" /> Defocus Blur
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Checklist */}
              <div className="pt-4 border-t border-slate-700/80 relative z-10 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
                <span className="font-medium text-slate-400">Guaranteed Invariants:</span>
                <div className="flex flex-wrap gap-4">
                  {steps[activeStep - 1].details.map((detail) => (
                    <span key={detail} className="flex items-center gap-1.5 text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" />
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
