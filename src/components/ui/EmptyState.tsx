import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 md:p-12 bg-white border border-[#E5E5E5] rounded-2xl shadow-sm">
      <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#737373] mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-bold text-[#111111]">{title}</h3>
      <p className="text-sm text-[#737373] max-w-sm mt-1 mb-6 font-medium">{description}</p>
      {action}
    </div>
  );
};

export default EmptyState;
