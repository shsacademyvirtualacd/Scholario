import React from 'react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import AdminMCQVerificationView from '../../components/admin/mcq/AdminMCQVerificationView';

export const AdminQuestionBankPage: React.FC = () => {
  return (
    <AdminShell>
      <SectionHeader
        title="Question Bank"
        description="Inspect, search, and verify curriculum-aligned MCQs, short questions, and long questions across all examination boards."
      />

      <div className="mt-4">
        <AdminMCQVerificationView />
      </div>
    </AdminShell>
  );
};

export default AdminQuestionBankPage;
