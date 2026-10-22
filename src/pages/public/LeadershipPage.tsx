import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ExternalLink, ArrowRight, ArrowLeft, Mail } from 'lucide-react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { ContactModal } from '../../components/ui/ContactModal';
import { AboutModal } from '../../components/ui/AboutModal';
import { useAuth } from '../../features/auth/AuthContext';

interface Leader {
  name: string;
  initials: string;
  position: string;
  isFounder?: boolean;
}

const foundingTeam: Leader[] = [
  {
    name: 'Muhammad Hashir',
    initials: 'MH',
    position: 'Founder',
    isFounder: true,
  },
  {
    name: 'Husnain Ali Abbasi',
    initials: 'HA',
    position: 'Co-founder',
  },
  {
    name: 'Syed Rayan Adeel Ahmed',
    initials: 'SR',
    position: 'Co-founder',
  },
];

const missionPoints = [
  'Making quality education more affordable and accessible.',
  "Reducing students' dependence on expensive physical academies.",
  'Providing structured online education for Matric and FSc students.',
  'Helping students prepare for examinations and university entrance tests.',
  'Using modern technology to improve teaching, learning, and academic performance.',
  'Building a digital educational ecosystem that supports students through online classes, learning resources, assessments, and exam preparation.',
];

export const LeadershipPage: React.FC = () => {
  const [contactOpen, setContactOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [inView, setInView] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { session, profile } = useAuth();
  const navigate = useNavigate();

  // Scroll to top on page mount & update document title / meta description
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const prevTitle = document.title;
    document.title = 'Leadership | Scholario';

    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : null;
    if (metaDesc) {
      metaDesc.setAttribute(
        'content',
        'Ownership, Leadership & Mission of SHS Virtual Academy. Founding leadership team: Muhammad Hashir (Founder), Husnain Ali Abbasi (Co-founder), and Syed Rayan Adeel Ahmed (Co-founder).'
      );
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
    };
  }, []);

  // Fade-in trigger on mount / scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
        }
      },
      { threshold: 0.05 }
    );

    const el = contentRef.current;
    if (el) observer.observe(el);

    // Default trigger in case element is already in viewport
    const timer = setTimeout(() => setInView(true), 50);

    return () => {
      if (el) observer.unobserve(el);
      clearTimeout(timer);
    };
  }, []);

  const handleGetStarted = () => {
    if (session) {
      if (profile?.role === 'admin') navigate('/admin');
      else if (profile?.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } else {
      navigate('/register');
    }
  };

  return (
    <div
      className="min-h-screen bg-white dark:bg-[#0E0E0E] text-[#111111] dark:text-white flex flex-col transition-colors selection:bg-[#F2C230] selection:text-black overflow-x-hidden"
      style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
    >
      <Navbar
        onOpenContact={() => setContactOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {/* ── Soft Ambient Glow in Background ── */}
      <div
        aria-hidden="true"
        className="fixed top-24 left-1/2 -translate-x-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] rounded-full pointer-events-none opacity-15 dark:opacity-10 blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(242,194,48,0.55) 0%, transparent 70%)',
        }}
      />

      <main
        ref={contentRef}
        id="leadership-main"
        className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 relative z-10 w-full max-w-2xl mx-auto"
      >
        {/* Back Link */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#737373] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white transition-colors min-h-[44px] py-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* ── A. Header ── */}
        <section
          className={`mb-8 transition-all duration-300 ease-out ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <span className="text-[12px] font-extrabold uppercase tracking-[0.18em] text-[#D4A017] dark:text-[#F2C230] mb-2 inline-block">
            — LEADERSHIP
          </span>
          <h1 className="text-[28px] sm:text-[32px] md:text-[34px] font-[800] leading-[1.2] tracking-[-0.02em] text-[#111111] dark:text-white mb-3 [text-wrap:balance]">
            Ownership, <span className="text-[#D4A017] dark:text-[#F2C230]">Leadership</span> &amp; Mission
          </h1>
          <p className="text-[15px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3]">
            SHS Virtual Academy is a Pakistan-based online education initiative focused on making quality education more accessible, affordable, and technology-driven for students across Pakistan.
          </p>
        </section>

        {/* ── B. Founding Team ── */}
        <section
          className={`mb-8 transition-all duration-300 ease-out delay-[50ms] ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="mb-3">
            <h2 className="text-[18px] sm:text-[20px] font-extrabold text-[#111111] dark:text-white">
              Founding Team
            </h2>
            <p className="text-[13px] sm:text-[14px] text-[#737373] dark:text-[#8E8E8E] leading-normal mt-0.5">
              These three individuals form the founding leadership team of SHS Virtual Academy.
            </p>
          </div>

          <div className="space-y-3">
            {foundingTeam.map((leader, idx) => (
              <div
                key={leader.name}
                id={`leader-card-${idx}`}
                className={`rounded-[20px] sm:rounded-[22px] p-4 sm:p-5 flex items-center justify-between gap-3 transition-all duration-200 ${
                  leader.isFounder
                    ? 'bg-[#F2C230]/[0.10] dark:bg-[#F2C230]/[0.14] border-2 border-[#F2C230] shadow-[0_4px_24px_rgba(242,194,48,0.18)]'
                    : 'bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Circular initials avatar in gold */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center shrink-0 font-black text-sm sm:text-base ${
                      leader.isFounder
                        ? 'bg-[#F2C230] text-[#111111] shadow-xs'
                        : 'bg-[#F2C230]/15 dark:bg-[#F2C230]/25 border border-[#F2C230]/40 text-[#D4A017] dark:text-[#F2C230]'
                    }`}
                  >
                    {leader.initials}
                  </div>

                  {/* Full Name */}
                  <div className="min-w-0">
                    <span className="font-bold text-[15px] sm:text-[17px] text-[#111111] dark:text-white leading-tight block truncate">
                      {leader.name}
                    </span>
                  </div>
                </div>

                {/* Position Pill */}
                <div className="shrink-0">
                  <span
                    className={`inline-flex items-center px-3 sm:px-3.5 py-1 rounded-full text-xs font-extrabold ${
                      leader.isFounder
                        ? 'bg-[#F2C230] text-[#111111] shadow-xs'
                        : 'bg-black/[0.06] dark:bg-white/[0.1] text-[#333333] dark:text-[#D4D4D4]'
                    }`}
                  >
                    {leader.position}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── C. Vision ── */}
        <section
          className={`mb-8 transition-all duration-300 ease-out delay-[100ms] ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#D4A017] dark:text-[#F2C230] mb-2 inline-block">
            — VISION
          </span>
          <div className="rounded-[22px] sm:rounded-[24px] bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-6 shadow-xs">
            <p className="text-[15px] sm:text-[16px] leading-[1.65] font-medium text-[#222222] dark:text-[#E0E0E0]">
              The primary aim of SHS Virtual Academy is to make quality education accessible to students throughout Pakistan, regardless of their location or financial circumstances.
            </p>
          </div>
        </section>

        {/* ── D. Mission ── */}
        <section
          className={`mb-8 transition-all duration-300 ease-out delay-[150ms] ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#D4A017] dark:text-[#F2C230] mb-2 inline-block">
            — MISSION
          </span>
          <div className="rounded-[22px] sm:rounded-[24px] bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-6 shadow-xs">
            <ul className="space-y-3 sm:space-y-3.5">
              {missionPoints.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <div className="w-5 h-5 min-w-[20px] min-h-[20px] rounded-full bg-[#F2C230]/20 dark:bg-[#F2C230]/25 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0 mt-0.5">
                    <Check size={13} className="stroke-[3]" />
                  </div>
                  <span className="text-[14px] sm:text-[15px] leading-[1.6] text-[#333333] dark:text-[#D4D4D4]">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── E. Our Platforms ── */}
        <section
          className={`mb-8 transition-all duration-300 ease-out delay-[200ms] ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#D4A017] dark:text-[#F2C230] mb-2 inline-block">
            — OUR PLATFORMS
          </span>
          <div className="space-y-3.5">
            {/* Platform 1: Scholario */}
            <div className="rounded-[22px] sm:rounded-[24px] bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-[18px] sm:text-[20px] font-extrabold text-[#111111] dark:text-white">
                    Scholario
                  </h3>
                  <span className="text-[12px] font-mono font-bold text-[#D4A017] dark:text-[#F2C230] bg-[#F2C230]/10 dark:bg-[#F2C230]/20 px-2.5 py-0.5 rounded-full border border-[#F2C230]/30">
                    scholario.me
                  </span>
                </div>
                <p className="text-[14px] sm:text-[15px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3] mb-4">
                  An online learning platform designed to support virtual classrooms, live lessons, academic resources, attendance, timetables, and student progress management.
                </p>
              </div>

              <a
                id="platform-scholario-link"
                href="https://scholario.me/"
                className="w-full h-12 min-h-[48px] rounded-full bg-black/[0.05] dark:bg-white/[0.08] hover:bg-[#F2C230] hover:text-[#111111] text-[#111111] dark:text-white font-extrabold text-[14px] border border-black/[0.12] dark:border-white/[0.15] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <span>Visit Scholario</span>
                <ArrowRight size={15} />
              </a>
            </div>

            {/* Platform 2: Boardly */}
            <div className="rounded-[22px] sm:rounded-[24px] bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <h3 className="text-[18px] sm:text-[20px] font-extrabold text-[#111111] dark:text-white">
                    Boardly
                  </h3>
                  <span className="text-[12px] font-mono font-bold text-[#D4A017] dark:text-[#F2C230] bg-[#F2C230]/10 dark:bg-[#F2C230]/20 px-2.5 py-0.5 rounded-full border border-[#F2C230]/30">
                    boardly.cfd
                  </span>
                </div>
                <p className="text-[14px] sm:text-[15px] leading-[1.6] text-[#666666] dark:text-[#A3A3A3] mb-4">
                  An AI-powered exam-preparation platform designed to help Pakistani students practise chapter-wise MCQs, attempt mock examinations, assess their preparation, and prepare for board examinations and university entrance tests.
                </p>
              </div>

              <a
                id="platform-boardly-link"
                href="https://boardly.cfd/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 min-h-[48px] rounded-full bg-black/[0.05] dark:bg-white/[0.08] hover:bg-[#F2C230] hover:text-[#111111] text-[#111111] dark:text-white font-extrabold text-[14px] border border-black/[0.12] dark:border-white/[0.15] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <span>Visit Boardly</span>
                <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </section>

        {/* ── F. Long-Term Vision ── */}
        <section
          className={`mb-8 transition-all duration-300 ease-out delay-[250ms] ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#D4A017] dark:text-[#F2C230] mb-2 inline-block">
            — LONG-TERM VISION
          </span>
          <div className="rounded-[22px] sm:rounded-[24px] bg-[#F2C230]/[0.08] dark:bg-[#F2C230]/[0.10] border border-[#F2C230]/40 p-5 sm:p-6 shadow-xs space-y-3">
            <p className="text-[14px] sm:text-[15px] leading-[1.65] text-[#222222] dark:text-[#E0E0E0]">
              The long-term vision of SHS Virtual Academy is to build a comprehensive digital education ecosystem for Pakistani students. Through online teaching, educational technology, and affordable exam preparation, the academy aims to make learning more convenient, structured, and accessible.
            </p>
            <p className="text-[14px] sm:text-[15px] leading-[1.65] text-[#222222] dark:text-[#E0E0E0]">
              The broader goal is to help students receive quality academic support without being limited by geographical barriers or the high costs of traditional educational institutions.
            </p>
          </div>
        </section>

        {/* ── G. Leadership Summary Table ── */}
        <section
          className={`mb-10 transition-all duration-300 ease-out delay-[300ms] ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="mb-2">
            <span className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#D4A017] dark:text-[#F2C230] inline-block">
              — LEADERSHIP SUMMARY
            </span>
          </div>

          <div className="rounded-[20px] overflow-hidden border border-black/[0.08] dark:border-white/[0.1] bg-white/80 dark:bg-[#161616]/80 backdrop-blur-md shadow-xs">
            <table className="w-full table-fixed text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-black/[0.08] dark:border-white/[0.1] bg-black/[0.03] dark:bg-white/[0.04]">
                  <th
                    scope="col"
                    className="w-3/5 py-3.5 px-4 text-[12px] font-extrabold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="w-2/5 py-3.5 px-4 text-[12px] font-extrabold uppercase tracking-wider text-[#666666] dark:text-[#A3A3A3]"
                  >
                    Position
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
                {foundingTeam.map((leader) => (
                  <tr
                    key={leader.name}
                    className={
                      leader.isFounder
                        ? 'bg-[#F2C230]/[0.06] dark:bg-[#F2C230]/[0.08]'
                        : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.02]'
                    }
                  >
                    <td className="py-3.5 px-4 font-bold text-[14px] text-[#111111] dark:text-white truncate">
                      {leader.name}
                    </td>
                    <td className="py-3.5 px-4 text-[13px] font-semibold text-[#555555] dark:text-[#BBBBBB]">
                      <span
                        className={
                          leader.isFounder
                            ? 'text-[#D4A017] dark:text-[#F2C230] font-extrabold'
                            : ''
                        }
                      >
                        {leader.position}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ── H. Bottom CTA ── */}
        <section
          className={`transition-all duration-300 ease-out delay-[350ms] ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
          }`}
        >
          <div className="rounded-[24px] bg-white/85 dark:bg-[#161616]/85 backdrop-blur-md border border-black/[0.08] dark:border-white/[0.1] p-5 sm:p-6 shadow-xs text-center space-y-3">
            <button
              id="leadership-cta-btn"
              type="button"
              onClick={handleGetStarted}
              className="w-full h-12 min-h-[48px] rounded-full bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-extrabold text-[15px] shadow-[0_4px_16px_rgba(242,194,48,0.25)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              <span>Get Started</span>
              <ArrowRight size={16} />
            </button>

            <button
              id="leadership-contact-btn"
              type="button"
              onClick={() => setContactOpen(true)}
              className="w-full min-h-[48px] flex items-center justify-center gap-1.5 text-sm font-bold text-[#666666] dark:text-[#A3A3A3] hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer underline underline-offset-4"
            >
              <Mail size={15} />
              <span>Contact us</span>
            </button>
          </div>
        </section>
      </main>

      <Footer
        onOpenContact={() => setContactOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
      />

      {/* Global Modals */}
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} />
      <AboutModal open={aboutOpen} onClose={() => setAboutOpen(false)} />

      <style>{`
        @media (prefers-reduced-motion: reduce) {
          #leadership-main * {
            animation: none !important;
            transition-delay: 0ms !important;
            transition-duration: 0ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LeadershipPage;
