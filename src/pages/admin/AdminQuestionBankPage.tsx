import React from 'react';
import AdminShell from '../../components/admin/AdminShell';
import AdminMCQVerificationView from '../../components/admin/mcq/AdminMCQVerificationView';

export const AdminQuestionBankPage: React.FC = () => {
  return (
    <AdminShell>
      <AdminMCQVerificationView />
    </AdminShell>
  );
};

export default AdminQuestionBankPage;
