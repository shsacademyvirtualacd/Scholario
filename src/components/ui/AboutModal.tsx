import React, { useEffect } from 'react';
import { X, Sparkles, Heart, Eye, Target } from 'lucide-react';

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
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

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-[#E5E5E5] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#F5F5F5] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FDF3C8] text-[#D4A017] flex items-center justify-center shrink-0 border border-[#FDF3C8]">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#111111] tracking-tight">
                About Scholario
              </h2>
              <p className="text-xs text-[#737373] mt-0.5 font-medium">
                Closing the gap in premium, affordable education systems.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#E5E5E5] text-[#737373] hover:text-[#111111] transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10">
          
          {/* Top Hero Believer block */}
          <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-br from-[#111111] to-[#262626] text-white overflow-hidden shadow-md">
            <div className="absolute right-0 top-0 w-64 h-64 bg-radial-gradient from-[#F4C430]/10 to-transparent pointer-events-none" />
            <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-[0.15em] uppercase text-[#F4C430] mb-4">
              <span className="w-4 h-0.5 bg-[#F4C430]" />
              Our Core Belief
            </span>
            <p className="text-lg md:text-xl font-medium leading-relaxed max-w-2xl">
              Quality education shouldn't be a privilege reserved for those who can afford expensive infrastructure. Built for SHS Academy, Scholario brings the clarity and structure of a modern institution to every student, without the cost or complexity.
            </p>
          </div>

          {/* Grid: Why Scholario Exists & What We Believe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Why Scholario Exists */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#D4A017]">
                <Heart size={18} />
                <h3 className="font-extrabold text-lg text-[#111111]">Why Scholario Exists</h3>
              </div>
              <p className="text-sm text-[#525252] leading-relaxed">
                Good education in Pakistan often comes with a trade-off: quality costs money, and affordability comes at the expense of structure, accountability, or care. Scholario exists to close that gap.
              </p>
              <p className="text-sm text-[#525252] leading-relaxed">
                It started with a straightforward conviction — that a student's access to organized learning, clear progress tracking, and real accountability shouldn't depend on how expensive their school's systems are. Institutions that genuinely care about their students shouldn't have to choose between doing right by them and staying affordable.
              </p>
            </div>

            {/* What We Believe */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#D4A017]">
                <Eye size={18} />
                <h3 className="font-extrabold text-lg text-[#111111]">What We Believe</h3>
              </div>
              
              <div className="space-y-3.5">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-1">Quality shouldn't be exclusive</h4>
                  <p className="text-xs text-[#525252] leading-relaxed">
                    A well-run institution — with attendance tracking, grade transparency, manual payment validation, and reliable notifications — has historically been the mark of expensive private education. We think every student deserves that standard.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-1">Structure is respect</h4>
                  <p className="text-xs text-[#525252] leading-relaxed">
                    When a school runs on clear systems instead of scattered notebooks and word-of-mouth, it tells students and parents: your progress matters.
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#111111] mb-1">Technology should disappear</h4>
                  <p className="text-xs text-[#525252] leading-relaxed">
                    Scholario is built to feel less like a portal and more like software an institution is proud to use — because the tool shouldn't stand between a student and learning.
                  </p>
                </div>
              </div>
            </div>

          </div>

          <hr className="border-[#F5F5F5]" />

          {/* Grid: Built for SHS Academy & The Bigger Picture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Built for SHS Academy */}
            <div className="p-6 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3">
              <div className="flex items-center gap-2 text-[#111111]">
                <Target size={16} className="text-[#D4A017]" />
                <h4 className="font-bold text-base">Built for SHS Academy</h4>
              </div>
              <p className="text-xs text-[#525252] leading-relaxed">
                Scholario is currently built exclusively for SHS Academy, managing daily attendance, schedules, resources, fee logs, grades, and teacher-parent-student chats. Every feature is shaped around the Academy's real needs rather than generic templates.
              </p>
              <p className="text-xs text-[#525252] leading-relaxed">
                By serving one institution properly first, we establish a robust framework of care that can eventually scale to help more classrooms.
              </p>
            </div>

            {/* The Bigger Picture */}
            <div className="p-6 rounded-2xl bg-[#FFFBF0] border border-[#FDF3C8] space-y-3">
              <div className="flex items-center gap-2 text-[#111111]">
                <Sparkles size={16} className="text-[#D4A017]" />
                <h4 className="font-bold text-base">The Bigger Picture</h4>
              </div>
              <p className="text-xs text-[#525252] leading-relaxed">
                Affordable, high-quality education isn't a slogan — it's why Scholario was built. Every feature, including manual payment reconciliation to keep costs low and security logs to protect data integrity, works toward a single goal: giving institutions premium capability without the premium cost.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
