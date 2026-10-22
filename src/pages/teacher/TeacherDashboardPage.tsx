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
      <div className="teacher-card border-l-4 border-l-[#F4C430] p-4 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--teacher-muted)] uppercase tracking-wide">Next Class</span>
          <span className="badge badge-gold text-[10px] font-black">End of Day</span>
        </div>
        <div className="my-2">
          <div className="text-[18px] font-extrabold text-[var(--teacher-text)] truncate">No classes scheduled</div>
          <div className="text-[13px] text-[var(--teacher-muted)] font-medium mt-0.5">Enjoy your break! 🌙</div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--teacher-card-border)]">
          <Clock size={13} className="text-[var(--teacher-muted)] shrink-0" />
          <span className="text-xs text-[var(--teacher-muted)] font-semibold">TBA</span>
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
      <div className="teacher-card border-l-4 border-l-[#F4C430] p-4 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--teacher-muted)] uppercase tracking-wide">Now In Session</span>
          <div className="flex items-center gap-1">
            {isMulti && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded status-pill-warning">
                {concurrentSlots.length} Concurrent
              </span>
            )}
            <span className="badge badge-gold text-[10px] font-black animate-pulse">● Live</span>
          </div>
        </div>
        <div className="my-2">
          <div className="text-[18px] font-extrabold text-[var(--teacher-text)] truncate">{subject}</div>
          <div className="text-[13px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{remLabel}</div>
          {isMulti ? (
            <div className="text-[11px] text-[var(--teacher-muted)] font-medium mt-1 truncate">
              {concurrentSlots.map(s => {
                const gr = s.offering?.grade || (s.offering as any)?.class?.grade;
                const bd = s.offering?.board || (s.offering as any)?.class?.board?.name;
                return `${gr ? `Gr.${gr}` : ''}${bd ? ` ${bd}` : ''}`;
              }).filter(Boolean).join(' · ')}
            </div>
          ) : (
            state.nextSlot && (
              <div className="text-[11px] text-[var(--teacher-muted)] font-medium mt-1 truncate">
                Up next: {getSlotSubject(state.nextSlot)} · {formatTime12h(state.nextSlot.start_time)}
              </div>
            )
          )}
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-[var(--teacher-card-border)]">
          <Zap size={13} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-bold text-[var(--teacher-text)]">
            {formatTime12h(state.activeSlot.start_time)} – {formatTime12h(state.activeSlot.end_time)}
          </span>
          {calcDuration(state.activeSlot.start_time, state.activeSlot.end_time) && (
            <span className="text-[11px] text-[var(--teacher-muted)]">
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
    <div className="teacher-card border-l-4 border-l-[#F4C430] p-4 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[var(--teacher-muted)] uppercase tracking-wide">Next Class</span>
        <div className="flex items-center gap-1">
          {isMulti && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded status-pill-warning">
              {concurrentSlots.length} Concurrent
            </span>
          )}
          <span className={`badge badge-gold text-[10px] font-black ${isPulsing ? 'animate-pulse' : ''}`}>{badgeLabel}</span>
        </div>
      </div>
      <div className="my-2">
        <div className="text-[18px] font-extrabold text-[var(--teacher-text)] truncate">{subject}</div>
        <div className="text-[13px] text-[var(--teacher-muted)] font-medium truncate mt-0.5">
          {isMulti
            ? `${concurrentSlots.length} sections scheduled simultaneously`
            : `${nextSlot.offering?.grade ? `Class ${nextSlot.offering.grade} · ` : ''}${String(nextSlot.offering?.board || 'Curriculum').toUpperCase()}`}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--teacher-card-border)]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--teacher-text)]">
          <Clock size={13} className="text-[#F4C430] shrink-0" />
          <span>{formatClassTimeLabel(nextSlot)}</span>
        </div>
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--teacher-text)] tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Teacher'} 🎓
          </h1>
          <p className="text-sm text-[var(--teacher-muted)] mt-1 font-medium line-clamp-2 max-w-2xl">
            Manage your classroom rosters, upload syllabus notes, and view your teaching schedule.
          </p>
        </div>
      </div>

      {/* ── Browser Notification Permission Banner for Class Reminders ── */}
      <NotificationPermissionBanner role="teacher" />

      {/* ── Metrics Strip: Compact row on mobile (<640px), 3-col grid on tablet/desktop (>=640px) ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="teacher-card p-4 rounded-2xl flex flex-col justify-between min-h-[140px]">
              <div className="flex items-center justify-between">
                <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-24" />
                <div className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10" />
              </div>
              <div className="space-y-2">
                <div className="h-7 bg-black/10 dark:bg-white/10 rounded w-12" />
                <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-36" />
              </div>
              <div className="pt-2 border-t border-[var(--teacher-card-border)] flex items-center justify-between">
                <div className="h-2.5 bg-black/10 dark:bg-white/10 rounded w-24" />
                <div className="h-2.5 bg-black/10 dark:bg-white/10 rounded w-10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Mobile view (<640px): 2 half-width tiles + full-width Next Class */}
          <div className="flex flex-col gap-3 sm:hidden">
            <div className="grid grid-cols-2 gap-3">
              {/* Assigned Classes */}
              <div className="teacher-card p-3.5 rounded-2xl flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--teacher-muted)] uppercase tracking-wide">Assigned</span>
                  <div className="w-7 h-7 rounded-lg bg-[#F4C430]/15 text-[#8A6A00] dark:text-[#F4C430] flex items-center justify-center">
                    <BookOpen size={14} />
                  </div>
                </div>
                <div>
                  <div className="text-[28px] font-extrabold text-[var(--teacher-text)] leading-tight">{offerings.length}</div>
                  <div className="text-[12px] text-[var(--teacher-muted)] font-medium mt-0.5">Classes assigned</div>
                </div>
                <div className="text-[12px] text-[var(--teacher-muted)] font-semibold mt-2 pt-1.5 border-t border-[var(--teacher-card-border)]">
                  Active roster
                </div>
              </div>

              {/* Classes Today */}
              <div className="teacher-card p-3.5 rounded-2xl flex flex-col justify-between min-h-[120px]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--teacher-muted)] uppercase tracking-wide">Today</span>
                  <div className="w-7 h-7 rounded-lg bg-[#F4C430]/15 text-[#8A6A00] dark:text-[#F4C430] flex items-center justify-center">
                    <Calendar size={14} />
                  </div>
                </div>
                <div>
                  <div className="text-[28px] font-extrabold text-[var(--teacher-text)] leading-tight">{todayClasses.length}</div>
                  <div className="text-[12px] text-[var(--teacher-muted)] font-medium mt-0.5">Lectures today</div>
                </div>
                <div className="text-[12px] text-[var(--teacher-muted)] font-semibold mt-2 pt-1.5 border-t border-[var(--teacher-card-border)]">
                  Daily timetable
                </div>
              </div>
            </div>

            {/* Next Class - Full-width card on mobile */}
            <TeacherNextClassWidget slots={allSlots} teacherId={teacherId} />
          </div>

          {/* Tablet & Desktop view (>=640px): 3-column grid */}
          <div className="hidden sm:grid sm:grid-cols-3 sm:gap-4">
            {/* Classes Assigned */}
            <div className="teacher-card p-4 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--teacher-muted)] uppercase tracking-wide">Assigned Classes</span>
                <div className="w-7 h-7 rounded-lg bg-[#F4C430]/15 text-[#8A6A00] dark:text-[#F4C430] flex items-center justify-center">
                  <BookOpen size={14} />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-extrabold text-[var(--teacher-text)]">{offerings.length}</div>
                <div className="text-xs text-[var(--teacher-muted)] font-medium mt-0.5">Subject groups assigned</div>
              </div>
              <div className="pt-2 border-t border-[var(--teacher-card-border)] flex items-center justify-between text-[11px] text-[var(--teacher-muted)] font-bold">
                <span>Scoped to Teacher Roster</span>
                <span className="text-[var(--teacher-text)]">Active</span>
              </div>
            </div>

            {/* Next Class Countdown Widget */}
            <TeacherNextClassWidget slots={allSlots} teacherId={teacherId} />

            {/* Classes Today */}
            <div className="teacher-card p-4 rounded-2xl flex flex-col justify-between min-h-[140px] shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--teacher-muted)] uppercase tracking-wide">Classes Today</span>
                <div className="w-7 h-7 rounded-lg bg-[#F4C430]/15 text-[#8A6A00] dark:text-[#F4C430] flex items-center justify-center">
                  <Calendar size={14} />
                </div>
              </div>
              <div className="my-2">
                <div className="text-2xl font-extrabold text-[var(--teacher-text)]">{todayClasses.length}</div>
                <div className="text-xs text-[var(--teacher-muted)] font-medium mt-0.5">Lectures scheduled today</div>
              </div>
              <div className="pt-2 border-t border-[var(--teacher-card-border)] flex items-center justify-between text-[11px] text-[var(--teacher-muted)] font-bold">
                <span>Mon - Sat timetable</span>
                <span className="text-[var(--teacher-text)]">Daily</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Staff Attendance & Timecard (Direct Punch, Timer & Recent Logs) ── */}
      <div id="teacher-timecard-dashboard-widget" className="w-full">
        <StaffAttendanceWidget standalone={true} />
      </div>

      {/* ── Today's Timetable + Class Roster Section ── */}
      <div className={isMobile ? 'flex flex-col gap-6' : 'grid grid-cols-3 gap-6'}>
        
        {/* Today's Lectures */}
        <div className="teacher-card p-4 sm:p-5 rounded-2xl lg:col-span-1">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--teacher-card-border)] pb-2">
            <h2 className="text-sm font-bold text-[var(--teacher-text)]">Today's Schedule</h2>
            <button
              onClick={() => navigate('/teacher/schedule')}
              className="h-11 inline-flex items-center text-xs text-[var(--teacher-muted)] hover:text-[var(--teacher-text)] gap-1 transition-colors font-semibold"
            >
              Full schedule <ChevronRight size={12} />
            </button>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2].map((n) => (
                  <div key={n} className="h-[72px] flex items-center gap-3 p-3 rounded-xl border border-[var(--teacher-card-border)] bg-[var(--teacher-card-bg)]">
                    <div className="w-1.5 h-10 bg-neutral-200 dark:bg-neutral-800 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-20" />
                      <div className="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : todayClasses.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[var(--teacher-card-border)] rounded-xl">
                <CheckCircle2 size={30} className="mx-auto text-[var(--teacher-muted)] mb-2" />
                <h3 className="font-bold text-[var(--teacher-text)] text-xs">No Lectures Today</h3>
                <p className="text-[10px] text-[var(--teacher-muted)] mt-1">You have no scheduled lectures for this day.</p>
              </div>
            ) : (
              todayClasses.map((cls) => {
                const color = getSubjectColor(cls.custom_title || cls.offering?.subject_name || cls.offering?.subject || 'Class');
                const concurrentCount = todayClasses.filter(c => c.start_time === cls.start_time).length;
                return (
                  <div
                    key={cls.id}
                    className="h-[72px] flex items-center gap-3 p-3 rounded-xl border border-[var(--teacher-card-border)] border-l-4 border-l-[#F4C430] bg-[var(--teacher-card-bg)] hover:border-[var(--teacher-muted)]/40 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-[var(--teacher-text)] truncate">
                          {cls.custom_title || cls.offering?.subject_name || cls.offering?.subject || 'Class'}
                        </span>
                        {concurrentCount > 1 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded status-pill-warning shrink-0">
                            ⚡ {concurrentCount} In Slot
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[var(--teacher-muted)] font-semibold mt-0.5 truncate">
                        Class {cls.offering?.grade || (cls.offering as any)?.class?.grade || ''} ({String(cls.offering?.board || (cls.offering as any)?.class?.board?.name || (cls.offering as any)?.class?.board_id || (cls.offering as any)?.board_name || 'Curriculum').toUpperCase()})
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[13px] font-black text-[var(--teacher-text)]">{formatClassTime(cls.start_time)}</div>
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
        <div className={`teacher-card p-4 sm:p-5 rounded-2xl ${isMobile ? '' : 'col-span-2'}`}>
          {loading ? (
            <div className="space-y-4 p-2 animate-pulse">
              <div className="h-6 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3" />
              <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2" />
              <div className="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
            </div>
          ) : !activeTodaySlot ? (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[var(--teacher-muted)] mb-3">
                <Calendar size={22} className="text-[var(--teacher-muted)]" />
              </div>
              <h3 className="font-extrabold text-[var(--teacher-text)] text-sm">No Class Scheduled Today</h3>
              <p className="text-xs text-[var(--teacher-muted)] max-w-xs mt-1">
                You have no active lecture sessions on today's timetable ({todayFormattedDate}). Enjoy your break!
              </p>
            </div>
          ) : (
            <div>
              <div className="flex flex-col gap-3 mb-4 pb-3 border-b border-[var(--teacher-card-border)]">
                {/* Concurrent Classes Alert Banner */}
                {activeConcurrentSlots.length > 1 && (
                  <div className="flex items-center gap-2.5 p-3 status-pill-warning rounded-xl shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-amber-200/50 dark:bg-amber-900/50 flex items-center justify-center text-[#7A5200] dark:text-[#FFD866] shrink-0">
                      <Layers size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black flex items-center gap-1.5">
                        <span>⚡ Concurrent Session Slot ({activeConcurrentSlots.length} Classes Running Simultaneously)</span>
                      </div>
                      <div className="text-[10px] opacity-90 mt-0.5">
                        Set the meeting link once below to distribute it immediately to all {activeConcurrentSlots.length} classes. Use the section tabs below to filter the student roster.
                      </div>
                    </div>
                  </div>
                )}

                {/* Header with Auto-Detected Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-extrabold text-[var(--teacher-text)]">
                        {activeConcurrentSlots.length > 1
                          ? `${getSlotSubject(activeTodaySlot)} (${activeConcurrentSlots.length} Sections)`
                          : (activeTodaySlot.custom_title || activeOffering?.subject_name || activeOffering?.subject || 'Class Session')}
                      </h2>
                      {activeConcurrentSlots.length === 1 && (
                        <span className="text-[10px] status-pill-warning font-bold px-2 py-0.5 rounded-md">
                          Class {activeOffering?.grade || (activeOffering as any)?.class?.grade || ''} · {String(activeOffering?.board || (activeOffering as any)?.class?.board?.name || (activeOffering as any)?.class?.board_id || (activeOffering as any)?.board_name || 'Curriculum').toUpperCase()}
                        </span>
                      )}
                      {activeOffering?.stream && (
                        <span className="text-[10px] status-pill-neutral font-bold px-2 py-0.5 rounded-md">
                          {typeof activeOffering.stream === 'string' ? activeOffering.stream : (activeOffering.stream as any).name}
                        </span>
                      )}
                    </div>

                    {/* Static Date & Exact Time Slot */}
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--teacher-muted)] mt-1 flex-wrap">
                      <span className="text-[var(--teacher-text)] font-bold flex items-center gap-1">
                        <Calendar size={13} className="text-[#F4C430]" />
                        {todayFormattedDate}
                      </span>
                      <span className="text-[var(--teacher-muted)] opacity-50">·</span>
                      <span className="flex items-center gap-1 text-[var(--teacher-text)]">
                        <Clock size={13} className="text-[var(--teacher-muted)]" />
                        {formatTime12h(activeTodaySlot.start_time)} – {formatTime12h(activeTodaySlot.end_time)}
                      </span>
                      {isClassOngoing ? (
                        <span className="badge badge-gold text-[10px] font-extrabold animate-pulse">
                          ● Now in Session
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md status-pill-neutral">
                          Scheduled Today
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mark All Present Action */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={handleMarkAllPresent}
                      disabled={displayedStudents.length === 0}
                      className="w-full sm:w-auto h-12 px-4 rounded-xl font-black text-xs bg-[#F4C430] hover:bg-[#E5B520] active:scale-[0.98] text-[#111111] shadow-xs transition-all flex items-center justify-center gap-2 interactive disabled:opacity-50 cursor-pointer"
                      title="Mark all currently displayed students as Present"
                    >
                      <CheckCircle2 size={16} />
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
                  <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 border-t border-[var(--teacher-card-border)] no-scrollbar">
                    <span className="text-[11px] font-bold text-[var(--teacher-muted)] mr-1 shrink-0">Filter Roster:</span>
                    <button
                      onClick={() => setSelectedSectionSlotId('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        selectedSectionSlotId === 'all'
                          ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                          : 'status-pill-neutral hover:opacity-80'
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                            selectedSectionSlotId === s.id
                              ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                              : 'status-pill-neutral hover:opacity-80'
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 status-pill-warning rounded-xl shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-amber-200/50 dark:bg-amber-900/50 flex items-center justify-center text-[#7A5200] dark:text-[#FFD866] shrink-0">
                              <Clock size={16} className="animate-spin" />
                            </div>
                            <div>
                              <div className="text-xs font-extrabold">
                                {pendingStudents.length} Pending Attendance Claim{pendingStudents.length > 1 ? 's' : ''}
                              </div>
                              <div className="text-[10px] opacity-80 font-medium">
                                {pendingStudents.length === 1 ? 'A student has' : `${pendingStudents.length} students have`} claimed attendance for this session and {pendingStudents.length === 1 ? 'is' : 'are'} awaiting approval.
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={handleApproveAllPending}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-all cursor-pointer interactive shrink-0"
                            title="Approve all pending student attendance claims"
                          >
                            <Check size={13} strokeWidth={3} />
                            <span>Approve All ({pendingStudents.length})</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Status Pill Counters: 2x2 grid on mobile, flex on desktop */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 text-[11px] font-bold">
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
                              <span className="status-pill-warning px-2.5 py-1 rounded-lg flex items-center justify-center sm:justify-start gap-1 font-extrabold animate-pulse">
                                <Clock size={11} className="animate-spin text-amber-600" /> Pending: {pend}
                              </span>
                            )}
                            <span className="status-pill-success px-2.5 py-1 rounded-lg flex items-center justify-center sm:justify-start gap-1">
                              ● Present: {pres}
                            </span>
                            <span className="status-pill-warning px-2.5 py-1 rounded-lg flex items-center justify-center sm:justify-start gap-1">
                              ● Late: {late}
                            </span>
                            <span className="status-pill-danger px-2.5 py-1 rounded-lg flex items-center justify-center sm:justify-start gap-1">
                              ● Absent: {abs}
                            </span>
                            {un > 0 && (
                              <span className="status-pill-neutral px-2.5 py-1 rounded-lg flex items-center justify-center sm:justify-start gap-1">
                                ○ Unmarked: {un}
                              </span>
                            )}
                            <span className="col-span-2 sm:col-span-1 sm:ml-auto text-[var(--teacher-text)] font-extrabold text-xs text-right sm:text-left self-center">
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
                  <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-[var(--teacher-muted)] mb-3">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="font-bold text-[var(--teacher-text)] text-xs">No Students Enrolled</h3>
                  <p className="text-[10px] text-[var(--teacher-muted)] max-w-xs mt-1">
                    There are currently no students enrolled in this section.
                  </p>
                </div>
              ) : (
                <>
                  {/* MOBILE (<640px) STUDENT CARDS */}
                  <div className="block sm:hidden space-y-3">
                    {displayedStudents.map((st) => {
                      const { status: stStatus, markedAt, markedBy } = getStudentStatus(st.id, st._slotId);
                      const isSaving = savingAttendanceId === st.id;
                      const joinTime = markedAt ? new Date(markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

                      return (
                        <div
                          key={`mobile_${st.id}_${st._slotId}`}
                          className="p-3.5 rounded-xl border border-[var(--teacher-card-border)] bg-[var(--teacher-card-bg)] shadow-xs"
                        >
                          <div className="flex items-start gap-3">
                            {/* 40px Avatar initials */}
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-[var(--teacher-card-border)] flex items-center justify-center text-xs font-bold text-[var(--teacher-text)] shrink-0">
                              {st.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-base font-bold text-[var(--teacher-text)] block leading-snug line-clamp-2">
                                  {st.full_name}
                                </span>
                              </div>
                              <span className="text-xs text-[var(--teacher-muted)] font-medium leading-tight truncate block mt-0.5">
                                {(st as any).email || `ID: ${st.id.slice(0, 8)}`}
                              </span>

                              {/* Class & Stream Pills */}
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {activeConcurrentSlots.length > 1 && (
                                  <span className="text-[10px] status-pill-warning font-bold px-2 py-0.5 rounded">
                                    {st._sectionName} {st._grade ? `Gr.${st._grade}` : ''}
                                  </span>
                                )}
                                <span className="text-[10px] status-pill-neutral font-bold px-2 py-0.5 rounded capitalize">
                                  {st.stream || 'General'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Status and Join Badge */}
                          <div className="mt-2.5 pt-2 border-t border-[var(--teacher-card-border)] flex items-center justify-between text-xs">
                            <span className="text-[11px] text-[var(--teacher-muted)] font-medium">Recorded Status:</span>
                            <div>
                              {stStatus === 'pending' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold status-pill-warning px-2.5 py-0.5 rounded-full">
                                  <Clock size={11} className="animate-spin" /> Pending Claim {joinTime ? `(${joinTime})` : ''}
                                </span>
                              ) : stStatus === 'present' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold status-pill-success px-2.5 py-0.5 rounded-full">
                                  ✓ Present <Lock size={9} className="opacity-70 ml-0.5" />
                                  {joinTime && <span className="font-semibold opacity-90">· {joinTime}</span>}
                                </span>
                              ) : stStatus === 'late' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold status-pill-warning px-2.5 py-0.5 rounded-full">
                                  ⏱ Late <Lock size={9} className="opacity-70 ml-0.5" />
                                  {joinTime && <span className="font-semibold opacity-90">· {joinTime}</span>}
                                </span>
                              ) : stStatus === 'absent' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold status-pill-danger px-2.5 py-0.5 rounded-full">
                                  ✕ Absent <Lock size={9} className="opacity-70 ml-0.5" />
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold status-pill-neutral px-2.5 py-0.5 rounded-full">
                                  ○ Unmarked
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 44px P | L | A Segmented Action Buttons */}
                          {stStatus === 'pending' ? (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--teacher-card-border)]">
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'present')}
                                disabled={isSaving}
                                className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                              >
                                <Check size={14} strokeWidth={3} />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'absent')}
                                disabled={isSaving}
                                className="flex-1 h-11 inline-flex items-center justify-center gap-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                              >
                                <X size={14} strokeWidth={3} />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--teacher-card-border)]">
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'present')}
                                disabled={isSaving}
                                className={`flex-1 h-11 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  stStatus === 'present'
                                    ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                                    : 'status-pill-neutral hover:bg-emerald-500/10 hover:text-emerald-600 active:scale-[0.98]'
                                }`}
                                title={stStatus === 'present' ? 'Present (Locked)' : 'Mark Present'}
                              >
                                <span>P</span>
                                {stStatus === 'present' && <Check size={14} strokeWidth={3} />}
                              </button>
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'late')}
                                disabled={isSaving}
                                className={`flex-1 h-11 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  stStatus === 'late'
                                    ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30'
                                    : 'status-pill-neutral hover:bg-amber-500/10 hover:text-amber-600 active:scale-[0.98]'
                                }`}
                                title={stStatus === 'late' ? 'Late (Locked)' : 'Mark Late'}
                              >
                                <span>L</span>
                                {stStatus === 'late' && <Clock size={13} strokeWidth={2.5} />}
                              </button>
                              <button
                                onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'absent')}
                                disabled={isSaving}
                                className={`flex-1 h-11 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  stStatus === 'absent'
                                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-500/30'
                                    : 'status-pill-neutral hover:bg-rose-500/10 hover:text-rose-600 active:scale-[0.98]'
                                }`}
                                title={stStatus === 'absent' ? 'Absent (Locked)' : 'Mark Absent'}
                              >
                                <span>A</span>
                                {stStatus === 'absent' && <X size={14} strokeWidth={3} />}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* DESKTOP & TABLET (>=640px) PRESERVED TABLE */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[var(--teacher-card-border)]">
                          <th className="py-2.5 text-[10px] font-black text-[var(--teacher-muted)] uppercase tracking-wider">Student</th>
                          {activeConcurrentSlots.length > 1 && (
                            <th className="py-2.5 text-[10px] font-black text-[var(--teacher-muted)] uppercase tracking-wider">Class / Section</th>
                          )}
                          <th className="py-2.5 text-[10px] font-black text-[var(--teacher-muted)] uppercase tracking-wider">Stream</th>
                          <th className="py-2.5 text-[10px] font-black text-[var(--teacher-muted)] uppercase tracking-wider">Status & Auto-Join Log</th>
                          <th className="py-2.5 text-[10px] font-black text-[var(--teacher-muted)] uppercase tracking-wider text-right">Toggle Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--teacher-card-border)]">
                        {displayedStudents.map((st) => {
                          const { status: stStatus, markedAt, markedBy } = getStudentStatus(st.id, st._slotId);
                          const isSaving = savingAttendanceId === st.id;
                          const joinTime = markedAt ? new Date(markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

                          return (
                            <tr key={`${st.id}_${st._slotId}`} className="hover:bg-[var(--teacher-card-bg)]/80 transition-colors">
                              <td className="py-3 pr-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-[var(--teacher-card-border)] flex items-center justify-center text-[10px] font-bold text-[var(--teacher-text)] shrink-0">
                                    {st.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-xs font-bold text-[var(--teacher-text)] block leading-tight truncate">{st.full_name}</span>
                                    <span className="text-[9px] text-[var(--teacher-muted)] font-medium leading-tight truncate block">
                                      {(st as any).email || `ID: ${st.id.slice(0, 8)}`}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {activeConcurrentSlots.length > 1 && (
                                <td className="py-3 text-xs whitespace-nowrap">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold status-pill-warning">
                                    {st._sectionName} {st._grade ? `Gr.${st._grade}` : ''}
                                  </span>
                                </td>
                              )}

                              <td className="py-3 text-xs font-semibold text-[var(--teacher-text)] capitalize whitespace-nowrap">
                                {st.stream || 'General'}
                              </td>

                              <td className="py-3">
                                <div className="flex flex-col gap-0.5">
                                  {stStatus === 'pending' ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold status-pill-warning px-2 py-0.5 rounded-full">
                                        <Clock size={10} className="animate-spin text-amber-600" /> Pending Approval
                                      </span>
                                      {joinTime && (
                                        <span className="text-[9px] status-pill-warning font-semibold px-1.5 py-0.5 rounded">
                                          Claimed {joinTime}
                                        </span>
                                      )}
                                    </div>
                                  ) : stStatus === 'present' ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold status-pill-success px-2 py-0.5 rounded-full" title="Locked: Status is recorded. Click another status to request change.">
                                        ✓ Present <Lock size={9} className="opacity-70 ml-0.5" />
                                      </span>
                                      {markedBy === 'self' || markedBy === 'student' || joinTime ? (
                                        <span className="text-[9px] status-pill-success font-semibold px-1.5 py-0.5 rounded">
                                          ⚡ Joined {joinTime || ''}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] text-[var(--teacher-muted)] font-medium">
                                          (Teacher marked)
                                        </span>
                                      )}
                                    </div>
                                  ) : stStatus === 'late' ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold status-pill-warning px-2 py-0.5 rounded-full" title="Locked: Status is recorded. Click another status to request change.">
                                        ⏱ Late <Lock size={9} className="opacity-70 ml-0.5" />
                                      </span>
                                      {joinTime && (
                                        <span className="text-[9px] status-pill-warning font-semibold px-1.5 py-0.5 rounded">
                                          at {joinTime}
                                        </span>
                                      )}
                                    </div>
                                  ) : stStatus === 'absent' ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold status-pill-danger px-2 py-0.5 rounded-full" title="Locked: Status is recorded. Click another status to request change.">
                                      ✕ Absent <Lock size={9} className="opacity-70 ml-0.5" />
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold status-pill-neutral px-2 py-0.5 rounded-full">
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
                                  <div className="inline-flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-[var(--teacher-card-border)]">
                                    <button
                                      onClick={() => handleTeacherClickAttendance(st.id, st.full_name, st._slotId, stStatus, 'present')}
                                      disabled={isSaving}
                                      className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                                        stStatus === 'present'
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'text-[var(--teacher-muted)] hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-neutral-700'
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
                                          : 'text-[var(--teacher-muted)] hover:text-amber-700 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-neutral-700'
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
                                          : 'text-[var(--teacher-muted)] hover:text-rose-700 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-neutral-700'
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
                </>
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
          <div className="bg-[var(--teacher-card-bg)] border border-[var(--teacher-card-border)] rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-[var(--teacher-text)]">{pendingChange.studentName}</div>
              <div className="text-[10px] text-[var(--teacher-muted)] mt-0.5">
                Today's Session: {todayFormattedDate}
              </div>
            </div>
            <div className="flex items-center gap-2 font-bold">
              <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase font-bold ${
                pendingChange.currentStatus === 'present'
                  ? 'status-pill-success'
                  : pendingChange.currentStatus === 'late'
                  ? 'status-pill-warning'
                  : 'status-pill-danger'
              }`}>
                {pendingChange.currentStatus}
              </span>
              <span className="text-[var(--teacher-muted)]">→</span>
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
