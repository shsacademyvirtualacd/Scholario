import React from 'react';
import StudentShell from '../../components/student/StudentShell';
import SageChatView from '../../components/sage/SageChatView';

export const StudentSagePage: React.FC = () => {
  return (
    <StudentShell>
      <div className="space-y-4">
        <SageChatView role="student" />
      </div>
    </StudentShell>
  );
};

export default StudentSagePage;
