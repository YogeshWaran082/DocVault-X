import React, { useState } from 'react';
import { LandingNav } from './LandingNav';
import { HeroSection } from './HeroSection';
import { SupportedFormats } from './SupportedFormats';
import { SecurityShowcase } from './SecurityShowcase';
import { HowItWorks } from './HowItWorks';
import { AppShowcase } from './AppShowcase';
import { FaqSection } from './FaqSection';
import { LandingFooter } from './LandingFooter';
import { LiveDemoViewerModal } from './LiveDemoViewerModal';

interface LandingPageProps {
  onOpenLogin: () => void;
  onOpenDashboard: () => void;
  onOpenDvx: () => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onOpenDashboard,
  onOpenDvx,
  isAuthenticated,
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleExploreFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-theme min-h-screen bg-[#030303] text-[#f5f5f7] font-sans selection:bg-[#FF6A00] selection:text-white overflow-x-hidden transition-colors duration-300">
      {/* Fixed Sticky Navigation */}
      <LandingNav
        isAuthenticated={isAuthenticated}
        onTryApp={() => setIsViewerOpen(true)}
        onOpenLogin={onOpenLogin}
        onOpenDashboard={onOpenDashboard}
      />

      {/* Main Landing Sections */}
      <main>
        {/* Hero Section with Realistic Interactive Mockup */}
        <HeroSection
          onExploreFeatures={handleExploreFeatures}
          onTryApp={() => setIsViewerOpen(true)}
        />

        {/* Supported File Formats */}
        <SupportedFormats />

        {/* Security Features & Platform Screenshot Matrix */}
        <SecurityShowcase />

        {/* How It Works - 3 Step Visual */}
        <HowItWorks />

        {/* Application Showcase - Multi-Platform Tabs */}
        <AppShowcase />

        {/* FAQ - Deep Technical Clarifications */}
        <FaqSection />
      </main>

      <LandingFooter onTryApp={() => setIsViewerOpen(true)} />

      <LiveDemoViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        onOpenDvx={onOpenDvx}
      />
    </div>
  );
};
