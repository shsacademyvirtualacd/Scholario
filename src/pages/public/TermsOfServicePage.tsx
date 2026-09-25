import React, { useState, useEffect } from 'react';
import { Scale, Calendar, Mail, Phone, ArrowLeft, AlertCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const termsSections = [
  { id: 'acceptance', label: '1. Acceptance of Terms' },
  { id: 'description', label: '2. Educational Service Scope' },
  { id: 'eligibility', label: '3. Eligibility & Minor Consent' },
  { id: 'tiers', label: '4. Free Trial vs Paid Enrollment' },
  { id: 'fees', label: '5. Challan Fees & Payment Terms' },
  { id: 'refunds', label: '6. Refund & Cancellation Terms' },
  { id: 'conduct', label: '7. Academic Integrity & Conduct' },
  { id: 'suspension', label: '8. Suspension & Account Termination' },
  { id: 'live-classes', label: '9. Live Classes & External Links' },
  { id: 'content', label: '10. Proprietary Curriculum IP' },
  { id: 'liability', label: '11. Limitation of Liability' },
  { id: 'governing-law', label: '12. Governing Law & Legal Advisory' },
  { id: 'contact', label: '13. Official Inquiries' },
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
                  Terms of Service & Enrollment Conditions
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-[#737373] dark:text-[#A3A3A3]">
                  <Calendar size={13} />
                  <span>Effective Date: Academic Session 2026–2027</span>
                  <span>•</span>
                  <span>SHS Virtual Academy</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#525252] dark:text-[#A3A3A3] max-w-3xl leading-relaxed">
              These Terms of Service govern student admission, enrollment payment verification, academic proctoring integrity, Free Trial preview access, and account suspension policies at <strong>SHS Virtual Academy</strong> operating through the Scholario learning platform.
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
              
              {/* 1. Acceptance */}
              <section id="acceptance" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">1. Acceptance of Terms</h2>
                <p>
                  By accessing, browsing, registering for an account, or submitting fee verification on Scholario, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service, along with our{' '}
                  <Link to="/privacy" className="text-[#D4A017] font-semibold hover:underline">
                    Privacy Policy
                  </Link>
                  ,{' '}
                  <Link to="/refund" className="text-[#D4A017] font-semibold hover:underline">
                    Refund Policy
                  </Link>
                  , and{' '}
                  <Link to="/cookies" className="text-[#D4A017] font-semibold hover:underline">
                    Cookie Policy
                  </Link>
                  .
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 2. Description */}
              <section id="description" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">2. Educational Service Scope</h2>
                <p>
                  Scholario provides academic services exclusively for enrolled students, guardians, and faculty of SHS Virtual Academy. This includes digital live timetable distribution, proctored examinations (MCQ testing center and written question submissions), syllabus notes vaults, teacher announcements, and educational messaging.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 3. Eligibility & Minor Consent */}
              <section id="eligibility" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">3. Eligibility & Minor Consent</h2>
                <p>
                  Users enrolled in FBISE Class 9–12 or Cambridge programs who are under the age of eighteen (18) are classified as minors under the <em>Contract Act 1872</em> of Pakistan.
                </p>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <p className="font-bold">Requirement for Minor Enrollment:</p>
                  <p>
                    All students under 18 years of age must provide a valid parent or legal guardian email address during registration. The parent/guardian acts as the contracting party authorizing the student's enrollment, fee commitments, and data processing.
                  </p>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 4. Free Trial vs Paid Enrollment */}
              <section id="tiers" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">4. Free Trial vs. Paid Enrollment Tiers</h2>
                <p>
                  Scholario is committed to clear, transparent pricing with <strong>zero dark patterns</strong>:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3 not-prose">
                  <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#181818] space-y-2">
                    <span className="text-xs font-bold text-[#737373] uppercase tracking-wider block">Free Trial / Orientation Access</span>
                    <h3 className="font-black text-sm text-[#111111] dark:text-white">Sample & Syllabus Preview</h3>
                    <ul className="text-xs text-[#525252] dark:text-[#A3A3A3] space-y-1 list-disc pl-4">
                      <li>Free account creation with zero payment details required.</li>
                      <li>Browse curriculum structures, subject catalogs, and sample notes.</li>
                      <li>Attempt self-testing practice questions in the open bank.</li>
                      <li>No automatic credit card renewals or forced continuity.</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-[#F4C430] bg-[#FFFDF5] dark:bg-[#1F1D15] space-y-2">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">Paid / Pro Enrollment</span>
                    <h3 className="font-black text-sm text-[#111111] dark:text-white">Full Academic Program</h3>
                    <ul className="text-xs text-[#525252] dark:text-[#A3A3A3] space-y-1 list-disc pl-4">
                      <li>Access to daily live video lecture links across enrolled subjects.</li>
                      <li>Official proctored examination center with teacher evaluation & marks.</li>
                      <li>Complete solved notes, past papers, and formula derivations.</li>
                      <li>Direct teacher messaging and Sage AI academic assistant.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 5. Challan Fees */}
              <section id="fees" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">5. Challan Fees & Payment Terms</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Transparent Rates:</strong> Tuition amounts are clearly displayed on the Pricing Calculator and Student Checkout page. There are no hidden processing surcharges, registration taxes, or undisclosed administrative fees added at checkout.</li>
                  <li><strong>Manual Verification:</strong> Payments are executed via bank transfer or mobile wallet (Easypaisa / JazzCash). Academy finance officers reconcile receipts within 24–48 business hours.</li>
                  <li><strong>Merit Scholarships:</strong> High-achieving students scoring 80%+ marks may qualify for a 40% or 60% tuition waiver upon administrative verification of uploaded marksheets.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 6. Refunds */}
              <section id="refunds" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">6. Refund & Cancellation Terms</h2>
                <p>
                  Refund requests are evaluated under our documented{' '}
                  <Link to="/refund" className="text-[#D4A017] font-semibold hover:underline">
                    Refund & Cancellation Policy
                  </Link>
                  . Pre-commencement withdrawals and verified duplicate payments are eligible for refund. Post-commencement withdrawals beyond the 7-day initial window are non-refundable.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 7. Conduct */}
              <section id="conduct" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">7. Academic Integrity & Conduct</h2>
                <p>All students and participants must maintain high standards of academic honesty:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Examination Honesty:</strong> Cheating, sharing answers, or tampering with proctoring watermarks during online tests is strictly prohibited.</li>
                  <li><strong>Respectful Communication:</strong> Cyberbullying, harassment, obscene language, or disruptive conduct in live lectures or chat channels will result in immediate disciplinary action.</li>
                  <li><strong>Credential Security:</strong> Sharing student accounts with unregistered third parties is grounds for immediate termination.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 8. Suspension */}
              <section id="suspension" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                  <ShieldAlert size={20} className="text-amber-600 shrink-0" />
                  <span>8. Account Suspension & Lockout Conditions</span>
                </h2>
                <p>
                  SHS Virtual Academy reserves the right to suspend or lock account access under the following explicit conditions:
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#181818] border border-[#E5E5E5] dark:border-[#262626]">
                    <strong>A. Tuition Billing Lockout:</strong> If tuition dues remain unpaid 7 calendar days after the due date, portal access is placed in billing lockout. The student can still view the payment details page and submit proof of payment or request voluntary withdrawal.
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#181818] border border-[#E5E5E5] dark:border-[#262626]">
                    <strong>B. Academic Dishonesty Suspension:</strong> Disciplinary suspension resulting from verified cheating during proctored examinations or submitting plagiarized written answer sheets.
                  </div>
                  <div className="p-3 rounded-xl bg-[#FAFAFA] dark:bg-[#181818] border border-[#E5E5E5] dark:border-[#262626]">
                    <strong>C. Code of Conduct Violations:</strong> Severe disruption of live classes, harassment of faculty members, or distributing inappropriate content through chat attachments.
                  </div>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 9. Live Classes */}
              <section id="live-classes" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">9. Live Classes & External Links</h2>
                <p>
                  Scholario manages class timetables and live links. Video/audio sessions are hosted on external certified platforms (Google Meet, Zoom). The Academy may substitute teachers or update meeting links on short notice to ensure student learning continuity.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 10. Content */}
              <section id="content" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">10. Proprietary Curriculum Intellectual Property</h2>
                <p>
                  All curriculum notes, lecture outlines, question banks, and examination materials provided through Scholario are the exclusive intellectual property of SHS Virtual Academy. Reproduction, commercial resale, or external distribution without written consent is strictly prohibited under Pakistani copyright law.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 11. Liability */}
              <section id="liability" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">11. Limitation of Liability</h2>
                <p>
                  Scholario provides educational tools on an "as available" basis. While we strive for 99.9% uptime, the Academy is not liable for internet connectivity disruptions, third-party video conferencing outages, or power fluctuations on the student's premises.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 12. Governing Law */}
              <section id="governing-law" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">12. Governing Law & Legal Advisory</h2>
                <p>
                  These Terms are governed by and construed in accordance with the laws of the Islamic Republic of Pakistan, subject to the jurisdiction of the courts in Rawalpindi / Islamabad.
                </p>
                <div className="p-4 rounded-xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] text-xs text-[#737373] dark:text-[#A3A3A3] flex items-start gap-3 mt-3">
                  <AlertCircle size={16} className="text-[#D4A017] shrink-0 mt-0.5" />
                  <p className="m-0 leading-relaxed">
                    <strong>Legal Advisory:</strong> These Terms have been prepared for educational operations. Formal legal enforceability regarding minors' contractual capacity under Section 11 of the Contract Act 1872 and digital service consumer protection requires licensed Pakistani legal counsel review.
                  </p>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 13. Contact */}
              <section id="contact" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">13. Official Inquiries</h2>
                <div className="p-5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] space-y-2 text-xs">
                  <p className="font-extrabold text-[#111111] dark:text-white text-sm">SHS Virtual Academy Administration</p>
                  <p>Registered Administrative Office: Rawalpindi, Punjab, Pakistan</p>
                  <p>Official Email: <a href="mailto:shs.academy.virtual@gmail.com" className="text-[#D4A017] font-bold hover:underline">shs.academy.virtual@gmail.com</a></p>
                  <p>Phone / WhatsApp: +92 305 86969050</p>
                </div>
              </section>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfServicePage;
