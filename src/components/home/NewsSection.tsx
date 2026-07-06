import React from 'react';
import { ArrowRight, Calendar, Clock } from 'lucide-react';

const articles = [
  {
    tag: 'EdTech',
    tagColor: '#3b82f6',
    title: 'Scholario Raises $5M Seed Round to Accelerate Digital Education Across Pakistan',
    excerpt: 'The funding will be used to expand Scholario\'s platform capabilities, grow the educator network, and extend coverage to underserved regions of Pakistan.',
    date: 'July 10, 2025',
    readTime: '4 min read',
    image: 'https://images.pexels.com/photos/577210/pexels-photo-577210.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600',
  },
  {
    tag: 'Product',
    tagColor: '#F4C430',
    title: 'Introducing AI-Powered Lesson Planning: Build Complete Curricula in Minutes',
    excerpt: 'Our new AI assistant can generate lesson plans, learning objectives, quiz questions, and assignment rubrics — all tailored to Pakistani curricula standards.',
    date: 'June 28, 2025',
    readTime: '6 min read',
    image: 'https://images.pexels.com/photos/577195/pexels-photo-577195.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600',
  },
  {
    tag: 'Impact',
    tagColor: '#22c55e',
    title: 'How Scholario Helped 200+ Rural Schools Go Digital Without Breaking the Budget',
    excerpt: 'A deep dive into Scholario\'s Rural Access Program — bringing modern education tools to areas with limited infrastructure and resources.',
    date: 'June 15, 2025',
    readTime: '8 min read',
    image: 'https://images.pexels.com/photos/7013070/pexels-photo-7013070.png?auto=compress&cs=tinysrgb&fit=crop&h=400&w=600',
  },
];

const NewsSection: React.FC = () => {
  return (
    <section className="py-28 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <span className="section-label mb-4">News & Updates</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] leading-tight">
              Latest from
              <br />
              Scholario
            </h2>
          </div>
          <button className="btn btn-ghost btn-md self-start md:self-auto">
            View All Posts <ArrowRight size={16} />
          </button>
        </div>

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article, i) => (
            <article
              key={article.title}
              className={`group bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:border-[#D4D4D4] hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer ${
                i === 0 ? 'md:col-span-1' : ''
              }`}
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden bg-[#F5F5F5]">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                {/* Tag */}
                <span
                  className="absolute top-4 left-4 badge text-[11px]"
                  style={{
                    background: `${article.tagColor}20`,
                    color: article.tag === 'Product' ? '#111111' : article.tagColor,
                    border: `1px solid ${article.tagColor}40`,
                    backdropFilter: 'blur(8px)',
                    backgroundColor: `${article.tagColor === '#F4C430' ? '#FFFBF0' : article.tagColor + '15'}`,
                  }}
                >
                  {article.tag}
                </span>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="font-bold text-[#111111] text-base leading-snug mb-3 group-hover:text-[#1a1a1a]">
                  {article.title}
                </h3>
                <p className="text-sm text-[#737373] leading-relaxed mb-5 line-clamp-2">
                  {article.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-[#A3A3A3]">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={11} />
                      {article.date}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} />
                      {article.readTime}
                    </span>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-[#D4D4D4] group-hover:text-[#111111] group-hover:translate-x-1 transition-all duration-200"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
