import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: 'What is Scholario and who is it for?',
    a: 'Scholario is a premium Learning Management System designed specifically for Pakistan\'s educational ecosystem. It\'s built for schools, colleges, universities, academies, and independent educators who want a modern, professional platform to deliver digital education. Whether you manage 10 students or 10,000, Scholario scales with you.',
  },
  {
    q: 'Is Scholario free to use?',
    a: 'Scholario offers a generous free tier for individual educators and small teams. Paid plans unlock advanced features like custom branding, analytics, live class integrations, and priority support. We also offer special pricing for government schools and non-profit educational institutions.',
  },
  {
    q: 'Does Scholario support Urdu and other regional languages?',
    a: 'Yes. Scholario has full Urdu language support including RTL text rendering, Urdu course content, and a localized interface. We\'re actively working on support for Sindhi, Pashto, and Balochi as well.',
  },
  {
    q: 'Can I migrate from my existing LMS?',
    a: 'Absolutely. Scholario supports SCORM and xAPI content imports, along with CSV-based student and course data migration. Our onboarding team assists with migration from popular platforms like Google Classroom, Moodle, and Edmodo at no additional cost.',
  },
  {
    q: 'How does Scholario handle assessments and grading?',
    a: 'Scholario includes a comprehensive assessment engine supporting MCQs, short answers, file submissions, and live proctored exams. Grading can be manual, automatic, or AI-assisted. You can set custom rubrics, weight scores, and generate detailed grade reports.',
  },
  {
    q: 'Is Scholario compatible with the Pakistani national curriculum?',
    a: 'Yes. Scholario\'s course templates and resource library are aligned with HEC, FBISE, and provincial board standards. We\'ve worked with curriculum experts to ensure the platform meets regulatory requirements for accredited institutions.',
  },
  {
    q: 'What kind of support does Scholario offer?',
    a: 'All plans include email support and access to our documentation and community forums. Growth and Enterprise plans include dedicated account managers, priority live chat support, and onboarding assistance. We also offer weekly free webinars for new users.',
  },
  {
    q: 'How secure is the platform?',
    a: 'Scholario is built with enterprise-grade security from the ground up. All data is encrypted in transit and at rest. We conduct regular third-party security audits, maintain strict data privacy policies compliant with international standards, and never sell user data.',
  },
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-28 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="section-label justify-center mb-4">FAQ</span>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#111111] mb-4">
            Frequently asked
            <br />
            questions
          </h2>
          <p className="text-[#737373] text-lg max-w-xl mx-auto">
            Everything you need to know about Scholario. Can't find what you're looking for?{' '}
            <a href="#" className="text-[#111111] font-semibold underline underline-offset-2">
              Chat with us.
            </a>
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className={`accordion-item ${openIndex === i ? 'border-[#D4D4D4] shadow-sm' : ''}`}
            >
              <button
                className="accordion-trigger"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="pr-4">{faq.q}</span>
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background: openIndex === i ? '#111111' : '#F5F5F5',
                    color: openIndex === i ? '#F4C430' : '#525252',
                  }}
                >
                  {openIndex === i ? <Minus size={14} /> : <Plus size={14} />}
                </div>
              </button>
              {openIndex === i && (
                <div className="accordion-content animate-fade-up">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom contact */}
        <div className="mt-14 text-center p-8 rounded-2xl border border-[#E5E5E5] bg-[#FAFAFA]">
          <div className="text-2xl mb-2">💬</div>
          <h3 className="font-bold text-[#111111] text-lg mb-2">Still have questions?</h3>
          <p className="text-[#737373] text-sm mb-5">
            Our team is available 9 AM – 9 PM PKT, Monday to Saturday.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button className="btn btn-primary btn-md">
              Chat with Support
            </button>
            <button className="btn btn-ghost btn-md">
              hello@scholario.pk
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
