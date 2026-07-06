import React from 'react';
import { ArrowRight, Sparkles, Shield, Zap, Play } from 'lucide-react';
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
          <button
            onClick={() => onNavigate('home')}
            className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-[#E5E5E5] bg-white hover:border-[#F4C430] hover:bg-[#FFFBF0] transition-all duration-300 shadow-sm cursor-pointer"
          >
            <span
              className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0"
              style={{ background: '#F4C430', color: '#111111' }}
            >
              <Sparkles size={10} />
            </span>
            <span className="text-sm font-medium text-[#525252]">
              AI-powered lesson planning is now live for educators
            </span>
            <ArrowRight
              size={14}
              className="text-[#A3A3A3] group-hover:text-[#111111] group-hover:translate-x-0.5 transition-all duration-200"
            />
          </button>
        </div>

        {/* Headline */}
        <div
          className="text-center mb-8 max-w-5xl mx-auto animate-fade-up"
          style={{ animationDelay: '80ms' }}
        >
          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-extrabold tracking-tight text-[#111111] leading-[1.03] mb-6">
            The modern LMS
            <br />
            built for{' '}
            <span className="relative inline-block">
              <span style={{ color: '#F4C430' }}>Pakistan</span>
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
            's classrooms
          </h1>
          <p className="text-xl md:text-2xl text-[#737373] font-normal leading-relaxed max-w-3xl mx-auto">
            Scholario gives educators and institutions a beautiful, powerful platform
            to create courses, manage students, and deliver exceptional learning experiences.
          </p>
        </div>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row gap-3 justify-center mb-7 animate-fade-up"
          style={{ animationDelay: '160ms' }}
        >
          <button onClick={() => onNavigate('student')} className="btn btn-primary btn-lg group">
            Start for Free
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
          <button onClick={() => onNavigate('student')} className="btn btn-ghost btn-lg gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: '#F5F5F5' }}
            >
              <Play size={11} className="text-[#111111] translate-x-0.5" />
            </div>
            Watch 2-min Demo
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

        {/* Social proof / stats strip */}
        <div
          className="flex flex-wrap items-stretch justify-center gap-0 mb-16 rounded-2xl border border-[#E5E5E5] bg-white shadow-sm overflow-hidden animate-fade-up max-w-3xl mx-auto"
          style={{ animationDelay: '280ms' }}
        >
          {[
            { value: '50,000+', label: 'Active Learners', emoji: '🎓' },
            { value: '1,200+', label: 'Courses Created', emoji: '📚' },
            { value: '98%', label: 'Satisfaction Rate', emoji: '⭐' },
            { value: '200+', label: 'Institutions', emoji: '🏫' },
          ].map(({ value, label, emoji }, i, arr) => (
            <div
              key={label}
              className={`flex-1 flex flex-col items-center justify-center py-5 px-4 text-center min-w-[120px] ${
                i < arr.length - 1 ? 'border-r border-[#F0F0F0]' : ''
              }`}
            >
              <div className="text-xl mb-1">{emoji}</div>
              <div className="text-2xl font-extrabold text-[#111111] tracking-tight">{value}</div>
              <div className="text-xs text-[#737373] mt-0.5 font-medium">{label}</div>
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
