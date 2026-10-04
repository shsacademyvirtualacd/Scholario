import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Clock, Calendar, CheckCircle2, ChevronRight, UserPlus, Zap,
  Check, X, Lock, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import TeacherShell from '../../components/teacher/TeacherShell';
import StatusPill from '../../components/ui/StatusPill';
import ConfirmModal from '../../components/common/ConfirmModal';
import StaffAttendanceWidget from '../../components/staff/StaffAttendanceWidget';
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
  formatTime12h, calcDuration,
  timeStrToMins, getClosestDateForDayOfWeek, findConcurrentSlots
} from '../../lib/scheduleUtils';
import { useMobile } from '../../hooks/useMobile';
import { NotificationPermissionBanner } from '../../components/student/NotificationPermissionBanner';
import DashboardNoticeModal from '../../components/announcements/DashboardNoticeModal';
import ConcurrentLiveLinkEditor from '../../components/teacher/ConcurrentLiveLinkEditor';

// ─── Live Link Editor for Teacher (Backward Compatibility Wrapper) ──────────
export const LiveLinkEditor: React.FC<{
  slot: ClassSlot;
  sessionDate: string;
  teacherId?: string;
  onLinkUpdated?: (linkUrl: string | null) => void;
}> = ({ slot, sessionDate, teacherId, onLinkUpdated }) => {
  return (
    <ConcurrentLiveLinkEditor
      slots={[slot]}
      sessionDate={sessionDate}
      teacherId={teacherId}
      onLinkUpdated={(map) => onLinkUpdated?.(map[slot?.id] || null)}
      compact={false}
    />
  );
};

