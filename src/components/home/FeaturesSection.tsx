import React, { useState } from 'react';
import {
  BookOpen, BarChart2, Video, Award, Users, Smartphone,
  Shield, Zap, MessageSquare
} from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Drag-and-Drop Course Builder',
    description: 'Create rich, structured courses with videos, PDFs, quizzes, and assignments — all from a beautifully simple editor. No technical expertise required.',
    tag: 'Core',
    highlight: false,
  },
  {
    icon: BarChart2,
    title: 'Real-Time Analytics',
    description: 'Track student engagement, completion rates, assessment performance, and learning outcomes with intuitive dashboards built for educators.',
    tag: 'Analytics',
    highlight: true,
  },
  {
    icon: Video,
    title: 'Live Class Integration',
    description: 'Host interactive live sessions with built-in video conferencing, virtual whiteboards, and real-time Q&A — no third-party tools needed.',
    tag: 'Live',
    highlight: false,
  },
  {
    icon: Award,
    title: 'Verified Certificates',
    description: 'Issue branded, blockchain-verified certificates upon course completion. Students can share credentials directly to LinkedIn.',
    tag: 'Credentials',
    highlight: false,
  },
  {
    icon: Users,
    title: 'Multi-Role Permissions',
    description: 'Manage students, teachers, parents, and administrators with fine-grained role permissions. Built for schools, colleges, and academies.',
    tag: 'Management',
    highlight: false,
  },
  {
    icon: Smartphone,
    title: 'Mobile-First Learning',
    description: 'Full-featured iOS and Android apps let students learn anywhere. Offline mode ensures continuity in areas with limited connectivity.',
    tag: 'Mobile',
    highlight: false,
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'End-to-end encryption, GDPR compliance, two-factor authentication, and regular security audits keep your institution\'s data safe.',
    tag: 'Security',
    highlight: false,
  },
  {
    icon: Zap,
    title: 'AI-Powered Insights',
    description: 'Scholario\'s AI suggests personalized learning paths, flags at-risk students early, and automates tedious administrative tasks.',
    tag: 'AI',
    highlight: true,
  },
  {
    icon: MessageSquare,
    title: 'Communication Tools',
    description: 'Built-in messaging, announcements, discussion forums, and parent notifications keep everyone informed and engaged.',
    tag: 'Communication',
    highlight: false,
  },
];

const FeaturesSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Core', 'Analytics', 'Live', 'AI', 'Security'];

  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="section-label justify-center mb-4">Features</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] mb-5 leading-tight">
            Everything you need to
            <br />
            run a modern institution
          </h2>
          <p className="text-xl text-[#737373] max-w-2xl mx-auto leading-relaxed">
            Scholario is the complete operating system for modern education — designed from the ground up for the Pakistani context.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border ${
                activeCategory === cat
                  ? 'bg-[#111111] text-white border-[#111111]'
                  : 'bg-white text-[#525252] border-[#E5E5E5] hover:border-[#D4D4D4] hover:text-[#111111]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group relative p-6 rounded-2xl border transition-all duration-250 cursor-pointer ${
                  feature.highlight
                    ? 'bg-[#111111] border-[#111111] text-white'
                    : 'bg-white border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-lg hover:-translate-y-1'
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Tag */}
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{
                      background: feature.highlight ? '#1F1F1F' : '#F5F5F5',
                    }}
                  >
                    <Icon
                      size={20}
                      style={{ color: feature.highlight ? '#F4C430' : '#111111' }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                    style={{
                      background: feature.highlight ? 'rgba(244,196,48,0.15)' : '#F5F5F5',
                      color: feature.highlight ? '#F4C430' : '#737373',
                    }}
                  >
                    {feature.tag}
                  </span>
                </div>

                <h3
                  className="text-base font-bold mb-2.5 leading-snug"
                  style={{ color: feature.highlight ? '#ffffff' : '#111111' }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: feature.highlight ? '#A3A3A3' : '#737373' }}
                >
                  {feature.description}
                </p>

                {/* Hover indicator */}
                {!feature.highlight && (
                  <div className="absolute bottom-5 right-5 w-7 h-7 rounded-full bg-[#F5F5F5] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 10L10 2M10 2H4M10 2V8" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <p className="text-[#737373] text-base mb-4">
            And many more features — <span className="text-[#111111] font-semibold">with new ones shipping every week.</span>
          </p>
          <button className="btn btn-ghost btn-md">
            View Full Feature List →
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
