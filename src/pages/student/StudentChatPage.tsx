import React from 'react';
import StudentShell from '../../components/student/StudentShell';
import { ChatView } from '../../components/chat/ChatView';

export const StudentChatPage: React.FC = () => {
  return (
    <StudentShell>
      <div className="space-y-4 max-w-7xl mx-auto">
        {/* Top Header Banner */}
        <div className="bg-[#111111] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 max-w-xl">
            <span className="badge bg-[#F4C430] text-[#111111] font-black tracking-widest text-[10px] uppercase px-2.5 py-1 mb-3 inline-block shadow-2xs">
              Direct Messages 💬
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              Academic Chat & Support
            </h1>
            <p className="text-xs md:text-sm text-[#A3A3A3] font-medium leading-relaxed">
              Connect directly with your course instructors and administration in dedicated, permanent 1-on-1 threads.
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-[#F4C430]/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Chat System Container */}
        <ChatView role="student" />
      </div>
    </StudentShell>
  );
};

export default StudentChatPage;
