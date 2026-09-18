import React, { useState, useEffect } from 'react';
import { Shield, Calendar, Mail, Phone, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const privacySections = [
  { id: 'intro', label: '1. Introduction' },
  { id: 'responsible', label: '2. Who Is Responsible' },
  { id: 'collect', label: '3. Information We Collect' },
  { id: 'children', label: '4. Children\'s Privacy' },
  { id: 'use', label: '5. How We Use Information' },
  { id: 'third-party', label: '6. Third-Party Providers' },
  { id: 'security', label: '7. Data Security' },
  { id: 'live-classes', label: '8. Live Classes & External Tools' },
  { id: 'retention', label: '9. Data Retention' },
  { id: 'rights', label: '10. Your Rights' },
  { id: 'cookies', label: '11. Cookies' },
  { id: 'changes', label: '12. Changes to This Policy' },
  { id: 'contact', label: '13. Contact' },
];

export const PrivacyPolicyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>('intro');

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
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] dark:text-white">
                  Privacy Policy
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
              This Privacy Policy explains what information Scholario collects from students, parents/guardians, and staff of SHS Virtual Academy, how it is handled, and how your privacy is protected.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
            
            {/* Table of Contents Sticky Sidebar */}
            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32 p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#171717] border border-[#E5E5E5] dark:border-[#262626] space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#A3A3A3] px-3 mb-2">
                  Table of Contents
                </p>
                {privacySections.map((sec) => (
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
              
              {/* Intro */}
              <section id="intro" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">1. Introduction</h2>
                <p>
                  Scholario ("<strong>Scholario</strong>," "<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>") is a Learning Management System built exclusively for and operated on behalf of <strong>SHS Virtual Academy</strong> ("the Academy"). This Privacy Policy explains what information we collect from students, parents/guardians, and staff who use Scholario, how we use it, who we share it with, and what rights you have over it.
                </p>
                <p>
                  Scholario is currently a single-institution platform serving SHS Virtual Academy only. It is not a public product and is not available to other schools or the general public at this time.
                </p>
                <p>
                  By creating an account or otherwise using Scholario, you (or, if you are a minor, your parent/guardian on your behalf) agree to the practices described in this Policy.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Responsible */}
              <section id="responsible" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">2. Who Is Responsible for Your Data</h2>
                <p>
                  SHS Virtual Academy is the data controller for information processed through Scholario — the Academy determines what data is collected and why, in its capacity as an educational institution. Scholario's development team acts as the technical operator and data processor on the Academy's behalf.
                </p>
                <div className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] space-y-1 text-sm">
                  <span className="font-bold text-[#111111] dark:text-white">Direct inquiries to:</span>
                  <p className="text-[#525252] dark:text-[#A3A3A3]">SHS Virtual Academy administration (shs.academy.virtual@gmail.com).</p>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Information We Collect */}
              <section id="collect" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">3. Information We Collect</h2>
                
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.1 Account Information</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Name, email address, and profile information provided via <strong>Google OAuth</strong> sign-in.</li>
                    <li>Role within the platform (student, parent/guardian, teacher/staff, or admin).</li>
                    <li>Class/section enrollment details.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.2 Academic Data</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Attendance records (per-subject or per-day).</li>
                    <li>Assignments submitted, grades, and progress tracking data.</li>
                    <li>Resource library activity (materials accessed, e.g. notes, past papers, recorded lectures).</li>
                    <li>Participation data related to scheduled live classes (scheduling metadata only).</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.3 Fee & Payment Records</h3>
                  <p>
                    Scholario currently uses a <strong>manual fee verification process</strong>, not an automated payment gateway. We collect:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Fee amounts due and payment status.</li>
                    <li>Bank transfer or mobile wallet (Easypaisa/JazzCash) transaction references and receipt confirmations submitted for admin verification.</li>
                    <li>An audit trail of who confirmed or edited a payment record, and when.</li>
                  </ul>
                  <p className="text-xs text-[#737373] dark:text-[#A3A3A3] italic">
                    We do <strong>not</strong> collect or store card numbers, bank account credentials, or mobile wallet PINs. All payments are made directly between the payer and the receiving bank/wallet account outside of Scholario.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.4 Communications</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Messages sent through the platform between teachers and students, and between teachers and parents.</li>
                    <li>Institution-wide and per-class announcements.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.5 Parent Portal Data</h3>
                  <p>
                    Where a parent/guardian account is linked to a student, the parent account has <strong>read-only</strong> access to that student's attendance, grades, and announcements.
                  </p>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.6 Technical & Usage Data</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Log data (IP address, browser/device type, access timestamps) collected automatically via infrastructure providers.</li>
                    <li>Basic diagnostic data to identify and fix errors or abuse.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Children's Privacy */}
              <section id="children" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">4. Children's Privacy</h2>
                <p>
                  Many Scholario users are minors. We treat the protection of student data as a priority:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Student accounts are created and managed under SHS Virtual Academy's authority, not through open self-registration.</li>
                  <li>We do not use student data for advertising, and we do not sell or rent student data to any third party, under any circumstance.</li>
                  <li>Data collected from students is limited to what is necessary for education administration.</li>
                  <li>Parents/guardians may request access to, correction of, or an explanation of their child's data by contacting the Academy.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* How We Use Information */}
              <section id="use" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">5. How We Use Information</h2>
                <p>
                  We use collected information to:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Operate core academic functions — enrollment, attendance, grading, resource access, and scheduling of live classes.</li>
                  <li>Verify and reconcile fee payments and maintain a financial audit trail.</li>
                  <li>Enable communication between teachers, students, and parents.</li>
                  <li>Generate internal administrative analytics and reporting for the Academy.</li>
                  <li>Maintain platform security, detect misuse, and enforce our Terms of Service.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Third-Party Service Providers */}
              <section id="third-party" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">6. Third-Party Service Providers</h2>
                <p>
                  Scholario is built on infrastructure providers that process data on our behalf:
                </p>
                <div className="overflow-x-auto my-4 border border-[#E5E5E5] dark:border-[#262626] rounded-xl">
                  <table className="min-w-full divide-y divide-[#E5E5E5] dark:divide-[#262626] text-left text-xs sm:text-sm">
                    <thead className="bg-[#FAFAFA] dark:bg-[#1A1A1A]">
                      <tr>
                        <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Provider</th>
                        <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Purpose</th>
                        <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Data Involved</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#262626]">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-[#111111] dark:text-white">Supabase</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Database, authentication, and file storage</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Account, academic, fee, and communication data</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-[#111111] dark:text-white">Google (OAuth)</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Sign-in and identity verification</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Name, email address, profile picture</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-[#111111] dark:text-white">Zoom / Google Meet</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Live class sessions (external)</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Session join links and scheduling metadata</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Data Security */}
              <section id="security" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">7. Data Security</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Role-based access control</strong> enforced through Row-Level Security (RLS) policies.</li>
                  <li><strong>Audit logs</strong> recording modifications to grades, attendance, and fee transactions.</li>
                  <li>Encrypted data transmission over HTTPS/TLS.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Live Classes */}
              <section id="live-classes" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">8. Live Classes & External Tools</h2>
                <p>
                  Scholario schedules and links to live classes hosted on third-party platforms (Zoom, Google Meet). We do not record or store the video/audio content of these sessions.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Retention */}
              <section id="retention" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">9. Data Retention</h2>
                <p>
                  Academic and financial records are retained according to Academy educational policy and administrative requirements.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Rights */}
              <section id="rights" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">10. Your Rights</h2>
                <p>
                  You or your guardian may request access to, correction of, or questions about your personal educational data by contacting the Academy.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Cookies */}
              <section id="cookies" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">11. Cookies</h2>
                <p>
                  Scholario uses only essential local storage and session tokens necessary for secure authentication. We do not use third-party tracking or ad cookies.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Changes */}
              <section id="changes" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">12. Changes to This Policy</h2>
                <p>
                  We may update this Privacy Policy as platform capabilities expand. Material updates will be communicated through the platform.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* Contact */}
              <section id="contact" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">13. Contact</h2>
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
                This Privacy Policy is intended to accurately describe Scholario's current data practices as a single-institution platform for SHS Virtual Academy. It is a working document drafted for an early-stage product and has not been reviewed by a licensed lawyer. Before Scholario scales beyond SHS Virtual Academy, or before payment volume becomes significant, it is strongly recommended that this document be reviewed by legal counsel familiar with Pakistani data protection and education law.
              </div>

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicyPage;
