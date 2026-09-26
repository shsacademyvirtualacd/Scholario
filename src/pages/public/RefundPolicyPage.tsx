import React, { useEffect } from 'react';
import { RefreshCw, Calendar, ArrowLeft, AlertCircle, CheckCircle2, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export const RefundPolicyPage: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#111111] text-[#111111] dark:text-[#E5E5E5] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
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
                <RefreshCw size={24} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] dark:text-white">
                  Refund & Cancellation Policy
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-[#737373] dark:text-[#A3A3A3]">
                  <Calendar size={13} />
                  <span>Effective Date: Academic Session 2026–2027</span>
                  <span>•</span>
                  <span>Applies to: FBISE, Cambridge O/A Levels & IELTS</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#525252] dark:text-[#A3A3A3] leading-relaxed">
              This Refund Policy applies to all enrollment challans, tuition fees, and course subscriptions at <strong>SHS Virtual Academy</strong> ("Scholario"). Please review these terms carefully prior to completing any bank transfer or mobile wallet challan payment.
            </p>
          </div>

          {/* Legal Review Advisory Notice */}
          <div className="mb-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <Scale size={20} className="text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
              <p className="font-bold">Legal Notice & Pakistani Law Advisory:</p>
              <p>
                This policy has been prepared to provide transparent educational operating guidelines. Note that consumer dispute resolutions, digital services regulations, and refund enforceability in Pakistan are governed by the <em>Punjab Consumer Protection Act 2005</em>, the <em>Contract Act 1872</em>, and relevant federal education guidelines. Formal statutory claims require licensed legal counsel review.
              </p>
            </div>
          </div>

          {/* Main Policy Content */}
          <div className="space-y-8 prose prose-sm max-w-none text-[#404040] dark:text-[#D4D4D4] leading-relaxed">
            
            {/* Section 1: Overview */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center text-xs font-black shrink-0">1</span>
                <span>Payment Architecture & Challan Flow</span>
              </h2>
              <p>
                All tuition fees on Scholario are paid via direct bank transfer, mobile wallet (JazzCash, Easypaisa, Nayapay, Sadapay), or direct bank counter deposit using the official fee challan generated in the <strong>Student Checkout & Tuition Portal</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Scholario does <strong>not</strong> operate automatic recurring credit/debit card debits. There is no forced continuity or automatic monthly card billing.</li>
                <li>Each term or month requires manual payment and administrative receipt verification by the student or parent.</li>
                <li>Once proof of payment is submitted via the portal or WhatsApp helpline, our finance desk reconciles the transaction within 24–48 business hours.</li>
              </ul>
            </section>

            <hr className="border-[#E5E5E5] dark:border-[#262626]" />

            {/* Section 2: Eligible Refund Scenarios */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center text-xs font-black shrink-0">2</span>
                <span>Eligible Refund Scenarios (Full or Partial)</span>
              </h2>
              <p>
                A student or parent/guardian is entitled to apply for a refund under the following specific verified conditions:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3 not-prose">
                <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#181818] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <CheckCircle2 size={16} />
                    <span>Duplicate / Excess Payment</span>
                  </div>
                  <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">
                    If a parent or student mistakenly submits a transaction more than once for the same term, the duplicate amount is <strong>100% refundable</strong> upon verification of bank statement proof.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#181818] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <CheckCircle2 size={16} />
                    <span>Course Cancellation by Academy</span>
                  </div>
                  <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">
                    If SHS Virtual Academy cancels a registered subject offering or is unable to provide scheduled teacher instruction for an enrolled class, a <strong>100% pro-rata refund</strong> is guaranteed.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#181818] space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                    <CheckCircle2 size={16} />
                    <span>Pre-Commencement Withdrawal</span>
                  </div>
                  <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">
                    If a formal withdrawal request is submitted in writing before the first live lecture session of the term commences, a refund minus a nominal 5% administrative bank processing fee is granted.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-[#E5E5E5] dark:border-[#262626] bg-[#FAFAFA] dark:bg-[#181818] space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
                    <AlertCircle size={16} />
                    <span>Scholarship Retroactive Adjustment</span>
                  </div>
                  <p className="text-xs text-[#525252] dark:text-[#A3A3A3]">
                    If a student pays standard tuition while their merit scholarship (40% or 60%) is verified and subsequently approved by admin, the differential waiver is credited toward the next session or refunded upon request.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-[#E5E5E5] dark:border-[#262626]" />

            {/* Section 3: Non-Refundable Items */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center text-xs font-black shrink-0">3</span>
                <span>Non-Refundable Circumstances</span>
              </h2>
              <p>Refunds cannot be authorized under the following circumstances:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Post-Commencement Withdrawal:</strong> After a student has attended more than two live sessions, or after seven (7) calendar days from the term commencement date.</li>
                <li><strong>Downloaded Intellectual Property:</strong> If the student has downloaded complete term notes vaults, proprietary past papers, or curriculum question bank packages.</li>
                <li><strong>Disciplinary Suspension / Expulsion:</strong> Where an account is terminated due to academic misconduct, harassment, sharing account credentials, or cheating during proctored examinations.</li>
                <li><strong>Student Inactivity or Lack of Attendance:</strong> Failure to attend live classes or submit tests does not constitute grounds for refund if the service was delivered as scheduled.</li>
              </ul>
            </section>

            <hr className="border-[#E5E5E5] dark:border-[#262626]" />

            {/* Section 4: Refund Process & Timelines */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center text-xs font-black shrink-0">4</span>
                <span>Refund Application Process & Timelines</span>
              </h2>
              <p>To request a refund, follow this procedure:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>
                  Email the finance office at <a href="mailto:shs.academy.virtual@gmail.com" className="text-[#D4A017] font-semibold hover:underline">shs.academy.virtual@gmail.com</a> with the subject line <code>"Refund Request - Student ID [Your ID]"</code>.
                </li>
                <li>Include the student's full name, registered phone number, challan transaction ID, copy of payment receipt, and the specific reason for requesting a refund.</li>
                <li>Our administration will acknowledge receipt within <strong>2 business days</strong> and complete investigation within <strong>5–7 business days</strong>.</li>
                <li>Approved refunds are disbursed via original payment channel (Bank Transfer / JazzCash / Easypaisa) within <strong>7–10 banking business days</strong>.</li>
              </ol>
            </section>

            <hr className="border-[#E5E5E5] dark:border-[#262626]" />

            {/* Section 5: Contact & Inquiries */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center text-xs font-black shrink-0">5</span>
                <span>Official Billing Contact</span>
              </h2>
              <div className="p-5 rounded-2xl bg-[#FAFAFA] dark:bg-[#181818] border border-[#E5E5E5] dark:border-[#262626] space-y-2 text-xs">
                <p className="font-bold text-[#111111] dark:text-white text-sm">SHS Virtual Academy Billing & Accounts Office</p>
                <p>Digital Academic Headquarters: Rawalpindi, Punjab, Pakistan</p>
                <p>Official Accounts Email: <a href="mailto:shs.academy.virtual@gmail.com" className="text-[#D4A017] font-bold hover:underline">shs.academy.virtual@gmail.com</a></p>
                <p>Official Accounts Phone / WhatsApp: <a href="tel:+9230586969050" className="hover:underline">+92 305 86969050</a></p>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RefundPolicyPage;
