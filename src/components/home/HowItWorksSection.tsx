import { UserPlus, BookOpen, BarChart2 } from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up in under 60 seconds. No credit card required. Choose between educator, student, or institution roles.',
    color: '#F4C430',
  },
  {
    number: '02',
    icon: BookOpen,
    title: 'Manage or Access Courses',
    description: 'Educators organize classes and resource materials. Students view and access their active enrolled subjects.',
    color: '#3b82f6',
  },
  {
    number: '03',
    icon: BarChart2,
    title: 'Track Progress in Real-Time',
    description: 'Monitor course metrics, grading charts, and class attendance records with active live dashboards.',
    color: '#22c55e',
  },
];

interface HowItWorksSectionProps {
  onNavigate?: (page: string) => void;
}

const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onNavigate }) => {
  return (
    <section className="py-28 bg-[#FAFAFA] relative overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"
        style={{
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-20">
          <span className="section-label justify-center mb-4">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] mb-5 leading-tight">
            Up and running
            <br />
            in minutes
          </h2>
          <p className="text-xl text-[#737373] max-w-xl mx-auto">
            Scholario is designed to be immediately intuitive — no training, no onboarding calls, no waiting.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connector line */}
          <div
            className="absolute top-10 left-0 right-0 h-px hidden lg:block"
            style={{
              background: 'linear-gradient(to right, transparent, #E5E5E5 10%, #E5E5E5 90%, transparent)',
              top: '3rem',
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative flex flex-col items-center text-center group">
                  {/* Step number + Icon */}
                  <div className="relative mb-6">
                    <div
                      className="w-20 h-20 rounded-2xl border-2 bg-white flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1"
                      style={{ borderColor: '#E5E5E5' }}
                    >
                      <Icon size={28} style={{ color: step.color }} />
                    </div>
                    {/* Number badge */}
                    <div
                      className="absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-extrabold"
                      style={{ background: step.color, color: i === 0 ? '#111111' : '#ffffff' }}
                    >
                      {i + 1}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="text-[11px] font-bold tracking-widest text-[#A3A3A3] mb-2 uppercase">
                    Step {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-[#111111] mb-3 leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#737373] leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <div
            className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white border border-[#E5E5E5] rounded-2xl px-8 py-6 shadow-sm"
          >
            <div className="text-left">
              <div className="font-bold text-[#111111]">Ready to get started?</div>
              <div className="text-sm text-[#737373]">Create your account today and start tracking your education.</div>
            </div>
            <button 
              onClick={() => onNavigate && onNavigate('register')}
              className="btn btn-primary btn-md shrink-0"
            >
              Create Account →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
