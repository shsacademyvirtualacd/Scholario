import React, { useState, useEffect } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { ChatView } from '../../components/chat/ChatView';
import { getAdminChatContacts } from '../../lib/chatService';
import type { Profile } from '../../types';

export const AdminChatPage: React.FC = () => {
  const [contacts, setContacts] = useState<Profile[]>([]);

  useEffect(() => {
    getAdminChatContacts()
      .then(({ students, teachers }) => {
        // List teachers first, then students
        setContacts([...teachers, ...students]);
      })
      .catch((err) => console.error('[AdminChatPage] Failed to fetch contacts:', err));
  }, []);

  return (
    <AdminShell>
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Banner */}
        <div className="bg-[#111111] rounded-3xl px-6 py-5 md:px-8 md:py-6 text-white relative overflow-hidden shadow-md flex items-center">
          <div className="relative z-10">
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              Scholario Chat
            </h1>
          </div>
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-[#F4C430]/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Chat System Container */}
        <ChatView
          role="admin"
          availableContacts={contacts}
          allowNewChatWithAllStudents={true}
          onStartNewChatTitle="Start Direct Chat (Teacher or Student)"
        />
      </div>
    </AdminShell>
  );
};

export default AdminChatPage;
