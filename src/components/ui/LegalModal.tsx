import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, Scale, Calendar, Mail, Phone } from 'lucide-react';

interface LegalModalProps {
  type: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    if (type) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [type]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && type) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [type, onClose]);

  if (!type) return null;

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
    { id: 'contact', label: '13. Contact' }
  ];

  const termsSections = [
    { id: 'acceptance', label: '1. Acceptance of Terms' },
    { id: 'description', label: '2. Description of the Service' },
    { id: 'eligibility', label: '3. Eligibility & Accounts' },
    { id: 'roles', label: '4. User Roles' },
    { id: 'use', label: '5. Acceptable Use' },
    { id: 'records', label: '6. Academic Records' },
    { id: 'fees', label: '7. Fees & Payments' },
    { id: 'live-classes', label: '8. Live Classes' },
    { id: 'content', label: '9. Content & Intellectual Property' },
    { id: 'availability', label: '10. Availability & Reliability' },
    { id: 'suspension', label: '11. Suspension & Termination' },
    { id: 'liability', label: '12. Limitation of Liability' },
    { id: 'governing-law', label: '13. Governing Law' },
    { id: 'changes', label: '14. Changes to These Terms' },
    { id: 'contact', label: '15. Contact' }
  ];

  const sections = type === 'privacy' ? privacySections : termsSections;

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
    }
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10" 
      role="dialog" 
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card Container */}
      <div className="relative z-10 bg-white text-[#111111] w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-[#E5E5E5] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F5F5F5] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDF3C8] text-[#D4A017] flex items-center justify-center shrink-0 border border-[#FDF3C8]">
              {type === 'privacy' ? <Shield size={20} /> : <Scale size={20} />}
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#111111] tracking-tight">
                {type === 'privacy' ? 'Privacy Policy' : 'Terms of Conditions'}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#737373]">
                <Calendar size={12} />
                <span>Effective: July 07, 2026</span>
                <span className="text-[#D4D4D4]">•</span>
                <span>Updated: July 06, 2026</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#E5E5E5] text-[#737373] hover:text-[#111111] transition-all duration-200 interactive"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Area with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Navigation */}
          <aside className="w-64 border-r border-[#F5F5F5] bg-[#FAFAFA] hidden md:block overflow-y-auto p-4 space-y-1 shrink-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] px-3 mb-3">
              Table of Contents
            </p>
            {sections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-between ${
                  activeSection === sec.id
                    ? 'bg-[#111111] text-white'
                    : 'text-[#525252] hover:bg-[#F5F5F5] hover:text-[#111111]'
                }`}
              >
                <span>{sec.label}</span>
              </button>
            ))}
          </aside>

          {/* Main Document Text */}
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 scroll-smooth">
            
            {type === 'privacy' ? (
              // Privacy Policy Content
              <div className="prose prose-sm max-w-none text-[#404040]">
                
                {/* Intro */}
                <section id="intro" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">1. Introduction</h3>
                  <p className="leading-relaxed">
                    Scholario ("<strong>Scholario</strong>," "<strong>we</strong>," "<strong>us</strong>," or "<strong>our</strong>") is a Learning Management System built exclusively for and operated on behalf of <strong>SHS Academy</strong> ("the Academy"). This Privacy Policy explains what information we collect from students, parents/guardians, and staff who use Scholario, how we use it, who we share it with, and what rights you have over it.
                  </p>
                  <p className="leading-relaxed">
                    Scholario is currently a single-institution platform serving SHS Academy only. It is not a public product and is not available to other schools or the general public at this time.
                  </p>
                  <p className="leading-relaxed">
                    By creating an account or otherwise using Scholario, you (or, if you are a minor, your parent/guardian on your behalf) agree to the practices described in this Policy.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Responsible */}
                <section id="responsible" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">2. Who Is Responsible for Your Data</h3>
                  <p className="leading-relaxed">
                    SHS Academy is the data controller for information processed through Scholario — the Academy determines what data is collected and why, in its capacity as an educational institution. Scholario's development team acts as the technical operator and data processor on the Academy's behalf.
                  </p>
                  <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-2 text-sm">
                    <span className="font-bold text-[#111111]">Direct inquiries to:</span>
                    <p className="text-[#525252]">SHS Academy admin contact email/phone.</p>
                  </div>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Information We Collect */}
                <section id="collect" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">3. Information We Collect</h3>
                  
                  <div className="space-y-3">
                    <h4 className="font-bold text-[#111111]">3.1 Account Information</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Name, email address, and profile information provided via <strong>Google OAuth</strong> sign-in.</li>
                      <li>Role within the platform (student, parent/guardian, teacher/staff, or admin).</li>
                      <li>Class/section enrollment details.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-[#111111]">3.2 Academic Data</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Attendance records (per-subject or per-day).</li>
                      <li>Assignments submitted, grades, and progress tracking data.</li>
                      <li>Resource library activity (materials accessed, e.g. notes, past papers, recorded lectures).</li>
                      <li>Participation data related to scheduled live classes (scheduling metadata only — Scholario does not host or record video itself; see Section 8).</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-[#111111]">3.3 Fee & Payment Records</h4>
                    <p className="leading-relaxed">
                      Scholario currently uses a <strong>manual fee verification process</strong>, not an automated payment gateway. We collect:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Fee amounts due and payment status.</li>
                      <li>Bank transfer or mobile wallet (Easypaisa/JazzCash) transaction references and receipt confirmations submitted for admin verification.</li>
                      <li>An audit trail of who confirmed or edited a payment record, and when.</li>
                    </ul>
                    <p className="text-xs text-[#737373] italic">
                      We do <strong>not</strong> collect or store card numbers, bank account credentials, or mobile wallet PINs. All payments are made directly between the payer and the receiving bank/wallet account outside of Scholario; we only record the confirmation and reference details needed to reconcile fee status.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-[#111111]">3.4 Communications</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Messages sent through the platform between teachers and students, and between teachers and parents.</li>
                      <li>Institution-wide and per-class announcements.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-[#111111]">3.5 Parent Portal Data</h4>
                    <p className="leading-relaxed">
                      Where a parent/guardian account is linked to a student, the parent account has <strong>read-only</strong> access to that student's attendance, grades, and announcements. Parent accounts do not have separate data collection beyond identity and the linkage to their child's record.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-[#111111]">3.6 Technical & Usage Data</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Log data (IP address, browser/device type, access timestamps) collected automatically via our hosting and security infrastructure (Cloudflare).</li>
                      <li>Basic diagnostic data to identify and fix errors or abuse.</li>
                    </ul>
                  </div>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Children's Privacy */}
                <section id="children" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">4. Children's Privacy</h3>
                  <p className="leading-relaxed">
                    Many Scholario users are minors. We treat the protection of student data as a priority:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Student accounts are created and managed under SHS Academy's authority, not through open self-registration.</li>
                    <li>We do not use student data for advertising, and we do not sell or rent student data to any third party, under any circumstance.</li>
                    <li>Data collected from students is limited to what is necessary for education administration — attendance, grades, assignments, fee status, and communication relevant to schooling.</li>
                    <li>Parents/guardians may request access to, correction of, or an explanation of their child's data by contacting the Academy (Section 2).</li>
                    <li>If we become aware that data has been collected from a student in a way inconsistent with this Policy, we will take steps to correct or remove it.</li>
                  </ul>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* How We Use Information */}
                <section id="use" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">5. How We Use Information</h3>
                  <p className="leading-relaxed">
                    We use collected information to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Operate core academic functions — enrollment, attendance, grading, resource access, and scheduling of live classes.</li>
                    <li>Verify and reconcile fee payments and maintain a financial audit trail.</li>
                    <li>Enable communication between teachers, students, and parents.</li>
                    <li>Generate analytics and reporting for the Academy (e.g. attendance trends, grade trends, at-risk student flags, enrollment and revenue reporting) — used internally by the Academy's administration, not shared externally.</li>
                    <li>Maintain platform security, detect misuse, and enforce our Terms of Conditions.</li>
                    <li>Improve the reliability and performance of the platform.</li>
                  </ul>
                  <p className="leading-relaxed">
                    We do not use student, parent, or staff data for advertising, profiling unrelated to education, or any purpose outside of operating the Academy's educational and administrative functions.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Third-Party Service Providers */}
                <section id="third-party" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">6. Third-Party Service Providers</h3>
                  <p className="leading-relaxed">
                    Scholario is built on the following infrastructure providers, each of which processes data on our behalf under their own security and data-protection terms:
                  </p>
                  
                  <div className="overflow-x-auto my-4 border border-[#E5E5E5] rounded-xl">
                    <table className="min-w-full divide-y divide-[#E5E5E5] text-left text-sm">
                      <thead className="bg-[#FAFAFA]">
                        <tr>
                          <th className="px-4 py-3 font-bold text-[#111111]">Provider</th>
                          <th className="px-4 py-3 font-bold text-[#111111]">Purpose</th>
                          <th className="px-4 py-3 font-bold text-[#111111]">Data Involved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E5E5]">
                        <tr>
                          <td className="px-4 py-3 font-semibold text-[#111111]">Supabase</td>
                          <td className="px-4 py-3 text-[#525252]">Database (Postgres), authentication, file storage, and backend logic (Edge Functions)</td>
                          <td className="px-4 py-3 text-[#525252]">All account, academic, fee, and communication data described above</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold text-[#111111]">Cloudflare Pages</td>
                          <td className="px-4 py-3 text-[#525252]">Website hosting and content delivery</td>
                          <td className="px-4 py-3 text-[#525252]">Technical/usage logs, IP addresses</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold text-[#111111]">Google (OAuth)</td>
                          <td className="px-4 py-3 text-[#525252]">Sign-in and identity verification</td>
                          <td className="px-4 py-3 text-[#525252]">Name, email, profile photo (if provided by Google)</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-3 font-semibold text-[#111111]">Zoom / Google Meet</td>
                          <td className="px-4 py-3 text-[#525252]">Live class hosting (external, admin-scheduled)</td>
                          <td className="px-4 py-3 text-[#525252]">Only the invite email/name needed to join a scheduled session; Scholario does not process video/audio content</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="leading-relaxed">
                    We do not sell personal data to any third party. Data is only shared with the providers above as necessary to operate the platform, and with SHS Academy staff on a need-to-know basis appropriate to their role.
                  </p>
                  <p className="text-xs text-[#737373] leading-relaxed">
                    <strong>Note on data location:</strong> Supabase and Cloudflare may store or process data on servers located outside Pakistan, depending on the hosting region selected for the project. If this applies, data leaving Pakistan is limited to what's needed for these providers to deliver hosting, database, and CDN services, under their respective data processing agreements.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Data Security */}
                <section id="security" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">7. Data Security</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Role-based access control</strong>, enforced through Supabase Row-Level Security (RLS) policies, ensures each user (student, parent, teacher, admin) can only access data appropriate to their role.</li>
                    <li><strong>Audit logs</strong> record sensitive edits — including changes to grades, attendance, and fee records — capturing who made a change and when.</li>
                    <li>Data is transmitted using encrypted connections (HTTPS/TLS).</li>
                    <li>Access to administrative functions is restricted to authorized Academy staff.</li>
                  </ul>
                  <p className="leading-relaxed">
                    No system can guarantee absolute security, and we cannot promise that data will never be compromised, but we take reasonable, industry-standard steps to protect it.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Live Classes & External Tools */}
                <section id="live-classes" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">8. Live Classes & External Tools</h3>
                  <p className="leading-relaxed">
                    Scholario schedules and links to live classes hosted on third-party platforms (Zoom, Google Meet). We do not control, record, or store the content of these sessions. Your use of those platforms during a scheduled class is also subject to that platform's own privacy policy and terms.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Data Retention */}
                <section id="retention" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">9. Data Retention</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Academic records (attendance, grades) are retained for as long as required for the student's enrollment and any subsequent record-keeping obligations of the Academy (e.g. transcript requests, transfer certificates).</li>
                    <li>Fee and payment audit trail records are retained for financial record-keeping purposes for a period determined by the Academy's administrative policy.</li>
                    <li>Communications and announcements are retained for as long as reasonably necessary for academic and administrative purposes, or until deleted by an authorized user.</li>
                    <li>Upon a student leaving the Academy, account access is deactivated; underlying academic records may be retained per the Academy's record-keeping obligations rather than deleted immediately.</li>
                  </ul>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Your Rights */}
                <section id="rights" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">10. Your Rights</h3>
                  <p className="leading-relaxed">
                    Subject to the Academy's academic and administrative record-keeping obligations, you (or your parent/guardian, if you are a minor) may request to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Access the personal data held about you.</li>
                    <li>Correct inaccurate data.</li>
                    <li>Ask questions about how your data is used.</li>
                    <li>Request deletion of data that is not subject to a retention obligation described above.</li>
                  </ul>
                  <p className="leading-relaxed">
                    Requests should be directed to the Academy contact in Section 2. We will respond within a reasonable time.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Cookies */}
                <section id="cookies" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">11. Cookies</h3>
                  <p className="leading-relaxed">
                    Scholario uses minimal cookies/local storage necessary for authentication sessions and basic security (via Cloudflare). We do not use third-party advertising or tracking cookies.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Changes to This Policy */}
                <section id="changes" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">12. Changes to This Policy</h3>
                  <p className="leading-relaxed">
                    We may update this Privacy Policy as Scholario's features evolve (e.g. when a payment gateway is introduced). Material changes will be communicated to users through the platform. Continued use of Scholario after changes take effect constitutes acceptance of the updated Policy.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Contact */}
                <section id="contact" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">13. Contact</h3>
                  <p className="leading-relaxed">
                    For any questions about this Privacy Policy or your data:
                  </p>
                  
                  <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3">
                    <p className="font-extrabold text-[#111111]">SHS Academy</p>
                    <div className="space-y-2 text-sm text-[#525252]">
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

                <div className="mt-10 p-5 rounded-2xl bg-[#FDF3C8]/40 border border-[#FDF3C8] text-xs text-[#D4A017] italic leading-relaxed">
                  This Privacy Policy is intended to accurately describe Scholario's current data practices as a single-institution platform for SHS Academy. It is a working document drafted for an early-stage product and has not been reviewed by a licensed lawyer. Before Scholario scales beyond SHS Academy, or before payment volume becomes significant, it is strongly recommended that this document be reviewed by legal counsel familiar with Pakistani data protection and education law.
                </div>

              </div>
            ) : (
              // Terms of Conditions Content
              <div className="prose prose-sm max-w-none text-[#404040]">
                
                {/* Acceptance */}
                <section id="acceptance" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">1. Acceptance of Terms</h3>
                  <p className="leading-relaxed">
                    These Terms of Conditions ("<strong>Terms</strong>") govern access to and use of Scholario (the "<strong>Platform</strong>"), a Learning Management System built and operated exclusively for <strong>SHS Academy</strong> ("the <strong>Academy</strong>"). By creating an account, logging in, or otherwise using the Platform, you agree to be bound by these Terms. If you are a minor, your parent or legal guardian accepts these Terms on your behalf and is responsible for your compliance with them.
                  </p>
                  <p className="leading-relaxed">
                    If you do not agree to these Terms, do not use the Platform.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Description */}
                <section id="description" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">2. Description of the Service</h3>
                  <p className="leading-relaxed">
                    Scholario is a single-tenant platform built solely for SHS Academy — it is not a general-purpose or multi-institution service, and access is limited to individuals affiliated with the Academy (students, parents/guardians, teachers/staff, and administrators).
                  </p>
                  <p className="leading-relaxed">
                    The Platform provides:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Class and section management</li>
                    <li>Attendance tracking</li>
                    <li>Institution-wide and per-class announcements</li>
                    <li>A resource library (notes, past papers, recorded lectures)</li>
                    <li>Scheduling and linking to externally-hosted live classes (Zoom/Google Meet)</li>
                    <li>Fee status tracking with manual payment verification</li>
                    <li>Messaging between teachers, students, and parents</li>
                    <li>A read-only parent portal</li>
                    <li>Analytics and reporting for Academy administration</li>
                  </ul>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Eligibility */}
                <section id="eligibility" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">3. Eligibility & Accounts</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Student and parent/guardian accounts are provisioned in connection with enrollment at SHS Academy; the Platform is not open to public self-registration.</li>
                    <li>Accounts are accessed via Google OAuth sign-in. You are responsible for maintaining the security of the Google account linked to your Scholario access.</li>
                    <li>You must provide accurate information when setting up or updating your account and promptly inform the Academy of any changes.</li>
                    <li>Parent/guardian accounts are linked to a specific student's record at the Academy's discretion and provide read-only visibility into that student's academic information.</li>
                  </ul>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* User Roles */}
                <section id="roles" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">4. User Roles</h3>
                  <p className="leading-relaxed">
                    The Platform recognizes the following roles, each with access limited to what is appropriate for that role (enforced via role-based access control):
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li><strong>Student</strong> — enrolls in classes, views attendance, submits assignments, tracks grades and progress.</li>
                    <li><strong>Parent/Guardian</strong> — read-only access to their linked child's attendance, grades, and announcements.</li>
                    <li><strong>Teacher/Staff</strong> — manages classes, records attendance and grades, posts announcements and resources, and communicates with students and parents.</li>
                    <li><strong>Admin/Owner</strong> — full institutional control over staff, students, fees, reporting, and platform settings.</li>
                  </ul>
                  <p className="text-sm text-[#737373]">
                    Role assignment and permissions are determined by the Academy and may be adjusted as the Platform evolves.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Acceptable Use */}
                <section id="use" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">5. Acceptable Use</h3>
                  <p className="leading-relaxed">
                    You agree not to:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Access or attempt to access accounts, data, or areas of the Platform not assigned to your role.</li>
                    <li>Use the Platform to harass, threaten, or send inappropriate communications to any other user.</li>
                    <li>Submit false attendance, grade, or payment information, or otherwise attempt to falsify academic or financial records.</li>
                    <li>Attempt to circumvent, disable, or interfere with security features, including access controls and audit logging.</li>
                    <li>Scrape, copy, or redistribute resource library content (notes, past papers, recorded lectures) outside the Academy community without authorization.</li>
                    <li>Use automated tools to access the Platform except as expressly authorized.</li>
                  </ul>
                  <p className="leading-relaxed text-sm text-red-600 font-medium">
                    Violation of this section may result in suspension or termination of your account (Section 11) and, where applicable, referral to Academy disciplinary procedures.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Academic Records */}
                <section id="records" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">6. Academic Records</h3>
                  <p className="leading-relaxed">
                    Attendance, grades, and progress data displayed on Scholario are entered by Academy teachers/staff and reflect the Academy's own academic records. Scholario is an administrative and record-keeping tool — it is <strong>not</strong> the final academic authority. Any dispute regarding the accuracy of a grade or attendance record should be raised directly with the Academy's teaching staff or administration, not resolved through the Platform alone.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Fees & Payments */}
                <section id="fees" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">7. Fees & Payments</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Scholario currently supports a <strong>manual fee verification process</strong>: you make a payment via bank transfer or a mobile wallet (Easypaisa/JazzCash) directly to the Academy's designated account, then submit confirmation (e.g. a receipt or transaction reference) through the Platform for admin review.</li>
                    <li>Fee status shown on the Platform (paid, pending, overdue) reflects the Academy admin's verification of the payment, not an automated transaction. There may be a delay between your payment and its reflection on the Platform.</li>
                    <li>Scholario does not process, hold, or have custody of funds — all money moves directly between the payer and the Academy's bank/wallet account.</li>
                    <li>Refunds, fee disputes, or payment corrections are governed by the Academy's own fee policy, not by Scholario as a platform.</li>
                    <li>A payment gateway (e.g. JazzCash/Easypaisa API integration) may be introduced in the future; these Terms will be updated accordingly when that occurs.</li>
                  </ul>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Live Classes */}
                <section id="live-classes" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">8. Live Classes</h3>
                  <p className="leading-relaxed">
                    Scholario schedules and links to live classes conducted on third-party platforms (Zoom, Google Meet). Scholario does not host video/audio infrastructure and is not responsible for the availability, quality, security, or content of sessions conducted on those third-party platforms. Your use of Zoom/Google Meet is subject to that platform's own terms.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Content & Intellectual Property */}
                <section id="content" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">9. Content & Intellectual Property</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Materials made available through the resource library (notes, past papers, recorded lectures) remain the property of the Academy and/or the original content creators. Users are granted a limited, non-transferable license to access this content for their own educational use in connection with their enrollment or role at the Academy.</li>
                    <li>The Scholario platform itself — including its design, branding, and underlying software — is the property of its developer and/or the Academy and may not be copied, reverse-engineered, or reproduced without authorization.</li>
                  </ul>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Availability & Reliability */}
                <section id="availability" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">10. Availability & Reliability</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Scholario is provided on an "as available" basis. As an actively developed platform, we do not currently guarantee a specific uptime percentage.</li>
                    <li>The Platform is designed to tolerate intermittent connectivity where possible (e.g. graceful handling of failed form submissions), but you should not rely on the Platform as the sole record of time-sensitive submissions without confirming successful completion.</li>
                    <li>We may perform maintenance, updates, or changes to the Platform at any time, which may result in temporary unavailability.</li>
                  </ul>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Suspension & Termination */}
                <section id="suspension" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">11. Suspension & Termination</h3>
                  <p className="leading-relaxed">
                    The Academy or Scholario's administrators may suspend or terminate a user's access to the Platform if:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>These Terms are violated (Section 5),</li>
                    <li>The user's enrollment or affiliation with the Academy ends,</li>
                    <li>Suspension is necessary to protect the security or integrity of the Platform or other users' data.</li>
                  </ul>
                  <p className="leading-relaxed text-sm text-[#737373]">
                    Where a student's account is suspended or terminated, associated academic records may be retained per the Academy's record-keeping obligations as described in the Privacy Policy.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Limitation of Liability */}
                <section id="liability" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">12. Limitation of Liability</h3>
                  <p className="leading-relaxed">
                    To the extent permitted by applicable law:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Scholario and its developer are not liable for indirect, incidental, or consequential damages arising from use of, or inability to use, the Platform.</li>
                    <li>Scholario is not liable for the accuracy of academic records entered by Academy staff, for the outcome of fee verification processes conducted by Academy admins, or for the availability or conduct of third-party services (Google, Zoom, Google Meet, Supabase, Cloudflare) integrated into the Platform.</li>
                    <li>Nothing in these Terms limits liability that cannot be excluded under applicable law.</li>
                  </ul>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Governing Law */}
                <section id="governing-law" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">13. Governing Law</h3>
                  <p className="leading-relaxed">
                    These Terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes arising from use of the Platform shall be subject to the jurisdiction of the courts of Pakistan.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Changes to These Terms */}
                <section id="changes" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">14. Changes to These Terms</h3>
                  <p className="leading-relaxed">
                    We may revise these Terms as the Platform's features change (for example, when a payment gateway or additional institutions are introduced). Material changes will be communicated through the Platform. Continued use of Scholario after changes take effect constitutes acceptance of the revised Terms.
                  </p>
                </section>

                <hr className="border-[#F5F5F5] my-6" />

                {/* Contact */}
                <section id="contact" className="space-y-4">
                  <h3 className="text-xl font-bold text-[#111111]">15. Contact</h3>
                  <p className="leading-relaxed">
                    For questions about these Terms:
                  </p>
                  <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3">
                    <p className="font-extrabold text-[#111111]">SHS Academy</p>
                    <div className="space-y-2 text-sm text-[#525252]">
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

                <div className="mt-10 p-5 rounded-2xl bg-[#FDF3C8]/40 border border-[#FDF3C8] text-xs text-[#D4A017] italic leading-relaxed">
                  These Terms of Conditions are drafted specifically for Scholario's current single-institution, manual-payment stage. They are a working document prepared for an early-stage product and have not been reviewed by a licensed lawyer. Before Scholario scales beyond SHS Academy, integrates a payment gateway, or handles meaningful transaction volume, it is strongly recommended that this document be reviewed by legal counsel familiar with Pakistani contract, consumer protection, and education law.
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};
