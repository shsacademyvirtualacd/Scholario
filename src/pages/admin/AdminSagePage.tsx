import React from 'react';
import AdminShell from '../../components/admin/AdminShell';
import SageChatView from '../../components/sage/SageChatView';

export const AdminSagePage: React.FC = () => {
  return (
    <AdminShell>
      <div className="space-y-4">
        <SageChatView role="admin" />
      </div>
    </AdminShell>
  );
};

export default AdminSagePage;
