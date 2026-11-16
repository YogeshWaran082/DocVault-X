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
              <div className="flex items-center justify-between border-b border-slate-700 pb-3 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-mono text-white font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>Desktop Client v1.0.4 — Receipt-2819-7625-3984.pdf</span>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 font-semibold">
                    Protected
                  </span>
                  <span>187%</span>
                </div>
              </div>

              {/* Realistic Desktop Mockup with Sidebar */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 rounded-2xl bg-[#1F242C] border border-slate-700/80 p-4">
                {/* Thumbnails Sidebar (3 cols) */}
                <div className="hidden md:block md:col-span-3 border-r border-slate-700/80 pr-4 space-y-3">
                  <div className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Thumbnails (1)
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-full p-2 rounded-lg border-2 border-blue-500 bg-white shadow-md cursor-pointer overflow-hidden">
                      <div className="w-full aspect-[1/1.4] bg-white overflow-hidden p-2 text-[5px] text-slate-800 leading-tight select-none">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-extrabold text-[7px] text-black">Receipt</span>
                          <div className="w-2.5 h-2.5 bg-black rounded-full flex items-center justify-center text-[4px] text-white">❖</div>
                        </div>
                        <div className="space-y-0.5 text-[4px] text-slate-500">
                          <div>AADNBWQB-0001</div>
                          <div>2819-7625-3984</div>
                        </div>
                        <div className="mt-1 text-[5px] font-bold text-black">₹0.00 paid</div>
                        <div className="space-y-0.5 mt-2">
                          <div className="w-full h-0.5 bg-slate-200" />
                          <div className="w-5/6 h-0.5 bg-slate-200" />
                        </div>
                      </div>
                    </div>
                    <span className="mt-1 px-2.5 py-0.5 rounded bg-blue-600 text-white font-mono font-bold text-[10px]">
                      1
                    </span>
                  </div>
                </div>

                {/* Main Reading Viewport (9 cols) */}
                <div className="md:col-span-9 flex flex-col items-center justify-center p-6 min-h-[380px] bg-[#2E3440] rounded-xl relative overflow-hidden">
                  {/* Subtle Forensic Watermark across canvas */}
                  <div className="absolute inset-0 pointer-events-none flex flex-col justify-around opacity-15 select-none -rotate-12">
                    <div className="text-center font-mono text-xs font-bold text-white tracking-widest">
                      CONFIDENTIAL • designer2.rthinfotech@gmail.com • IP: 157.49.201.12
                    </div>
                    <div className="text-center font-mono text-xs font-bold text-white tracking-widest">
                      CONFIDENTIAL • designer2.rthinfotech@gmail.com • IP: 157.49.201.12
                    </div>
                  </div>

                  {/* Document Page Simulation (OpenAI Receipt) */}
                  <div className="w-full max-w-lg bg-white text-slate-900 rounded shadow-2xl p-6 sm:p-8 space-y-4">
                    <div className="flex items-start justify-between border-b pb-3">
                      <div>
                        <h3 className="text-2xl font-black text-black font-sans">Receipt</h3>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">
                          Invoice: AADNBWQB-0001 • Date: Oct 23, 2026
                        </div>
                      </div>
                      <div className="w-7 h-7 text-black flex items-center justify-center">
                        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.6669zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                        </svg>
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 leading-relaxed grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-500">Bill to</div>
                        <div className="font-semibold text-black">Danel</div>
                        <div className="text-[11px] text-slate-600">Chennai 600091, Tamil Nadu</div>
                        <div className="text-[10px] text-slate-500 font-mono">designer2.rthinfotech@gmail.com</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold uppercase text-slate-500">Issued by</div>
                        <div className="font-semibold text-black">OpenAI OpCo, LLC</div>
                        <div className="text-[11px] text-slate-600">San Francisco, CA 94158</div>
                      </div>
                    </div>

                    {/* Table Summary */}
                    <div className="rounded border border-slate-200 overflow-hidden text-[11px]">
                      <div className="bg-slate-900 text-white px-3 py-1.5 font-bold flex justify-between text-[10px] uppercase">
                        <span>Description</span>
                        <span>Amount</span>
                      </div>
                      <div className="p-2 space-y-1 divide-y divide-slate-100">
                        <div className="flex justify-between py-1">
                          <span>ChatGPT Plus Subscription (per seat)</span>
                          <span className="font-medium">₹1,694.07</span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-600">
                          <span>1 Month Free Trial (100% off)</span>
                          <span className="font-medium">-₹1,694.07</span>
                        </div>
                        <div className="flex justify-between py-1 font-bold text-slate-950 border-t pt-1">
                          <span>TOTAL PAID</span>
                          <span className="text-emerald-600 font-black">₹0.00</span>
                        </div>
                      </div>
                    </div>
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
