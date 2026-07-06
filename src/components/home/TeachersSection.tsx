import React from 'react';
import { Star, BookOpen, Users, ArrowRight } from 'lucide-react';

const teachers = [
  {
    name: 'Dr. Ayesha Siddiqui',
    subject: 'Mathematics & Statistics',
    institution: 'University of Lahore',
    rating: 4.9,
    students: 3200,
    courses: 12,
    bio: 'Former head of Mathematics at UoL with 15+ years of teaching excellence. Known for making calculus accessible to everyone.',
    photo: 'https://images.pexels.com/photos/5212321/pexels-photo-5212321.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=300',
    tags: ['Calculus', 'Statistics', 'Linear Algebra'],
  },
  {
    name: 'Prof. Tariq Mehmood',
    subject: 'Physics & Engineering',
    institution: 'NUST Islamabad',
    rating: 4.8,
    students: 2800,
    courses: 9,
    bio: 'Award-winning physics educator and researcher. Pioneered online STEM education in Pakistan through practical, project-based learning.',
    photo: 'https://images.pexels.com/photos/37811217/pexels-photo-37811217.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=300',
    tags: ['Quantum Physics', 'Mechanics', 'Thermodynamics'],
  },
  {
    name: 'Ms. Fatima Zahra',
    subject: 'English Literature & Writing',
    institution: 'Kinnaird College, Lahore',
    rating: 4.9,
    students: 4100,
    courses: 15,
    bio: 'Published author and literary scholar. Specializes in helping students master English for academic and professional success.',
    photo: 'https://images.pexels.com/photos/37827733/pexels-photo-37827733.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=300',
    tags: ['Academic Writing', 'Literature', 'IELTS Prep'],
  },
  {
    name: 'Mr. Hassan Ali',
    subject: 'Computer Science & AI',
    institution: 'LUMS, Lahore',
    rating: 4.7,
    students: 5600,
    courses: 18,
    bio: 'Silicon Valley veteran turned educator. Brings real-world software engineering experience to his courses on algorithms, ML, and web development.',
    photo: 'https://images.pexels.com/photos/5905753/pexels-photo-5905753.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=400&w=300',
    tags: ['Python', 'Machine Learning', 'Data Structures'],
  },
];

const TeachersSection: React.FC = () => {
  return (
    <section className="py-28 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
          <div>
            <span className="section-label mb-4">Our Educators</span>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] leading-tight">
              Learn from
              <br />
              Pakistan's finest
            </h2>
          </div>
          <p className="text-[#737373] text-lg max-w-sm leading-relaxed md:text-right">
            Our curated network of expert educators brings decades of academic and professional excellence to your screen.
          </p>
        </div>

        {/* Teacher Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {teachers.map((teacher) => (
            <div
              key={teacher.name}
              className="group bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:border-[#D4D4D4] hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer"
            >
              {/* Photo */}
              <div className="relative h-52 overflow-hidden bg-[#F5F5F5]">
                <img
                  src={teacher.photo}
                  alt={teacher.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                {/* Rating pill */}
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full shadow-sm border border-[#F0F0F0]">
                  <Star size={11} className="fill-[#F4C430] text-[#F4C430]" />
                  <span className="text-[11px] font-bold text-[#111111]">{teacher.rating}</span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="mb-3">
                  <h3 className="font-bold text-[#111111] text-base leading-tight mb-0.5">{teacher.name}</h3>
                  <p className="text-xs font-semibold text-[#F4C430]">{teacher.subject}</p>
                  <p className="text-xs text-[#A3A3A3] mt-0.5">{teacher.institution}</p>
                </div>

                <p className="text-xs text-[#737373] leading-relaxed mb-4 line-clamp-2">
                  {teacher.bio}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 py-3 border-y border-[#F5F5F5]">
                  <div className="flex items-center gap-1.5">
                    <Users size={12} className="text-[#A3A3A3]" />
                    <span className="text-xs font-semibold text-[#525252]">{teacher.students.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={12} className="text-[#A3A3A3]" />
                    <span className="text-xs font-semibold text-[#525252]">{teacher.courses} courses</span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {teacher.tags.map((tag) => (
                    <span key={tag} className="badge badge-gray text-[10px]">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* View Profile - appears on hover */}
                <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button className="btn btn-ghost btn-sm w-full text-xs">
                    View Profile <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-[#737373] mb-4">
            Join <span className="font-semibold text-[#111111]">500+ expert educators</span> already on Scholario
          </p>
          <button className="btn btn-primary btn-md">
            Become an Educator <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};

export default TeachersSection;
