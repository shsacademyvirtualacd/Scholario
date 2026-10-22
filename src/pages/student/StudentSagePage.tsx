import React from 'react';
import StudentShell from '../../components/student/StudentShell';
import StudentPageHeader from '../../components/student/shared/StudentPageHeader';
import SageChatView from '../../components/sage/SageChatView';

export const StudentSagePage: React.FC = () => {
  return (
    <StudentShell>
      <div className="space-y-4 max-w-5xl mx-auto">
        <StudentPageHeader
          title="Sage AI"
          badge="UI v2"
          description="Your syllabus-aligned study companion for homework help, formula derivations, and exam prep."
        />
        <SageChatView role="student" />
      </div>
    </StudentShell>
  );
};

export default StudentSagePage;
