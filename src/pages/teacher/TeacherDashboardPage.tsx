import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Clock, Calendar, CheckCircle2, ChevronRight, UserPlus
} from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import StatusPill from '../../components/ui/StatusPill';
import { useAuth } from '../../features/auth/AuthContext';
import {
  getOfferingsForTeacher,
  getStudentsForTeacher,
  getStudentsInOffering,
  getSlotsForTeacher,
} from '../../lib/db';
import { pageCache } from '../../lib/pageCache';
import type { ClassOffering, ClassSlot, Profile } from '../../types';

// ─── Live Next Class Countdown Widget for Teacher ──────────────────
const TeacherNextClassWidget: React.FC<{ slots: ClassSlot[] }> = ({ slots }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  const currentDayIndex = (new Date().getDay() + 6) % 7; // 0=Mon ... 6=Sun

  // Sort slots by day and time to find upcoming ones
  const upcomingSlots = slots
    .filter(slot => slot.day_of_week >= currentDayIndex && !slot.is_cancelled)
    .sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return (a.start_time || '').localeCompare(b.start_time || '');
    });

  const nextSlot = upcomingSlots[0] || slots[0];

  useEffect(() => {
    if (!nextSlot || !nextSlot.start_time) return;

    const updateCountdown = () => {
      const now = new Date();
      const target = new Date();

      const startTimeStr = nextSlot.start_time || '09:00:00';
      let targetDay = nextSlot.day_of_week ?? 0;
      let currentDay = (now.getDay() + 6) % 7;

      let daysToAdd = targetDay - currentDay;
      if (daysToAdd < 0 || (daysToAdd === 0 && startTimeStr < `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`)) {
        daysToAdd += 7;
      }

      target.setDate(now.getDate() + daysToAdd);

      const [hours = 9, minutes = 0] = startTimeStr.split(':').map(Number);
      target.setHours(hours, minutes, 0, 0);

      const diffMs = target.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeLeft('Starting now');
        return;
      }

      const diffMins = Math.floor(diffMs / 60000);
      const h = Math.floor(diffMins / 60);
      const m = diffMins % 60;

      if (h > 0) {
        setTimeLeft(`in ${h}h ${m}m`);
      } else {
        setTimeLeft(`in ${m}m`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [nextSlot]);

  if (!nextSlot) {
    return (
      <div className="stat-card flex flex-col gap-2">
        <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Next Class</span>
        <div className="text-sm font-medium text-[#737373]">No classes scheduled</div>
      </div>
    );
  }

  const formatClassTime = (timeStr?: string) => {
    if (!timeStr || typeof timeStr !== 'string') return 'TBA';
    const parts = timeStr.split(':').map(Number);
    const hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="stat-card flex flex-col justify-between min-h-[140px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Next Class</span>
        <span className="badge badge-gold text-[10px] font-bold">{timeLeft}</span>
      </div>
      <div>
        <div className="text-base font-extrabold text-[#111111] truncate">{nextSlot.custom_title || nextSlot.offering?.subject_name || nextSlot.offering?.subject || 'Class'}</div>
        <div className="text-xs text-[#737373] font-medium truncate mt-0.5">
          Class {nextSlot.offering?.grade} · FBISE
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
        <Clock size={13} className="text-[#F4C430] shrink-0" />
        <span className="text-xs font-bold text-[#111111]">{formatClassTime(nextSlot.start_time)}</span>
        <span className="text-xs text-[#A3A3A3]">·</span>
        <span className="text-xs font-semibold text-[#737373] truncate max-w-[100px]">
          {nextSlot.room_or_link || 'TBD'}
        </span>
      </div>
    </div>
  );
};

export const TeacherDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const teacherId = profile?.id || 't1';

  // ── Load teacher-scoped data from DB ─────────────────────────────────
  const cachedOfferings = teacherId ? pageCache.get<ClassOffering[]>('teacher_offerings', teacherId) : null;
  const cachedStudents = teacherId ? pageCache.get<Profile[]>('teacher_students', teacherId) : null;
  const cachedSlots = teacherId ? pageCache.get<ClassSlot[]>('teacher_slots', teacherId) : null;

  const [offerings, setOfferings] = useState<ClassOffering[]>(cachedOfferings || []);
  const [students, setStudents] = useState<Profile[]>(cachedStudents || []);
  const [allSlots, setAllSlots] = useState<ClassSlot[]>(cachedSlots || []);

  useEffect(() => {
    let mounted = true;

    const initOffs = pageCache.get<ClassOffering[]>('teacher_offerings', teacherId);
    const initStuds = pageCache.get<Profile[]>('teacher_students', teacherId);
    const initSlots = pageCache.get<ClassSlot[]>('teacher_slots', teacherId);

    if (initOffs && offerings.length === 0 && mounted) setOfferings(initOffs);
    if (initStuds && students.length === 0 && mounted) setStudents(initStuds);
    if (initSlots && allSlots.length === 0 && mounted) setAllSlots(initSlots);

    if (initOffs && initOffs.length > 0 && !selectedOfferingId && mounted) {
      setSelectedOfferingId(initOffs[0].id);
    }

    Promise.all([
      getOfferingsForTeacher(teacherId),
      getStudentsForTeacher(teacherId),
      getSlotsForTeacher(teacherId),
    ]).then(([offs, studs, slots]) => {
      if (!mounted) return;
      const currentOffs = pageCache.get<ClassOffering[]>('teacher_offerings', teacherId);
      if (!currentOffs || JSON.stringify(currentOffs) !== JSON.stringify(offs)) {
        setOfferings(offs);
        pageCache.set('teacher_offerings', offs, teacherId);
      }
      const currentStuds = pageCache.get<Profile[]>('teacher_students', teacherId);
      if (!currentStuds || JSON.stringify(currentStuds) !== JSON.stringify(studs)) {
        setStudents(studs);
        pageCache.set('teacher_students', studs, teacherId);
      }
      const currentSlots = pageCache.get<ClassSlot[]>('teacher_slots', teacherId);
      if (!currentSlots || JSON.stringify(currentSlots) !== JSON.stringify(slots)) {
        setAllSlots(slots);
        pageCache.set('teacher_slots', slots, teacherId);
      }
      if (offs.length > 0 && !selectedOfferingId) {
        setSelectedOfferingId(offs[0].id);
      }
    }).catch(console.error);

    return () => {
      mounted = false;
    };
  }, [teacherId]);

  const currentDayIndex = (new Date().getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const todayClasses = allSlots
    .filter(slot => slot.day_of_week === currentDayIndex)
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));

  // Active Class Roster View states
  const [selectedOfferingId, setSelectedOfferingId] = useState<string>(cachedOfferings && cachedOfferings.length > 0 ? cachedOfferings[0].id : '');
  const cachedRoster = (teacherId && selectedOfferingId) ? pageCache.get<Profile[]>(`teacher_roster_${selectedOfferingId}`, teacherId) : null;
  const [rosterStudents, setRosterStudents] = useState<Profile[]>(cachedRoster || []);

  useEffect(() => {
    if (!selectedOfferingId) {
      setRosterStudents([]);
      return;
    }
    let mounted = true;
    const initRoster = pageCache.get<Profile[]>(`teacher_roster_${selectedOfferingId}`, teacherId);
    if (initRoster && mounted) setRosterStudents(initRoster);

    getStudentsInOffering(selectedOfferingId).then((studs) => {
      if (!mounted) return;
      const currentRoster = pageCache.get<Profile[]>(`teacher_roster_${selectedOfferingId}`, teacherId);
      if (!currentRoster || JSON.stringify(currentRoster) !== JSON.stringify(studs)) {
        setRosterStudents(studs);
        pageCache.set(`teacher_roster_${selectedOfferingId}`, studs, teacherId);
      }
    }).catch(console.error);

    return () => {
      mounted = false;
    };
  }, [selectedOfferingId, teacherId]);

  // Dynamic colors for subjects
  const getSubjectColor = (subject: string) => {
    switch (subject.toLowerCase()) {
      case 'mathematics': return '#F4C430'; // Gold
      case 'physics': return '#3b82f6'; // Blue
      case 'chemistry': return '#10b981'; // Green
      case 'computer science': return '#8b5cf6'; // Purple
      default: return '#ec4899'; // Pink
    }
  };

  const formatClassTime = (timeStr?: string) => {
    if (!timeStr || typeof timeStr !== 'string') return '';
    const [hours = 16, minutes = 0] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  return (
    <TeacherShell>
      {/* ── Welcome Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Teacher'} 🎓
          </h1>
          <p className="text-sm text-[#737373] mt-1 font-medium">
            Manage your classroom rosters, upload syllabus notes, and view your teaching schedule.
          </p>
        </div>
      </div>

      {/* ── Metrics Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Classes Assigned */}
        <div className="stat-card flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Assigned Classes</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen size={14} />
            </div>
          </div>
          <div>
            <div className="stat-value">{offerings.length}</div>
            <div className="stat-label">Subject groups assigned</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] text-[#A3A3A3] font-bold">
            <span>Scoped to Teacher Roster</span>
            <span className="text-[#111111]">Active</span>
          </div>
        </div>

        {/* Total Students */}
        <div className="stat-card flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Enrolled Students</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={14} />
            </div>
          </div>
          <div>
            <div className="stat-value">{students.length}</div>
            <div className="stat-label">Unique students in your classes</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] text-[#A3A3A3] font-bold">
            <span>Enrolled Students Roster</span>
            <span className="text-emerald-600">Secure</span>
          </div>
        </div>

        {/* Next ClassCountdown Widget */}
        <TeacherNextClassWidget slots={allSlots} />

        {/* Classes Today */}
        <div className="stat-card flex flex-col justify-between min-h-[140px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Classes Today</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center animate-pulse">
              <Calendar size={14} />
            </div>
          </div>
          <div>
            <div className="stat-value">{todayClasses.length}</div>
            <div className="stat-label">Lectures scheduled today</div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] text-[#A3A3A3] font-bold">
            <span>Mon - Sat timetable</span>
            <span className="text-[#111111]">Daily</span>
          </div>
        </div>
      </div>

      {/* ── Today's Timetable + Class Roster Section ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Today's Lectures */}
        <div className="card card-elevated lg:col-span-1">
          <div className="flex items-center justify-between mb-4 border-b border-[#F5F5F5] pb-2">
            <h2 className="text-sm font-bold text-[#111111]">Today's Schedule</h2>
            <button
              onClick={() => navigate('/teacher/schedule')}
              className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors font-semibold"
            >
              Full schedule <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-3">
            {todayClasses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
                <CheckCircle2 size={32} className="text-[#D4D4D4] mb-2" />
                <p className="text-xs text-[#737373] font-semibold">No classes scheduled today.</p>
                <p className="text-[10px] text-[#A3A3A3] mt-0.5">Enjoy your break!</p>
              </div>
            ) : (
              todayClasses.map((cls) => {
                const color = getSubjectColor(cls.custom_title || cls.offering?.subject || '');
                return (
                  <div
                    key={cls.id}
                    className="flex items-center gap-3.5 p-3 rounded-xl border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all hover:shadow-sm bg-white"
                  >
                    <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-[#111111]">{cls.custom_title || cls.offering?.subject_name || cls.offering?.subject || 'Class'}</div>
                      <div className="text-[10px] text-[#737373] font-semibold mt-0.5 truncate">
                        Class {cls.offering?.grade} (FBISE)
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-[#111111]">{formatClassTime(cls.start_time)}</div>
                      <div className="mt-1">
                        <StatusPill status={cls.is_cancelled ? 'cancelled' : 'upcoming'} />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Class Rosters */}
        <div className="card card-elevated lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-[#F5F5F5]">
            <div>
              <h2 className="text-sm font-bold text-[#111111]">Class Rosters</h2>
              <p className="text-[10px] text-[#737373] font-medium mt-0.5">Secure, admin-assigned class student lists.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#737373]">Select Class:</span>
              <select
                value={selectedOfferingId}
                onChange={(e) => setSelectedOfferingId(e.target.value)}
                className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer max-w-[200px]"
              >
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.subject_name || o.subject} (Class {o.grade} FBISE)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {rosterStudents.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#A3A3A3] mb-3">
                <UserPlus size={20} />
              </div>
              <h3 className="font-bold text-[#111111] text-xs">No Students Enrolled</h3>
              <p className="text-[10px] text-[#737373] max-w-xs mt-1">
                There are currently no students enrolled in this class offering.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0F0F0]">
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Student Name</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Stream / Group</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Contact Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAFAFA]">
                  {rosterStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-[#FAFAFA]/40 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0] flex items-center justify-center text-[10px] font-bold text-[#525252]">
                            {st.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-[#111111] block leading-tight">{st.full_name}</span>
                            <span className="text-[9px] text-[#737373] font-medium leading-tight">Student ID: {st.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-xs font-semibold text-[#525252] capitalize">
                        {st.stream || 'General'}
                      </td>
                      <td className="py-3 text-xs font-medium text-[#737373]">
                        {st.phone || 'No phone record'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TeacherShell>
  );
};

export default TeacherDashboardPage;
