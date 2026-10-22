import React, { useState, useEffect, useRef } from 'react';
import { Plus, Minus, MessageSquare, Mail } from 'lucide-react';

const faqs = [
  {
    q: 'What is Scholario?',
    a: 'Scholario is a modern Learning Management System built exclusively for and operated on behalf of SHS Virtual Academy. It serves as a unified portal connecting students, parents, teachers, and administration to streamline the educational experience.',
  },
  {
    q: 'Who is eligible to use Scholario?',
    a: 'Currently, Scholario is a single-institution platform. Access is limited to enrolled students, parents/guardians, teachers, and staff members affiliated with SHS Virtual Academy. It is not open to self-registration by the general public.',
  },
  {
    q: 'How does the Parent Portal work?',
    a: "Parent/guardian accounts are linked to their child's student record. Parents get secure, read-only access to view daily class attendance, assignment deadlines, teacher announcements, and term grades.",
  },
  {
    q: 'How are fee payments tracked and verified?',
    a: "Scholario uses a secure manual fee verification process. Payers transfer school fees directly to SHS Virtual Academy's bank or mobile wallet accounts, then submit the payment reference or receipt photo inside the portal for administrative verification.",
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
  const [isInView, setIsInView] = useState<boolean>(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentSection = sectionRef.current;
    if (currentSection) {
      observer.observe(currentSection);
    }

    return () => {
      if (currentSection) observer.unobserve(currentSection);
    };
  }, []);

  const handleContactClick = (e: React.MouseEvent) => {
    if (onOpenContact) {
      e.preventDefault();
      onOpenContact();
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section
      ref={sectionRef}
      id="faq-section"
      className="pt-14 sm:pt-20 lg:pt-24 pb-14 sm:pb-20 lg:pb-24 bg-white dark:bg-[#0E0E0E] text-[#111111] dark:text-white transition-colors relative overflow-hidden"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      {/* ── Soft ambient glow ── */}
      <div
        aria-hidden="true"
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] sm:w-[520px] lg:w-[680px] h-[360px] sm:h-[520px] lg:h-[680px] rounded-full pointer-events-none opacity-15 dark:opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(242,194,48,0.55) 0%, transparent 70%)',
        }}
      />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">

          {/* ── Left Column (Header & Desktop Contact Card, sticky on lg) ── */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <div className="flex flex-col items-start sm:items-center lg:items-start text-left sm:text-center lg:text-left max-w-xl sm:max-w-[720px] lg:max-w-none mx-auto lg:mx-0 mb-6 lg:mb-8">
              <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#D4A017] dark:text-[#F2C230] mb-2 inline-block">
                — FAQ
              </span>
              <h2 className="text-[28px] sm:text-[34px] lg:text-[40px] font-[800] leading-[1.2] tracking-[-0.02em] text-[#111111] dark:text-white mb-3 [text-wrap:balance]">
                Frequently asked{' '}
                <span className="text-[#D4A017] dark:text-[#F2C230]">questions</span>
              </h2>
              <p className="text-[15px] sm:text-[16px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3] max-w-[36ch] sm:max-w-xl text-left sm:text-center lg:text-left">
                Everything you need to know about Scholario. Can't find what you're looking for?{' '}
                <a
                  href="#contact"
                  onClick={handleContactClick}
                  className="text-[#D4A017] dark:text-[#F2C230] font-bold underline underline-offset-2 hover:opacity-85 transition-opacity"
                >
                  Chat with us.
                </a>
              </p>
            </div>

            {/* Desktop Contact Card (sticky under header) */}
            <div className="hidden lg:block pt-2">
              <div className="rounded-[24px] bg-white/85 dark:bg-[#161616]/85 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] p-6 shadow-xs text-left">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 border border-[#F2C230]/30 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                    <MessageSquare size={21} className="stroke-[2.2]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[18px] font-bold text-[#111111] dark:text-white leading-snug">
                      Still have questions?
                    </h3>
                    <p className="text-[13px] sm:text-[14px] text-[#737373] dark:text-[#A3A3A3] leading-relaxed mt-0.5">
                      Our team is available 9 AM – 9 PM PKT, Monday to Saturday.
                    </p>
                  </div>
                </div>

                <a
                  id="faq-email-btn"
                  href="mailto:shs.academy.virtual@gmail.com"
                  className="w-full h-12 min-h-[48px] rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-[14px] shadow-[0_4px_16px_rgba(242,194,48,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
                >
                  <Mail size={16} className="text-[#111111] shrink-0" />
                  <span className="truncate">shs.academy.virtual@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── Right Column: Accordion List (and mobile contact card) ── */}
          <div className="lg:col-span-7">
            <div className="space-y-3 max-w-2xl sm:max-w-[720px] lg:max-w-none mx-auto" id="faq-accordion-container">
              {faqs.map((faq, i) => {
                const isOpen = openIndex === i;
                return (
                  <div
                    key={faq.q}
                    id={`faq-accordion-item-${i}`}
                    style={{
                      transitionDelay: `${i * 50}ms`,
                    }}
                    className={`rounded-[20px] transition-all duration-200 overflow-hidden ${
                      isOpen
                        ? 'bg-white/90 dark:bg-[#161616]/90 border border-[#F2C230]/60 dark:border-[#F2C230]/60 shadow-[0_4px_20px_rgba(242,194,48,0.12)]'
                        : 'bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] shadow-xs hover:border-[#F2C230]/40'
                    } ${
                      isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                    }`}
                  >
                    {/* Full Question Row as Tap Target (min-height 56px, press scale 0.99) */}
                    <button
                      type="button"
                      id={`faq-accordion-trigger-${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-accordion-content-${i}`}
                      onClick={() => toggleFAQ(i)}
                      className="w-full min-h-[56px] p-4 sm:p-5 text-left flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230] rounded-[20px]"
                    >
                      <span className="font-semibold text-[15px] sm:text-[16px] leading-[1.35] text-[#111111] dark:text-white line-clamp-2 pr-2">
                        {faq.q}
                      </span>

                      {/* 32px Circle Icon */}
                      <div
                        className={`w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
                          isOpen
                            ? 'bg-[#F2C230] text-[#111111] shadow-xs rotate-180'
                            : 'bg-[#F2C230]/[0.14] text-[#D4A017] dark:text-[#F2C230] rotate-0'
                        }`}
                      >
                        {isOpen ? <Minus size={15} className="stroke-[2.5]" /> : <Plus size={15} className="stroke-[2.5]" />}
                      </div>
                    </button>

                    {/* Animated Answer Section */}
                    {isOpen && (
                      <div
                        id={`faq-accordion-content-${i}`}
                        role="region"
                        aria-labelledby={`faq-accordion-trigger-${i}`}
                        className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 animate-fade-in"
                      >
                        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                          <p className="text-[14px] sm:text-[15px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3]">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile / Tablet Contact Card (< lg only) */}
            <div className="block lg:hidden mt-8 max-w-2xl sm:max-w-[720px] mx-auto rounded-[24px] bg-white/85 dark:bg-[#161616]/85 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-6 shadow-xs text-left">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 border border-[#F2C230]/30 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                  <MessageSquare size={21} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[18px] font-bold text-[#111111] dark:text-white leading-snug">
                    Still have questions?
                  </h3>
                  <p className="text-[13px] sm:text-[14px] text-[#737373] dark:text-[#A3A3A3] leading-relaxed mt-0.5">
                    Our team is available 9 AM – 9 PM PKT, Monday to Saturday.
                  </p>
                </div>
              </div>

              <a
                id="faq-email-btn-mobile"
                href="mailto:shs.academy.virtual@gmail.com"
                className="w-full h-12 min-h-[48px] rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-[14px] shadow-[0_4px_16px_rgba(242,194,48,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <Mail size={16} className="text-[#111111] shrink-0" />
                <span className="truncate">shs.academy.virtual@gmail.com</span>
              </a>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          #faq-section * {
            animation: none !important;
            transition-delay: 0ms !important;
            transition-duration: 0ms !important;
          }
        }
      `}</style>
    </section>
  );
};

export default FAQSection;
