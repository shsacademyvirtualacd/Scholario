import React, { useState, useEffect } from 'react';
import { Shield, Calendar, ArrowLeft, Database, Trash2, Scale, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const privacySections = [
  { id: 'intro', label: '1. Introduction' },
  { id: 'responsible', label: '2. Controller & Operator' },
  { id: 'collect', label: '3. Student & Parent Data We Collect' },
  { id: 'storage', label: '4. Storage Architecture & Cloud Storage' },
  { id: 'minors', label: '5. Protection of Minors & Parental Rights' },
  { id: 'deletion-flow', label: '6. Parental Deletion Request Procedure' },
  { id: 'third-party', label: '7. Third-Party Service Processing Basis' },
  { id: 'ai-processing', label: '8. AI Academic Assistant (Sage) Safeguards' },
  { id: 'security', label: '9. Data Security & RLS Controls' },
  { id: 'retention', label: '10. Data Retention & Auto-Purge' },
  { id: 'cookies', label: '11. Cookies & Storage' },
  { id: 'advisory', label: '12. Legal Advisory & Compliance Notice' },
  { id: 'contact', label: '13. Data Protection Inquiries' },
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
                  Privacy Policy & Student Data Protection
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-[#737373] dark:text-[#A3A3A3]">
                  <Calendar size={13} />
                  <span>Effective Date: Academic Session 2026–2027</span>
                  <span>•</span>
                  <span>FBISE Grade 9–12, Cambridge & IELTS</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#525252] dark:text-[#A3A3A3] max-w-3xl leading-relaxed">
              This Privacy Policy details the exact data collected by <strong>Scholario</strong> on behalf of <strong>SHS Virtual Academy</strong>, our encrypted storage architecture across our secure database and cloud infrastructure, our third-party data processing legal bases, and the formal procedures available to parents and guardians of minor students to request data access or permanent account deletion.
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
              
              {/* 1. Intro */}
              <section id="intro" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">1. Introduction</h2>
                <p>
                  Scholario is a dedicated institutional Learning Management System (LMS) engineered exclusively for <strong>SHS Virtual Academy</strong>. It connects enrolled FBISE (Grade 9, 10, 11, 12), Cambridge (O Levels, A Levels), and IELTS students with faculty members, proctored examinations, schedule timetable synchronizations, and academic resources.
                </p>
                <p>
                  Because a significant portion of our student body consists of minors (individuals under 18 years of age), Scholario operates under strict educational data minimization principles: we collect only what is strictly necessary to deliver curriculum education, record attendance, and evaluate examinations.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 2. Responsible */}
              <section id="responsible" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">2. Data Controller & Operator</h2>
                <p>
                  <strong>Data Controller:</strong> SHS Virtual Academy is the educational institution determining the educational curriculum, enrollment rules, and academic records.
                </p>
                <p>
                  <strong>Technical Operator / Processor:</strong> Scholario platform engineering operates the secure cloud infrastructure, database isolation, and application layers on behalf of the Academy.
                </p>
                <div className="p-4 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] space-y-1 text-xs">
                  <span className="font-bold text-[#111111] dark:text-white">Official Academy Correspondence:</span>
                  <p className="text-[#525252] dark:text-[#A3A3A3]">Email: <a href="mailto:shs.academy.virtual@gmail.com" className="text-[#D4A017] font-semibold hover:underline">shs.academy.virtual@gmail.com</a> | Phone / WhatsApp: +92 305 86969050</p>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 3. Information We Collect */}
              <section id="collect" className="scroll-mt-32 space-y-4">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">3. Student & Parent Data We Collect</h2>
                
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.1 Student Identification & Contact Info</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Full Legal Name</strong> and profile avatar (obtained via Google OAuth).</li>
                    <li><strong>Pakistani Mobile / WhatsApp Number</strong> (validated format: +92 3XXXXXXXXX) for urgent class link updates and challan verification.</li>
                    <li><strong>Academic Placement:</strong> Board (Federal FBISE, Punjab, Cambridge, etc.), Grade (9, 10, 11, 12, IELTS), Stream (Pre-Medical, Pre-Engineering, Computer Science, General), and enrolled subject list.</li>
                    <li><strong>Generated Unique Numeric Student ID:</strong> 8-digit unique identifier for roster verification and attendance records.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.2 Minor Contact & Parent/Guardian Details</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Parent / Legal Guardian Email Address:</strong> Collected during registration for students under 18 years of age and stored for academic notifications and record access. For students 18 and older, this step is skipped entirely.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.3 Academic Performance & Assessment Records</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Examination Results:</strong> Multiple-choice question (MCQ) answers, timestamps, proctored attempt histories, scores, and teacher evaluations.</li>
                    <li><strong>Written Submissions & Answer Sheets:</strong> Uploaded photographs or PDF scans of handwritten examination answer booklets.</li>
                    <li><strong>Attendance Logs:</strong> Daily class attendance per subject slot, entry timestamps, and monthly attendance percentage metrics.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.4 Communications & Chat Attachments</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Direct Messaging:</strong> Chat messages exchanged between students, faculty members, and academy administration.</li>
                    <li><strong>Media Attachments & Voice Notes:</strong> Homework images, audio recordings, and document attachments sent within authorized chat threads.</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-[#111111] dark:text-white">3.5 Scholarship Verification Documents</h3>
                  <p>
                    Where a student applies for a merit-based scholarship (40% or 60% tuition waiver) or improvement discount, we collect claimed previous board marks and uploaded scans of official board marksheets or school result cards strictly for administrative verification.
                  </p>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 4. Storage Architecture */}
              <section id="storage" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">4. Storage Architecture & Encryption</h2>
                <p>
                  Scholario employs a dual-tier hardened cloud storage architecture:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3 not-prose">
                  <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#181818] space-y-2">
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                      <Database size={16} />
                      <span>Primary Relational Database</span>
                    </div>
                    <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">
                      Primary structured data storage (profiles, rosters, attendance, test scores, fee audit trails). Secured with granular Row-Level Security (RLS) policies guaranteeing strict multi-tenant isolation.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#181818] space-y-2">
                    <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wide">
                      <Lock size={16} />
                      <span>Encrypted Cloud Storage</span>
                    </div>
                    <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">
                      Encrypted bucket storage for large binaries (chat attachments, written exam submission photo scans, scholarship marksheets). Temporary exam photos are subject to automated 24-hour lifecycle expiry.
                    </p>
                  </div>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 5. Minor Protection */}
              <section id="minors" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">5. Protection of Minors & Parental Rights</h2>
                <p>
                  We recognize that minors require heightened privacy standards. We enforce the following guardrails:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Zero Commercial Exploitation:</strong> Minor student data is never monetized, never profiled for marketing, and never shared with advertisers.</li>
                  <li><strong>Controlled Communication Environment:</strong> Students may only communicate with authenticated teachers and staff enrolled in their active subjects. Public discovery or unmonitored peer-to-peer open chatrooms are prohibited.</li>
                  <li><strong>Right to Review:</strong> Parents and guardians have the absolute right to inspect any educational record, attendance log, or submitted examination paper associated with their child.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 6. Deletion Procedure */}
              <section id="deletion-flow" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                  <Trash2 size={20} className="text-red-500 shrink-0" />
                  <span>6. Parental Deletion Request Procedure</span>
                </h2>
                <p>
                  A parent or legal guardian may request the permanent deletion of their child's account and personal records at any time:
                </p>
                <div className="p-4 rounded-2xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-3 not-prose">
                  <h4 className="text-xs font-bold text-red-900 dark:text-red-300 uppercase tracking-wider">
                    How to Submit a Data Deletion Notice:
                  </h4>
                  <ol className="list-decimal pl-5 space-y-1.5 text-xs text-red-950 dark:text-red-200">
                    <li>
                      <strong>Option A (In-App Request):</strong> Navigate to Student Settings / Profile page and click <strong>"Request Account & Data Deletion"</strong>.
                    </li>
                    <li>
                      <strong>Option B (Direct Email):</strong> Send an email from the registered parent/guardian email address to <a href="mailto:shs.academy.virtual@gmail.com" className="font-bold underline">shs.academy.virtual@gmail.com</a> with subject <code>"Student Data Deletion Request - ID [Student Number]"</code>.
                    </li>
                    <li>
                      <strong>Verification:</strong> Our administration verifies parental identity within <strong>48 hours</strong>.
                    </li>
                    <li>
                      <strong>Purge Execution:</strong> Upon confirmation, all student profile details, test submissions, chat attachments in cloud storage, and database rows are irreversibly deleted within <strong>30 calendar days</strong>, retaining only basic financial ledger receipts required by Pakistani tax and regulatory audit laws.
                    </li>
                  </ol>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 7. Third-Party Service Table */}
              <section id="third-party" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">7. Third-Party Service Providers & Processing Basis</h2>
                <p>
                  Scholario utilizes trusted infrastructure providers under strict contractual data protection terms:
                </p>
                <div className="overflow-x-auto my-4 border border-[#E5E5E5] dark:border-[#262626] rounded-xl not-prose">
                  <table className="min-w-full divide-y divide-[#E5E5E5] dark:divide-[#262626] text-left text-xs">
                    <thead className="bg-[#FAFAFA] dark:bg-[#1A1A1A]">
                      <tr>
                        <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Service / Role</th>
                        <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Function & Operation</th>
                        <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Data Processed</th>
                        <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Legal Processing Basis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#262626]">
                      <tr>
                        <td className="px-4 py-3 font-semibold text-[#111111] dark:text-white">Primary Database Infrastructure</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Database host & Auth Service</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">User profiles, rosters, attendance, test scores, chat records</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Contractual Educational Service Delivery</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-[#111111] dark:text-white">Encrypted Cloud Storage</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Object & Attachment Storage</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Chat attachments, written test scan photos, scholarship marksheets</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Contractual Educational Assessment</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-[#111111] dark:text-white">AI Model Inference Infrastructure</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Academic AI Assistant (Sage)</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Ephemeral student queries and homework question prompts</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Explicit User Request / Legitimate Study Interest</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-[#111111] dark:text-white">Transactional Email Delivery</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Notification Dispatch</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Account verification, password reset, exam submission receipts</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Contractual Necessity (Transactional Notices Only)</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 font-semibold text-[#111111] dark:text-white">SMS & Messaging Dispatch</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Emergency Timetable & Fee Alerts</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Student/Parent phone number, class link updates</td>
                        <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Explicit Consent & Timetable Operation</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 8. AI Processing */}
              <section id="ai-processing" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">8. AI Assistant (Sage) Safeguards</h2>
                <p>
                  Scholario includes an optional academic study assistant named <strong>Sage</strong> powered by our advanced AI model infrastructure. When you interact with Sage:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Prompts and questions are processed ephemerally to generate explanations, formula derivations, and study guides.</li>
                  <li>Per enterprise data protection terms, student prompts are <strong>not</strong> used to train public foundational AI models.</li>
                  <li>Students may clear their active Sage conversation memory at any time using the in-chat "Clear History" button.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 9. Security */}
              <section id="security" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">9. Data Security & RLS Controls</h2>
                <p>
                  We implement multi-layered defenses including HTTPS/TLS 1.3 encryption in transit, AES-256 encryption at rest across our database and cloud storage, granular Row-Level Security policies, and audit logs tracking any administrative status alterations.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 10. Retention */}
              <section id="retention" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">10. Data Retention & Auto-Purge Cycles</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li><strong>Active Academic Records:</strong> Retained for the duration of the student's enrollment term plus one (1) academic session for transcript re-issuance.</li>
                  <li><strong>Temporary Exam Photos:</strong> Automatically purged from storage after 24 hours of submission evaluation.</li>
                  <li><strong>Terminated / Expelled Accounts:</strong> Slated for complete database deletion within 30 days of confirmed termination.</li>
                </ul>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 11. Cookies */}
              <section id="cookies" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">11. Cookies & Storage</h2>
                <p>
                  Scholario sets strictly functional cookies and local storage tokens. Please review our comprehensive{' '}
                  <Link to="/cookies" className="text-[#D4A017] font-bold hover:underline">
                    Cookie & Local Storage Policy
                  </Link>{' '}
                  for an itemized breakdown.
                </p>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 12. Legal Advisory */}
              <section id="advisory" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                  <Scale size={20} className="text-amber-600 shrink-0" />
                  <span>12. Legal Advisory & Compliance Notice</span>
                </h2>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <p className="font-bold">Notice Regarding Pakistani Cyber & Data Protection Legislation:</p>
                  <p>
                    Data privacy practices described herein have been drafted to align with the <em>Prevention of Electronic Crimes Act (PECA) 2016</em>, the <em>Contract Act 1872</em> (regarding minor capacity and parental agency), and principles set forth in the draft <em>Personal Data Protection Bill (PDPB)</em> of Pakistan.
                  </p>
                  <p className="italic">
                    This document serves as an operational institutional policy. Formal statutory compliance audits require review by licensed Pakistani legal counsel prior to high-volume multi-school commercial deployment.
                  </p>
                </div>
              </section>

              <hr className="border-[#E5E5E5] dark:border-[#262626]" />

              {/* 13. Contact */}
              <section id="contact" className="scroll-mt-32 space-y-3">
                <h2 className="text-xl font-bold text-[#111111] dark:text-white">13. Data Protection Inquiries</h2>
                <div className="p-5 rounded-2xl bg-[#FAFAFA] dark:bg-[#1A1A1A] border border-[#E5E5E5] dark:border-[#262626] space-y-2 text-xs">
                  <p className="font-extrabold text-[#111111] dark:text-white text-sm">SHS Virtual Academy Data Protection Desk</p>
                  <p>Registered Administrative Office: Rawalpindi, Punjab, Pakistan</p>
                  <p>Official Email: <a href="mailto:shs.academy.virtual@gmail.com" className="text-[#D4A017] font-bold hover:underline">shs.academy.virtual@gmail.com</a></p>
                  <p>Helpline / WhatsApp: +92 305 86969050</p>
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

export default PrivacyPolicyPage;
