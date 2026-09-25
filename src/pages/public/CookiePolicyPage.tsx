import React, { useEffect } from 'react';
import { Cookie, Calendar, ArrowLeft, ShieldCheck, Database, CheckCircle2, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

export const CookiePolicyPage: React.FC = () => {
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
                <Cookie size={24} />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#111111] dark:text-white">
                  Cookie & Local Storage Policy
                </h1>
                <div className="flex items-center gap-2 mt-1.5 text-xs text-[#737373] dark:text-[#A3A3A3]">
                  <Calendar size={13} />
                  <span>Effective Date: Academic Session 2026–2027</span>
                  <span>•</span>
                  <span>Audited Storage Specifications</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#525252] dark:text-[#A3A3A3] leading-relaxed">
              This Cookie Policy explains how <strong>Scholario</strong> (operated exclusively for <strong>SHS Virtual Academy</strong>) uses cookies, browser <code>localStorage</code>, and <code>sessionStorage</code> to deliver secure educational services.
            </p>
          </div>

          {/* Privacy Guarantee Banner */}
          <div className="mb-8 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
            <ShieldCheck size={20} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-bold">Zero Third-Party Advertising Trackers Guarantee:</p>
              <p>
                Scholario is built exclusively for students and educators. We do <strong>not</strong> use advertising cookies, marketing pixels, social media beacons, or commercial retargeting scripts. Our cookies and browser storage are strictly limited to authenticating user logins and remembering your display preferences.
              </p>
            </div>
          </div>

          {/* Main Policy Content */}
          <div className="space-y-8 prose prose-sm max-w-none text-[#404040] dark:text-[#D4D4D4] leading-relaxed">
            
            {/* Section 1: What Are Cookies and Storage */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center text-xs font-black shrink-0">1</span>
                <span>What Technologies We Use</span>
              </h2>
              <p>
                When you access Scholario, small pieces of technical information are stored on your device to keep your session active and responsive:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>HTTP Cookies:</strong> Standard web tokens transferred between your browser and our secure backend servers.</li>
                <li><strong>Local Storage (localStorage):</strong> Browser storage that persists across sessions to remember interface themes and accessibility preferences.</li>
                <li><strong>Session Storage (sessionStorage):</strong> Temporary browser memory that automatically clears when you close your browser tab or window.</li>
              </ul>
            </section>

            <hr className="border-[#E5E5E5] dark:border-[#262626]" />

            {/* Section 2: Complete Audited Storage Inventory */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center text-xs font-black shrink-0">2</span>
                <span>Complete Audited Technical Inventory</span>
              </h2>
              <p>
                Below is the comprehensive audit of every cookie and storage key set by the Scholario web application:
              </p>

              <div className="overflow-x-auto my-4 border border-[#E5E5E5] dark:border-[#262626] rounded-xl not-prose">
                <table className="min-w-full divide-y divide-[#E5E5E5] dark:divide-[#262626] text-left text-xs">
                  <thead className="bg-[#FAFAFA] dark:bg-[#1A1A1A]">
                    <tr>
                      <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Storage Key / Cookie Name</th>
                      <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Category</th>
                      <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Lifespan</th>
                      <th className="px-4 py-3 font-bold text-[#111111] dark:text-white">Exact Purpose</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5] dark:divide-[#262626]">
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-[#111111] dark:text-white">auth-token</td>
                      <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400 font-semibold">Strictly Essential</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Session (Renewable)</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">
                        Primary authentication session token maintaining secure logged-in access for students, teachers, and admins.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-[#111111] dark:text-white">scholario_cookie_consent</td>
                      <td className="px-4 py-3 text-emerald-700 dark:text-emerald-400 font-semibold">Strictly Essential</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">12 Months</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">
                        Stores whether you have acknowledged the platform Cookie & Privacy Notice so the banner is not displayed repeatedly.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-[#111111] dark:text-white">scholario-theme</td>
                      <td className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold">Preferences</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Persistent</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">
                        Remembers your selected visual mode (Light / Dark mode) for comfortable studying.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-[#111111] dark:text-white">scholario_chat_theme_*</td>
                      <td className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold">Preferences</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Persistent</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">
                        Stores user's chosen chat wallpaper and message bubble color scheme for WhatsApp-style messaging.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-[#111111] dark:text-white">sage_chat_*</td>
                      <td className="px-4 py-3 text-purple-700 dark:text-purple-400 font-semibold">Session Cache</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Browser Tab Session</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">
                        Temporary session cache of your active conversation with Sage AI academic assistant to prevent chat loss on page reload.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-[#111111] dark:text-white">scholario_cache_*</td>
                      <td className="px-4 py-3 text-purple-700 dark:text-purple-400 font-semibold">Performance</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Browser Tab Session</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">
                        Temporary fast cache of class schedules, notes lists, and attendance records to minimize server requests.
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-mono font-bold text-[#111111] dark:text-white">scholario_dismissed_ann_*</td>
                      <td className="px-4 py-3 text-blue-700 dark:text-blue-400 font-semibold">Preferences</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">Persistent</td>
                      <td className="px-4 py-3 text-[#525252] dark:text-[#A3A3A3]">
                        Remembers which global or class announcements you have already closed so you are not disturbed again.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <hr className="border-[#E5E5E5] dark:border-[#262626]" />

            {/* Section 3: Managing & Clearing Cookies */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center text-xs font-black shrink-0">3</span>
                <span>How to Manage or Clear Your Storage</span>
              </h2>
              <p>
                You can manage or clear stored items at any time through your browser settings:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Chrome / Edge / Brave:</strong> Settings → Privacy & Security → Clear Browsing Data → Cookies and Site Data.</li>
                <li><strong>Safari (iOS / macOS):</strong> Settings → Safari → Advanced → Website Data → Remove All Website Data.</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data → Clear Data.</li>
              </ul>
              <p className="text-xs text-[#737373] dark:text-[#A3A3A3]">
                <em>Note:</em> Clearing essential authentication tokens will sign you out of your Scholario student or teacher account, requiring you to log in again with Google.
              </p>
            </section>

            <hr className="border-[#E5E5E5] dark:border-[#262626]" />

            {/* Section 4: Contact */}
            <section className="space-y-3">
              <h2 className="text-xl font-bold text-[#111111] dark:text-white flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#111111] text-[#F4C430] flex items-center justify-center text-xs font-black shrink-0">4</span>
                <span>Questions Regarding Data Storage</span>
              </h2>
              <p>
                If you have questions about our technical data practices or cookie usage, please contact our data administration officer at <a href="mailto:shs.academy.virtual@gmail.com" className="text-[#D4A017] font-semibold hover:underline">shs.academy.virtual@gmail.com</a>.
              </p>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CookiePolicyPage;
