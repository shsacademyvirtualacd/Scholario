import React, { useState, useEffect } from 'react';
import TeacherShell from '../../components/teacher/TeacherShell';
import { ChatView } from '../../components/chat/ChatView';
import { useAuth } from '../../features/auth/AuthContext';
import { getStudentsForTeacherClasses } from '../../lib/chatService';
import type { Profile } from '../../types';

export const TeacherChatPage: React.FC = () => {
  const { profile } = useAuth();
  const [enrolledStudents, setEnrolledStudents] = useState<Profile[]>([]);

  useEffect(() => {
    if (profile?.id) {
      getStudentsForTeacherClasses(profile.id)
        .then((students) => setEnrolledStudents(students))
        .catch((err) => console.error('[TeacherChatPage] Failed to fetch students:', err));
    }
  }, [profile?.id]);

  return (
    <TeacherShell>
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Banner */}
        <div className="bg-[#111111] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 max-w-xl">
            <span className="badge bg-[#F4C430] text-[#111111] font-black tracking-widest text-[10px] uppercase px-2.5 py-1 mb-3 inline-block shadow-2xs">
              Direct Messages 💬
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              Student Direct Threads
            </h1>
            <p className="text-xs md:text-sm text-[#A3A3A3] font-medium leading-relaxed">
              Communicate one-on-one with your enrolled students. All conversation records are permanent and private between you and each individual student.
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-[#F4C430]/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Chat System Container */}
        <ChatView
          role="teacher"
          availableContacts={enrolledStudents}
          onStartNewChatTitle="Message an Enrolled Student"
        />
      </div>
    </TeacherShell>
  );
};

export default TeacherChatPage;
