import React from 'react';

export interface TabOption<T extends string = string> {
  id: T;
  label: string;
  badge?: number | string;
  icon?: React.ReactNode;
}

export interface TabFilterProps<T extends string = string> {
  tabs: readonly TabOption<T>[] | TabOption<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  className?: string;
  variant?: 'pills' | 'underline' | 'chips' | 'segmented';
  size?: 'xs' | 'sm' | 'md';
}

export function TabFilter<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  className = '',
  variant = 'pills',
  size = 'sm',
}: TabFilterProps<T>) {
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-[11px]',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  }[size];

  if (variant === 'underline') {
    return (
      <div className={`flex items-center gap-4 border-b border-[#E5E5E5] overflow-x-auto no-scrollbar max-w-full ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`pb-3 font-bold transition-all relative flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'text-[#111111]' : 'text-[#737373] hover:text-[#111111]'
              } ${sizeClasses}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-[#F4C430] text-[#111111]' : 'bg-[#F0F0F0] text-[#737373]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#F4C430]" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'segmented') {
    return (
      <div className={`inline-flex items-center gap-1 p-1 bg-[#F5F5F5] rounded-xl overflow-x-auto no-scrollbar max-w-full ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`rounded-lg font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-white text-[#111111] shadow-2xs font-extrabold'
                  : 'text-[#737373] hover:text-[#111111]'
              } ${sizeClasses}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-[#111111] text-[#F4C430]' : 'bg-black/5 text-[#737373]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'chips') {
    return (
      <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full ${className}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`rounded-full border font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                  : 'bg-white text-[#525252] border-[#E5E5E5] hover:border-[#D4D4D4]'
              } ${sizeClasses}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-[#F0F0F0] text-[#737373]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Default: 'pills'
  return (
    <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full ${className}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`rounded-xl border font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
              isActive
                ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                : 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5] hover:text-[#111111]'
            } ${sizeClasses}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-black/5 text-[#737373]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabFilter;
