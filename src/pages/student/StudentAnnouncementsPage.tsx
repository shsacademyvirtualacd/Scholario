import React, { useState, useEffect } from 'react';
import { Megaphone, Calendar, Filter, Search, ShieldAlert } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import { getAnnouncements } from '../../lib/db';
import { useMobile } from '../../hooks/useMobile';
import { pageCache } from '../../lib/pageCache';
import type { Announcement } from '../../types';

export const StudentAnnouncementsPage: React.FC = () => {
  const isMobile = useMobile();
  const cachedAnn = pageCache.get<Announcement[]>('student_announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>(cachedAnn || []);
  const [loading, setLoading] = useState(!cachedAnn || cachedAnn.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'crucial' | 'normal'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    if (announcements.length === 0) {
      setLoading(true);
    }
    getAnnouncements()
      .then((data) => {
        setAnnouncements(data);
        pageCache.set('student_announcements', data);
      })
      .catch((err) => console.error('[StudentAnnouncements] Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  // Filter based on search term and severity selector, and sort by date
  const filteredAnnouncements = announcements
    .filter((ann) => {
      if (severityFilter !== 'all' && ann.severity !== severityFilter) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return ann.title.toLowerCase().includes(term) || ann.body.toLowerCase().includes(term);
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at).getTime();
      const timeB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  return (
    <StudentShell>
      <div className="space-y-6">
        {/* Banner */}
        <div className="bg-gradient-to-r from-[#111111] to-[#262626] rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-md">
          <div className="relative z-10 max-w-xl">
            <span className="badge bg-[#F4C430] text-[#111111] font-black tracking-widest text-[10px] uppercase px-2.5 py-1 mb-3 inline-block shadow-2xs">
              School Updates 📢
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              Notice Board & Alerts
            </h1>
            <p className="text-sm text-[#A3A3A3] font-medium leading-relaxed">
              Stay updated with school announcements, examination notices, and class-specific broadcast messages.
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-[#F4C430]/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 text-xs w-full py-2 bg-[#FAFAFA]"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-[#737373] flex items-center gap-1 shrink-0">
                <Filter size={12} /> Severity:
              </span>
              <button
                onClick={() => setSeverityFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  severityFilter === 'all'
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-[#FAFAFA] text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                }`}
              >
                All ({announcements.length})
              </button>
              <button
                onClick={() => setSeverityFilter('crucial')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1 ${
                  severityFilter === 'crucial'
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA] hover:bg-[#FEE2E2]'
                }`}
              >
                🔴 Crucial
              </button>
              <button
                onClick={() => setSeverityFilter('normal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border flex items-center gap-1 ${
                  severityFilter === 'normal'
                    ? 'bg-[#16A34A] text-white border-[#16A34A]'
                    : 'bg-[#FAFAFA] text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                }`}
              >
                🟢 Normal
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold shrink-0 border-l border-[#E5E5E5] pl-3">
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
        </div>

        {/* Announcements List */}
        <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-2xs">
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
              <h3 className="font-bold text-[#111111] text-sm">No Announcements Yet</h3>
              <p className="text-xs text-[#737373] max-w-sm mt-1 leading-relaxed">
                There are currently no announcements posted for your class or school right now.
              </p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <h3 className="font-bold text-[#111111] text-sm">No Matching Announcements Found</h3>
              <p className="text-xs text-[#737373] max-w-xs mt-1">Try clearing your search query or severity filters.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSeverityFilter('all');
                }}
                className="btn btn-secondary text-xs mt-4 interactive"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAnnouncements.map((ann) => (
                <div
                  key={ann.id}
                  className={`p-5 rounded-2xl border transition-all flex ${isMobile ? 'flex-col gap-3' : 'items-start gap-4'} ${
                    ann.severity === 'crucial'
                      ? 'bg-[#FEF2F2]/50 border-[#FECACA] shadow-xs'
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
                          : '🌐 School-wide'}
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
