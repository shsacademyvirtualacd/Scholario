import React from 'react';
import { Check, X } from 'lucide-react';

const features = [
  'Modern, intuitive interface',
  'Built for Pakistan\'s curriculum',
  'Urdu language support',
  'AI-powered tools',
  'Live class integration',
  'Mobile app (iOS & Android)',
  'Real-time analytics',
  'Verified certificates',
  'Parent portal',
  'Affordable pricing (PKR)',
];

const competitors = [
  { name: 'Scholario', values: [true, true, true, true, true, true, true, true, true, true], highlight: true },
  { name: 'Moodle', values: [false, false, false, false, true, false, true, false, false, false] },
  { name: 'Google Classroom', values: [true, false, false, false, true, true, false, false, true, false] },
  { name: 'Edmodo', values: [true, false, false, false, false, true, false, false, true, false] },
];

const ComparisonSection: React.FC = () => {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="section-label justify-center mb-4">Why Scholario</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] mb-5 leading-tight">
            Built specifically
            <br />
            for Pakistan
          </h2>
          <p className="text-xl text-[#737373] max-w-xl mx-auto">
            Generic LMS platforms weren't built with Pakistani educators in mind. Scholario was.
          </p>
        </div>

        {/* Table */}
        <div className="table-container overflow-hidden">
          <table className="w-full">
            <thead>
              <tr>
                <th className="py-5 px-6 text-left text-xs font-bold uppercase tracking-widest text-[#A3A3A3] bg-[#FAFAFA] w-1/3">
                  Feature
                </th>
                {competitors.map((c) => (
                  <th
                    key={c.name}
                    className="py-5 px-4 text-center text-sm font-bold"
                    style={{
                      background: c.highlight ? '#111111' : '#FAFAFA',
                      color: c.highlight ? '#ffffff' : '#525252',
                    }}
                  >
                    <div className="flex flex-col items-center gap-1">
                      {c.highlight && (
                        <span
                          className="text-[9px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full mb-1"
                          style={{ background: '#F4C430', color: '#111111' }}
                        >
                          Recommended
                        </span>
                      )}
                      {c.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, fi) => (
                <tr key={feature} className={fi % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'}>
                  <td className="py-4 px-6 text-sm font-medium text-[#262626]">{feature}</td>
                  {competitors.map((c) => (
                    <td
                      key={c.name}
                      className="py-4 px-4 text-center"
                      style={{
                        background: c.highlight
                          ? fi % 2 === 0 ? '#141414' : '#111111'
                          : undefined,
                      }}
                    >
                      {c.values[fi] ? (
                        <div className="flex justify-center">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center"
                            style={{
                              background: c.highlight ? 'rgba(244,196,48,0.15)' : 'rgba(34,197,94,0.12)',
                            }}
                          >
                            <Check
                              size={13}
                              style={{ color: c.highlight ? '#F4C430' : '#22c55e' }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-[#F5F5F5]">
                            <X size={13} className="text-[#D4D4D4]" />
                          </div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-[#A3A3A3] mt-6">
          Comparison based on publicly available information as of July 2025. Some features may vary by plan.
        </p>
      </div>
    </section>
  );
};

export default ComparisonSection;
