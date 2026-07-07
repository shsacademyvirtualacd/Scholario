import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Filter, Search } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import { MOCK_ANNOUNCEMENTS, MOCK_ENROLLMENTS, MOCK_USER_ID } from '../../lib/mockData';
import type { Announcement } from '../../lib/mockData';
import { useAuth } from '../../features/auth/AuthContext';

export const StudentAnnouncementsPage: React.FC = () => {
  const { profile } = useAuth();
  const studentId = profile?.id || MOCK_USER_ID;

  const [announcements, setAnnouncements] = useState<Announcement[]>([...MOCK_ANNOUNCEMENTS]);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    const handleUpdate = () => {
      setAnnouncements([...MOCK_ANNOUNCEMENTS]);
    };
    window.addEventListener('scholario_announcements_updated', handleUpdate);
    return () => {
      window.removeEventListener('scholario_announcements_updated', handleUpdate);
    };
  }, []);

  const enrolledOfferingIds = MOCK_ENROLLMENTS
    .filter(e => e.student_id === studentId)
    .map(e => e.offering_id);

  const filteredAnnouncements = announcements.filter((ann) => {
    // Show if school-wide OR if the student is enrolled in that offering
    const isVisible = !ann.offering_id || enrolledOfferingIds.includes(ann.offering_id);
    if (!isVisible) return false;

    const matchesSearch = ann.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      ann.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || ann.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  return (
    <StudentShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            School Announcements 📢
          </h1>
          <p className="text-sm text-[#737373] mt-1">
            Stay updated with the latest news, notices, and exam schedules from school administration.
          </p>
        </div>

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 py-2 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-[#737373] shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="input text-sm py-2 px-3 pr-8 min-w-[140px]"
            >
              <option value="all">All Priorities</option>
              <option value="high">🔴 High Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="low">🟢 Low Priority</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5">
          {filteredAnnouncements.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#A3A3A3] mb-3">
                <Megaphone size={20} />
              </div>
              <h3 className="font-bold text-[#111111] text-sm">No Announcements Found</h3>
              <p className="text-xs text-[#737373] max-w-xs mt-1">There are no updates matching your search criteria right now.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F5F5F5]">
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className="py-5 first:pt-0 last:pb-0 flex items-start gap-4 hover:bg-[#FAFAFA]/50 px-2 rounded-xl transition-all"
                >
                  <div className="text-2xl shrink-0 p-3 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                    {ann.icon || '📢'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-[#111111] text-sm leading-snug">{ann.title}</h3>
                      <span
                        className={`badge text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border ${
                          ann.priority === 'high'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : ann.priority === 'medium'
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-green-50 text-green-600 border-green-200'
                        }`}
                      >
                        {ann.priority}
                      </span>
                    </div>
                    <p className="text-xs text-[#525252] mt-2 leading-relaxed font-medium whitespace-pre-wrap">
                      {ann.content}
                    </p>
                    <div className="flex items-center gap-3 mt-3.5 text-[10px] text-[#A3A3A3] font-bold">
                      <span className="flex items-center gap-1 text-[#A3A3A3]">
                        <Calendar size={11} className="inline mr-1" />
                        {ann.date}
                      </span>
                      <span>•</span>
                      <span>{ann.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentShell>
  );
};

export default StudentAnnouncementsPage;
