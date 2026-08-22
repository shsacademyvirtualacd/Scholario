import React from 'react';
import TeacherShell from '../../components/teacher/TeacherShell';
import SageChatView from '../../components/sage/SageChatView';

export const TeacherSagePage: React.FC = () => {
  return (
    <TeacherShell>
      <div className="space-y-4">
        <SageChatView role="teacher" />
      </div>
    </TeacherShell>
  );
};

export default TeacherSagePage;
