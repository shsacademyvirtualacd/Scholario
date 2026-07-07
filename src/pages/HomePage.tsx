import React from 'react';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import ComparisonSection from '../components/home/ComparisonSection';
import PricingSection from '../components/home/PricingSection';
import FAQSection from '../components/home/FAQSection';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <main>
      <HeroSection onNavigate={onNavigate} />
      <FeaturesSection />
      <HowItWorksSection onNavigate={onNavigate} />
      <ComparisonSection />
      <PricingSection />
      <FAQSection />
    </main>
  );
};

export default HomePage;
