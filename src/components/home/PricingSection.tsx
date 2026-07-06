import React, { useState } from 'react';
import { Check, ArrowRight, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: { monthly: 0, annual: 0 },
    description: 'Perfect for individual tutors and small academies getting started with digital learning.',
    features: [
      'Up to 50 students',
      '5 active courses',
      'Basic quiz builder',
      'Progress tracking',
      'Community forum access',
      'Email support',
    ],
    missing: ['Live classes', 'Custom branding', 'Advanced analytics', 'AI features'],
    cta: 'Get Started Free',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Growth',
    price: { monthly: 4999, annual: 3999 },
    description: 'Ideal for growing institutions that need powerful tools to manage and scale their education.',
    features: [
      'Up to 500 students',
      'Unlimited courses',
      'Advanced assessments',
      'Live class integration',
      'Custom branding',
      'Detailed analytics',
      'Parent portal',
      'Priority support',
      'AI lesson suggestions',
    ],
    missing: ['White-label platform', 'API access', 'Dedicated CSM'],
    cta: 'Start Free Trial',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: { monthly: null, annual: null },
    description: 'For large universities, school networks, and EdTech companies requiring a fully tailored solution.',
    features: [
      'Unlimited students',
      'Unlimited courses',
      'White-label platform',
      'Full API access',
      'Custom integrations',
      'Advanced AI tools',
      'Dedicated CSM',
      'SLA guarantee',
      'On-premise option',
      'Custom contracts',
    ],
    missing: [],
    cta: 'Talk to Sales',
    highlighted: false,
    badge: null,
  },
];

const PricingSection: React.FC = () => {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="section-label justify-center mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] mb-5 leading-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-[#737373] max-w-xl mx-auto mb-8">
            No hidden fees. No long-term lock-ins. Choose the plan that fits your institution.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-[#F5F5F5] rounded-full p-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                !annual ? 'bg-white text-[#111111] shadow-sm' : 'text-[#737373]'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
                annual ? 'bg-white text-[#111111] shadow-sm' : 'text-[#737373]'
              }`}
            >
              Annual
              <span className="badge badge-green text-[10px]">Save 20%</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-7 transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-[#111111] border-[#111111] shadow-2xl scale-[1.02]'
                  : 'bg-white border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-lg'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span
                    className="px-3.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: '#F4C430', color: '#111111' }}
                  >
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Plan name */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-base font-bold"
                    style={{ color: plan.highlighted ? '#ffffff' : '#111111' }}
                  >
                    {plan.name}
                  </span>
                  {plan.highlighted && (
                    <Zap size={14} style={{ color: '#F4C430' }} />
                  )}
                </div>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: plan.highlighted ? '#737373' : '#737373' }}
                >
                  {plan.description}
                </p>
              </div>

              {/* Price */}
              <div className="mb-7 pb-7 border-b" style={{ borderColor: plan.highlighted ? '#1F1F1F' : '#F0F0F0' }}>
                {plan.price.monthly === null ? (
                  <div>
                    <div
                      className="text-3xl font-extrabold tracking-tight mb-1"
                      style={{ color: plan.highlighted ? '#ffffff' : '#111111' }}
                    >
                      Custom
                    </div>
                    <div className="text-sm" style={{ color: plan.highlighted ? '#525252' : '#A3A3A3' }}>
                      Tailored to your institution
                    </div>
                  </div>
                ) : plan.price.monthly === 0 ? (
                  <div>
                    <div
                      className="text-3xl font-extrabold tracking-tight mb-1"
                      style={{ color: plan.highlighted ? '#ffffff' : '#111111' }}
                    >
                      Free
                    </div>
                    <div className="text-sm" style={{ color: plan.highlighted ? '#525252' : '#A3A3A3' }}>
                      Forever, no credit card needed
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm font-medium" style={{ color: plan.highlighted ? '#525252' : '#A3A3A3' }}>
                        PKR
                      </span>
                      <span
                        className="text-4xl font-extrabold tracking-tight"
                        style={{ color: plan.highlighted ? '#ffffff' : '#111111' }}
                      >
                        {annual
                          ? plan.price.annual?.toLocaleString()
                          : plan.price.monthly?.toLocaleString()}
                      </span>
                      <span className="text-sm font-medium" style={{ color: plan.highlighted ? '#525252' : '#A3A3A3' }}>
                        /mo
                      </span>
                    </div>
                    {annual && (
                      <div className="text-xs mt-1" style={{ color: plan.highlighted ? '#525252' : '#A3A3A3' }}>
                        Billed annually · PKR {((plan.price.annual || 0) * 12).toLocaleString()}/yr
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                className={`btn btn-md w-full mb-7 ${
                  plan.highlighted ? 'btn-gold' : 'btn-primary'
                }`}
              >
                {plan.cta}
                <ArrowRight size={16} />
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5">
                    <Check
                      size={15}
                      className="shrink-0 mt-0.5"
                      style={{ color: plan.highlighted ? '#F4C430' : '#22c55e' }}
                    />
                    <span
                      className="text-sm"
                      style={{ color: plan.highlighted ? '#D4D4D4' : '#525252' }}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Note */}
        <p className="text-center text-sm text-[#A3A3A3] mt-10">
          All prices in Pakistani Rupees (PKR). 14-day free trial on Growth plan. No credit card required.{' '}
          <a href="#" className="text-[#111111] underline underline-offset-2">
            Compare all features →
          </a>
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
