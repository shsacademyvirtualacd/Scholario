import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Users, Clock, Calendar, CheckCircle2, ChevronRight, UserPlus, Zap,
  Link as LinkIcon, Check, X, Lock
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import TeacherShell from '../../components/teacher/TeacherShell';
import StatusPill from '../../components/ui/StatusPill';
import { useAuth } from '../../features/auth/AuthContext';
import {
  getOfferingsForTeacher,
  getStudentsForTeacher,
  getStudentsInOffering,
  getSlotsForTeacher,
  getAttendanceForTeacher,
  getAttendanceForSession,
  recordAttendance,
  upsertAttendanceBatch
} from '../../lib/db';
import { pageCache } from '../../lib/pageCache';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { ClassOffering, ClassSlot, Profile, Attendance, AttendanceStatus } from '../../types';
import {
  getPKTNow, classWidgetState, formatCountdown, getSlotSubject,
  formatTime12h, calcDuration, getLinkAvailabilityStatus,
  timeStrToMins
} from '../../lib/scheduleUtils';
import { useMobile } from '../../hooks/useMobile';

// ─── Live Link Editor for Teacher ────────────────────────────────────
const LiveLinkEditor: React.FC<{ slot: ClassSlot }> = ({ slot }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [linkVal, setLinkVal] = useState(slot.room_or_link || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await (supabase as any).from('class_slots').update({ room_or_link: linkVal }).eq('id', slot.id);
      if (error) throw error;
      slot.room_or_link = linkVal; // optimistically update local state
    } catch (err) {
      console.error('Failed to save link:', err);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 mt-2 w-full">
        <div className="flex items-center gap-2 w-full">
          <input 
            type="text" 
            placeholder="https://zoom.us/j/..."
            value={linkVal}
            onChange={e => setLinkVal(e.target.value)}
            className="flex-1 text-xs px-2 py-1 border border-[#E5E5E5] rounded focus:outline-none focus:border-[#F4C430]"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} disabled={isSaving} className="p-1 bg-[#F4C430] text-[#111111] rounded hover:bg-[#E5B520] interactive">
            <Check size={12} />
          </button>
          <button onClick={() => { setIsEditing(false); setLinkVal(slot.room_or_link || ''); }} className="p-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">
            <X size={12} />
          </button>
        </div>
        <span className="text-[10px] text-[#737373] italic">
          ℹ️ Link will automatically become accessible to students 10 minutes before class.
        </span>
      </div>
    );
  }

  const hasLink = slot.room_or_link && slot.room_or_link.trim().length > 0;
  const status = getLinkAvailabilityStatus(slot, getPKTNow());
  
  if (hasLink) {
    return (
      <div className="flex flex-col gap-1 w-full mt-2 bg-[#FAFAFA] border border-[#E5E5E5] rounded p-2">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-1.5 truncate">
            <LinkIcon size={12} className="text-blue-500 shrink-0" />
            <a href={slot.room_or_link!.startsWith('http') ? slot.room_or_link! : `https://${slot.room_or_link!}`} target="_blank" rel="noreferrer" className="text-[10px] font-semibold text-blue-600 hover:underline truncate">
              {slot.room_or_link}
            </a>
          </div>
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 text-[10px] text-[#737373] hover:text-[#111111] font-semibold shrink-0 ml-2">
            ✏️ Edit
          </button>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-semibold">
          {status.isAvailable ? (
            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              🟢 Accessible to students now
            </span>
          ) : (
            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
              <Lock size={9} /> Accessible to students 10m before class
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 text-[10px] text-[#737373] hover:text-[#111111] font-semibold border border-dashed border-[#D4D4D4] px-2 py-1.5 rounded transition-colors w-full justify-center bg-[#FAFAFA] hover:bg-[#F5F5F5] mt-2">
      🔗 Add Live Class Link (Zoom/Meet)
    </button>
  );
};

// ─── Live Next Class Countdown Widget for Teacher ──────────────────
const TeacherNextClassWidget: React.FC<{ slots: ClassSlot[] }> = ({ slots }) => {
  const [pktnow, setPktnow] = useState(getPKTNow);

  useEffect(() => {
    const id = setInterval(() => setPktnow(getPKTNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const state = classWidgetState(slots, pktnow);

  // ── State B: end-of-day with no next class scheduled at all ────────
  if (state.type === 'end-of-day' && !state.nextSlot) {
    return (
      <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Next Class</span>
          <span className="badge badge-gold text-[10px] font-bold">End of Day</span>
        </div>
        <div>
          <div className="text-base font-extrabold text-[#111111] truncate">No classes scheduled</div>
          <div className="text-xs text-[#737373] font-medium mt-0.5">Enjoy your break! 🌙</div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
          <Clock size={13} className="text-[#A3A3A3] shrink-0" />
          <span className="text-xs text-[#A3A3A3] font-semibold">TBA</span>
        </div>
      </div>
    );
  }

  // ── State A: class is ongoing ──────────────────────────────────────
  if (state.type === 'ongoing') {
    const subject = getSlotSubject(state.activeSlot);
    const remH = Math.floor(state.minsRemaining / 60);
    const remM = state.minsRemaining % 60;
    const remLabel = remH > 0 ? `${remH}h ${remM}m remaining` : `${remM}m remaining`;
    return (
      <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Now In Session</span>
          <span className="badge badge-gold text-[10px] font-bold animate-pulse">● Live</span>
        </div>
        <div>
          <div className="text-base font-extrabold text-[#111111] truncate">{subject}</div>
          <div className="text-xs text-emerald-600 font-bold mt-0.5">{remLabel}</div>
          {state.nextSlot && (
            <div className="text-[10px] text-[#A3A3A3] font-medium mt-1 truncate">
              Up next: {getSlotSubject(state.nextSlot)} · {formatTime12h(state.nextSlot.start_time)}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
          <Zap size={13} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-[#111111]">{formatTime12h(state.activeSlot.start_time)} – {formatTime12h(state.activeSlot.end_time)}</span>
          {calcDuration(state.activeSlot.start_time, state.activeSlot.end_time) && (
            <span className="text-[10px] text-[#A3A3A3]">· {calcDuration(state.activeSlot.start_time, state.activeSlot.end_time)}</span>
          )}
        </div>
        <LiveLinkEditor slot={state.activeSlot} />
      </div>
    );
  }

  // ── States B/C/D with an upcoming class ─────────────────────────────
  const nextSlot = state.nextSlot!;
  const minsUntil = state.minsUntil ?? 0;
  const subject = getSlotSubject(nextSlot);
  
  let badgeLabel = '';
  let isPulsing = false;

  if (state.type === 'end-of-day') {
    badgeLabel = 'No classes for today';
  } else {
    badgeLabel = formatCountdown(minsUntil);
    if (state.type === 'morning-buffer') {
      isPulsing = true;
    }
  }

  const formatClassTimeLabel = (slot: ClassSlot) => {
    if (slot.day_of_week == null) return formatTime12h(slot.start_time);
    let daysAhead = slot.day_of_week - pktnow.dayIndex;
    if (daysAhead < 0) daysAhead += 7;

    const timeStr = formatTime12h(slot.start_time);
    if (daysAhead === 0) return timeStr;

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return `${days[slot.day_of_week]} at ${timeStr}`;
  };

  return (
    <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Next Class</span>
        <span className={`badge badge-gold text-[10px] font-bold ${isPulsing ? 'animate-pulse' : ''}`}>{badgeLabel}</span>
      </div>
      <div>
        <div className="text-base font-extrabold text-[#111111] truncate">{subject}</div>
        <div className="text-xs text-[#737373] font-medium truncate mt-0.5">
          Class {nextSlot.offering?.grade} · FBISE
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
        <Clock size={13} className="text-[#F4C430] shrink-0" />
        <span className="text-xs font-bold text-[#111111]">{formatClassTimeLabel(nextSlot)}</span>
        <span className="text-xs text-[#A3A3A3]">·</span>
        <span className="text-xs font-semibold text-[#737373] truncate max-w-[100px]">
          {(nextSlot.room_or_link && (nextSlot.room_or_link.includes('http') || nextSlot.room_or_link.includes('zoom') || nextSlot.room_or_link.includes('meet'))) ? 'Online' : 'TBD'}
        </span>
      </div>
      <LiveLinkEditor slot={nextSlot} />
    </div>
  );
};

export const TeacherDashboardPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const teacherId = profile?.id || 't1';

  // ── Load teacher-scoped data from DB ─────────────────────────────────
  const cachedOfferings = teacherId ? pageCache.get<ClassOffering[]>('teacher_offerings', teacherId) : null;
  const cachedStudents = teacherId ? pageCache.get<Profile[]>('teacher_students', teacherId) : null;
  const cachedSlots = teacherId ? pageCache.get<ClassSlot[]>('teacher_slots', teacherId) : null;

  const [offerings, setOfferings] = useState<ClassOffering[]>(cachedOfferings || []);
  const [students, setStudents] = useState<Profile[]>(cachedStudents || []);
  const [allSlots, setAllSlots] = useState<ClassSlot[]>(cachedSlots || []);
  const [loading, setLoading] = useState(!cachedOfferings || cachedOfferings.length === 0);

  useEffect(() => {
    let mounted = true;

    const initOffs = pageCache.get<ClassOffering[]>('teacher_offerings', teacherId);
    const initStuds = pageCache.get<Profile[]>('teacher_students', teacherId);
    const initSlots = pageCache.get<ClassSlot[]>('teacher_slots', teacherId);

    if (initOffs && offerings.length === 0 && mounted) setOfferings(initOffs);
    if (initStuds && students.length === 0 && mounted) setStudents(initStuds);
    if (initSlots && allSlots.length === 0 && mounted) setAllSlots(initSlots);

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
    }).catch(console.error).finally(() => {
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [teacherId]);

  useRealtimeTable({
    table: 'class_slots',
    debounceMs: 2000,
    onAny: async () => {
      if (!teacherId) return;
      const slots = await getSlotsForTeacher(teacherId);
      setAllSlots(slots);
      pageCache.set('teacher_slots', slots, teacherId);
    }
  });

  // Refetch everything when admin assigns/deassigns teacher classes
  useRealtimeTable({
    table: 'class_offerings',
    debounceMs: 1500,
    onAny: async () => {
      if (!teacherId) return;
      const [offs, studs, slots] = await Promise.all([
        getOfferingsForTeacher(teacherId),
        getStudentsForTeacher(teacherId),
        getSlotsForTeacher(teacherId),
      ]);
      setOfferings(offs);
      pageCache.set('teacher_offerings', offs, teacherId);
      setStudents(studs);
      pageCache.set('teacher_students', studs, teacherId);
      setAllSlots(slots);
      pageCache.set('teacher_slots', slots, teacherId);
    }
  });

  // ── Auto-Detect Today's Real Schedule & Active/Upcoming Class ─────────
  const [pktnow, setPktnow] = useState(getPKTNow);
  useEffect(() => {
    const interval = setInterval(() => {
      setPktnow(getPKTNow());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const currentDayIndex = pktnow.dayIndex; // 0 for Mon ... 5 for Sat, 6 for Sun
  const todayDateStr = pktnow.dateString; // e.g. "2026-08-22"
  const currentMins = pktnow.totalMins;

  const todayClasses = useMemo(() => {
    return allSlots
      .filter(slot => slot.day_of_week === currentDayIndex && !slot.is_cancelled)
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
  }, [allSlots, currentDayIndex]);

  // Target class for today:
  // 1. Ongoing right now -> pick it
  // 2. Next upcoming class today -> pick the earliest upcoming
  // 3. All finished today -> show the last completed class of today
  // 4. No class today -> null
  const activeTodaySlot = useMemo(() => {
    if (todayClasses.length === 0) return null;

    // 1. Currently in session?
    const ongoing = todayClasses.find(s => {
      const start = timeStrToMins(s.start_time || '00:00');
      const end = timeStrToMins(s.end_time || '23:59');
      return currentMins >= start && currentMins < end;
    });
    if (ongoing) return ongoing;

    // 2. Next upcoming class today?
    const upcoming = todayClasses.find(s => {
      const start = timeStrToMins(s.start_time || '00:00');
      return currentMins < start;
    });
    if (upcoming) return upcoming;

    // 3. End of day: All sessions today completed -> show last session today
    return todayClasses[todayClasses.length - 1];
  }, [todayClasses, currentMins]);

  const isClassOngoing = useMemo(() => {
    if (!activeTodaySlot) return false;
    const start = timeStrToMins(activeTodaySlot.start_time || '00:00');
    const end = timeStrToMins(activeTodaySlot.end_time || '23:59');
    return currentMins >= start && currentMins < end;
  }, [activeTodaySlot, currentMins]);

  const activeOfferingId = activeTodaySlot?.offering_id || (activeTodaySlot?.offering as any)?.id || '';
  const activeOffering = useMemo(() => {
    if (!activeOfferingId) return null;
    return offerings.find(o => o.id === activeOfferingId) || (activeTodaySlot?.offering as ClassOffering) || null;
  }, [offerings, activeOfferingId, activeTodaySlot]);

  const todayFormattedDate = useMemo(() => {
    try {
      const [y, m, d] = todayDateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      return dt.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return todayDateStr;
    }
  }, [todayDateStr]);

  // Roster of students enrolled in the auto-resolved class
  const cachedRoster = (teacherId && activeOfferingId) ? pageCache.get<Profile[]>(`teacher_roster_${activeOfferingId}`, teacherId) : null;
  const [rosterStudents, setRosterStudents] = useState<Profile[]>(cachedRoster || []);
  const [teacherAttendance, setTeacherAttendance] = useState<Attendance[]>([]);
  const [savingAttendanceId, setSavingAttendanceId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeOfferingId) {
      setRosterStudents([]);
      return;
    }
    let mounted = true;
    const initRoster = pageCache.get<Profile[]>(`teacher_roster_${activeOfferingId}`, teacherId);
    if (initRoster && mounted) setRosterStudents(initRoster);

    getStudentsInOffering(activeOfferingId).then((studs) => {
      if (!mounted) return;
      const currentRoster = pageCache.get<Profile[]>(`teacher_roster_${activeOfferingId}`, teacherId);
      if (!currentRoster || JSON.stringify(currentRoster) !== JSON.stringify(studs)) {
        setRosterStudents(studs);
        pageCache.set(`teacher_roster_${activeOfferingId}`, studs, teacherId);
      }
    }).catch(console.error);

    return () => {
      mounted = false;
    };
  }, [activeOfferingId, teacherId]);

  useRealtimeTable({
    table: 'enrollments',
    debounceMs: 2000,
    onAny: async () => {
      if (!teacherId || !activeOfferingId) return;
      const studs = await getStudentsInOffering(activeOfferingId);
      setRosterStudents(studs);
      pageCache.set(`teacher_roster_${activeOfferingId}`, studs, teacherId);
    }
  });

  // Fetch attendance records for today's session
  const fetchTeacherAttendance = async () => {
    try {
      let combined: Attendance[] = [];
      if (activeTodaySlot?.id) {
        const sessionRecords = await getAttendanceForSession(activeTodaySlot.id, todayDateStr);
        combined = sessionRecords || [];
      }
      if (teacherId) {
        const teacherRecords = await getAttendanceForTeacher(teacherId, todayDateStr);
        const seenKeys = new Set(combined.map(r => `${r.student_id}_${r.slot_id}`));
        teacherRecords.forEach(tr => {
          const key = `${tr.student_id}_${tr.slot_id}`;
          if (!seenKeys.has(key)) {
            combined.push(tr);
            seenKeys.add(key);
          }
        });
      }
      setTeacherAttendance(combined);
    } catch (err) {
      console.error('Failed fetching teacher attendance:', err);
    }
  };

  useEffect(() => {
    fetchTeacherAttendance();
  }, [teacherId, todayDateStr, activeTodaySlot?.id, activeOfferingId]);

  useRealtimeTable({
    table: 'attendance',
    debounceMs: 300,
    onAny: fetchTeacherAttendance
  });

  // Attendance helpers
  const getStudentStatus = (studentId: string): { status: AttendanceStatus | 'unmarked'; markedAt?: string; markedBy?: string } => {
    if (!activeTodaySlot) return { status: 'unmarked' };
    const record = teacherAttendance.find(
      a => a.student_id === studentId && a.slot_id === activeTodaySlot.id && a.session_date === todayDateStr
    );
    if (!record) return { status: 'unmarked' };
    return {
      status: record.status,
      markedAt: record.marked_at,
      markedBy: record.marked_by
    };
  };

  const handleUpdateStudentStatus = async (studentId: string, newStatus: AttendanceStatus) => {
    if (!activeTodaySlot) return;

    setSavingAttendanceId(studentId);

    // Optimistic UI update
    setTeacherAttendance(prev => {
      const filtered = prev.filter(
        a => !(a.student_id === studentId && a.slot_id === activeTodaySlot.id && a.session_date === todayDateStr)
      );
      const newRec: Attendance = {
        id: `att-${Date.now()}-${studentId}`,
        student_id: studentId,
        slot_id: activeTodaySlot.id,
        session_date: todayDateStr,
        status: newStatus,
        marked_at: new Date().toISOString(),
        marked_by: 'teacher'
      };
      return [...filtered, newRec];
    });

    try {
      await recordAttendance({
        student_id: studentId,
        slot_id: activeTodaySlot.id,
        session_date: todayDateStr,
        status: newStatus,
        marked_by: 'teacher'
      });
    } catch (err) {
      console.error('Error saving attendance:', err);
    } finally {
      setSavingAttendanceId(null);
    }
  };

  const handleApproveAllPending = async () => {
    if (!activeTodaySlot || rosterStudents.length === 0) return;
    const pendingStudents = rosterStudents.filter(st => getStudentStatus(st.id).status === 'pending');
    if (pendingStudents.length === 0) return;

    const updates = pendingStudents.map(st => ({
      student_id: st.id,
      slot_id: activeTodaySlot.id,
      session_date: todayDateStr,
      status: 'present' as AttendanceStatus,
      marked_at: new Date().toISOString(),
    }));

    // Optimistic update
    setTeacherAttendance(prev => {
      const studentIds = new Set(pendingStudents.map(s => s.id));
      const remaining = prev.filter(
        a => !(studentIds.has(a.student_id) && a.slot_id === activeTodaySlot.id && a.session_date === todayDateStr)
      );
      return [...remaining, ...updates.map(u => ({ ...u, id: `att-${Date.now()}-${u.student_id}`, marked_by: 'teacher' as const }))];
    });

    try {
      await upsertAttendanceBatch(updates);
    } catch (err) {
      console.error('Error approving all pending claims:', err);
    }
  };

  const handleMarkAllPresent = async () => {
    if (!activeTodaySlot || rosterStudents.length === 0) return;

    const updates = rosterStudents.map(st => ({
      student_id: st.id,
      slot_id: activeTodaySlot.id,
      session_date: todayDateStr,
      status: 'present' as AttendanceStatus,
      marked_at: new Date().toISOString(),
    }));

    // Optimistic update
    setTeacherAttendance(prev => {
      const studentIds = new Set(rosterStudents.map(s => s.id));
      const remaining = prev.filter(
        a => !(studentIds.has(a.student_id) && a.slot_id === activeTodaySlot.id && a.session_date === todayDateStr)
      );
      return [...remaining, ...updates.map(u => ({ ...u, id: `att-${Date.now()}-${u.student_id}`, marked_by: 'teacher' as const }))];
    });

    try {
      await upsertAttendanceBatch(updates);
    } catch (err) {
      console.error('Error in batch marking:', err);
    }
  };

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

  const formatClassTime = formatTime12h;

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
      <div className={isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-2 xl:grid-cols-4 gap-4'}>
        {loading ? (
          [1, 2, 3, 4].map((n) => (
            <div key={n} className="stat-card flex flex-col justify-between min-h-[140px] animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-gray-100 rounded w-24" />
                <div className="w-7 h-7 rounded-lg bg-gray-100" />
              </div>
              <div className="space-y-2">
                <div className="h-7 bg-gray-100 rounded w-12" />
                <div className="h-3 bg-gray-100 rounded w-36" />
              </div>
              <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between">
                <div className="h-2.5 bg-gray-100 rounded w-24" />
                <div className="h-2.5 bg-gray-100 rounded w-10" />
              </div>
            </div>
          ))
        ) : (
          <>
            {/* Classes Assigned */}
            <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
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
            <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
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
            <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
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
          </>
        )}
      </div>

      {/* ── Today's Timetable + Class Roster Section ── */}
      <div className={isMobile ? 'flex flex-col gap-6' : 'grid grid-cols-3 gap-6'}>
        
        {/* Today's Lectures */}
        <div className="card card-elevated lg:col-span-1 interactive">
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
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((n) => (
                  <div key={n} className="flex items-center gap-3 p-3 rounded-xl border border-[#F0F0F0] bg-white">
                    <div className="w-1.5 h-10 bg-gray-100 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-gray-100 rounded w-20" />
                      <div className="h-3 bg-gray-100 rounded w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todayClasses.length === 0 ? (
              <div className="py-8 text-center bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
                <CheckCircle2 size={30} className="mx-auto text-[#D4D4D4] mb-2" />
                <h3 className="font-bold text-[#111111] text-xs">No Lectures Today</h3>
                <p className="text-[10px] text-[#737373] mt-1">You have no scheduled lectures for this day.</p>
              </div>
            ) : (
              todayClasses.map((cls) => {
                const color = getSubjectColor(cls.custom_title || cls.offering?.subject_name || cls.offering?.subject || 'Class');
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

        {/* Class Rosters & Session Attendance — Auto-Driven Live/Next Class Only */}
        <div className={`card card-elevated ${isMobile ? '' : 'col-span-2'}`}>
          {loading ? (
            <div className="space-y-4 p-2 animate-pulse">
              <div className="h-6 bg-gray-100 rounded w-1/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-40 bg-gray-50 rounded-xl" />
            </div>
          ) : !activeTodaySlot ? (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#A3A3A3] mb-3">
                <Calendar size={22} className="text-[#737373]" />
              </div>
              <h3 className="font-extrabold text-[#111111] text-sm">No Class Scheduled Today</h3>
              <p className="text-xs text-[#737373] max-w-xs mt-1">
                You have no active lecture sessions on today's timetable ({todayFormattedDate}). Enjoy your break!
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-[#F5F5F5]">
                {/* Header with Auto-Detected Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-extrabold text-[#111111]">
                        {activeTodaySlot.custom_title || activeOffering?.subject_name || activeOffering?.subject || 'Class Session'}
                      </h2>
                      <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                        Class {activeOffering?.grade || '10'} · {(activeOffering?.board || 'FBISE').toUpperCase()}
                      </span>
                      {activeOffering?.stream && (
                        <span className="text-[10px] bg-[#F5F5F5] text-[#525252] font-bold px-2 py-0.5 rounded">
                          {typeof activeOffering.stream === 'string' ? activeOffering.stream : (activeOffering.stream as any).name}
                        </span>
                      )}
                    </div>

                    {/* Static Date & Exact Time Slot */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#525252] mt-1 flex-wrap">
                      <span className="text-[#111111] font-bold flex items-center gap-1">
                        <Calendar size={13} className="text-[#F4C430]" />
                        {todayFormattedDate}
                      </span>
                      <span className="text-[#D4D4D4]">·</span>
                      <span className="flex items-center gap-1 text-[#111111]">
                        <Clock size={13} className="text-[#A3A3A3]" />
                        {formatTime12h(activeTodaySlot.start_time)} – {formatTime12h(activeTodaySlot.end_time)}
                      </span>
                      {isClassOngoing ? (
                        <span className="badge badge-gold text-[9px] font-extrabold animate-pulse">
                          ● Now in Session
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          Scheduled Today
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark All Present Action */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMarkAllPresent}
                      disabled={rosterStudents.length === 0}
                      className="text-[11px] font-bold bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] px-3 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 interactive disabled:opacity-50 cursor-pointer"
                      title="Mark all currently enrolled students as Present for today's session"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark All Present</span>
                    </button>
                  </div>
                </div>

                {/* Real-time Status Counts for Today's Class */}
                {rosterStudents.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {/* Pending Claims Alert Banner */}
                    {(() => {
                      const pendingStudents = rosterStudents.filter(st => getStudentStatus(st.id).status === 'pending');
                      if (pendingStudents.length === 0) return null;
                      return (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                              <Clock size={16} className="animate-spin text-amber-600" />
                            </div>
                            <div>
                              <div className="text-xs font-extrabold text-amber-900">
                                {pendingStudents.length} Pending Attendance Claim{pendingStudents.length > 1 ? 's' : ''}
                              </div>
                              <div className="text-[10px] text-amber-700 font-medium">
                                {pendingStudents.length === 1 ? 'A student has' : `${pendingStudents.length} students have`} claimed attendance for this session and {pendingStudents.length === 1 ? 'is' : 'are'} awaiting approval.
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={handleApproveAllPending}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-all cursor-pointer interactive shrink-0"
                            title="Approve all pending student attendance claims for this session"
                          >
                            <Check size={13} strokeWidth={3} />
                            <span>Approve All ({pendingStudents.length})</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Status Pill Counters */}
                    <div className="flex items-center gap-2.5 text-[11px] font-bold text-[#737373] overflow-x-auto flex-wrap">
                      {(() => {
                        let pres = 0, late = 0, abs = 0, un = 0, pend = 0;
                        rosterStudents.forEach(st => {
                          const stStatus = getStudentStatus(st.id).status;
                          if (stStatus === 'present') pres++;
                          else if (stStatus === 'late') late++;
                          else if (stStatus === 'absent') abs++;
                          else if (stStatus === 'pending') pend++;
                          else un++;
                        });
                        return (
                          <>
                            {pend > 0 && (
                              <span className="text-amber-800 bg-amber-100/80 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1 font-extrabold animate-pulse">
                                <Clock size={11} className="animate-spin text-amber-600" /> Pending: {pend}
                              </span>
                            )}
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              ● Present: {pres}
                            </span>
                            <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              ● Late: {late}
                            </span>
                            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                              ● Absent: {abs}
                            </span>
                            {un > 0 && (
                              <span className="text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                                ○ Unmarked: {un}
                              </span>
                            )}
                            <span className="text-[#111111] ml-auto font-extrabold">
                              {rosterStudents.length} {rosterStudents.length === 1 ? 'Student' : 'Students'} Enrolled
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {rosterStudents.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center">
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
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Student</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Stream</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Status & Auto-Join Log</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider text-right">Toggle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAFAFA]">
                  {rosterStudents.map((st) => {
                    const { status: stStatus, markedAt, markedBy } = getStudentStatus(st.id);
                    const isSaving = savingAttendanceId === st.id;
                    const joinTime = markedAt ? new Date(markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

                    return (
                      <tr key={st.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#FAFAFA] border border-[#F0F0F0] flex items-center justify-center text-[10px] font-bold text-[#525252] shrink-0">
                              {st.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-[#111111] block leading-tight truncate">{st.full_name}</span>
                              <span className="text-[9px] text-[#737373] font-medium leading-tight truncate block">
                                {(st as any).email || `ID: ${st.id.slice(0, 8)}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 text-xs font-semibold text-[#525252] capitalize whitespace-nowrap">
                          {st.stream || 'General'}
                        </td>

                        <td className="py-3">
                          <div className="flex flex-col gap-0.5">
                            {stStatus === 'pending' ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-300">
                                  <Clock size={10} className="animate-spin text-amber-600" /> Pending Approval
                                </span>
                                {joinTime && (
                                  <span className="text-[9px] text-amber-700 font-semibold bg-amber-50/70 px-1.5 py-0.5 rounded">
                                    Claimed {joinTime}
                                  </span>
                                )}
                              </div>
                            ) : stStatus === 'present' ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  ✓ Present
                                </span>
                                {markedBy === 'self' || markedBy === 'student' || joinTime ? (
                                  <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50/50 px-1.5 py-0.5 rounded">
                                    ⚡ Joined {joinTime || ''}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-[#737373] font-medium">
                                    (Teacher marked)
                                  </span>
                                )}
                              </div>
                            ) : stStatus === 'late' ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  ⏱ Late
                                </span>
                                {joinTime && (
                                  <span className="text-[9px] text-amber-600 font-semibold">
                                    at {joinTime}
                                  </span>
                                )}
                              </div>
                            ) : stStatus === 'absent' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                ✕ Absent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                ○ Unmarked
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 text-right">
                          {stStatus === 'pending' ? (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleUpdateStudentStatus(st.id, 'present')}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer interactive"
                                title="Approve attendance claim (Mark Present)"
                              >
                                <Check size={11} strokeWidth={3} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleUpdateStudentStatus(st.id, 'absent')}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer interactive"
                                title="Reject attendance claim (Mark Absent)"
                              >
                                <X size={11} strokeWidth={3} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center bg-[#F5F5F5] p-0.5 rounded-lg border border-[#E5E5E5]">
                              <button
                                onClick={() => handleUpdateStudentStatus(st.id, 'present')}
                                disabled={isSaving}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                                  stStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-[#737373] hover:text-emerald-700 hover:bg-white'
                                }`}
                                title="Mark Present"
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleUpdateStudentStatus(st.id, 'late')}
                                disabled={isSaving}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                                  stStatus === 'late'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-[#737373] hover:text-amber-700 hover:bg-white'
                                }`}
                                title="Mark Late"
                              >
                                L
                              </button>
                              <button
                                onClick={() => handleUpdateStudentStatus(st.id, 'absent')}
                                disabled={isSaving}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${
                                  stStatus === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-[#737373] hover:text-rose-700 hover:bg-white'
                                }`}
                                title="Mark Absent"
                              >
                                A
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
            </div>
          )}
        </div>
      </div>
    </TeacherShell>
  );
};

export default TeacherDashboardPage;
