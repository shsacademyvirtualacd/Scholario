import React, { useState, useEffect } from 'react';
import StudentShell from '../../components/student/StudentShell';
import StudentPageHeader from '../../components/student/shared/StudentPageHeader';
import { ChatView } from '../../components/chat/ChatView';
import { useAuth } from '../../features/auth/AuthContext';
import { getStudentChatContacts } from '../../lib/chatService';
import type { Profile } from '../../types';

export const StudentChatPage: React.FC = () => {
  const { profile } = useAuth();
  const [contacts, setContacts] = useState<Profile[]>([]);

  useEffect(() => {
    if (profile?.id) {
      getStudentChatContacts(profile.id)
        .then(({ teachers, admins, admin }) => {
          const adminList = admins && admins.length > 0 ? admins : (admin ? [admin] : []);
          setContacts([...adminList, ...teachers]);
        })
        .catch((err) => console.error('[StudentChatPage] Failed to fetch contacts:', err));
    }
  }, [profile?.id]);

  return (
    <StudentShell>
      <div className="space-y-3 max-w-7xl mx-auto">
        <StudentPageHeader
          title="Chat"
          description="Direct messaging with your teachers and academy administration."
          badge="UI v2"
        />

        {/* Chat System Container */}
        <ChatView
          role="student"
          availableContacts={contacts}
          onStartNewChatTitle="Message a Teacher or Admin Support"
        />
      </div>
    </StudentShell>
  );
};

export default StudentChatPage;
