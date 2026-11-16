import React from 'react';
import { LandingNav } from './LandingNav';
import { HeroSection } from './HeroSection';
import { SupportedFormats } from './SupportedFormats';
import { SecurityShowcase } from './SecurityShowcase';
import { HowItWorks } from './HowItWorks';
import { AppShowcase } from './AppShowcase';
import { DownloadsSection } from './DownloadsSection';
import { FaqSection } from './FaqSection';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onNavigateToAdmin: () => void;
  onOpenDvx: () => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToAdmin,
  isAuthenticated,
}) => {
  const handleExploreFeatures = () => {
    const el = document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-[#f5f5f7] font-sans selection:bg-[#FF6A00] selection:text-white overflow-x-hidden">
      {/* Fixed Sticky Navigation */}
      <LandingNav
        isAuthenticated={isAuthenticated}
      />

      {/* Main Landing Sections */}
      <main>
        {/* Hero Section with Realistic Interactive Mockup */}
        <HeroSection
          onExploreFeatures={handleExploreFeatures}
        />

        {/* Supported File Formats */}
        <SupportedFormats />

        {/* Security Features & Platform Screenshot Matrix */}
        <SecurityShowcase />

        {/* How It Works - 3 Step Visual */}
        <HowItWorks />

        {/* Application Showcase - Multi-Platform Tabs */}
        <AppShowcase />

        {/* Application Downloads - Native OS Builds */}
        <DownloadsSection />

        {/* FAQ - Deep Technical Clarifications */}
        <FaqSection />
      </main>

      {/* Footer with 3-Click Facebook Admin Easter Egg */}
      <LandingFooter
        onTriggerAdmin={onNavigateToAdmin}
      />
    </div>
  );
};
