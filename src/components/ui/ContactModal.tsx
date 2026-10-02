import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { validatePakistaniPhoneNumber } from '../../lib/phoneValidation';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { supabase } from '../../lib/supabase';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

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
    }
  }, [open]);

  if (!open) return null;

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
      // Invoke Supabase Edge Function: send-contact-email
      // The recipient support@scholario.me is strictly hardcoded inside the edge function.
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
        // If error response contains JSON data with error message
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

      // Success! Clear form state completely
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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Container: Fixed max-height on dynamic viewport units, mobile-first */}
      <div className="relative z-10 bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4F4F5] w-full max-w-4xl max-h-[92dvh] sm:max-h-[90dvh] rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col border border-[#E5E5E5] dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Fixed Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-[#F0F0F0] dark:border-zinc-800 flex items-center justify-between bg-[#FAFAFA] dark:bg-zinc-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#FDF3C8] dark:bg-amber-950/40 text-[#D4A017] dark:text-amber-400 flex items-center justify-center shrink-0 border border-[#FDF3C8] dark:border-amber-900/30">
              <Mail size={19} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg md:text-xl font-extrabold text-[#111111] dark:text-[#F4F4F5] tracking-tight leading-tight">
                Contact Scholario
              </h2>
              <p className="text-[11px] sm:text-xs text-[#737373] dark:text-[#A1A1AA] mt-0.5 font-medium line-clamp-1">
                Get in touch with the development and support team.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-xl text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-white hover:bg-[#E5E5E5] dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* ONE Scrollable Body (overflow-y: auto, max-height based on dvh, smooth touch scrolling) */}
        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex flex-col md:flex-row min-h-full">

            {/* Left Column: Direct Contact, Working Hours & Technical Portal Notice */}
            <div className="w-full md:w-80 bg-[#FAFAFA] dark:bg-zinc-900/50 border-b md:border-b-0 md:border-r border-[#F0F0F0] dark:border-zinc-800 p-5 sm:p-6 md:p-7 flex flex-col justify-between space-y-6 shrink-0">
              <div className="space-y-6">
                
                {/* Direct Contact Info */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] dark:text-zinc-500 mb-3.5">
                    Direct Contact
                  </h4>
                  <div className="space-y-3.5 text-sm">
                    <div className="flex items-start gap-3">
                      <MapPin size={18} className="text-[#D4A017] dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs sm:text-sm text-[#111111] dark:text-[#F4F4F5]">Location</p>
                        <p className="text-[#737373] dark:text-[#A1A1AA] text-xs mt-0.5">Rawalpindi, Punjab, Pakistan</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail size={18} className="text-[#D4A017] dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs sm:text-sm text-[#111111] dark:text-[#F4F4F5]">Email Support</p>
                        <a
                          href="mailto:support@scholario.me"
                          className="text-xs text-[#2563EB] dark:text-amber-400 hover:underline mt-0.5 block font-medium break-all"
                        >
                          support@scholario.me
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone size={18} className="text-[#D4A017] dark:text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-xs sm:text-sm text-[#111111] dark:text-[#F4F4F5]">Call / WhatsApp</p>
                        <a
                          href="tel:+9230586969050"
                          className="text-[#737373] dark:text-[#A1A1AA] text-xs hover:text-[#111111] dark:hover:text-white mt-0.5 block transition-colors font-medium"
                        >
                          +92 305 86969050
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] dark:text-zinc-500 mb-2 flex items-center gap-1.5">
                    <Clock size={12} className="text-[#D4A017] dark:text-amber-400" />
                    Working Hours
                  </h4>
                  <div className="space-y-1 text-xs text-[#737373] dark:text-[#A1A1AA] leading-relaxed">
                    <p className="font-medium">Monday to Saturday: 9:00 AM – 6:00 PM (PKT)</p>
                    <p className="text-[11px] text-[#A3A3A3] dark:text-zinc-500">Emergency technical support available 24/7.</p>
                  </div>
                </div>

              </div>

              {/* Disclaimer Notice: Placed strictly inside Direct Contact/Working Hours section with clear divider */}
              <div className="pt-4 border-t border-[#E5E5E5] dark:border-zinc-800">
                <div className="flex items-start gap-2 bg-[#FFFBF0] dark:bg-amber-950/20 border border-[#FDF3C8] dark:border-amber-900/30 rounded-xl p-3">
                  <ShieldAlert size={16} className="text-[#D4A017] dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-[#737373] dark:text-zinc-400 leading-relaxed font-normal">
                    <strong className="text-[#111111] dark:text-zinc-200 font-semibold block mb-0.5">Notice:</strong>
                    SHS Virtual Academy technical administration portal. For admissions or fee disputes, please contact the admin office directly.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form */}
            <div className="flex-1 p-5 sm:p-6 md:p-8 flex flex-col justify-start">
              {isSuccess ? (
                <div className="text-center py-8 sm:py-12 max-w-sm mx-auto space-y-4 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 bg-[#FFFBF0] dark:bg-amber-950/30 text-[#D4A017] dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-[#FDF3C8] dark:border-amber-900/40">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-extrabold text-[#111111] dark:text-[#F4F4F5] tracking-tight">
                    Message Sent!
                  </h3>
                  <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A1A1AA] leading-relaxed">
                    Thank you for reaching out. Your message has been routed to <strong>support@scholario.me</strong>. A member of our support team will respond to your email shortly.
                  </p>
                  <button
                    onClick={() => {
                      setIsSuccess(false);
                      setServerError(null);
                    }}
                    className="px-5 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-zinc-700 text-xs font-bold text-[#111111] dark:text-[#F4F4F5] hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
                  
                  {/* Server error alert if function failed */}
                  {serverError && (
                    <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start gap-2.5 text-xs text-red-600 dark:text-red-400">
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

                  {/* Name and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] sm:text-xs font-bold text-[#111111] dark:text-[#F4F4F5] uppercase tracking-wide">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        maxLength={100}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        placeholder="e.g. Ali Ahmed"
                        className={`w-full text-xs sm:text-sm bg-white dark:bg-zinc-900 text-[#111111] dark:text-[#F4F4F5] border px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-600 ${
                          errors.name
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E5E5E5] dark:border-zinc-800 focus:border-[#111111] dark:focus:border-[#F4C430] focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#F4C430]'
                        }`}
                      />
                      {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] sm:text-xs font-bold text-[#111111] dark:text-[#F4F4F5] uppercase tracking-wide">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        placeholder="e.g. ali@example.com"
                        className={`w-full text-xs sm:text-sm bg-white dark:bg-zinc-900 text-[#111111] dark:text-[#F4F4F5] border px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-600 ${
                          errors.email
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E5E5E5] dark:border-zinc-800 focus:border-[#111111] dark:focus:border-[#F4C430] focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#F4C430]'
                        }`}
                      />
                      {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
                    </div>
                  </div>

                  {/* Phone & Role */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] sm:text-xs font-bold text-[#111111] dark:text-[#F4F4F5] uppercase tracking-wide">
                          Phone Number
                        </label>
                        <span className="text-[10px] text-[#A3A3A3] dark:text-zinc-500 font-medium">🇵🇰 +92 3XXXXXXXXX</span>
                      </div>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          if (errors.phone) setErrors({ ...errors, phone: '' });
                        }}
                        placeholder="e.g. +92 3058969050"
                        className={`w-full text-xs sm:text-sm bg-white dark:bg-zinc-900 text-[#111111] dark:text-[#F4F4F5] border px-3.5 py-2.5 rounded-xl outline-none transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-600 ${
                          errors.phone
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#E5E5E5] dark:border-zinc-800 focus:border-[#111111] dark:focus:border-[#F4C430] focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#F4C430]'
                        }`}
                      />
                      {errors.phone && <p className="text-[10px] text-red-500 font-semibold">{errors.phone}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] sm:text-xs font-bold text-[#111111] dark:text-[#F4F4F5] uppercase tracking-wide">
                        Your Role
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g. Student, Parent, Teacher"
                        className="w-full text-xs sm:text-sm bg-white dark:bg-zinc-900 text-[#111111] dark:text-[#F4F4F5] border border-[#E5E5E5] dark:border-zinc-800 px-3.5 py-2.5 rounded-xl outline-none focus:border-[#111111] dark:focus:border-[#F4C430] focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#F4C430] transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-600"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] sm:text-xs font-bold text-[#111111] dark:text-[#F4F4F5] uppercase tracking-wide">
                        Message *
                      </label>
                      <span className="text-[10px] text-[#A3A3A3] dark:text-zinc-500">
                        {formData.message.length}/2000
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={2000}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (errors.message) setErrors({ ...errors, message: '' });
                      }}
                      placeholder="How can we help you?"
                      className={`w-full text-xs sm:text-sm bg-white dark:bg-zinc-900 text-[#111111] dark:text-[#F4F4F5] border px-3.5 py-2.5 rounded-xl outline-none resize-none transition-all placeholder:text-[#A3A3A3] dark:placeholder:text-zinc-600 ${
                        errors.message
                          ? 'border-red-500 focus:border-red-500'
                          : 'border-[#E5E5E5] dark:border-zinc-800 focus:border-[#111111] dark:focus:border-[#F4C430] focus:ring-1 focus:ring-[#111111] dark:focus:ring-[#F4C430]'
                      }`}
                    />
                    {errors.message && <p className="text-[10px] text-red-500 font-semibold">{errors.message}</p>}
                  </div>

                  {/* Send Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full h-11 rounded-xl bg-[#F4C430] hover:bg-[#D4A017] text-[#111111] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                          <span>Sending message...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Message</span>
                          <Send size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};
