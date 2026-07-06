import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

/**
 * Temporary placeholder used for pages not yet built.
 * Replaced batch-by-batch as development progresses.
 */
const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => (
  <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center p-6">
    <div className="text-center max-w-sm">
      <div className="w-14 h-14 rounded-2xl bg-[#FFFBF0] border border-[#F4C43033] flex items-center justify-center mx-auto mb-5">
        <Construction size={24} style={{ color: '#F4C430' }} />
      </div>
      <h1 className="text-xl font-extrabold text-[#111111] tracking-tight mb-2">{title}</h1>
      <p className="text-sm text-[#737373] leading-relaxed">
        {description ?? 'This page is being built in the next batch. Check back soon.'}
      </p>
    </div>
  </div>
);

export default PlaceholderPage;
