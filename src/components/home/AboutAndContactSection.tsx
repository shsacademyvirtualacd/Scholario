import React from 'react';
import { Sparkles, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';

interface AboutAndContactSectionProps {
  onOpenAbout: () => void;
  onOpenContact: () => void;
}

export const AboutAndContactSection: React.FC<AboutAndContactSectionProps> = ({
  onOpenAbout,
  onOpenContact,
}) => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-[#FAFAFA] border-t border-[#F5F5F5] relative overflow-hidden">
      {/* Decorative background glow */}
      <div 
        className="absolute bottom-0 right-0 w-full max-w-sm sm:max-w-[400px] h-[400px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(244,196,48,0.03) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Left Column: About Scholario short version */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: '#D4A017' }}>
                <span style={{ display: 'inline-block', width: 12, height: 2, background: '#D4A017', borderRadius: 1 }} />
                About Scholario
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#111111] leading-tight">
                Belief in accessible,
                <br />
                <span style={{ color: '#D4A017' }}>structured education</span>
              </h2>
              <p className="text-[#525252] text-base md:text-lg leading-relaxed max-w-2xl font-medium">
                Scholario was built on a simple belief: quality education shouldn't be a privilege reserved for those who can afford expensive infrastructure. Built for SHS Academy, Scholario brings the clarity and structure of a modern institution to every student, without the cost or complexity usually attached to it.
              </p>
            </div>
            
            <div>
              <button
                onClick={onOpenAbout}
                className="btn btn-gold btn-md group inline-flex items-center gap-2"
              >
                <span>Read Our Full Story</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* Right Column: Contact info & Quick message CTA */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#111111] text-white p-8 md:p-10 rounded-3xl relative overflow-hidden shadow-xl border border-[#262626]">
            {/* Ambient pattern */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-radial-gradient from-[#F4C430]/10 to-transparent pointer-events-none" />

            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 text-[9px] font-bold tracking-[0.12em] uppercase text-[#F4C430]">
                <Sparkles size={10} />
                Connect With Us
              </span>
              
              <h3 className="text-2xl font-extrabold tracking-tight">
                Have questions or need assistance?
              </h3>
              
              <p className="text-[#A3A3A3] text-sm leading-relaxed">
                Whether you're a parent tracking grades, an educator setting up class streams, or looking for institutional setup, our support team is here to help.
              </p>

              <div className="space-y-3.5 pt-2 text-sm text-[#D4D4D4]">
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-[#F4C430] shrink-0" />
                  <span>Rawalpindi, Punjab, Pakistan</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[#F4C430] shrink-0" />
                  <a href="mailto:shs.academy.virtual@gmail.com" className="hover:text-white transition-colors">
                    shs.academy.virtual@gmail.com
                  </a>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-[#F4C430] shrink-0" />
                  <a href="tel:+9230586969050" className="hover:text-white transition-colors">
                    +92 305 86969050
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-6 border-t border-[#262626]">
              <button
                onClick={onOpenContact}
                className="w-full btn btn-gold btn-md bg-[#F4C430] text-[#111111] hover:bg-[#D4A017]"
              >
                Send Us a Message
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
