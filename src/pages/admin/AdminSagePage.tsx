import React from 'react';
import { Database, Bot, ShieldCheck } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SageChatView from '../../components/sage/SageChatView';
import { SAGE_MODEL_DISPLAY_NAME } from '../../lib/knowledgeBaseService';

export const AdminSagePage: React.FC = () => {
  return (
    <AdminShell>
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E5] dark:border-[#27272A]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#111111] dark:text-[#FAFAFA] tracking-tight">
                Sage AI
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F4C430]/20 text-[#B45309] dark:text-[#FBBF24] border border-[#F4C430]/40 shrink-0">
                UI v2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A1A1AA] mt-1 font-medium">
              Administrative AI copilot with live database access to students, offerings, fee structures, and curriculum.
            </p>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 text-[11px] font-bold text-purple-700 dark:text-purple-300">
              <Bot size={13} className="text-purple-600 dark:text-purple-400" />
              <span>{SAGE_MODEL_DISPLAY_NAME}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 text-[11px] font-bold text-sky-700 dark:text-sky-300">
              <Database size={13} className="text-sky-600 dark:text-sky-400" />
              <span>RAG Knowledge Vault</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
              <span>Admin Live RLS</span>
            </div>
          </div>
        </div>

        {/* Chat Component */}
        <div className="w-full">
          <SageChatView role="admin" />
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminSagePage;
