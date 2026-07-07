import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

interface ContactModalProps {
  open: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ open, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Student',
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.message.trim()) newErrors.message = 'Please enter your message';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    // Simulate submission delay
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Student',
        message: ''
      });
    }, 1200);
  };

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
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-extrabold text-[#111111] tracking-tight">
                Contact Scholario
              </h2>
              <p className="text-xs text-[#737373] mt-0.5 font-medium">
                Get in touch with the development and support team.
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

        {/* Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* Left Column: Direct Info */}
          <div className="w-full md:w-80 bg-[#FAFAFA] border-r border-[#F5F5F5] p-6 md:p-8 flex flex-col justify-between space-y-6 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-4">
                  Direct Contact
                </h4>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="text-[#D4A017] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#111111]">Location</p>
                      <p className="text-[#737373] text-xs mt-0.5">Rawalpindi, Punjab, Pakistan</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail size={18} className="text-[#D4A017] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#111111]">Email</p>
                      <a href="mailto:shs.academy.virtual@gmail.com" className="text-[#737373] text-xs hover:text-[#111111] mt-0.5 block transition-colors">
                        shs.academy.virtual@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone size={18} className="text-[#D4A017] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#111111]">Call / WhatsApp</p>
                      <a href="tel:+9230586969050" className="text-[#737373] text-xs hover:text-[#111111] mt-0.5 block transition-colors">
                        +92 305 86969050
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#A3A3A3] mb-3">
                  Working Hours
                </h4>
                <p className="text-xs text-[#737373] leading-relaxed">
                  Monday to Saturday: 9:00 AM - 6:00 PM (PKT)
                  <br />
                  Emergency technical support available 24/7.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-[#E5E5E5] text-xs text-[#A3A3A3] leading-relaxed">
              SHS Academy technical administration portal. For admissions or fee disputes, please contact the admin office directly.
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col justify-center">
            {isSuccess ? (
              <div className="text-center py-10 max-w-sm mx-auto space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-[#FFFBF0] text-[#D4A017] rounded-full flex items-center justify-center mx-auto border border-[#FDF3C8]">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-xl font-extrabold text-[#111111]">Message Sent!</h3>
                <p className="text-sm text-[#737373] leading-relaxed">
                  Thank you for reaching out. A support representative or developer from the SHS Academy team will respond to your query shortly.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="btn btn-ghost text-xs font-bold text-[#111111] hover:bg-[#F5F5F5] px-4 py-2 mt-4"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111111] uppercase tracking-wide">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: '' });
                      }}
                      placeholder="e.g. Ali Ahmed"
                      className={`w-full text-sm border px-3.5 py-2.5 rounded-xl outline-none transition-all ${
                        errors.name ? 'border-red-500 focus:border-red-500' : 'border-[#E5E5E5] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]'
                      }`}
                    />
                    {errors.name && <p className="text-[10px] text-red-500 font-semibold">{errors.name}</p>}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111111] uppercase tracking-wide">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      placeholder="e.g. ali@example.com"
                      className={`w-full text-sm border px-3.5 py-2.5 rounded-xl outline-none transition-all ${
                        errors.email ? 'border-red-500 focus:border-red-500' : 'border-[#E5E5E5] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]'
                      }`}
                    />
                    {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111111] uppercase tracking-wide">Phone Number (Optional)</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +92 300 1234567"
                      className="w-full text-sm border border-[#E5E5E5] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#111111] uppercase tracking-wide">Your Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full text-sm border border-[#E5E5E5] px-3.5 py-2.5 rounded-xl outline-none focus:border-[#111111] focus:ring-1 focus:ring-[#111111] bg-white transition-all cursor-pointer"
                    >
                      <option value="Student">Student / Applicant</option>
                      <option value="Parent">Parent / Guardian</option>
                      <option value="Educator">Educator / Staff</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#111111] uppercase tracking-wide">Message *</label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (errors.message) setErrors({ ...errors, message: '' });
                    }}
                    placeholder="How can we help you?"
                    className={`w-full text-sm border px-3.5 py-2.5 rounded-xl outline-none resize-none transition-all ${
                      errors.message ? 'border-red-500 focus:border-red-500' : 'border-[#E5E5E5] focus:border-[#111111] focus:ring-1 focus:ring-[#111111]'
                    }`}
                  />
                  {errors.message && <p className="text-[10px] text-red-500 font-semibold">{errors.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn btn-gold btn-md mt-2 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#111111] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
