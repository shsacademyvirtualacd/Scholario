import React, { useState, useEffect } from 'react';
import { Scale, Calendar, Mail, Phone, ArrowLeft, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const termsSections = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'description', label: '2. Description of the Service' },
  { id: 'eligibility', label: '3. Eligibility & Accounts' },
  { id: 'roles', label: '4. User Roles' },
  { id: 'use', label: '5. Acceptable Use' },
  { id: 'records', label: '6. Academic Records' },
  { id: 'fees', label: '7. Fees & Payments' },
  { id: 'live-classes', label: '8. Live Classes' },
  { id: 'content', label: '9. Content & IP' },
  { id: 'availability', label: '10. Availability & Reliability' },
  { id: 'suspension', label: '11. Suspension & Termination' },
  { id: 'liability', label: '12. Limitation of Liability' },
  { id: 'governing-law', label: '13. Governing Law' },
  { id: 'changes', label: '14. Changes to Terms' },
  { id: 'contact', label: '15. Contact' },
];

export const TermsOfServicePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('acceptance');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-[#111111] dark:text-[#E5E5E5] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumbs & Header */}
          <div className="mb-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#737373] hover:text-[#111111] dark:hover:text-white transition-colors mb-6"
            >
              <ArrowLeft size={14} />
              <span>Back to Home</span>
            </Link>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FDF3C8] text-[#D4A017] flex items-center justify-center shrink-0 border border-[#FDF3C8]">
                <Scale size={24} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] dark:text-white">
                  Terms of Service
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-[#737373] dark:text-[#A3A3A3]">
                  <Calendar size={13} />
                  <span>Effective: July 07, 2026</span>
                  <span>•</span>
                  <span>Updated: July 06, 2026</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#525252] dark:text-[#A3A3A3] max-w-3xl leading-relaxed">
              These Terms govern your access to and use of the Scholario learning platform operated exclusively for SHS Virtual Academy.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            
            {/* Table of Contents Sticky Sidebar */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32 p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#262626] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#A3A3A3] px-3 mb-2">
                  Table of Contents
                </p>
                {termsSections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-between ${
                      activeSection === sec.id
                        ? 'bg-[#111111] text-white dark:bg-[#F4C430] dark:text-[#111111]'
                        : 'text-[#525252] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#262626] hover:text-[#111111] dark:hover:text-white'
                    }`}
                  >
                    <span>{sec.label}</span>
                  </button>
                ))}
              </div>
            </aside>

            {/* Document Content */}
            <div className="lg:col-span-3 space-y-8 prose prose-sm max-w-none text-[#404040] dark:text-[#D4D4D4] leading-relaxed">
              
              {/* Acceptance */}
              <section id="acceptance" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">1. Acceptance of Terms</h2>
                <p>
                  These Terms of Service ("<strong>Terms</strong>") govern access to and use of Scholario (the "<strong>Platform</strong>"), a Learning Management System built and operated exclusively for <strong>SHS Virtual Academy</strong> ("the <strong>Academy</strong>"). By creating an account, logging in, or otherwise using the Platform, you agree to be bound by these Terms.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Description */}
              <section id="description" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">2. Description of the Service</h2>
                <p>
                  Scholario provides academic management services for SHS Virtual Academy, including course enrollments, attendance tracking, announcements, resource libraries, live class schedules, and fee records.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Eligibility */}
              <section id="eligibility" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">3. Eligibility & Accounts</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Accounts are provisioned for authorized students, guardians, and staff of SHS Virtual Academy.</li>
                  <li>Access is authenticated through institutional Google OAuth sign-in.</li>
                  <li>Users are responsible for maintaining the confidentiality and security of their Google credentials.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Roles */}
              <section id="roles" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">4. User Roles</h2>
                <p>
                  The platform supports role-based access control for Students, Parents/Guardians, Teachers/Staff, and Administrators. Permissions are assigned by the Academy administration.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Acceptable Use */}
              <section id="use" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">5. Acceptable Use</h2>
                <p>Users must not:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Attempt unauthorized access to other user accounts or restricted administrative areas.</li>
                  <li>Falsify attendance, grades, test answers, or fee payment receipts.</li>
                  <li>Scrape, redistribute, or reproduce proprietary Academy educational materials outside authorized coursework.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Records */}
              <section id="records" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">6. Academic Records</h2>
                <p>
                  Academic records recorded on Scholario represent administrative records entered by Academy teachers. Official academic disputes are governed by Academy policies.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Fees */}
              <section id="fees" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">7. Fees & Payments</h2>
                <p>
                  Tuition payments are made directly to the Academy via bank transfer or mobile wallets (Easypaisa/JazzCash). Payment status updates occur following administrative review.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Live Classes */}
              <section id="live-classes" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">8. Live Classes</h2>
                <p>
                  Live interactive lessons are hosted on third-party video conferencing services (Zoom, Google Meet). Scholario links to sessions but does not record or host live audio/video.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Content */}
              <section id="content" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">9. Content & Intellectual Property</h2>
                <p>
                  Notes, curriculum slides, tests, and answer keys are the intellectual property of SHS Virtual Academy. Scholario platform software and branding are protected by copyright.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Availability */}
              <section id="availability" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">10. Availability & Reliability</h2>
                <p>
                  The platform is continuously developed and provided on an as-available basis. Maintenance and scheduled improvements may occur periodically.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Suspension */}
              <section id="suspension" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">11. Suspension & Termination</h2>
                <p>
                  The Academy reserves the right to suspend or terminate accounts in cases of policy violations, enrollment cessation, or security protection.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Liability */}
              <section id="liability" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">12. Limitation of Liability</h2>
                <p>
                  Scholario is provided as an educational tool to facilitate learning and administrative coordination. Liability is limited to the extent permitted by applicable law.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Governing Law */}
              <section id="governing-law" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">13. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of the Islamic Republic of Pakistan.
                </p>
                <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#737373] dark:text-[#A3A3A3] flex items-start gap-3 mt-3">
                  <AlertCircle size={16} className="text-[#D4A017] shrink-0 mt-0.5" />
                  <p className="m-0 leading-relaxed">
                    <strong>Disclaimer:</strong> This document is not a substitute for professional legal advice; consult a qualified lawyer for legal matters specific to your situation.
                  </p>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Changes */}
              <section id="changes" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">14. Changes to Terms</h2>
                <p>
                  We may periodically revise these Terms. Continued use of the platform indicates acceptance of updated terms.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Contact */}
              <section id="contact" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">15. Contact</h2>
                <div className="p-5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] space-y-2">
                  <p className="font-extrabold text-[#111111] dark:text-white">SHS Virtual Academy</p>
                  <div className="space-y-1.5 text-sm text-[#525252] dark:text-[#A3A3A3]">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-[#D4A017]" />
                      <span>shs.academy.virtual@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[#D4A017]" />
                      <span>+92 305 86969050</span>
                    </div>
                  </div>
                </div>
              </section>

              <div className="mt-8 p-5 rounded-2xl bg-[#FDF3C8]/50 dark:bg-[#D4A017]/10 border border-[#FDF3C8] dark:border-[#D4A017]/25 text-xs text-[#B8860B] dark:text-[#E5B53B] italic leading-relaxed">
                These Terms of Conditions are drafted specifically for Scholario's current single-institution, manual-payment stage. They are a working document prepared for an early-stage product and have not been reviewed by a licensed lawyer. Before Scholario scales beyond SHS Virtual Academy, integrates a payment gateway, or handles meaningful transaction volume, it is strongly recommended that this document be reviewed by legal counsel familiar with Pakistani contract, consumer protection, and education law.
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
