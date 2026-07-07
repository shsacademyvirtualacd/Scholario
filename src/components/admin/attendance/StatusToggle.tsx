import React from 'react';
import { Check, Clock, X } from 'lucide-react';
import type { AttendanceStatus } from '../../../types';

interface StatusToggleProps {
  value: AttendanceStatus | null;
  onChange: (status: AttendanceStatus) => void;
}

export const StatusToggle: React.FC<StatusToggleProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-1.5 justify-end">
      
      {/* Present */}
      <button
        type="button"
        onClick={() => onChange('present')}
        className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
          value === 'present'
            ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#047857] shadow-sm'
            : 'bg-white border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#737373]'
        }`}
      >
        <Check size={12} className={value === 'present' ? 'text-[#10b981]' : ''} />
        <span>Present</span>
      </button>

      {/* Late */}
      <button
        type="button"
        onClick={() => onChange('late')}
        className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
          value === 'late'
            ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#B45309] shadow-sm'
            : 'bg-white border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#737373]'
        }`}
      >
        <Clock size={12} className={value === 'late' ? 'text-[#F4C430]' : ''} />
        <span>Late</span>
      </button>

      {/* Absent */}
      <button
        type="button"
        onClick={() => onChange('absent')}
        className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all ${
          value === 'absent'
            ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#B91C1C] shadow-sm'
            : 'bg-white border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#737373]'
        }`}
      >
        <X size={12} className={value === 'absent' ? 'text-[#ef4444]' : ''} />
        <span>Absent</span>
      </button>

    </div>
  );
};

export default StatusToggle;
