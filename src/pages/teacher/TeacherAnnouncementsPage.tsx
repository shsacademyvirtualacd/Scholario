import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, ShieldAlert } from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { getAnnouncements } from '../../lib/db';
import { useMobile } from '../../hooks/useMobile';
import { pageCache } from '../../lib/pageCache';
import type { Announcement } from '../../types';

export const TeacherAnnouncementsPage: React.FC = () => {
  const isMobile = useMobile();
  const cachedAnn = pageCache.get<Announcement[]>('teacher_announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>(cachedAnn || []);
  const [loading, setLoading] = useState(!cachedAnn || cachedAnn.length === 0);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (announcements.length === 0) {
      setLoading(true);
    }
    getAnnouncements()
      .then((data) => {
        setAnnouncements(data);
        pageCache.set('teacher_announcements', data);
      })
      .catch((err) => console.error('[TeacherAnnouncements] Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  return (
    <TeacherShell>
      <div className="space-y-6">
        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row items-center justify-between gap-4'}`}>
          <SectionHeader
            title="School & Class Announcements"
            subtitle="Read institutional updates, alerts, and notices scoped to your assigned classes."
          />
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-6 border-b border-[#F5F5F5] pb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-[#111111] text-base">All Visible Broadcasts</h2>
              <span className="badge badge-gray text-xs font-bold">{announcements.length} updates</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="text-[#737373]">Sort:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111] rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer hover:bg-[#F5F5F5]"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </div>
          </div>

          {loading && announcements.length === 0 ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-5 rounded-2xl border border-[#E5E5E5] flex flex-col md:flex-row items-start gap-4 bg-white">
                  <div className="p-3 rounded-xl border border-gray-100 bg-gray-50 shrink-0 w-12 h-12" />
                  <div className="flex-1 min-w-0 space-y-3 w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="h-5 bg-gray-100 rounded w-1/3" />
                      <div className="h-5 bg-gray-100 rounded-full w-20" />
                      <div className="h-5 bg-gray-100 rounded-full w-28" />
                    </div>
                    <div className="h-4 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-5/6" />
                    <div className="h-3 bg-gray-100 rounded w-24 pt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#A3A3A3] mb-3">
                <Megaphone size={22} />
              </div>
              <h3 className="font-bold text-[#111111] text-sm">No Active Announcements</h3>
              <p className="text-xs text-[#737373] max-w-sm mt-1 leading-relaxed">
                There are currently no active announcements posted for your assigned classes or school.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-5 rounded-xl border transition-all flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-4'} ${
                    ann.severity === 'crucial'
                      ? 'bg-[#FEF2F2]/40 border-[#FECACA] shadow-2xs'
                      : 'bg-white border-[#E5E5E5] hover:border-[#D4D4D4]'
                  }`}
                >
                  <div
                    className={`p-3 rounded-xl border shrink-0 flex items-center justify-center ${
                      ann.severity === 'crucial'
                        ? 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
                        : 'bg-[#FAFAFA] border-[#F0F0F0] text-[#111111]'
                    }`}
                  >
                    {ann.severity === 'crucial' ? <ShieldAlert size={22} /> : <Megaphone size={22} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="font-bold text-[#111111] text-sm md:text-base truncate">{ann.title}</h3>
                      <span
                        className={`badge text-[10px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full border ${
                          ann.severity === 'crucial'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-green-50 text-green-600 border-green-200'
                        }`}
                      >
                        {ann.severity === 'crucial' ? '🔴 Crucial' : '🟢 Normal'}
                      </span>
                      <span className="badge bg-[#FAFAFA] text-[#525252] border border-[#E5E5E5] text-[10px] font-bold py-0.5 px-2.5 rounded-full">
                        {ann.scope === 'class'
                          ? `🎯 Grade ${ann.class?.grade || ''} • ${ann.stream?.name || 'All Streams'}`
                          : '🌐 Whole System'}
                      </span>
                    </div>

                    <p className="text-xs md:text-sm text-[#525252] mt-2 leading-relaxed font-medium whitespace-pre-wrap">
                      {ann.body}
                    </p>

                    <div className="flex items-center gap-3 mt-3.5 text-[11px] text-[#A3A3A3] font-bold">
                      <span className="flex items-center gap-1 text-[#737373]">
                        <Calendar size={12} className="inline mr-1 text-[#A3A3A3]" />
                        {new Date(ann.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>{new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {ann.creator?.full_name && (
                        <>
                          <span>•</span>
                          <span>Posted by {ann.creator.full_name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TeacherShell>
  );
};

export default TeacherAnnouncementsPage;
