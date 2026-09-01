import React, { useState, useEffect } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import { ChatView } from '../../components/chat/ChatView';
import { getAllStudents } from '../../lib/db';
import type { Profile } from '../../types';

export const AdminChatPage: React.FC = () => {
  const [allStudents, setAllStudents] = useState<Profile[]>([]);

  useEffect(() => {
    getAllStudents()
      .then((students) => setAllStudents(students))
      .catch((err) => console.error('[AdminChatPage] Failed to fetch students:', err));
  }, []);

  return (
    <AdminShell>
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Banner */}
        <div className="bg-[#111111] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 max-w-xl">
            <span className="badge bg-[#F4C430] text-[#111111] font-black tracking-widest text-[10px] uppercase px-2.5 py-1 mb-3 inline-block shadow-2xs">
              Direct Messages 💬
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              Student Direct Communications
            </h1>
            <p className="text-xs md:text-sm text-[#A3A3A3] font-medium leading-relaxed">
              Official 1-on-1 support and advisory threads with students. Initiate a new thread with any enrolled student or respond to active student inquiries.
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-[#F4C430]/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Chat System Container */}
        <ChatView
          role="admin"
          availableContacts={allStudents}
          allowNewChatWithAllStudents={true}
          onStartNewChatTitle="Start Direct Chat with Student"
        />
      </div>
    </AdminShell>
  );
};

export default AdminChatPage;
