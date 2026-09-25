import React from 'react';
import { ShieldCheck, BookOpen, Clock, Lock } from 'lucide-react';

const institutionalPillars = [
  {
    icon: BookOpen,
    title: 'Curriculum & Board Alignment',
    description: 'Structured course plans mapped directly to Federal Board (FBISE Class 9–12), Cambridge (O/A Levels), and IELTS standards with full topic breakdowns.',
  },
  {
    icon: Lock,
    title: 'Zero Third-Party Ad Trackers',
    description: 'Student data is protected with zero commercial tracking, no advertising beacons, and encrypted database isolation on Supabase and Cloudflare R2.',
  },
  {
    icon: Clock,
    title: 'Live Timetable Synchronized',
    description: 'Instant schedule notifications and admin-verified teacher links ensure students never miss live interactive lecture sessions.',
  },
];

export const TrustSection: React.FC = () => {
  return (
    <section className="py-24 bg-white dark:bg-[#111111]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D4A017] bg-[#FFFBF0] dark:bg-amber-950/40 px-3 py-1 rounded-full border border-[#FDE68A] dark:border-amber-800/40 mb-3">
            <ShieldCheck size={14} />
            Institutional Standards
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#111111] dark:text-white tracking-tight">
            Built for Academic Integrity & Focused Study
          </h2>
          <p className="text-sm text-[#737373] dark:text-[#A3A3A3] max-w-xl mx-auto mt-2">
            SHS Virtual Academy operates on educational rigor, transparent billing, and zero marketing distraction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {institutionalPillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="p-6 rounded-2xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#181818] space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FFFBF0] dark:bg-amber-950/40 border border-[#FDE68A] dark:border-amber-800/40 text-[#D4A017] flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <h3 className="text-base font-bold text-[#111111] dark:text-white">{p.title}</h3>
                <p className="text-xs text-[#525252] dark:text-[#A3A3A3] leading-relaxed">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