// ─── Live Next Class Countdown Widget for Teacher ──────────────────
const TeacherNextClassWidget: React.FC<{ slots: ClassSlot[]; teacherId?: string }> = ({ slots, teacherId }) => {
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
    const sessionDate = pktnow.dateString;
    const concurrentSlots = findConcurrentSlots(
      state.activeSlot,
      slots.filter(s => s.day_of_week === pktnow.dayIndex)
    );
    const isMulti = concurrentSlots.length > 1;
    const subject = isMulti
      ? `${getSlotSubject(state.activeSlot)} (${concurrentSlots.length} Sections)`
      : getSlotSubject(state.activeSlot);

    const remH = Math.floor(state.minsRemaining / 60);
    const remM = state.minsRemaining % 60;
    const remLabel = remH > 0 ? `${remH}h ${remM}m remaining` : `${remM}m remaining`;

    return (
      <div className="stat-card flex flex-col justify-between min-h-[140px] interactive">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">Now In Session</span>
          <div className="flex items-center gap-1">
            {isMulti && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                {concurrentSlots.length} Concurrent
              </span>
            )}
            <span className="badge badge-gold text-[10px] font-bold animate-pulse">● Live</span>
          </div>
        </div>
        <div>
          <div className="text-base font-extrabold text-[#111111] truncate">{subject}</div>
          <div className="text-xs text-emerald-600 font-bold mt-0.5">{remLabel}</div>
          {isMulti ? (
            <div className="text-[10px] text-[#737373] font-medium mt-1 truncate">
              {concurrentSlots.map(s => {
                const gr = s.offering?.grade || (s.offering as any)?.class?.grade;
                const bd = s.offering?.board || (s.offering as any)?.class?.board?.name;
                return `${gr ? `Gr.${gr}` : ''}${bd ? ` ${bd}` : ''}`;
              }).filter(Boolean).join(' · ')}
            </div>
          ) : (
            state.nextSlot && (
              <div className="text-[10px] text-[#A3A3A3] font-medium mt-1 truncate">
                Up next: {getSlotSubject(state.nextSlot)} · {formatTime12h(state.nextSlot.start_time)}
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
          <Zap size={13} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-[#111111]">
            {formatTime12h(state.activeSlot.start_time)} – {formatTime12h(state.activeSlot.end_time)}
          </span>
          {calcDuration(state.activeSlot.start_time, state.activeSlot.end_time) && (
            <span className="text-[10px] text-[#A3A3A3]">
              · {calcDuration(state.activeSlot.start_time, state.activeSlot.end_time)}
            </span>
          )}
        </div>
        <ConcurrentLiveLinkEditor
          slots={concurrentSlots}
          sessionDate={sessionDate}
          teacherId={teacherId}
          compact={true}
        />
      </div>
    );
  }

  // ── States B/C/D with an upcoming class ─────────────────────────────
  const nextSlot = state.nextSlot!;
  const minsUntil = state.minsUntil ?? 0;
  const sessionDate = nextSlot.day_of_week === pktnow.dayIndex
    ? pktnow.dateString
    : getClosestDateForDayOfWeek(nextSlot.day_of_week ?? 0, pktnow);

  const concurrentSlots = findConcurrentSlots(
    nextSlot,
    slots.filter(s => s.day_of_week === nextSlot.day_of_week)
  );
  const isMulti = concurrentSlots.length > 1;
  const subject = isMulti
    ? `${getSlotSubject(nextSlot)} (${concurrentSlots.length} Sections)`
    : getSlotSubject(nextSlot);

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
        <div className="flex items-center gap-1">
          {isMulti && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
              {concurrentSlots.length} Concurrent
            </span>
          )}
          <span className={`badge badge-gold text-[10px] font-bold ${isPulsing ? 'animate-pulse' : ''}`}>{badgeLabel}</span>
        </div>
      </div>
      <div>
        <div className="text-base font-extrabold text-[#111111] truncate">{subject}</div>
        <div className="text-xs text-[#737373] font-medium truncate mt-0.5">
          {isMulti
            ? `${concurrentSlots.length} sections scheduled simultaneously`
            : `${nextSlot.offering?.grade ? `Class ${nextSlot.offering.grade} · ` : ''}${String(nextSlot.offering?.board || 'Curriculum').toUpperCase()}`}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-2 border-t border-[#F5F5F5]">
        <Clock size={13} className="text-[#F4C430] shrink-0" />
        <span className="text-xs font-bold text-[#111111]">{formatClassTimeLabel(nextSlot)}</span>
      </div>
      <ConcurrentLiveLinkEditor
        slots={concurrentSlots}
        sessionDate={sessionDate}
        teacherId={teacherId}
        compact={true}
      />
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
      setOfferings(offs);
      pageCache.set('teacher_offerings', offs, teacherId);
      setStudents(studs);
      pageCache.set('teacher_students', studs, teacherId);
      setAllSlots(slots);
      pageCache.set('teacher_slots', slots, teacherId);
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

  // Detect all slots concurrent with active slot (e.g. 2, 3, or more classes in the same time slot)
  const activeConcurrentSlots = useMemo(() => {
    if (!activeTodaySlot) return [];
    return findConcurrentSlots(activeTodaySlot, todayClasses);
  }, [activeTodaySlot, todayClasses]);

  const [selectedSectionSlotId, setSelectedSectionSlotId] = useState<string>('all');
  const [sectionRosters, setSectionRosters] = useState<Record<string, { offering: ClassOffering | null; students: Profile[] }>>({});
  const [teacherAttendance, setTeacherAttendance] = useState<Attendance[]>([]);
  const [savingAttendanceId, setSavingAttendanceId] = useState<string | null>(null);

  // Locked attendance confirmation modal state
  const [pendingChange, setPendingChange] = useState<{
    studentId: string;
    studentName: string;
    slotId: string;
    currentStatus: AttendanceStatus;
    newStatus: AttendanceStatus;
  } | null>(null);

  // Fetch rosters for ALL concurrent slots in this active slot
  useEffect(() => {
    if (activeConcurrentSlots.length === 0) {
      setSectionRosters({});
      return;
    }
    let mounted = true;
    Promise.all(
      activeConcurrentSlots.map(async (slot) => {
        const offId = slot.offering_id || (slot.offering as any)?.id;
        const off = offerings.find(o => o.id === offId) || (slot.offering as ClassOffering) || null;
        const studs = offId ? await getStudentsInOffering(offId).catch(() => [] as Profile[]) : [];
        return { slotId: slot.id, offering: off, students: studs };
      })
    ).then((results) => {
      if (!mounted) return;
      const map: Record<string, { offering: ClassOffering | null; students: Profile[] }> = {};
      results.forEach(r => {
        map[r.slotId] = { offering: r.offering, students: r.students };
      });
      setSectionRosters(map);
    }).catch(console.error);

    return () => {
      mounted = false;
    };
  }, [activeConcurrentSlots, offerings]);

  // Compute all students across concurrent slots and filtered students by selected section tab
  interface DisplayedStudent extends Profile {
    _slotId: string;
    _sectionName: string;
    _grade: string;
    _board: string;
  }

  const allConcurrentStudents = useMemo<DisplayedStudent[]>(() => {
    const list: DisplayedStudent[] = [];
    const seen = new Set<string>();

    activeConcurrentSlots.forEach(slot => {
      const data = sectionRosters[slot.id];
      const studs = data?.students || [];
      const off = data?.offering;
      const secName = getSlotSubject(slot);
      const gr = off?.grade || (off as any)?.class?.grade || '';
      const bd = String(off?.board || (off as any)?.class?.board?.name || '').toUpperCase();

      studs.forEach(st => {
        const key = `${st.id}_${slot.id}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            ...st,
            _slotId: slot.id,
            _sectionName: secName,
            _grade: gr,
            _board: bd,
          });
        }
      });
    });

    return list;
  }, [activeConcurrentSlots, sectionRosters]);

  const displayedStudents = useMemo<DisplayedStudent[]>(() => {
    if (selectedSectionSlotId === 'all') return allConcurrentStudents;
    return allConcurrentStudents.filter(st => st._slotId === selectedSectionSlotId);
  }, [allConcurrentStudents, selectedSectionSlotId]);

  // Re-fetch enrollments when changed
  useRealtimeTable({
    table: 'enrollments',
    debounceMs: 2000,
    onAny: async () => {
      if (activeConcurrentSlots.length === 0) return;
      const results = await Promise.all(
        activeConcurrentSlots.map(async (slot) => {
          const offId = slot.offering_id || (slot.offering as any)?.id;
          const off = offerings.find(o => o.id === offId) || (slot.offering as ClassOffering) || null;
          const studs = offId ? await getStudentsInOffering(offId).catch(() => [] as Profile[]) : [];
          return { slotId: slot.id, offering: off, students: studs };
        })
      );
      const map: Record<string, { offering: ClassOffering | null; students: Profile[] }> = {};
      results.forEach(r => {
        map[r.slotId] = { offering: r.offering, students: r.students };
      });
      setSectionRosters(map);
    }
  });

  // Fetch attendance records for today's session across all active concurrent slots
  const fetchTeacherAttendance = async () => {
    try {
      let combined: Attendance[] = [];
      if (activeConcurrentSlots.length > 0) {
        const slotSessionRecords = await Promise.all(
          activeConcurrentSlots.map(s => getAttendanceForSession(s.id, todayDateStr).catch(() => [] as Attendance[]))
        );
        slotSessionRecords.forEach(records => {
          combined.push(...(records || []));
        });
      }
      if (teacherId) {
        const teacherRecords = await getAttendanceForTeacher(teacherId, todayDateStr);
        const seenKeys = new Set(combined.map(r => `${r.student_id}_${r.slot_id}_${r.session_date}`));
        teacherRecords.forEach(tr => {
          const key = `${tr.student_id}_${tr.slot_id}_${tr.session_date}`;
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
  }, [teacherId, todayDateStr, activeConcurrentSlots.map(s => s.id).join(',')]);

  useRealtimeTable({
    table: 'attendance',
    debounceMs: 300,
    onAny: fetchTeacherAttendance
  });

  // Attendance helpers per student and slot
  const getStudentStatus = (studentId: string, slotId: string): { status: AttendanceStatus | 'unmarked'; markedAt?: string; markedBy?: string } => {
    const record = teacherAttendance.find(
      a => a.student_id === studentId && a.slot_id === slotId && a.session_date === todayDateStr
    );
    if (!record) return { status: 'unmarked' };
    return {
      status: record.status,
      markedAt: record.marked_at,
      markedBy: record.marked_by
    };
  };

  const handleUpdateStudentStatus = async (studentId: string, newStatus: AttendanceStatus, slotId: string) => {
    setSavingAttendanceId(studentId);

    // Optimistic UI update
    setTeacherAttendance(prev => {
      const filtered = prev.filter(
        a => !(a.student_id === studentId && a.slot_id === slotId && a.session_date === todayDateStr)
      );
      const newRec: Attendance = {
        id: `att-${Date.now()}-${studentId}`,
        student_id: studentId,
        slot_id: slotId,
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
        slot_id: slotId,
        session_date: todayDateStr,
        status: newStatus,
        marked_by: 'teacher'
      });
      const formatted = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
      toast.success(`Attendance updated to ${formatted}`);
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Failed to update attendance');
    } finally {
      setSavingAttendanceId(null);
    }
  };

  // Safe handler: Single-click when unmarked/pending; Confirmation required when already marked
  const handleTeacherClickAttendance = (
    studentId: string,
    studentName: string,
    slotId: string,
    currentStatus: AttendanceStatus | 'unmarked',
    targetStatus: AttendanceStatus
  ) => {
    if (currentStatus === targetStatus) {
      const formatted = targetStatus.charAt(0).toUpperCase() + targetStatus.slice(1);
      toast.info(`Attendance is already marked as ${formatted}`);
      return;
    }

    // First time marking or resolving pending claim -> Direct single-click action
    if (currentStatus === 'unmarked' || currentStatus === 'pending') {
      handleUpdateStudentStatus(studentId, targetStatus, slotId);
      return;
    }

    // Changing existing recorded attendance -> Locked, require explicit confirmation
    setPendingChange({
      studentId,
      studentName,
      slotId,
      currentStatus,
      newStatus: targetStatus
    });
  };

  const handleApproveAllPending = async () => {
    if (displayedStudents.length === 0) return;
    const pendingStudents = displayedStudents.filter(st => getStudentStatus(st.id, st._slotId).status === 'pending');
    if (pendingStudents.length === 0) return;

    const updates = pendingStudents.map(st => ({
      student_id: st.id,
      slot_id: st._slotId,
      session_date: todayDateStr,
      status: 'present' as AttendanceStatus,
      marked_at: new Date().toISOString(),
    }));

    // Optimistic update
    setTeacherAttendance(prev => {
      const targetPairs = new Set(pendingStudents.map(s => `${s.id}_${s._slotId}`));
      const remaining = prev.filter(
        a => !(targetPairs.has(`${a.student_id}_${a.slot_id}`) && a.session_date === todayDateStr)
      );
      return [...remaining, ...updates.map(u => ({ ...u, id: `att-${Date.now()}-${u.student_id}`, marked_by: 'teacher' as const }))];
    });

    try {
      await upsertAttendanceBatch(updates);
      toast.success(`Approved ${updates.length} pending claim${updates.length > 1 ? 's' : ''}`);
    } catch (err) {
      console.error('Error approving all pending claims:', err);
      toast.error('Failed to approve claims');
    }
  };

  const handleMarkAllPresent = async () => {
    if (displayedStudents.length === 0) return;

    const updates = displayedStudents.map(st => ({
      student_id: st.id,
      slot_id: st._slotId,
      session_date: todayDateStr,
      status: 'present' as AttendanceStatus,
      marked_at: new Date().toISOString(),
    }));

    // Optimistic update
    setTeacherAttendance(prev => {
      const targetPairs = new Set(displayedStudents.map(s => `${s.id}_${s._slotId}`));
      const remaining = prev.filter(
        a => !(targetPairs.has(`${a.student_id}_${a.slot_id}`) && a.session_date === todayDateStr)
      );
      return [...remaining, ...updates.map(u => ({ ...u, id: `att-${Date.now()}-${u.student_id}`, marked_by: 'teacher' as const }))];
    });

    try {
      await upsertAttendanceBatch(updates);
      toast.success(`Marked ${updates.length} students as Present`);
    } catch (err) {
      console.error('Error in batch marking:', err);
      toast.error('Failed to mark all present');
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

      {/* ── Browser Notification Permission Banner for Class Reminders ── */}
      <NotificationPermissionBanner role="teacher" />

      {/* ── Metrics Strip (3 Quick Overview Stat Cards) ── */}
      <div className={isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-1 md:grid-cols-3 gap-4'}>
        {loading ? (
          [1, 2, 3].map((n) => (
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

            {/* Next ClassCountdown Widget */}
            <TeacherNextClassWidget slots={allSlots} teacherId={teacherId} />

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

      {/* ── Staff Attendance & Timecard (Direct Punch, Timer & Recent Logs) ── */}
      <div id="teacher-timecard-dashboard-widget" className="w-full">
        <StaffAttendanceWidget standalone={true} />
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
                const concurrentCount = todayClasses.filter(c => c.start_time === cls.start_time).length;
                return (
                  <div
                    key={cls.id}
                    className="flex items-center gap-3.5 p-3 rounded-xl border border-[#F0F0F0] hover:border-[#E5E5E5] transition-all hover:shadow-sm bg-white"
                  >
                    <div className="w-1.5 h-10 rounded-full shrink-0" style={{ background: color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-[#111111] truncate">
                          {cls.custom_title || cls.offering?.subject_name || cls.offering?.subject || 'Class'}
                        </span>
                        {concurrentCount > 1 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            ⚡ {concurrentCount} In Slot
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#737373] font-semibold mt-0.5 truncate">
                        Class {cls.offering?.grade || (cls.offering as any)?.class?.grade || ''} ({String(cls.offering?.board || (cls.offering as any)?.class?.board?.name || (cls.offering as any)?.class?.board_id || (cls.offering as any)?.board_name || 'Curriculum').toUpperCase()})
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
                {/* Concurrent Classes Alert Banner */}
                {activeConcurrentSlots.length > 1 && (
                  <div className="flex items-center gap-2.5 p-3 bg-gradient-to-r from-amber-50 to-[#FFFDF5] border border-amber-300 rounded-xl text-amber-900 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                      <Layers size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <span>⚡ Concurrent Session Slot ({activeConcurrentSlots.length} Classes Running Simultaneously)</span>
                      </div>
                      <div className="text-[10px] text-amber-800 mt-0.5">
                        Set the meeting link once below to distribute it immediately to all {activeConcurrentSlots.length} classes. Use the section tabs below to filter the student roster.
                      </div>
                    </div>
                  </div>
                )}

                {/* Header with Auto-Detected Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm font-extrabold text-[#111111]">
                        {activeConcurrentSlots.length > 1
                          ? `${getSlotSubject(activeTodaySlot)} (${activeConcurrentSlots.length} Sections)`
                          : (activeTodaySlot.custom_title || activeOffering?.subject_name || activeOffering?.subject || 'Class Session')}
                      </h2>
                      {activeConcurrentSlots.length === 1 && (
                        <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                          Class {activeOffering?.grade || (activeOffering as any)?.class?.grade || ''} · {String(activeOffering?.board || (activeOffering as any)?.class?.board?.name || (activeOffering as any)?.class?.board_id || (activeOffering as any)?.board_name || 'Curriculum').toUpperCase()}
                        </span>
                      )}
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
                      disabled={displayedStudents.length === 0}
                      className="text-[11px] font-bold bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] px-3 py-1.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 interactive disabled:opacity-50 cursor-pointer"
                      title="Mark all currently displayed students as Present"
                    >
                      <CheckCircle2 size={13} />
                      <span>
                        Mark All Present ({displayedStudents.length})
                      </span>
                    </button>
                  </div>
                </div>

                {/* Concurrent Meeting Link Editor with Per-Class Overrides */}
                <div className="w-full">
                  <ConcurrentLiveLinkEditor 
                    slots={activeConcurrentSlots} 
                    sessionDate={todayDateStr} 
                    teacherId={profile?.id} 
                  />
                </div>

                {/* Section Filter Tabs for Concurrent Slots */}
                {activeConcurrentSlots.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 border-t border-[#F5F5F5] no-scrollbar">
                    <span className="text-[11px] font-bold text-[#737373] mr-1 shrink-0">Filter Roster:</span>
                    <button
                      onClick={() => setSelectedSectionSlotId('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        selectedSectionSlotId === 'all'
                          ? 'bg-[#111111] text-white shadow-xs'
                          : 'bg-gray-100 text-[#525252] hover:bg-gray-200'
                      }`}
                    >
                      All Concurrent Sections ({allConcurrentStudents.length})
                    </button>
                    {activeConcurrentSlots.map(s => {
                      const count = sectionRosters[s.id]?.students?.length || 0;
                      const subj = getSlotSubject(s);
                      const gr = s.offering?.grade || (s.offering as any)?.class?.grade || '';
                      const bd = String(s.offering?.board || (s.offering as any)?.class?.board?.name || '').toUpperCase();

                      return (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSectionSlotId(s.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            selectedSectionSlotId === s.id
                              ? 'bg-[#111111] text-white shadow-xs'
                              : 'bg-gray-100 text-[#525252] hover:bg-gray-200'
                          }`}
                        >
                          {subj} {gr ? `Gr.${gr}` : ''} {bd ? `· ${bd}` : ''} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Real-time Status Counts for Displayed Students */}
                {displayedStudents.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {/* Pending Claims Alert Banner */}
                    {(() => {
                      const pendingStudents = displayedStudents.filter(st => getStudentStatus(st.id, st._slotId).status === 'pending');
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
                            title="Approve all pending student attendance claims"
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
                        displayedStudents.forEach(st => {
                          const stStatus = getStudentStatus(st.id, st._slotId).status;
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
                              {displayedStudents.length} {displayedStudents.length === 1 ? 'Student' : 'Students'}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>

              {displayedStudents.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#A3A3A3] mb-3">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="font-bold text-[#111111] text-xs">No Students Enrolled</h3>
                  <p className="text-[10px] text-[#737373] max-w-xs mt-1">
                    There are currently no students enrolled in this section.
                  </p>
                </div>
              ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0F0F0] dark:border-zinc-800">
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] dark:text-zinc-500 uppercase tracking-wider">Student</th>
                    {activeConcurrentSlots.length > 1 && (
                      <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] dark:text-zinc-500 uppercase tracking-wider">Class / Section</th>
                    )}
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] dark:text-zinc-500 uppercase tracking-wider">Stream</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] dark:text-zinc-500 uppercase tracking-wider">Status & Auto-Join Log</th>
                    <th className="py-2.5 text-[10px] font-black text-[#A3A3A3] dark:text-zinc-500 uppercase tracking-wider text-right">Toggle Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAFAFA] dark:divide-zinc-800/60">
                  {displayedStudents.map((st) => {
                    const { status: stStatus, markedAt, markedBy } = getStudentStatus(st.id, st._slotId);
                    const isSaving = savingAttendanceId === st.id;
                    const joinTime = markedAt ? new Date(markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

                    return (
                      <tr key={`${st.id}_${st._slotId}`} className="hover:bg-[#FAFAFA]/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#FAFAFA] dark:bg-zinc-800 border border-[#F0F0F0] dark:border-zinc-700 flex items-center justify-center text-[10px] font-bold text-[#525252] dark:text-zinc-300 shrink-0">
                              {st.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-[#111111] dark:text-zinc-100 block leading-tight truncate">{st.full_name}</span>
                              <span className="text-[9px] text-[#737373] dark:text-zinc-400 font-medium leading-tight truncate block">
                                {(st as any).email || `ID: ${st.id.slice(0, 8)}`}
                              </span>
                            </div>
                          </div>
                        </td>

                        {activeConcurrentSlots.length > 1 && (
                          <td className="py-3 text-xs whitespace-nowrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              {st._sectionName} {st._grade ? `Gr.${st._grade}` : ''}
                            </span>
                          </td>
                        )}

                        <td className="py-3 text-xs font-semibold text-[#525252] dark:text-zinc-300 capitalize whitespace-nowrap">
                          {st.stream || 'General'}
                        </td>

                        <td className="py-3">
                          <div className="flex flex-col gap-0.5">
                            {stStatus === 'pending' ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                                  <Clock size={10} className="animate-spin text-amber-600 dark:text-amber-400" /> Pending Approval
                                </span>
                                {joinTime && (
                                  <span className="text-[9px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-50/70 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                                    Claimed {joinTime}
                                  </span>
                                )}
                              </div>
                            ) : stStatus === 'present' ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800" title="Locked: Status is recorded. Click another status to request change.">
                                  ✓ Present <Lock size={9} className="text-emerald-600/70 dark:text-emerald-400/70 ml-0.5" />
                                </span>
                                {markedBy === 'self' || markedBy === 'student' || joinTime ? (
                                  <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                    ⚡ Joined {joinTime || ''}
                                  </span>
                                ) : (
                                  <span className="text-[9px] text-[#737373] dark:text-zinc-400 font-medium">
                                    (Teacher marked)
                                  </span>
                                )}
                              </div>
                            ) : stStatus === 'late' ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800" title="Locked: Status is recorded. Click another status to request change.">
                                  ⏱ Late <Lock size={9} className="text-amber-600/70 dark:text-amber-400/70 ml-0.5" />
                                </span>
                                {joinTime && (
                                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold">
                                    at {joinTime}
                                  </span>
                                )}
                              </div>
                            ) : stStatus === 'absent' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800" title="Locked: Status is recorded. Click another status to request change.">
                                ✕ Absent <Lock size={9} className="text-rose-600/70 dark:text-rose-400/70 ml-0.5" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-zinc-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-zinc-700">
                                ○ Unmarked
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 text-right">
                          {stStatus === 'pending' ? (
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'present')}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer interactive"
                                title="Approve attendance claim (Mark Present)"
                              >
                                <Check size={11} strokeWidth={3} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'absent')}
                                disabled={isSaving}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer interactive"
                                title="Reject attendance claim (Mark Absent)"
                              >
                                <X size={11} strokeWidth={3} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center bg-[#F5F5F5] dark:bg-zinc-800 p-0.5 rounded-lg border border-[#E5E5E5] dark:border-zinc-700">
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'present')}
                                disabled={isSaving}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                  stStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-[#737373] dark:text-zinc-400 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-zinc-700'
                                }`}
                                title={
                                  stStatus === 'present'
                                    ? 'Status is recorded as Present (Locked)'
                                    : stStatus !== 'unmarked'
                                    ? 'Change status to Present (Requires confirmation)'
                                    : 'Mark Present'
                                }
                              >
                                P
                              </button>
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'late')}
                                disabled={isSaving}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                  stStatus === 'late'
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'text-[#737373] dark:text-zinc-400 hover:text-amber-700 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-zinc-700'
                                }`}
                                title={
                                  stStatus === 'late'
                                    ? 'Status is recorded as Late (Locked)'
                                    : stStatus !== 'unmarked'
                                    ? 'Change status to Late (Requires confirmation)'
                                    : 'Mark Late'
                                }
                              >
                                L
                              </button>
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'absent')}
                                disabled={isSaving}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                  stStatus === 'absent'
                                    ? 'bg-rose-600 text-white shadow-xs'
                                    : 'text-[#737373] dark:text-zinc-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-zinc-700'
                                }`}
                                title={
                                  stStatus === 'absent'
                                    ? 'Status is recorded as Absent (Locked)'
                                    : stStatus !== 'unmarked'
                                    ? 'Change status to Absent (Requires confirmation)'
                                    : 'Mark Absent'
                                }
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

      {/* ── TEACHER ATTENDANCE CHANGE CONFIRMATION MODAL ── */}
      <ConfirmModal
        open={!!pendingChange}
        onClose={() => setPendingChange(null)}
        onConfirm={async () => {
          if (pendingChange) {
            await handleUpdateStudentStatus(pendingChange.studentId, pendingChange.newStatus, pendingChange.slotId);
            setPendingChange(null);
          }
        }}
        title="Confirm Attendance Modification"
        description={`Are you sure you want to change this student's attendance record from ${
          pendingChange?.currentStatus
            ? pendingChange.currentStatus.charAt(0).toUpperCase() + pendingChange.currentStatus.slice(1)
            : ''
        } to ${
          pendingChange?.newStatus
            ? pendingChange.newStatus.charAt(0).toUpperCase() + pendingChange.newStatus.slice(1)
            : ''
        } for today's session?`}
        confirmLabel={`Change to ${
          pendingChange?.newStatus
            ? pendingChange.newStatus.charAt(0).toUpperCase() + pendingChange.newStatus.slice(1)
            : 'Confirm'
        }`}
        danger={pendingChange?.newStatus === 'absent'}
      >
        {pendingChange && (
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-[#111111]">{pendingChange.studentName}</div>
              <div className="text-[10px] text-[#737373] mt-0.5">
                Today's Session: {todayFormattedDate}
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold">
              <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                pendingChange.currentStatus === 'present'
                  ? 'bg-emerald-100 text-emerald-800'
                  : pendingChange.currentStatus === 'late'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {pendingChange.currentStatus}
              </span>
              <span className="text-[#A3A3A3]">→</span>
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] uppercase font-black ${
                pendingChange.newStatus === 'present'
                  ? 'bg-emerald-600 text-white'
                  : pendingChange.newStatus === 'late'
                  ? 'bg-amber-500 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {pendingChange.newStatus}
              </span>
            </div>
          </div>
        )}
      </ConfirmModal>

      <DashboardNoticeModal role="teacher" />
    </TeacherShell>
  );
};

export default TeacherDashboardPage;
