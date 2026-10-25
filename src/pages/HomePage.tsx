import React from 'react';
import HeroSection from '../components/home/HeroSection';
import LandingAndroidPromoCard from '../components/home/LandingAndroidPromoCard';
import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import ComparisonSection from '../components/home/ComparisonSection';
import PricingSection from '../components/home/PricingSection';
import FAQSection from '../components/home/FAQSection';
import PublicTangoGuide from '../components/home/PublicTangoGuide';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <main className="relative">
      <HeroSection onNavigate={onNavigate} />
      <LandingAndroidPromoCard />
      <FeaturesSection />
      <HowItWorksSection onNavigate={onNavigate} />
      <ComparisonSection />
      <PricingSection />
      <FAQSection />
      {/* Slow-roaming Tango Cat Guide on the public home page before login */}
      <PublicTangoGuide onNavigate={onNavigate} />
    </main>
  );
};

export default HomePage;
