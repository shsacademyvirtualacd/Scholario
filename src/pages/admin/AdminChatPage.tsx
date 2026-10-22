import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Radio, Users, RefreshCw } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import { ChatView } from '../../components/chat/ChatView';
import { getAdminChatContacts } from '../../lib/chatService';
import type { Profile } from '../../types';

export const AdminChatPage: React.FC = () => {
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactError, setContactError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoadingContacts(true);
    setContactError(null);
    try {
      const { students, teachers } = await getAdminChatContacts();
      // List teachers first, then students
      setContacts([...teachers, ...students]);
    } catch (err: any) {
      console.error('[AdminChatPage] Failed to fetch contacts:', err);
      setContactError(err?.message || 'Failed to load institutional contacts.');
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  return (
    <AdminShell>
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E5E5] dark:border-[#27272A]">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#111111] dark:text-[#FAFAFA] tracking-tight">
                Scholario Chat
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F4C430]/20 text-[#B45309] dark:text-[#FBBF24] border border-[#F4C430]/40 shrink-0">
                UI v2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A1A1AA] mt-1 font-medium">
              Direct institutional messaging with students, faculty mentors, and academic administrators.
            </p>
          </div>

          {/* Status & Capabilities Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              <Radio size={13} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>Live Realtime</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/50 text-[11px] font-bold text-sky-700 dark:text-sky-300">
              <Shield size={13} className="text-sky-600 dark:text-sky-400" />
              <span>Encrypted Direct</span>
            </div>

            {loadingContacts ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5F5F5] dark:bg-zinc-800 text-[11px] font-bold text-[#737373] dark:text-zinc-400 animate-pulse">
                <Users size={13} />
                <span>Loading directory...</span>
              </div>
            ) : contactError ? (
              <button
                type="button"
                onClick={fetchContacts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-[11px] font-bold text-amber-800 dark:text-amber-300 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
                title="Retry loading directory"
              >
                <RefreshCw size={13} />
                <span>Retry Contacts</span>
              </button>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] dark:bg-zinc-800/80 border border-[#E5E5E5] dark:border-zinc-700 text-[11px] font-bold text-[#111111] dark:text-[#FAFAFA]">
                <Users size={13} className="text-[#F4C430]" />
                <span>{contacts.length} Contacts Directory</span>
              </div>
            )}
          </div>
        </div>

        {/* Chat System Container */}
        <div className="w-full">
          <ChatView
            role="admin"
            availableContacts={contacts}
            allowNewChatWithAllStudents={true}
            onStartNewChatTitle="Start Direct Chat (Teacher or Student)"
          />
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminChatPage;
