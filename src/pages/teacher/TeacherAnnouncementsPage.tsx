import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar } from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { MOCK_ANNOUNCEMENTS, getTeacherOfferings, MOCK_OFFERINGS } from '../../lib/mockData';
import type { Announcement } from '../../lib/mockData';
import { useAuth } from '../../features/auth/AuthContext';

export const TeacherAnnouncementsPage: React.FC = () => {
  const { profile } = useAuth();
  const teacherId = profile?.id || 't1';

  // Load teacher specific class offerings
  const teacherOfferings = getTeacherOfferings(teacherId);
  const teacherOfferingIds = teacherOfferings.map((o) => o.id);

  const [announcements, setAnnouncements] = useState<Announcement[]>([...MOCK_ANNOUNCEMENTS]);

  useEffect(() => {
    const handleUpdate = () => {
      setAnnouncements([...MOCK_ANNOUNCEMENTS]);
    };
    window.addEventListener('scholario_announcements_updated', handleUpdate);
    return () => {
      window.removeEventListener('scholario_announcements_updated', handleUpdate);
    };
  }, []);

  // Filter visible announcements: show institution-wide (no offering_id) OR teacher's assigned classes
  const visibleAnnouncements = announcements.filter((ann) => {
    return !ann.offering_id || teacherOfferingIds.includes(ann.offering_id);
  });

  return (
    <TeacherShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="School Announcements"
            description="View active announcements, guidelines, and class updates from school administration."
          />
        </div>

        {/* List of active announcements */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5">
          <div className="flex items-center justify-between mb-4 border-b border-[#F5F5F5] pb-3">
            <h2 className="font-bold text-[#111111] text-base">Active Broadcasts</h2>
            <span className="badge badge-gray text-xs">{visibleAnnouncements.length} updates</span>
          </div>

          {visibleAnnouncements.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#A3A3A3] mb-3">
                <Megaphone size={20} />
              </div>
              <h3 className="font-bold text-[#111111] text-sm">No Active Announcements</h3>
              <p className="text-xs text-[#737373] max-w-xs mt-1">There are no active notices or updates broadcasted at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleAnnouncements.map((ann) => {
                const offering = ann.offering_id ? MOCK_OFFERINGS.find(o => o.id === ann.offering_id) : undefined;
                return (
                  <div
                    key={ann.id}
                    className="p-4 rounded-xl border border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-sm transition-all flex items-start gap-4 group"
                  >
                    <div className="text-2xl shrink-0 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                      {ann.icon || '📢'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-[#111111] text-sm truncate">{ann.title}</h3>
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
                        {offering ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                            {offering.subject} (Class {offering.grade})
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100">
                            Institution-Wide
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#525252] mt-1.5 leading-relaxed font-medium whitespace-pre-wrap">
                        {ann.content}
                      </p>
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-[#A3A3A3] font-bold">
                        <span className="flex items-center gap-1 text-[#A3A3A3]">
                          <Calendar size={11} className="inline mr-1" />
                          {ann.date}
                        </span>
                        <span>•</span>
                        <span>{ann.time}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </TeacherShell>
  );
};

export default TeacherAnnouncementsPage;
