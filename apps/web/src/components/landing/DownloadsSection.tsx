import React, { useState } from 'react';
import {
  Download,
  Clock,
  CheckCircle2,
  Bell,
  X
} from 'lucide-react';

interface PlatformDownload {
  name: string;
  os: string;
  version: string;
  architecture: string;
  icon: React.ReactNode;
  status: 'available' | 'coming_soon';
  releaseChannel: string;
  securityFeatures: string[];
}

// Official Standard Platform Brand Logos (Production SaaS Standard)
const WindowsLogo = () => (
  <svg className="w-8 h-8 fill-[#00A4EF]" viewBox="0 0 24 24">
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
  </svg>
);

const AppleLogo = () => (
  <svg className="w-8 h-8 fill-white" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.72-.94 2.74 1.01.08 2.04-.49 2.66-1.24z" />
  </svg>
);

const AndroidLogo = () => (
  <svg className="w-8 h-8 fill-[#3DDC84]" viewBox="0 0 24 24">
    <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.551 0 .9993.4482.9993.9993.0001.5511-.4483.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4116 13.8533 8.081 12 8.081s-3.5902.3306-5.1367.8687L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396" />
  </svg>
);

const AppleIosLogo = () => (
  <svg className="w-8 h-8 fill-[#007AFF]" viewBox="0 0 24 24">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.72-.94 2.74 1.01.08 2.04-.49 2.66-1.24z" />
  </svg>
);

export const DownloadsSection: React.FC = () => {
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const platforms: PlatformDownload[] = [
    {
      name: 'Windows Native',
      os: 'Windows 10 / 11',
      version: 'v1.1.0-RC3',
      architecture: 'x64 & ARM64 MSI / EXE',
      icon: <WindowsLogo />,
      status: 'coming_soon',
      releaseChannel: 'Hardened Tauri 2 + Rust Build',
      securityFeatures: [
        'WDA_MONITOR Display Affinity Screen Shield',
        'Direct Kernel Screen Grab Prevention',
        'Offline KMS Cryptographic Keyring',
      ],
    },
    {
      name: 'macOS Client',
      os: 'macOS Monterey / Ventura / Sonoma / Sequoia',
      version: 'v1.1.0-RC3',
      architecture: 'Apple Silicon (M1-M4) & Intel DMG',
      icon: <AppleLogo />,
      status: 'coming_soon',
      releaseChannel: 'Apple Notarized Binary Verification',
      securityFeatures: [
        'App Sandbox with Memory Quarantine',
        'Metal-Accelerated In-Memory Rendering',
        'QuickTime & Screenshot Shielding',
      ],
    },
    {
      name: 'Android Mobile',
      os: 'Android 10+ (API 29+)',
      version: 'v1.0.8',
      architecture: 'Google Play & Direct Signed APK',
      icon: <AndroidLogo />,
      status: 'coming_soon',
      releaseChannel: 'Google Play Internal Security Track',
      securityFeatures: [
        'Hardware WindowManager FLAG_SECURE',
        'Biometric StrongBox Decryption Key',
        'Recents Task Preview Obfuscation',
      ],
    },
    {
      name: 'iOS & iPadOS',
      os: 'iOS 16.0 or later',
      version: 'v1.0.8',
      architecture: 'Universal App Store & TestFlight',
      icon: <AppleIosLogo />,
      status: 'coming_soon',
      releaseChannel: 'Apple TestFlight Public Beta',
      securityFeatures: [
        'Secure Enclave Hardware Storage',
        'AirPlay Mirroring Interception Lock',
        'App Switcher Privacy Shielding',
      ],
    },
  ];

  const handleNotifyClick = (platformName: string) => {
    setSelectedPlatform(platformName);
    setSubscribed(false);
    setEmailInput('');
    setNotifyModalOpen(true);
  };

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setNotifyModalOpen(false);
        setSubscribed(false);
      }, 2000);
    }
  };

  return (
    <section id="downloads" className="py-24 bg-[#000000] border-t border-white/10 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#1d1d1f] border border-[#424245] text-[#2997ff] text-xs font-medium tracking-wide">
            <Download className="w-3.5 h-3.5" />
            <span className="uppercase text-[11px] font-semibold">NATIVE HARDWARE BUILDS</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-bold text-[#f5f5f7] tracking-tight">
            Application Downloads
          </h2>

          <p className="text-base sm:text-lg text-[#86868b]">
            For strict hardware-level screen capture and recording protection, run DocVault X as a verified native desktop or mobile application.
          </p>
        </div>

        {/* 4 Cards Grid with Real Brand Logos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((plat) => (
            <div
              key={plat.name}
              className="rounded-3xl bg-[#161617] border border-[#333336] hover:border-[#424245] p-6 flex flex-col justify-between transition-all duration-300 group hover:shadow-2xl"
            >
              <div>
                {/* Header with Real Platform Logo & Badge */}
                <div className="flex items-start justify-between mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-[#1d1d1f] border border-[#424245] flex items-center justify-center transition-colors shadow-sm">
                    {plat.icon}
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-medium tracking-wide uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Clock className="w-3 h-3" />
                    Coming Soon
                  </span>
                </div>

                {/* Name & OS */}
                <h3 className="text-lg font-semibold text-[#f5f5f7] group-hover:text-white transition-colors">
                  {plat.name}
                </h3>
                <div className="text-xs text-[#86868b] mt-0.5">{plat.os}</div>
                <div className="text-[11px] font-mono text-[#2997ff] mt-1">{plat.architecture}</div>

                {/* Security Highlights */}
                <div className="mt-6 space-y-2 pt-4 border-t border-[#333336]">
                  <div className="text-[10px] font-mono font-medium uppercase text-[#86868b] tracking-wider">
                    Native Security Features
                  </div>
                  {plat.securityFeatures.map((feat) => (
                    <div key={feat} className="flex items-start gap-1.5 text-xs text-[#a1a1a6]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2997ff] shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Apple Pill Style */}
              <div className="mt-6 pt-4 border-t border-[#333336]">
                <button
                  onClick={() => handleNotifyClick(plat.name)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium text-[#f5f5f7] bg-[#1d1d1f] hover:bg-[#252528] border border-[#424245] transition-all active:scale-98"
                >
                  <Bell className="w-3.5 h-3.5 text-[#2997ff]" />
                  <span>Notify on Release</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notify Modal */}
      {notifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[#17253A] border border-slate-700 p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setNotifyModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#161617] border border-[#333336] flex items-center justify-center text-[#2997ff]">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#f5f5f7]">Release Notification</h4>
                <p className="text-xs text-[#86868b]">Target build: {selectedPlatform}</p>
              </div>
            </div>

            {subscribed ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                <div className="font-bold">You are on the priority notification list!</div>
                <div className="text-[11px] text-[#86868b]">We will notify you immediately once the signed binary is ready.</div>
              </div>
            ) : (
              <form onSubmit={handleNotifySubmit} className="space-y-3">
                <p className="text-xs text-[#86868b] leading-relaxed">
                  Enter your work email to receive early access binaries and cryptographic checksums as soon as the verified build passes security notarization.
                </p>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full px-4 py-2.5 rounded-full bg-[#161617] border border-[#333336] text-[#f5f5f7] text-xs focus:outline-none focus:border-[#0071e3] transition placeholder:text-[#6e6e73]"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full font-medium text-xs text-white bg-[#0071e3] hover:bg-[#0077ed] transition shadow-sm"
                >
                  Join Release Notification List
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
