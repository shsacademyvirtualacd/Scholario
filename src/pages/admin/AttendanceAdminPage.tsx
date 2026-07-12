import React from 'react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { ClipboardCheck } from 'lucide-react';

export const AttendanceAdminPage: React.FC = () => {
  return (
    <AdminShell>
      <SectionHeader
        title="Attendance Manager"
        description="Mark and review student attendance across all class sessions."
      />

      <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-5 shadow-sm border border-amber-100/50">
          <ClipboardCheck size={32} strokeWidth={2.5} />
        </div>
        <h3 className="text-xl font-black text-[#111111] mb-2">Coming Soon</h3>
        <p className="text-[15px] font-semibold text-[#737373] max-w-sm">
          Attendance tracking is currently under development. Check back later!
        </p>
      </div>
    </AdminShell>
  );
};

export default AttendanceAdminPage;
