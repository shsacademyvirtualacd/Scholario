import React from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import TeacherShell from '../../components/teacher/TeacherShell';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import StaffAttendanceWidget from '../../components/staff/StaffAttendanceWidget';

export const StaffAttendancePage: React.FC = () => {
  const { profile } = useAuth();
  const role = profile?.role || 'teacher';

  const content = (
    <div className="space-y-6">
      <SectionHeader
        title="Staff Attendance & Timecard"
        description="Remote faculty presence tracking, automated shift clock-in/out, and session verification."
      />

      <StaffAttendanceWidget standalone />
    </div>
  );

  if (role === 'admin') {
    return <AdminShell>{content}</AdminShell>;
  }

  return <TeacherShell>{content}</TeacherShell>;
};

export default StaffAttendancePage;
