import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { validatePakistaniPhoneNumber } from '../../lib/phoneValidation';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { supabase } from '../../lib/supabase';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS = ['Student', 'Parent', 'Teacher', 'Other'];

export const ContactModal: React.FC<ContactModalProps> = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    message: '',
    honeypot: '', // Hidden field for bot detection
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Swipe-down to close on mobile
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number | null>(null);

  // Lock background scroll and preserve position
  useModalScrollLock(open);

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

  // Reset errors and server error when opening/closing
  useEffect(() => {
    if (!open) {
      setServerError(null);
      setErrors({});
      setDragY(0);
      setIsDragging(false);
    }
  }, [open]);

  if (!open) return null;

  // Touch drag handlers for mobile bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0) {
      setDragY(diff);
    }
  };

  const handleTouchEnd = () => {
    if (dragY > 80) {
      onClose();
    }
    setDragY(0);
    setIsDragging(false);
    touchStartY.current = null;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName) {
      newErrors.name = 'Full name is required';
    } else if (trimmedName.length > 100) {
      newErrors.name = 'Full name must be 100 characters or less';
    }

    if (!trimmedEmail) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && formData.phone.trim()) {
      const phoneValidation = validatePakistaniPhoneNumber(formData.phone, false);
      if (!phoneValidation.isValid) {
        newErrors.phone = phoneValidation.error || 'Invalid phone format';
      }
    }

    if (!trimmedMessage) {
      newErrors.message = 'Please enter your message';
    } else if (trimmedMessage.length > 2000) {
      newErrors.message = 'Message must be 2000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role.trim(),
        message: formData.message.trim(),
        honeypot: formData.honeypot,
      };

      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: payload,
      });

      if (error) {
        console.error('[ContactModal] Edge function invocation error:', error);
        let errorMsg = error.message || 'Failed to send message. Please try again.';
        if (data && data.error) {
          errorMsg = data.error;
        }
        setServerError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      if (data && data.success === false) {
        setServerError(data.error || 'Unable to deliver message at this time.');
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: '',
        message: '',
        honeypot: '',
      });
      setErrors({});
    } catch (err: any) {
      console.error('[ContactModal] Unexpected submission error:', err);
      setServerError(err?.message || 'Network error occurred. Please check your connection.');
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
    >
      {/* ── 6px Blurred Dim Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-[6px] transition-opacity duration-300 animate-in fade-in cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ── Modal Container (Responsive: Mobile Bottom Sheet, Tablet Centered, Desktop 2-Panel) ── */}
      <div
        id="contact-modal-dialog"
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="relative z-10 w-full sm:w-[clamp(560px,85vw,640px)] lg:w-[clamp(920px,80vw,1000px)] max-h-[92dvh] sm:max-h-[90dvh] lg:max-h-[85vh] lg:h-[85vh] bg-white dark:bg-[#161616] text-[#111111] dark:text-white rounded-t-[28px] rounded-b-none sm:rounded-[28px] lg:rounded-[32px] shadow-[0_24px_64px_rgba(0,0,0,0.35)] flex flex-col lg:flex-row border border-black/[0.08] dark:border-white/[0.12] overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Top-Right Close Button (All screen sizes) */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 lg:top-6 lg:right-6 z-30 w-10 h-10 rounded-full flex items-center justify-center bg-black/[0.05] dark:bg-white/[0.08] text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-white hover:bg-black/[0.10] dark:hover:bg-white/[0.15] active:scale-95 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
        >
          <X size={19} className="stroke-[2.5]" />
        </button>

        {/* ── MOBILE DRAG HANDLE (under 640px) ── */}
        <div
          className="w-full pt-3 pb-1 flex justify-center items-center cursor-grab active:cursor-grabbing sm:hidden shrink-0 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 rounded-full bg-black/20 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/30 transition-colors" />
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* ── DESKTOP LEFT PANEL (1024px and above) ────────────────── */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="hidden lg:flex lg:flex-col lg:w-[38%] bg-[#F2C230]/[0.08] dark:bg-[#F2C230]/[0.06] border-r border-[#F2C230]/20 dark:border-white/[0.08] p-7 sm:p-8 justify-between overflow-y-auto shrink-0">
          <div className="space-y-6">
            {/* Header: Icon, Title, Subtitle */}
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#F2C230] text-[#111111] flex items-center justify-center shadow-[0_4px_16px_rgba(242,194,48,0.3)] mb-4">
                <Mail size={22} className="stroke-[2.3]" />
              </div>
              <h2
                id="contact-modal-title"
                className="text-2xl font-[800] tracking-tight text-[#111111] dark:text-white leading-tight"
              >
                Contact Scholario
              </h2>
              <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A1A1AA] mt-1.5 leading-relaxed font-medium">
                Get in touch with the development and support team.
              </p>
            </div>

            {/* Contact Details Stacked Vertically as Cards */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#D4A017] dark:text-[#F2C230]">
                Direct Contact
              </span>

              {/* Card 1: Call / WhatsApp */}
              <a
                href="tel:+9230586969050"
                className="p-3.5 rounded-[18px] bg-white/70 dark:bg-[#1C1C1C]/70 backdrop-blur-sm border border-black/[0.06] dark:border-white/[0.08] hover:border-[#F2C230]/60 hover:shadow-[0_4px_16px_rgba(242,194,48,0.15)] flex items-center gap-3.5 transition-all group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0 group-hover:bg-[#F2C230] group-hover:text-[#111111] transition-colors">
                  <Phone size={17} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#8E8E8E]">
                    Call / WhatsApp
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-[#111111] dark:text-white mt-0.5 truncate group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230] transition-colors">
                    +92 305 86969050
                  </p>
                </div>
              </a>

              {/* Card 2: Email Support */}
              <a
                href="mailto:support@scholario.me"
                className="p-3.5 rounded-[18px] bg-white/70 dark:bg-[#1C1C1C]/70 backdrop-blur-sm border border-black/[0.06] dark:border-white/[0.08] hover:border-[#F2C230]/60 hover:shadow-[0_4px_16px_rgba(242,194,48,0.15)] flex items-center gap-3.5 transition-all group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0 group-hover:bg-[#F2C230] group-hover:text-[#111111] transition-colors">
                  <Mail size={17} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#8E8E8E]">
                    Email Support
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-[#111111] dark:text-white mt-0.5 truncate group-hover:text-[#D4A017] dark:group-hover:text-[#F2C230] transition-colors">
                    support@scholario.me
                  </p>
                </div>
              </a>

              {/* Card 3: Location */}
              <div className="p-3.5 rounded-[18px] bg-white/70 dark:bg-[#1C1C1C]/70 backdrop-blur-sm border border-black/[0.06] dark:border-white/[0.08] hover:border-[#F2C230]/60 hover:shadow-[0_4px_16px_rgba(242,194,48,0.15)] flex items-center gap-3.5 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                  <MapPin size={17} className="stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#737373] dark:text-[#8E8E8E]">
                    Location
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-[#111111] dark:text-white mt-0.5 truncate">
                    Rawalpindi, Punjab, Pakistan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours Block (bottom of left panel) */}
          <div className="mt-8 pt-5 border-t border-[#F2C230]/25 dark:border-white/[0.08] space-y-1.5">
            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-[#D4A017] dark:text-[#F2C230] flex items-center gap-1.5">
              <Clock size={13} className="stroke-[2.5]" />
              Working Hours
            </h4>
            <p className="text-xs font-semibold text-[#333333] dark:text-[#D4D4D4] leading-relaxed">
              Monday to Saturday: 9:00 AM – 6:00 PM (PKT)
            </p>
            <p className="text-[11px] text-[#737373] dark:text-[#8E8E8E] leading-tight">
              Emergency technical support available 24/7.
            </p>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────── */}
        {/* ── RIGHT PANEL / MAIN CONTENT (Mobile, Tablet & Desktop) ── */}
        {/* ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-y-auto overscroll-contain bg-white dark:bg-[#161616]">
          {/* Header on Mobile & Tablet (< 1024px) */}
          <div className="lg:hidden px-5 sm:px-7 pt-2 sm:pt-6 pb-3 sm:pb-4 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-[#F2C230] text-[#111111] flex items-center justify-center shrink-0 shadow-xs">
              <Mail size={19} className="stroke-[2.3]" />
            </div>
            <div className="min-w-0 pr-8">
              <h2 className="text-lg sm:text-xl font-[800] text-[#111111] dark:text-white tracking-tight leading-tight">
                Contact Scholario
              </h2>
              <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5 font-medium truncate">
                Get in touch with the development and support team.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-7 md:p-8 flex-1 flex flex-col justify-between">
            {/* ── QUICK CONTACT TILES (Mobile & Tablet) ── */}
            {/* Mobile (under 640px): 1 row of 3 (icon + short label) */}
            <div className="grid grid-cols-3 gap-2 sm:hidden mb-5">
              <a
                href="tel:+9230586969050"
                className="h-13 min-h-[48px] rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] hover:border-[#F2C230] flex flex-col items-center justify-center gap-1 text-center transition-all active:scale-[0.98] group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <Phone size={15} className="text-[#D4A017] dark:text-[#F2C230]" />
                <span className="text-[11px] font-bold text-[#111111] dark:text-white leading-none">Call</span>
              </a>

              <a
                href="mailto:support@scholario.me"
                className="h-13 min-h-[48px] rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] hover:border-[#F2C230] flex flex-col items-center justify-center gap-1 text-center transition-all active:scale-[0.98] group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <Mail size={15} className="text-[#D4A017] dark:text-[#F2C230]" />
                <span className="text-[11px] font-bold text-[#111111] dark:text-white leading-none">Email</span>
              </a>

              <div className="h-13 min-h-[48px] rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] hover:border-[#F2C230] flex flex-col items-center justify-center gap-1 text-center transition-all">
                <MapPin size={15} className="text-[#D4A017] dark:text-[#F2C230]" />
                <span className="text-[11px] font-bold text-[#111111] dark:text-white leading-none">Location</span>
              </div>
            </div>

            {/* Tablet (640px to 1023px): 1 row of 3 with full text */}
            <div className="hidden sm:grid lg:hidden grid-cols-3 gap-3 mb-6">
              <a
                href="tel:+9230586969050"
                className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] hover:border-[#F2C230] transition-all flex items-center gap-2.5 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <div className="w-8 h-8 rounded-xl bg-[#F2C230]/20 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                  <Phone size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-[#737373] dark:text-[#8E8E8E] block leading-none">
                    Phone
                  </span>
                  <span className="text-xs font-bold text-[#111111] dark:text-white truncate block mt-0.5">
                    +92 305 86969050
                  </span>
                </div>
              </a>

              <a
                href="mailto:support@scholario.me"
                className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] hover:border-[#F2C230] transition-all flex items-center gap-2.5 group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
              >
                <div className="w-8 h-8 rounded-xl bg-[#F2C230]/20 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                  <Mail size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-[#737373] dark:text-[#8E8E8E] block leading-none">
                    Email
                  </span>
                  <span className="text-xs font-bold text-[#111111] dark:text-white truncate block mt-0.5">
                    support@scholario.me
                  </span>
                </div>
              </a>

              <div className="p-3 rounded-2xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] hover:border-[#F2C230] transition-all flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#F2C230]/20 text-[#D4A017] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                  <MapPin size={15} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-[#737373] dark:text-[#8E8E8E] block leading-none">
                    Location
                  </span>
                  <span className="text-xs font-bold text-[#111111] dark:text-white truncate block mt-0.5">
                    Rawalpindi, Punjab, Pakistan
                  </span>
                </div>
              </div>
            </div>

            {/* ── FORM OR SUCCESS STATE ── */}
            {isSuccess ? (
              <div className="text-center py-10 sm:py-14 max-w-sm mx-auto space-y-4 animate-in fade-in zoom-in-95 my-auto">
                <div className="w-16 h-16 bg-[#F2C230]/20 text-[#D4A017] dark:text-[#F2C230] rounded-2xl flex items-center justify-center mx-auto border border-[#F2C230]/30 shadow-xs">
                  <CheckCircle2 size={32} className="stroke-[2.5]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-[800] text-[#111111] dark:text-white tracking-tight">
                  Message Sent!
                </h3>
                <p className="text-xs sm:text-sm text-[#666666] dark:text-[#A1A1AA] leading-relaxed">
                  Thank you for reaching out. Your message has been routed to{' '}
                  <strong className="text-[#111111] dark:text-white">support@scholario.me</strong>. A member of our
                  support team will respond to your email shortly.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccess(false);
                      setServerError(null);
                    }}
                    className="min-h-[48px] px-6 py-2.5 rounded-full border border-black/[0.15] dark:border-white/[0.2] text-xs sm:text-sm font-bold text-[#111111] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F2C230]"
                  >
                    Send another message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-4">
                  {/* Server error alert if function failed */}
                  {serverError && (
                    <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
                      <AlertCircle size={16} className="shrink-0 mt-0.5" />
                      <div className="flex-1 leading-snug">
                        <span className="font-bold">Error sending message:</span> {serverError}
                      </div>
                    </div>
                  )}

                  {/* Honeypot anti-spam field (hidden from real users) */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="hp_field">Do not fill this</label>
                    <input
                      id="hp_field"
                      type="text"
                      name="hp_field"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                    />
                  </div>

                  {/* 2-Column Grid: Full Name | Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact_name"
                        className="text-[12px] font-extrabold text-[#111111] dark:text-[#E0E0E0] uppercase tracking-wide"
                      >
                        Full Name *
                      </label>
                      <input
                        id="contact_name"
                        type="text"
                        value={formData.name}
                        maxLength={100}
                        onFocus={(e) => {
                          setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
                        }}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        placeholder="e.g. Ali Ahmed"
                        className={`w-full text-[16px] min-h-[48px] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-white border px-4 py-2.5 rounded-2xl outline-none transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-500 hover:border-[#F2C230]/60 ${
                          errors.name
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-black/[0.12] dark:border-white/[0.15] focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/25'
                        }`}
                      />
                      {errors.name && <p className="text-[11px] text-red-500 font-semibold">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label
                        htmlFor="contact_email"
                        className="text-[12px] font-extrabold text-[#111111] dark:text-[#E0E0E0] uppercase tracking-wide"
                      >
                        Email Address *
                      </label>
                      <input
                        id="contact_email"
                        type="email"
                        value={formData.email}
                        onFocus={(e) => {
                          setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
                        }}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        placeholder="e.g. ali@example.com"
                        className={`w-full text-[16px] min-h-[48px] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-white border px-4 py-2.5 rounded-2xl outline-none transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-500 hover:border-[#F2C230]/60 ${
                          errors.email
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-black/[0.12] dark:border-white/[0.15] focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/25'
                        }`}
                      />
                      {errors.email && <p className="text-[11px] text-red-500 font-semibold">{errors.email}</p>}
                    </div>
                  </div>

                  {/* 2-Column Grid: Phone | Your Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    {/* Phone */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="contact_phone"
                          className="text-[12px] font-extrabold text-[#111111] dark:text-[#E0E0E0] uppercase tracking-wide"
                        >
                          Phone Number
                        </label>
                        <span className="text-[10px] text-[#888888] dark:text-[#8E8E8E] font-semibold">
                          🇵🇰 +92 3XXXXXXXXX
                        </span>
                      </div>
                      <input
                        id="contact_phone"
                        type="text"
                        value={formData.phone}
                        onFocus={(e) => {
                          setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
                        }}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (errors.phone) setErrors({ ...errors, phone: '' });
                        }}
                        placeholder="e.g. +92 305 8969050"
                        className={`w-full text-[16px] min-h-[48px] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-white border px-4 py-2.5 rounded-2xl outline-none transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-500 hover:border-[#F2C230]/60 ${
                          errors.phone
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-black/[0.12] dark:border-white/[0.15] focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/25'
                        }`}
                      />
                      {errors.phone && <p className="text-[11px] text-red-500 font-semibold">{errors.phone}</p>}
                    </div>

                    {/* Your Role (with quick selectable role chips that wrap) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label
                          htmlFor="contact_role"
                          className="text-[12px] font-extrabold text-[#111111] dark:text-[#E0E0E0] uppercase tracking-wide"
                        >
                          Your Role
                        </label>
                        {formData.role && (
                          <span className="text-[10px] font-bold text-[#D4A017] dark:text-[#F2C230] truncate">
                            {formData.role}
                          </span>
                        )}
                      </div>
                      <input
                        id="contact_role"
                        type="text"
                        value={formData.role}
                        onFocus={(e) => {
                          setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
                        }}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g. Student, Parent, Teacher"
                        className="w-full text-[16px] min-h-[48px] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-white border border-black/[0.12] dark:border-white/[0.15] px-4 py-2.5 rounded-2xl outline-none focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/25 hover:border-[#F2C230]/60 transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-500"
                      />

                      {/* Role Chips (wrap smoothly on all screens) */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {ROLE_OPTIONS.map((r) => {
                          const isSelected = formData.role.trim().toLowerCase() === r.toLowerCase();
                          return (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, role: isSelected ? '' : r });
                              }}
                              className={`h-7 px-2.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#F2C230] text-[#111111] shadow-2xs'
                                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-[#666666] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-white border border-black/[0.06] dark:border-white/[0.1]'
                              }`}
                            >
                              {r}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Message (Full width, with 0/2000 counter inside textarea) */}
                  <div className="space-y-1.5 col-span-full">
                    <label
                      htmlFor="contact_message"
                      className="text-[12px] font-extrabold text-[#111111] dark:text-[#E0E0E0] uppercase tracking-wide block"
                    >
                      Message *
                    </label>
                    <div className="relative">
                      <textarea
                        id="contact_message"
                        rows={4}
                        maxLength={2000}
                        value={formData.message}
                        onFocus={(e) => {
                          setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
                        }}
                        onChange={(e) => {
                          setFormData({ ...formData, message: e.target.value });
                          if (errors.message) setErrors({ ...errors, message: '' });
                        }}
                        placeholder="How can we help you?"
                        className={`w-full text-[16px] bg-white dark:bg-[#1A1A1A] text-[#111111] dark:text-white border px-4 pt-3 pb-8 rounded-2xl outline-none resize-none transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-500 hover:border-[#F2C230]/60 ${
                          errors.message
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-black/[0.12] dark:border-white/[0.15] focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/25'
                        }`}
                      />
                      {/* Character Counter Inside Textarea */}
                      <div className="absolute bottom-2.5 right-3 text-[11px] font-bold text-[#888888] dark:text-[#737373] pointer-events-none select-none">
                        {formData.message.length}/2000
                      </div>
                    </div>
                    {errors.message && <p className="text-[11px] text-red-500 font-semibold">{errors.message}</p>}
                  </div>
                </div>

                {/* ── Send Message Button ── */}
                {/* On Mobile (< 640px): sticky at the bottom of the sheet */}
                {/* On Tablet & Desktop (>= 640px): normal (non-sticky) at the bottom */}
                <div className="sticky bottom-0 sm:static bg-white/95 dark:bg-[#161616]/95 backdrop-blur-md pt-3 pb-[max(12px,env(safe-area-inset-bottom))] px-4 -mx-4 sm:mx-0 sm:p-0 sm:pt-4 border-t border-black/[0.06] dark:border-white/[0.08] sm:border-0 z-20 shrink-0">
                  <button
                    id="contact-submit-btn"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 min-h-[48px] rounded-full sm:rounded-2xl bg-[#F2C230] hover:bg-[#E5B520] text-[#111111] font-[800] text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(242,194,48,0.28)] hover:shadow-[0_6px_20px_rgba(242,194,48,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                        <span>Sending message...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Message</span>
                        <Send size={16} className="stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ContactModal;
