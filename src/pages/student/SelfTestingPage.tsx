import React from 'react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
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
      <SectionHeader
        title="Self Testing"
        description="Practice with curriculum-aligned multiple choice questions, mock exam simulations, and instant performance feedback."
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
