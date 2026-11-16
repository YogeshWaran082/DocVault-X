import React, { useState } from 'react';
import {
  Monitor,
  Smartphone,
  FolderLock,
  FileBox,
  Eye,
  Share2,
  FileText,
  ShieldCheck
} from 'lucide-react';

export const AppShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'desktop' | 'mobile' | 'library' | 'dvx'>('desktop');

  const tabs = [
    { id: 'desktop', label: 'Desktop PDF Viewer', icon: <Monitor className="w-4 h-4" /> },
    { id: 'mobile', label: 'Mobile Secure Viewer', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'library', label: 'Document Library & Vault', icon: <FolderLock className="w-4 h-4" /> },
    { id: 'dvx', label: 'Protected .DVX Viewer', icon: <FileBox className="w-4 h-4" /> },
  ] as const;

  return (
    <section id="features" className="py-24 bg-[#000000] border-t border-white/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1d1d1f] border border-[#424245] text-[#2997ff] text-xs font-medium tracking-wide">
            <Eye className="w-3.5 h-3.5" />
            <span className="uppercase text-[11px] font-semibold">AUTHENTIC INTERFACES</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-[#f5f5f7] tracking-tight">
            Application Showcase
          </h2>

          <p className="text-base sm:text-lg text-[#86868b]">
            Explore the real UI components powering DocVault X across desktops, mobile devices, and secure enterprise vaults.
          </p>
        </div>

        {/* Tab Controls - Apple Segment Control Style */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-[#161617] border border-[#333336] rounded-full max-w-2xl mx-auto mb-10 shadow-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[#0071e3] text-white shadow-sm'
                  : 'text-[#86868b] hover:text-[#f5f5f7] hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Showcase Canvas Frame */}
        <div className="rounded-3xl bg-[#161617] border border-[#333336] p-4 sm:p-8 shadow-2xl overflow-hidden min-h-[520px]">
          {/* TAB 1: Desktop PDF Viewer */}
          {activeTab === 'desktop' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-[#333336] pb-3 text-xs text-[#86868b]">
                <div className="flex items-center gap-2 font-mono text-[#f5f5f7] font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Desktop Client v1.0.4 — Sales_Invoice_9000000001.pdf</span>
                </div>
                <div className="flex items-center gap-3 text-[#86868b] font-mono text-[11px]">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                    Protected
                  </span>
                  <span>187%</span>
                </div>
              </div>

              {/* Realistic Desktop Mockup with Sidebar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-2xl bg-[#161617] border border-[#333336] p-4">
                {/* Thumbnails Sidebar (3 cols) */}
                <div className="hidden md:block md:col-span-3 border-r border-[#333336] pr-4 space-y-3">
                  <div className="text-[11px] font-mono font-medium text-[#86868b] uppercase tracking-wider mb-2">
                    Thumbnails (1)
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full p-1 rounded-lg border-2 border-[#0071e3] bg-white shadow-md cursor-pointer overflow-hidden">
                      <div className="w-full aspect-[1/1.4] bg-white overflow-hidden select-none">
                        <img
                          src="/stripesshop-sales-invoice.jpg"
                          alt="Invoice Preview"
                          className="w-full h-full object-cover object-top select-none pointer-events-none"
                        />
                      </div>
                    </div>
                    <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#0071e3] text-white font-mono font-semibold text-[10px]">
                      1
                    </span>
                  </div>
                </div>

                {/* Main Reading Viewport (9 cols) */}
                <div className="md:col-span-9 flex flex-col items-center justify-center p-4 sm:p-6 min-h-[380px] bg-[#000000] rounded-xl relative overflow-hidden border border-[#333336]">
                  {/* Subtle Forensic Watermark across canvas */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-around opacity-15 select-none -rotate-12 z-20">
                    <div className="text-center font-mono text-xs font-bold text-slate-900 tracking-widest">
                      CONFIDENTIAL • designer2.rthinfotech@gmail.com • IP: 157.49.201.12
                    </div>
                    <div className="text-center font-mono text-xs font-bold text-slate-900 tracking-widest">
                      CONFIDENTIAL • designer2.rthinfotech@gmail.com • IP: 157.49.201.12
                    </div>
                  </div>

                  {/* Document Page Simulation (StripesShop Sales Invoice) */}
                  <div className="w-full max-w-lg bg-white rounded shadow-2xl overflow-hidden select-none">
                    <img
                      src="/stripesshop-sales-invoice.jpg"
                      alt="Sales Invoice #9000000001"
                      className="w-full h-auto block select-none pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Mobile Secure Viewer */}
          {activeTab === 'mobile' && (
            <div className="flex flex-col items-center justify-center py-4 animate-in fade-in duration-300">
              <div className="w-full max-w-xs rounded-[40px] bg-[#161617] border-4 border-[#333336] p-4 shadow-2xl relative">
                {/* Mobile Camera Notch */}
                <div className="w-24 h-4 bg-[#000000] rounded-full mx-auto mb-4" />

                {/* Mobile Header Bar */}
                <div className="flex items-center justify-between text-xs text-[#f5f5f7] pb-3 border-b border-[#333336]">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-[#2997ff]" />
                    <span>DocVault Mobile</span>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    FLAG_SECURE
                  </span>
                </div>

                {/* Mobile Screen Content */}
                <div className="my-4 bg-white text-slate-900 rounded-2xl p-4 shadow min-h-[300px] flex flex-col justify-between relative overflow-hidden">
                  <div className="space-y-2">
                    <div className="text-[9px] font-mono font-bold text-[#0071e3] uppercase">
                      SECURE MOBILE LEASE
                    </div>
                    <h5 className="text-xs font-bold text-slate-900">Q4 Executive Financials</h5>
                    <p className="text-[10px] text-slate-600 leading-tight">
                      Screen recording and system screenshot commands are blocked at the OS layer via Android WindowManager.LayoutParams.FLAG_SECURE.
                    </p>
                  </div>

                  {/* Watermark */}
                  <div className="text-[8px] font-mono text-slate-400 text-center border-t pt-2">
                    FORENSIC TAG: USER_MOBILE_102 • EXPIRES IN 42M
                  </div>
                </div>

                {/* Bottom Navigation Pill */}
                <div className="flex items-center justify-around pt-2 text-xs text-[#86868b]">
                  <span className="text-[#2997ff] font-semibold text-[11px]">Overview</span>
                  <span className="text-[11px]">Pages (1/4)</span>
                  <span className="text-[11px]">Shield Active</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Document Library & Vault */}
          {activeTab === 'library' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#333336] text-xs">
                <div>
                  <h4 className="text-sm font-semibold text-[#f5f5f7]">Protected Document Vault</h4>
                  <p className="text-[#86868b] text-[11px]">
                    Manage tenant files, cryptographic policies, and expiring share tokens.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-[#161617] border border-[#333336] text-[#86868b] font-mono text-[11px]">
                    3 Active Documents
                  </span>
                </div>
              </div>

              {/* Realistic Document List Rows */}
              <div className="space-y-3">
                {[
                  {
                    title: 'Board_Meeting_Minutes_Nov2026.pdf',
                    size: '2.4 MB',
                    status: 'ACTIVE ENCRYPTED',
                    policy: '24h Expiry • Print Disabled',
                    hash: 'sha256:4a8b...19f2',
                  },
                  {
                    title: 'Strategic_Patents_Vault_Container.dvx',
                    size: '18.1 MB',
                    status: 'DVX ENCRYPTED',
                    policy: 'Max 3 Opens • Forensic Watermark',
                    hash: 'sha256:9c12...88d1',
                  },
                  {
                    title: 'Audited_Customer_Ledger.xlsx',
                    size: '4.8 MB',
                    status: 'CONVERTED SECURE',
                    policy: 'Revocable • View-Only',
                    hash: 'sha256:3d7a...44c0',
                  },
                ].map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#161617] border border-[#333336] hover:border-[#424245] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1d1d1f] border border-[#333336] flex items-center justify-center text-[#2997ff]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-[#f5f5f7]">{doc.title}</div>
                        <div className="text-[11px] text-[#86868b] font-mono flex items-center gap-2">
                          <span>{doc.size}</span>
                          <span>•</span>
                          <span className="text-[#2997ff]">{doc.policy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[#1d1d1f] text-[#86868b] border border-[#333336]">
                        {doc.status}
                      </span>
                      <button className="p-1.5 rounded-full bg-[#1d1d1f] text-[#86868b] hover:text-white border border-[#333336] transition-colors">
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Protected DVX Viewer */}
          {activeTab === 'dvx' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-5 rounded-2xl bg-[#161617] border border-[#333336] space-y-4">
                <div className="flex items-center justify-between border-b border-[#333336] pb-3">
                  <div className="flex items-center gap-2">
                    <FileBox className="w-5 h-5 text-[#2997ff]" />
                    <span className="font-semibold text-[#f5f5f7] text-sm">.DVX Standalone Container Inspection</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    CRYPTOGRAPHICALLY VALID
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#1d1d1f] border border-[#333336]">
                    <div className="text-[10px] text-[#86868b] font-mono">Container Header</div>
                    <div className="font-semibold text-[#f5f5f7] mt-1">DVX1 Magic (CBOR)</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#1d1d1f] border border-[#333336]">
                    <div className="text-[10px] text-[#86868b] font-mono">Authenticated Cipher</div>
                    <div className="font-semibold text-[#f5f5f7] mt-1">AES-256-GCM (64KB)</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#1d1d1f] border border-[#333336]">
                    <div className="text-[10px] text-[#86868b] font-mono">Payload Chunks</div>
                    <div className="font-semibold text-[#2997ff] mt-1">142 Authenticated Chunks</div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#1d1d1f] border border-[#333336]">
                    <div className="text-[10px] text-[#86868b] font-mono">Digital Signature</div>
                    <div className="font-semibold text-emerald-400 mt-1">Ed25519 Verified</div>
                  </div>
                </div>

                <p className="text-xs text-[#86868b] leading-relaxed">
                  The .dvx container format allows distribution of high-security files through public channels (email, cloud drives, USB) while maintaining zero-trust offline access policies.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
