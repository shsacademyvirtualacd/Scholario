import React, { useState } from 'react';
import {
  BookOpen, Video, LayoutDashboard, FileText, Bell, ClipboardList
} from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Interactive Dashboards',
    description: 'Track active courses, student grades, attendance records, and platform health at a glance with clean, dedicated views.',
    tag: 'Analytics',
    highlight: true,
  },
  {
    icon: BookOpen,
    title: 'Course Management',
    description: 'Organize study streams (ICS, Pre-Med, Pre-Eng), upload notes, share documents, and track individual course progress.',
    tag: 'Core',
    highlight: false,
  },
  {
    icon: Video,
    title: 'Live Class Scheduling',
    description: 'Check daily calendars for scheduled live lectures, interactive sessions, and recorded class links directly from the portal.',
    tag: 'Live',
    highlight: false,
  },
  {
    icon: ClipboardList,
    title: 'Attendance Tracking',
    description: 'Seamlessly record and review student attendance. Access attendance rate charts and trace remaining class slots dynamically.',
    tag: 'Management',
    highlight: false,
  },
  {
    icon: FileText,
    title: 'Resource Library',
    description: 'Access or share course-specific study resources, worksheets, past papers, syllabus files, and lecture notes instantly.',
    tag: 'Core',
    highlight: false,
  },
  {
    icon: Bell,
    title: 'Announcements Broadcast',
    description: 'Broadcast and read institution-wide updates filtered by categories, complete with unread notification badges.',
    tag: 'Communication',
    highlight: true,
  },
];

const FeaturesSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', 'Core', 'Analytics', 'Live', 'Management', 'Communication'];

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
          {features
            .filter((f) => activeCategory === 'All' || f.tag === activeCategory)
            .map((feature, i) => {
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

      </div>
    </section>
  );
};

export default FeaturesSection;
