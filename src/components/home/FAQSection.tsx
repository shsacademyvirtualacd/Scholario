import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const faqs = [
  {
    q: 'What is Scholario?',
    a: 'Scholario is a modern Learning Management System built exclusively for and operated on behalf of SHS Academy. It serves as a unified portal connecting students, parents, teachers, and administration to streamline the educational experience.',
  },
  {
    q: 'Who is eligible to use Scholario?',
    a: 'Currently, Scholario is a single-institution platform. Access is limited to enrolled students, parents/guardians, teachers, and staff members affiliated with SHS Academy. It is not open to self-registration by the general public.',
  },
  {
    q: 'How does the Parent Portal work?',
    a: 'Parent/guardian accounts are linked to their child\'s student record. Parents get secure, read-only access to view daily class attendance, assignment deadlines, teacher announcements, and term grades.',
  },
  {
    q: 'How are fee payments tracked and verified?',
    a: 'Scholario uses a secure manual fee verification process. Payers transfer school fees directly to SHS Academy\'s bank or mobile wallet accounts, then submit the payment reference or receipt photo inside the portal for administrative verification.',
  },
  {
    q: 'Are live classes hosted directly on Scholario?',
    a: 'No. Scholario manages class timetables and schedules, and provides direct launching links for live classes. The actual live video and audio sessions are hosted externally via integrations with standard tools like Zoom and Google Meet.',
  },
];

interface FAQSectionProps {
  onOpenContact?: () => void;
}

const FAQSection: React.FC<FAQSectionProps> = ({ onOpenContact }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleContactClick = (e: React.MouseEvent) => {
    if (onOpenContact) {
      e.preventDefault();
      onOpenContact();
    }
  };

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
            <a 
              href="#" 
              onClick={handleContactClick}
              className="text-[#111111] font-semibold underline underline-offset-2"
            >
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
          <div className="flex justify-center">
            <a 
              href="mailto:shs.academy.virtual@gmail.com"
              className="btn btn-primary btn-md"
            >
              shs.academy.virtual@gmail.com
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
