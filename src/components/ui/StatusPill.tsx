import React from 'react';

export type StatusType = 'present' | 'absent' | 'late' | 'upcoming' | 'cancelled' | 'active' | 'inactive';

interface StatusPillProps {
  status: StatusType | string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status }) => {
  const normalized = status.toLowerCase();

  let styles = 'bg-[#F5F5F5] text-[#737373] border-[#E5E5E5]';
  let label = status;

  switch (normalized) {
    case 'present':
      styles = 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
      label = 'Present';
      break;
    case 'absent':
      styles = 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]';
      label = 'Absent';
      break;
    case 'late':
      styles = 'bg-[#FFFBEB] text-[#92400E] border-[#FDE68A]';
      label = 'Late';
      break;
    case 'upcoming':
      styles = 'bg-[#FEF9C3] text-[#854D0E] border-[#FEF08A]';
      label = 'Upcoming';
      break;
    case 'cancelled':
      styles = 'bg-[#F5F5F5] text-[#737373] border-[#D4D4D4] line-through';
      label = 'Cancelled';
      break;
    case 'active':
      styles = 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]';
      label = 'Active';
      break;
    case 'inactive':
      styles = 'bg-[#F5F5F5] text-[#737373] border-[#D4D4D4]';
      label = 'Inactive';
      break;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${styles}`}>
      {label}
    </span>
  );
};

export default StatusPill;
