import React from 'react';
import { Quote, Star } from 'lucide-react';

const testimonials = [
  {
    quote: "Scholario transformed how we deliver education at our institution. The platform is intuitive, fast, and our students actually enjoy using it. We've seen a 40% increase in course completion rates.",
    author: 'Zainab Naqvi',
    role: 'Principal, Beacon House School System',
    avatar: 'ZN',
    rating: 5,
  },
  {
    quote: "As an educator from a traditional background, I was skeptical about online LMS platforms. But Scholario made the transition seamless. The analytics help me identify struggling students before they fall behind.",
    author: 'Prof. Imran Baig',
    role: 'Senior Faculty, Punjab University',
    avatar: 'IB',
    rating: 5,
  },
  {
    quote: "I prepared for my ECAT exam entirely through Scholario. The content was well-structured, the live sessions were incredibly helpful, and the progress tracking kept me motivated throughout.",
    author: 'Sana Mirza',
    role: 'Engineering Student, UET Lahore',
    avatar: 'SM',
    rating: 5,
  },
];

const logos = [
  { name: 'LUMS', abbr: 'LUMS' },
  { name: 'NUST', abbr: 'NUST' },
  { name: 'IBA', abbr: 'IBA' },
  { name: 'Punjab University', abbr: 'PU' },
  { name: 'FAST', abbr: 'FAST' },
  { name: 'Aga Khan University', abbr: 'AKU' },
  { name: 'Karachi University', abbr: 'KU' },
];

const TrustSection: React.FC = () => {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Trusted By */}
        <div className="text-center mb-20">
          <p className="text-sm font-semibold text-[#A3A3A3] uppercase tracking-widest mb-8">
            Trusted by Pakistan's leading institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {logos.map(({ name, abbr }) => (
              <div
                key={name}
                className="flex items-center justify-center h-10 px-6 rounded-xl border border-[#E5E5E5] bg-white hover:border-[#D4D4D4] hover:shadow-sm transition-all duration-200 cursor-pointer"
              >
                <span className="text-sm font-extrabold text-[#D4D4D4] tracking-widest hover:text-[#A3A3A3] transition-colors">
                  {abbr}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-8">
          <span className="section-label justify-center mb-4">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-center tracking-tight text-[#111111] mb-4">
            Loved by educators
            <br />and learners alike
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-12">
          {testimonials.map((t, i) => (
            <div
              key={t.author}
              className={`relative p-7 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                i === 1
                  ? 'bg-[#111111] border-[#111111]'
                  : 'bg-white border-[#E5E5E5]'
              }`}
            >
              {/* Quote icon */}
              <Quote
                size={24}
                className="mb-5"
                style={{ color: i === 1 ? '#F4C430' : '#F4C430', opacity: 0.7 }}
              />

              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star
                    key={si}
                    size={13}
                    className="fill-[#F4C430] text-[#F4C430]"
                  />
                ))}
              </div>

              <p
                className="text-base leading-relaxed mb-6 font-medium"
                style={{ color: i === 1 ? '#D4D4D4' : '#262626' }}
              >
                "{t.quote}"
              </p>

              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    background: i === 1 ? '#F4C430' : '#111111',
                    color: i === 1 ? '#111111' : '#ffffff',
                  }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: i === 1 ? '#ffffff' : '#111111' }}
                  >
                    {t.author}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: i === 1 ? '#737373' : '#A3A3A3' }}
                  >
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Review aggregate */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 py-8 border-t border-[#F0F0F0]">
          <div className="flex items-center gap-1">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} size={20} className="fill-[#F4C430] text-[#F4C430]" />
            ))}
          </div>
          <div className="text-center sm:text-left">
            <span className="text-3xl font-extrabold text-[#111111]">4.9/5</span>
            <span className="text-[#737373] ml-2 text-sm">from 2,000+ reviews</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
