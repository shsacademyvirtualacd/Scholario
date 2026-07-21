import React from 'react';
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react';
import DashboardPreview from './DashboardPreview';

interface HeroSectionProps {
  onNavigate: (page: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-white">
      {/* Background dot pattern */}
      <div
        className="absolute inset-0 bg-dot-pattern opacity-50 pointer-events-none"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 80% at 50% 30%, black 50%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 50% 30%, black 50%, transparent 100%)',
        }}
      />

      {/* Gold ambient glow — top */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-5%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '800px',
          height: '400px',
          background: 'radial-gradient(ellipse, rgba(244,196,48,0.06) 0%, transparent 70%)',
        }}
      />

      {/* Left gold accent */}
      <div
        className="absolute left-0 top-1/4 pointer-events-none hidden lg:block"
        style={{
          width: '320px',
          height: '320px',
          background: 'radial-gradient(ellipse, rgba(244,196,48,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-20">
        {/* Announcement Banner */}
        <div className="flex justify-center mb-10 animate-fade-up" style={{ animationDelay: '0ms' }}>
          <div
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white shadow-sm"
          >
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
              style={{ background: '#F4C430', color: '#111111' }}
            >
              <Sparkles size={10} />
            </span>
            <span className="text-sm font-medium text-[#525252]">
              Built for SHS Academy
            </span>
          </div>
        </div>

        {/* Headline */}
        <div
          className="text-center mb-8 max-w-5xl mx-auto animate-fade-up"
          style={{ animationDelay: '80ms' }}
        >
          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-tight text-[#111111] leading-[1.03] mb-6">
            The Official Virtual Academy Portal for{' '}
            <span className="relative inline-block">
              <span style={{ color: '#F4C430' }}>SHS Academy</span>
              <svg
                className="absolute w-full"
                style={{ bottom: '-6px', left: 0 }}
                height="8"
                viewBox="0 0 200 8"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 6 Q50 1 100 5 Q150 9 200 4"
                  stroke="#F4C430"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-[#737373] font-normal leading-relaxed max-w-3xl mx-auto">
            Built exclusively for SHS Academy students — live FBISE 9th–12th classes, subject note vaults, and daily timetables in one private learning hub.
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-3 justify-center mb-7 animate-fade-up"
          style={{ animationDelay: '160ms' }}
        >
          <button onClick={() => onNavigate('login')} className="btn btn-primary btn-lg group interactive">
            Get Started
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>

        {/* Trust indicators */}
        <div
          className="flex flex-wrap items-center justify-center gap-5 mb-16 animate-fade-up"
          style={{ animationDelay: '220ms' }}
        >
          {[
            { icon: Shield, text: 'Enterprise Security' },
            { icon: Zap, text: '99.9% Uptime SLA' },
            { icon: Sparkles, text: 'AI-Powered' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-[#737373]">
              <Icon size={14} style={{ color: '#F4C430' }} />
              {text}
            </div>
          ))}
        </div>



        {/* Dashboard Preview */}
        <div
          className="relative max-w-6xl mx-auto animate-fade-up"
          style={{ animationDelay: '360ms' }}
        >
          {/* Subtle shadow beneath */}
          <div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-24 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.08) 0%, transparent 70%)',
              filter: 'blur(12px)',
            }}
          />
          {/* Gold glow beneath */}
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[60%] h-16 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse, rgba(244,196,48,0.12) 0%, transparent 70%)',
            }}
          />
          <DashboardPreview />
        </div>

        {/* Scroll hint */}
        <div className="flex justify-center mt-14">
          <div className="flex flex-col items-center gap-1.5 text-[#D4D4D4]">
            <div className="text-xs font-medium tracking-widest uppercase">Scroll to explore</div>
            <div className="w-5 h-8 border border-[#E5E5E5] rounded-full flex items-start justify-center pt-1.5">
              <div
                className="w-1 h-2 bg-[#F4C430] rounded-full"
                style={{ animation: 'scrollHint 1.5s ease-in-out infinite' }}
              />
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollHint {
          0%, 100% { transform: translateY(0); opacity: 1; }
          60% { transform: translateY(8px); opacity: 0.3; }
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
