import React from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-[#737373] mt-1 font-medium">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
