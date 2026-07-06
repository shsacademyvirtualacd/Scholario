import React from 'react';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import HowItWorksSection from '../components/home/HowItWorksSection';
import TrustSection from '../components/home/TrustSection';
import TeachersSection from '../components/home/TeachersSection';
import ComparisonSection from '../components/home/ComparisonSection';
import PricingSection from '../components/home/PricingSection';
import NewsSection from '../components/home/NewsSection';
import FAQSection from '../components/home/FAQSection';

interface HomePageProps {
  onNavigate: (page: string) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <main>
      <HeroSection onNavigate={onNavigate} />
      <FeaturesSection />
      <HowItWorksSection />
      <TrustSection />
      <TeachersSection />
      <ComparisonSection />
      <PricingSection />
      <NewsSection />
      <FAQSection />
    </main>
  );
};

export default HomePage;
