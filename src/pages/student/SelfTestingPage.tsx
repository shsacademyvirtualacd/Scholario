import React from 'react';
import StudentShell from '../../components/student/StudentShell';
import StudentPageHeader from '../../components/student/shared/StudentPageHeader';
import SelfTestingView from '../../components/tests/SelfTestingView';
import { useAuth } from '../../features/auth/AuthContext';

export const SelfTestingPage: React.FC = () => {
  const { profile } = useAuth();
  const studentGrade = profile?.class?.grade || (profile as any)?.grade || '10';
  const studentBoardId =
    profile?.board_id ||
    (typeof profile?.board === 'string' ? profile.board : profile?.board?.id) ||
    profile?.class?.board_id ||
    'fbise';

  return (
    <StudentShell>
      <StudentPageHeader
        title="Self Testing"
        description="Practice curriculum-aligned multiple choice questions, mock exams, and instant performance feedback."
        badge="UI v2"
      />

      <div className="mt-4">
        <SelfTestingView
          defaultBoard={studentBoardId}
          defaultGrade={studentGrade}
          userRole="student"
        />
      </div>
    </StudentShell>
  );
};

export default SelfTestingPage;
