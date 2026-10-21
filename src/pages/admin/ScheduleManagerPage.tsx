import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Plus,
  Filter,
  RotateCcw,
  Megaphone,
  Trash2,
  CheckSquare,
  MoreVertical,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import WeeklyGrid from '../../components/admin/schedule/WeeklyGrid';
import AdminDrawer from '../../components/admin/AdminDrawer';
import SlotForm from '../../components/admin/schedule/SlotForm';
import SlotDetailDrawer from '../../components/admin/schedule/SlotDetailDrawer';
import ClearScheduleDialog from '../../components/admin/schedule/ClearScheduleDialog';
import ConfirmModal from '../../components/admin/ConfirmModal';
import ScheduleConflictModal, { ConflictDetails } from '../../components/admin/schedule/ScheduleConflictModal';
import AdminClassLinkModal from '../../components/admin/schedule/AdminClassLinkModal';
import {
  getAllSlots,
  getAllOfferings,
  getAllTeachers,
  upsertSlot,
  deleteSlot,
  deleteSlots,
  getTaxonomy,
  createAnnouncement,
  getSessionLinksForDates,
  getSubjectsForStream,
} from '../../lib/db';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { DAYS_OF_WEEK_FULL, formatTime12h, getPKTNow } from '../../lib/scheduleUtils';
import { toast } from 'sonner';
import { useMobile } from '../../hooks/useMobile';
import { NotificationPermissionBanner } from '../../components/student/NotificationPermissionBanner';
import type { ClassSlot, ClassOffering, Teacher, ClassSessionLink } from '../../types';

const BOARDS = [
  { id: 'fbise', label: 'FBISE' },
  { id: 'punjab', label: 'Punjab Board' },
  { id: 'sindh', label: 'Sindh Board' },
  { id: 'kpk', label: 'KPK Board' },
  { id: 'olevel', label: 'O Levels' },
  { id: 'alevel', label: 'A Levels' },
  { id: 'ielts', label: 'IELTS' },
];

export const ScheduleManagerPage: React.FC = () => {
  const isMobile = useMobile();
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [taxonomy, setTaxonomy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Detail & Edit Drawers
  const [activeSlotForDetail, setActiveSlotForDetail] = useState<any | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ClassSlot | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [sourceDuplicateSlot, setSourceDuplicateSlot] = useState<ClassSlot | null>(null);

  // Modals
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState<string | null>(null);
  const [notifyCancel, setNotifyCancel] = useState(true);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [pendingMoveData, setPendingMoveData] = useState<any>(null);
  const [conflictData, setConflictData] = useState<ConflictDetails | null>(null);
  const [clearScheduleModalOpen, setClearScheduleModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Meeting Link Modal
  const [sessionLinksMap, setSessionLinksMap] = useState<Record<string, ClassSessionLink>>({});
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [slotForLinkModal, setSlotForLinkModal] = useState<any>(null);

  // Filters
  const [selectedBoard, setSelectedBoard] = useState<string>('fbise');
  const [selectedGrade, setSelectedGrade] = useState<string>('10');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [onlyMissingLinks, setOnlyMissingLinks] = useState(false);
  const [showPublishBanner, setShowPublishBanner] = useState(false);
  const [showMobileFilterSheet, setShowMobileFilterSheet] = useState(false);

  // Overflow Menu State
  const [overflowMenuOpen, setOverflowMenuOpen] = useState(false);
  const overflowMenuRef = useRef<HTMLDivElement>(null);

  // Close overflow menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (overflowMenuRef.current && !overflowMenuRef.current.contains(e.target as Node)) {
        setOverflowMenuOpen(false);
      }
    };
    if (overflowMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [overflowMenuOpen]);

  const fetchSessionLinks = useCallback(async () => {
    try {
      const pktnow = getPKTNow();
      const dates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        dates.push(d.toISOString().slice(0, 10));
      }
      if (!dates.includes(pktnow.dateString)) {
        dates.push(pktnow.dateString);
      }
      const links = await getSessionLinksForDates(dates);
      const map: Record<string, ClassSessionLink> = {};
      links.forEach((l) => {
        if (l.slot_id) {
          map[l.slot_id] = l;
        }
      });
      setSessionLinksMap(map);
    } catch (err) {
      console.warn('[ScheduleManagerPage] error fetching session links:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, o, t, tax] = await Promise.all([
        getAllSlots(),
        getAllOfferings(),
        getAllTeachers(),
        getTaxonomy(),
      ]);
      setSlots(s);
      setOfferings(o);
      setTeachers(t);
      setTaxonomy(tax);
      await fetchSessionLinks();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchSessionLinks]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Default to 'all' streams whenever taxonomy loads or grade changes
  useEffect(() => {
    if (!taxonomy) return;
    setSelectedStream('all');
  }, [taxonomy, selectedGrade, selectedBoard]);

  useRealtimeTable({
    table: 'class_slots',
    onAny: async () => {
      const s = await getAllSlots();
      setSlots(s);
    },
  });

  useRealtimeTable({
    table: 'class_session_links',
    onAny: fetchSessionLinks,
  });

  // Enrich raw slots with offering, teacher, and stream names
  const enrichedSlots = useMemo(() => {
    return slots.map((slot) => {
      const offering = offerings.find((o) => o.id === slot.offering_id);
      const teacher = offering ? teachers.find((t) => t.id === offering.teacher_id) : undefined;
      const streamId = slot.stream_id || offering?.stream_id;
      const streamObj = streamId ? taxonomy?.streams?.find((s: any) => s.id === streamId) : undefined;
      return {
        ...slot,
        offering: offering ? { ...offering, teacher } : undefined,
        streamName: streamObj?.name || (offering as any)?.stream || undefined,
      };
    });
  }, [slots, offerings, teachers, taxonomy]);

  const activeClass = useMemo(() => {
    return taxonomy?.classes?.find((c: any) => c.grade === selectedGrade && c.board_id === selectedBoard);
  }, [taxonomy, selectedGrade, selectedBoard]);

  const activeStreams = useMemo(() => {
    if (activeClass) {
      return taxonomy?.streams?.filter((s: any) => s.class_id === activeClass.id) || [];
    }
    if (selectedGrade !== 'all' && taxonomy?.classes) {
      return (
        taxonomy?.streams?.filter((s: any) => {
          const cls = taxonomy.classes.find((c: any) => c.id === s.class_id);
          return cls && String(cls.grade) === String(selectedGrade);
        }) || []
      );
    }
    return [];
  }, [activeClass, selectedGrade, taxonomy]);

  // Filter slots based on active cohort, teacher, and missing link toggle
  const filteredSlots = useMemo(() => {
    return enrichedSlots.filter((slot) => {
      const slotClass = taxonomy?.classes?.find(
        (c: any) =>
          c.id === slot.class_id ||
          c.id === slot.offering?.class_id ||
          c.id === (slot.offering as any)?.class?.id
      );

      // Grade match
      const slotGrade = slot.offering?.grade || slotClass?.grade || (slot.offering as any)?.class?.grade;
      const gradeMatch = selectedGrade === 'all' || String(slotGrade) === String(selectedGrade);

      // Board match
      const slotBoard = slot.offering?.board || slotClass?.board_id || (slot.offering as any)?.class?.board?.id;
      const boardMatch = selectedBoard === 'all' || !slotBoard || slotBoard === selectedBoard;

      // Teacher match
      const slotTeacherId = slot.offering?.teacher_id;
      const teacherMatch = teacherFilter === 'all' || slotTeacherId === teacherFilter;

      // Stream match
      let streamMatch = true;
      if (selectedStream && selectedStream !== 'all' && selectedStream !== '') {
        const explicitSlotStream = slot.stream_id;
        const explicitOfferingStream = slot.offering?.stream_id || (slot.offering as any)?.stream?.id;
        const slotStreamId = explicitSlotStream || explicitOfferingStream;

        if (slotStreamId) {
          streamMatch = slotStreamId === selectedStream || slotStreamId === 'all';
        } else {
          const activeStreamName =
            activeStreams.find((s: any) => s.id === selectedStream)?.name ||
            taxonomy?.streams?.find((s: any) => s.id === selectedStream)?.name;
          if (activeStreamName && slotGrade) {
            const streamSubjects = getSubjectsForStream(String(slotGrade), activeStreamName);
            const offeringSubject =
              slot.custom_title ||
              slot.offering?.subject_name ||
              slot.offering?.subject?.name ||
              slot.offering?.subject;
            if (streamSubjects && streamSubjects.length > 0 && offeringSubject) {
              streamMatch = streamSubjects.some(
                (s: string) => s.toLowerCase() === String(offeringSubject).toLowerCase()
              );
            }
          }
        }
      }

      // Missing links only filter
      if (onlyMissingLinks) {
        const link = (sessionLinksMap[slot.id]?.link_url || slot.room_or_link || '').trim();
        if (link || slot.is_cancelled) return false;
      }

      return boardMatch && gradeMatch && teacherMatch && streamMatch;
    });
  }, [
    enrichedSlots,
    taxonomy,
    selectedGrade,
    selectedBoard,
    teacherFilter,
    selectedStream,
    activeStreams,
    onlyMissingLinks,
    sessionLinksMap,
  ]);

  // Conflict Detection across timetable
  const conflictSlotIds = useMemo(() => {
    const conflicts = new Set<string>();
    const timeToMins = (t: string) => {
      if (!t) return 0;
      const [h = 0, m = 0] = t.split(':').map(Number);
      return h * 60 + m;
    };

    for (let i = 0; i < enrichedSlots.length; i++) {
      const a = enrichedSlots[i];
      if (a.is_cancelled) continue;
      const aStart = timeToMins(a.start_time);
      const aEnd = timeToMins(a.end_time || a.start_time);
      const aTeacherId = a.offering?.teacher_id;

      for (let j = i + 1; j < enrichedSlots.length; j++) {
        const b = enrichedSlots[j];
        if (b.is_cancelled) continue;
        if (a.day_of_week !== b.day_of_week) continue;

        const bStart = timeToMins(b.start_time);
        const bEnd = timeToMins(b.end_time || b.start_time);
        const isOverlap = Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
        if (!isOverlap) continue;

        // Conflict 1: Teacher double-booked
        if (aTeacherId && b.offering?.teacher_id && aTeacherId === b.offering.teacher_id) {
          conflicts.add(a.id);
          conflicts.add(b.id);
        }

        // Conflict 2: Same cohort slot collision
        const aClass = taxonomy?.classes?.find((c: any) => c.id === a.class_id || c.id === a.offering?.class_id);
        const bClass = taxonomy?.classes?.find((c: any) => c.id === b.class_id || c.id === b.offering?.class_id);
        const aBoard = aClass?.board_id || a.offering?.board;
        const bBoard = bClass?.board_id || b.offering?.board;
        const aGrade = aClass?.grade || a.offering?.grade;
        const bGrade = bClass?.grade || b.offering?.grade;

        if (aBoard && bBoard && aBoard === bBoard && String(aGrade) === String(bGrade)) {
          const aStream = a.stream_id || a.offering?.stream_id;
          const bStream = b.stream_id || b.offering?.stream_id;
          if (!aStream || !bStream || aStream === 'all' || bStream === 'all' || aStream === bStream) {
            conflicts.add(a.id);
            conflicts.add(b.id);
          }
        }
      }
    }
    return conflicts;
  }, [enrichedSlots, taxonomy]);

  // Meeting Link Status Summary
  const linkSummary = useMemo(() => {
    const activeCohortSlots = enrichedSlots.filter((slot) => {
      const slotClass = taxonomy?.classes?.find(
        (c: any) => c.id === slot.class_id || c.id === slot.offering?.class_id
      );
      const slotGrade = slot.offering?.grade || slotClass?.grade;
      const slotBoard = slot.offering?.board || slotClass?.board_id;
      const gradeMatch = selectedGrade === 'all' || String(slotGrade) === String(selectedGrade);
      const boardMatch = selectedBoard === 'all' || !slotBoard || slotBoard === selectedBoard;
      return gradeMatch && boardMatch && !slot.is_cancelled;
    });

    const total = activeCohortSlots.length;
    const withLink = activeCohortSlots.filter((s) => {
      const link = (sessionLinksMap[s.id]?.link_url || s.room_or_link || '').trim();
      return Boolean(link);
    }).length;
    const missing = total - withLink;
    return { total, withLink, missing };
  }, [enrichedSlots, selectedGrade, selectedBoard, sessionLinksMap, taxonomy]);

  // Cohort display label for clear confirmation
  const activeBoardLabel = BOARDS.find((b) => b.id === selectedBoard)?.label || selectedBoard.toUpperCase();
  const cohortDisplayName = `${activeBoardLabel} Grade ${selectedGrade}${
    selectedStream && selectedStream !== 'all'
      ? ` (${activeStreams.find((s: any) => s.id === selectedStream)?.name || selectedStream})`
      : ''
  }`;

  // Conflict checker on save
  const checkSlotConflict = (formData: any, targetSlotId: string | null): ConflictDetails | null => {
    const formOffering = offerings.find((o) => o.id === formData.offering_id);
    const formSubject =
      formData.custom_title ||
      formOffering?.subject_name ||
      formOffering?.subject?.name ||
      'Class';
    const formTeacherId = formOffering?.teacher_id;
    const formTeacher = teachers.find((t) => t.id === formTeacherId);

    const formClassId =
      formData.class_id ||
      formOffering?.class_id ||
      taxonomy?.classes?.find((c: any) => c.board_id === selectedBoard && String(c.grade) === String(selectedGrade))?.id;
    const formClass = taxonomy?.classes?.find((c: any) => c.id === formClassId);
    const formBoard = formClass?.board_id || selectedBoard;
    const formGrade = formClass?.grade || selectedGrade;
    const formStreamId = formData.stream_id || formOffering?.stream_id || null;
    const formStreamObj = taxonomy?.streams?.find((s: any) => s.id === formStreamId);

    const timeToMins = (t: string) => {
      if (!t) return 0;
      const [h = 0, m = 0] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const formStart = timeToMins(formData.start_time);
    const formEnd = timeToMins(formData.end_time || formData.start_time);

    for (const s of slots) {
      if (s.id === targetSlotId || s.is_cancelled) continue;
      if (s.day_of_week !== formData.day_of_week) continue;

      const sStart = timeToMins(s.start_time);
      const sEnd = timeToMins(s.end_time || s.start_time);
      const isOverlap = Math.max(sStart, formStart) < Math.min(sEnd, formEnd);
      if (!isOverlap) continue;

      const sOffering = offerings.find((o) => o.id === s.offering_id);
      const sSubject =
        s.custom_title || sOffering?.subject_name || sOffering?.subject?.name || 'Class';
      const sTeacherId = sOffering?.teacher_id;
      const sTeacher = teachers.find((t) => t.id === sTeacherId);
      const sClassId = s.class_id || sOffering?.class_id;
      const sClass = taxonomy?.classes?.find((c: any) => c.id === sClassId);
      const sBoard = sClass?.board_id || sOffering?.board;
      const sGrade = sClass?.grade || sOffering?.grade;
      const sStreamId = s.stream_id || sOffering?.stream_id || null;

      const isSameClass =
        (formClassId && sClassId && formClassId === sClassId) ||
        (formBoard && sBoard && formBoard === sBoard && String(formGrade) === String(sGrade));
      const isSameStream =
        !formStreamId ||
        !sStreamId ||
        formStreamId === 'all' ||
        sStreamId === 'all' ||
        formStreamId === sStreamId;
      const isSameSubject =
        (formData.offering_id && s.offering_id && formData.offering_id === s.offering_id) ||
        formSubject.trim().toLowerCase() === sSubject.trim().toLowerCase();

      // Duplicate Class
      if (isSameClass && isSameStream && isSameSubject) {
        return {
          type: 'duplicate_class',
          title: `${formSubject} already exists`,
          message: `${formSubject} already exists on ${DAYS_OF_WEEK_FULL[formData.day_of_week]} at ${formatTime12h(s.start_time)} for Grade ${formGrade}.`,
          subjectName: formSubject,
          teacherName: formTeacher?.full_name || 'Instructor',
          dayIndex: formData.day_of_week,
          startTime: formData.start_time,
          endTime: formData.end_time,
          cohortGrade: formGrade,
          streamName: formStreamObj?.name,
          conflictingSlot: { ...s, offering: sOffering },
          pendingFormData: formData,
          isEditMode: !!targetSlotId,
        };
      }

      // Teacher double-booking
      if (formTeacherId && sTeacherId && formTeacherId === sTeacherId) {
        return {
          type: 'teacher_double_booking',
          title: `Instructor Double-Booking Conflict`,
          message: `Instructor ${formTeacher?.full_name || 'Teacher'} is already scheduled to teach ${sSubject} on ${DAYS_OF_WEEK_FULL[formData.day_of_week]} at ${formatTime12h(s.start_time)}.`,
          subjectName: formSubject,
          teacherName: formTeacher?.full_name || 'Instructor',
          dayIndex: formData.day_of_week,
          startTime: formData.start_time,
          endTime: formData.end_time,
          cohortGrade: formGrade,
          streamName: formStreamObj?.name,
          conflictingSlot: { ...s, offering: sOffering },
          pendingFormData: formData,
          isEditMode: !!targetSlotId,
        };
      }

      // Class slot collision
      if (isSameClass && isSameStream && !isSameSubject) {
        return {
          type: 'cohort_clash',
          title: `Class Slot Already Occupied`,
          message: `${sSubject} (${sTeacher?.full_name || 'Instructor'}) is already scheduled on ${DAYS_OF_WEEK_FULL[formData.day_of_week]} at ${formatTime12h(s.start_time)} for Grade ${formGrade}.`,
          subjectName: formSubject,
          teacherName: formTeacher?.full_name || 'Instructor',
          dayIndex: formData.day_of_week,
          startTime: formData.start_time,
          endTime: formData.end_time,
          cohortGrade: formGrade,
          streamName: formStreamObj?.name,
          conflictingSlot: { ...s, offering: sOffering },
          pendingFormData: formData,
          isEditMode: !!targetSlotId,
        };
      }
    }
    return null;
  };

  // Drawer Save handler
  const handleSaveSlot = async (formData: any) => {
    const isEditMode = !isDuplicateMode && !!editingSlotId;

    if (formData.days_of_week && formData.days_of_week.length > 0) {
      for (const d of formData.days_of_week) {
        const conflict = checkSlotConflict({ ...formData, day_of_week: d }, null);
        if (conflict) {
          setConflictData({ ...conflict, pendingFormData: { ...formData, day_of_week: d } });
          return;
        }
      }
    } else {
      const conflict = checkSlotConflict(formData, editingSlotId);
      if (conflict) {
        setConflictData(conflict);
        return;
      }
    }

    if (isEditMode && selectedSlot) {
      const dayChanged = selectedSlot.day_of_week !== formData.day_of_week;
      const timeChanged = selectedSlot.start_time !== formData.start_time;
      if ((dayChanged || timeChanged) && !pendingMoveData) {
        setPendingMoveData(formData);
        setMoveModalOpen(true);
        return;
      }
    }

    await executeSaveSlot(formData);
  };

  const executeSaveSlot = async (formData: any) => {
    const isEditMode = !isDuplicateMode && !!editingSlotId;
    const targetSlotId = isEditMode ? editingSlotId : undefined;

    try {
      const targetDays: number[] =
        formData.days_of_week && formData.days_of_week.length > 0
          ? formData.days_of_week
          : [formData.day_of_week];

      if (targetDays.length > 1 || isDuplicateMode) {
        for (const d of targetDays) {
          await upsertSlot({
            id: undefined,
            offering_id: formData.offering_id || null,
            custom_title: formData.custom_title || null,
            class_id: formData.class_id || null,
            stream_id: formData.stream_id || null,
            day_of_week: d as any,
            start_time: formData.start_time,
            end_time: formData.end_time,
            room_or_link: formData.room_or_link !== undefined ? formData.room_or_link : null,
            is_cancelled: false,
          });
        }
      } else {
        await upsertSlot({
          id: targetSlotId,
          offering_id: formData.offering_id || null,
          custom_title: formData.custom_title || null,
          class_id: formData.class_id || null,
          stream_id: formData.stream_id || null,
          day_of_week: formData.day_of_week as any,
          start_time: formData.start_time,
          end_time: formData.end_time,
          room_or_link:
            formData.room_or_link !== undefined
              ? formData.room_or_link
              : selectedSlot?.room_or_link || null,
          is_cancelled: formData.is_cancelled !== undefined ? formData.is_cancelled : false,
        });
      }

      await loadData();
      setDrawerOpen(false);
      setSelectedSlot(null);
      setEditingSlotId(null);
      setIsDuplicateMode(false);
      setSourceDuplicateSlot(null);
      toast.success(isEditMode ? 'Class slot updated.' : 'Class scheduled successfully.');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to save class slot.');
    }
  };

  const handleToggleCancel = async (slotId: string, currentStatus: boolean) => {
    if (!currentStatus) {
      setSlotToCancel(slotId);
      setNotifyCancel(true);
      setCancelModalOpen(true);
      return;
    }

    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;

    try {
      await upsertSlot({ ...slot, is_cancelled: false });
      await loadData();
      toast.success('Class slot restored.');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to restore class slot.');
    }
  };

  const handleConfirmCancel = async () => {
    if (!slotToCancel) return;
    const slot = slots.find((s) => s.id === slotToCancel);
    if (!slot) return;

    try {
      await upsertSlot({ ...slot, is_cancelled: true });
      await loadData();

      if (notifyCancel) {
        const offering = offerings.find((o) => o.id === slot.offering_id);
        const subject =
          slot.custom_title ||
          (offering ? offering.subject_name || offering.subject?.name || 'Class' : 'Class');
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[slot.day_of_week];
        const timeStr = slot.start_time.slice(0, 5);

        await createAnnouncement({
          title: 'Class Cancellation',
          body: `${subject} on ${dayName} at ${timeStr} has been cancelled.`,
          severity: 'crucial',
          scope: 'class',
          class_id: slot.class_id || offering?.class_id || null,
          stream_id: slot.stream_id && slot.stream_id !== 'all' ? slot.stream_id : offering?.stream_id || null,
        });
        setShowPublishBanner(true);
        setTimeout(() => setShowPublishBanner(false), 4000);
      }
      toast.success('Class slot marked as cancelled.');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to cancel class slot.');
    } finally {
      setSlotToCancel(null);
    }
  };

  const handleDeleteTrigger = (slotId: string) => {
    setSlotToDelete(slotId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (slotToDelete) {
      try {
        await deleteSlot(slotToDelete);
        await loadData();
        toast.success('Class slot deleted.');
      } catch (err: any) {
        console.error(err);
        toast.error('Failed to delete class slot.');
      } finally {
        setSlotToDelete(null);
      }
    }
  };

  // Clear entire cohort schedule
  const handleConfirmClearSchedule = async () => {
    const targetIds = filteredSlots.map((s) => s.id);
    if (targetIds.length === 0) return;

    try {
      await deleteSlots(targetIds);
      await loadData();
      toast.success(`Cleared ${targetIds.length} class slots for ${cohortDisplayName}.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to clear schedule.');
    } finally {
      setClearScheduleModalOpen(false);
    }
  };

  // Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedSlotIds.length === 0) return;
    try {
      await deleteSlots(selectedSlotIds);
      await loadData();
      toast.success(`Deleted ${selectedSlotIds.length} selected class slots.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete selected slots.');
    } finally {
      setSelectedSlotIds([]);
      setBulkDeleteModalOpen(false);
      setSelectionMode(false);
    }
  };

  // Drawer triggers
  const handleAddTrigger = (dayOfWeekIndex: number = 0, startTime?: string, endTime?: string) => {
    setEditingSlotId(null);
    setSelectedSlot(null);
    setIsDuplicateMode(false);
    setSourceDuplicateSlot(null);
    setDrawerOpen(true);
    const newSlotTemplate: Partial<ClassSlot> = {
      offering_id: '',
      day_of_week: dayOfWeekIndex as any,
      start_time: startTime || '16:00:00',
      end_time: endTime || '16:30:00',
    };
    setSelectedSlot(newSlotTemplate as any);
  };

  const handleSelectSlotForDetail = (slot: any) => {
    setActiveSlotForDetail(slot);
  };

  const handleEditFullSlotFromDetail = (slot: ClassSlot) => {
    setActiveSlotForDetail(null);
    setEditingSlotId(slot.id);
    setSelectedSlot(slot);
    setIsDuplicateMode(false);
    setSourceDuplicateSlot(null);
    setDrawerOpen(true);
  };

  const resetFilters = () => {
    setSelectedBoard('fbise');
    setSelectedGrade('10');
    setSelectedStream('all');
    setTeacherFilter('all');
    setOnlyMissingLinks(false);
  };

  const activeGrades = useMemo(() => {
    return taxonomy
      ? taxonomy.classes
          .filter((c: any) => c.board_id === selectedBoard)
          .map((c: any) => ({ id: c.grade, label: c.display_name }))
      : [];
  }, [taxonomy, selectedBoard]);

  if (loading) {
    return (
      <AdminShell>
        <div className="py-24 text-center space-y-3">
          <span className="w-8 h-8 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin inline-block" />
          <p className="text-xs text-neutral-500 font-bold">Loading timetable schedules...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-4">
        {/* ── Page Header & Link Summary ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Schedule Manager
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Live class timetable for {cohortDisplayName}
            </p>
          </div>

          {/* Link Status Pill Summary */}
          <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                linkSummary.missing > 0
                  ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
              }`}
            >
              {linkSummary.missing > 0 ? (
                <AlertCircle size={14} className="text-amber-600 dark:text-amber-400" />
              ) : (
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              )}
              <span>
                {linkSummary.withLink} of {linkSummary.total} classes have links
              </span>
            </div>

            {/* One-click "Fix missing links" filter toggle */}
            {linkSummary.missing > 0 && (
              <button
                type="button"
                onClick={() => setOnlyMissingLinks(!onlyMissingLinks)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                  onlyMissingLinks
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/60 dark:hover:bg-amber-900 dark:text-amber-300'
                }`}
              >
                <span>{onlyMissingLinks ? 'Showing missing links' : `Fix ${linkSummary.missing} missing links`}</span>
                {onlyMissingLinks && <X size={12} />}
              </button>
            )}
          </div>
        </div>

        <NotificationPermissionBanner role="admin" />

        {/* Cancellation news broadcast banner */}
        {showPublishBanner && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <Megaphone size={14} className="text-blue-600 dark:text-blue-400 shrink-0 animate-bounce" />
            <span>Class cancellation notice published to student announcements.</span>
          </div>
        )}

        {/* ── Compact Consolidated Toolbar ── */}
        <div className="bg-white dark:bg-[#18181B] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          {/* Mobile / Tablet Filter Button */}
          <div className="lg:hidden flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowMobileFilterSheet(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700"
            >
              <Filter size={13} />
              <span>Filters ({activeBoardLabel}, Gr. {selectedGrade})</span>
            </button>
          </div>

          {/* Desktop Single-Row Filter Strip (Hidden on mobile/tablet) */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap">
            {/* Board Dropdown */}
            <select
              value={selectedBoard}
              onChange={(e) => {
                setSelectedBoard(e.target.value);
                setSelectedGrade('10');
                setSelectedStream('all');
              }}
              className="text-xs font-bold px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              {BOARDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>

            {/* Grade Segmented Control */}
            {activeGrades.length > 0 && (
              <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-700">
                {activeGrades.map((g: any) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      setSelectedGrade(g.id);
                      setSelectedStream('all');
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      selectedGrade === g.id
                        ? 'bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    {g.id === 'ielts' ? 'IELTS' : `Gr. ${g.id}`}
                  </button>
                ))}
              </div>
            )}

            {/* Stream Selector (if applicable) */}
            {activeStreams.length > 0 && (
              <select
                value={selectedStream}
                onChange={(e) => setSelectedStream(e.target.value)}
                className="text-xs font-medium px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
              >
                <option value="all">All Streams</option>
                {activeStreams.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {/* Instructor Selector */}
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="text-xs font-medium px-2.5 py-1.5 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
            >
              <option value="all">All Teachers</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>

            {/* Reset Button */}
            {(selectedBoard !== 'fbise' || selectedGrade !== '10' || teacherFilter !== 'all' || selectedStream !== 'all' || onlyMissingLinks) && (
              <button
                type="button"
                onClick={resetFilters}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg"
                title="Reset filters"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Select Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedSlotIds([]);
              }}
              className={`p-2 sm:px-3 sm:py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                selectionMode
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              }`}
            >
              <CheckSquare size={14} />
              <span className="hidden sm:inline">{selectionMode ? 'Exit Select' : 'Select'}</span>
            </button>

            {/* Primary Action: Schedule Class */}
            <button
              type="button"
              onClick={() => handleAddTrigger(0)}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-neutral-950 text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus size={15} />
              <span>Schedule Class</span>
            </button>

            {/* Overflow (...) Menu */}
            <div className="relative" ref={overflowMenuRef}>
              <button
                type="button"
                onClick={() => setOverflowMenuOpen(!overflowMenuOpen)}
                className="p-2 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
                title="More actions"
                aria-label="More actions"
              >
                <MoreVertical size={16} />
              </button>

              {overflowMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-40 w-52 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setClearScheduleModalOpen(true);
                    }}
                    disabled={filteredSlots.length === 0}
                    className="w-full text-left px-3.5 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-medium disabled:opacity-40"
                  >
                    <Trash2 size={13} />
                    <span>Clear Schedule ({filteredSlots.length})</span>
                  </button>

                  <div className="border-t border-neutral-100 dark:border-neutral-800 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setOverflowMenuOpen(false);
                      setOnlyMissingLinks(!onlyMissingLinks);
                    }}
                    className="w-full text-left px-3.5 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-2"
                  >
                    <AlertCircle size={13} />
                    <span>{onlyMissingLinks ? 'Show all classes' : 'Filter missing links'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selection Action Bar (when in multi-select mode) */}
        {selectionMode && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-blue-900 dark:text-blue-200">
                Selected: {selectedSlotIds.length} / {filteredSlots.length}
              </span>
              <button
                type="button"
                onClick={() => setSelectedSlotIds(filteredSlots.map((s) => s.id))}
                className="font-semibold text-blue-700 dark:text-blue-400 underline"
              >
                Select All
              </button>
              {selectedSlotIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSlotIds([])}
                  className="font-semibold text-neutral-500 hover:text-neutral-700 underline"
                >
                  Deselect
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {selectedSlotIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  <Trash2 size={12} />
                  <span>Delete Selected ({selectedSlotIds.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSelectionMode(false);
                  setSelectedSlotIds([]);
                }}
                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-700 dark:text-neutral-300 font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── Main Timetable Weekly Grid (Desktop / Tablet / Mobile) ── */}
        <WeeklyGrid
          slots={filteredSlots}
          sessionLinks={sessionLinksMap}
          conflictSlotIds={conflictSlotIds}
          onAddSlot={handleAddTrigger}
          onSelectSlot={handleSelectSlotForDetail}
          selectionMode={selectionMode}
          selectedSlotIds={selectedSlotIds}
          onToggleSelectSlot={(slotId) => {
            setSelectedSlotIds((prev) =>
              prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
            );
          }}
        />

        {/* ── Mobile Floating Action Button (FAB) for Scheduling ── */}
        {isMobile && !selectionMode && (
          <button
            type="button"
            onClick={() => handleAddTrigger(0)}
            className="fixed bottom-6 right-5 z-40 px-4 py-3 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-amber-400 dark:hover:bg-amber-300 dark:text-neutral-950 text-xs font-bold rounded-full shadow-xl flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Schedule</span>
          </button>
        )}

        {/* ── Mobile / Tablet Filter Bottom Sheet ── */}
        {showMobileFilterSheet && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          >
            <div className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                  <Filter size={16} />
                  <span>Filter Timetable</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMobileFilterSheet(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Board Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Board</label>
                <select
                  value={selectedBoard}
                  onChange={(e) => {
                    setSelectedBoard(e.target.value);
                    setSelectedGrade('10');
                    setSelectedStream('all');
                  }}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  {BOARDS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Grade Selector */}
              {activeGrades.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Grade</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {activeGrades.map((g: any) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setSelectedGrade(g.id);
                          setSelectedStream('all');
                        }}
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                          selectedGrade === g.id
                            ? 'bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        {g.id === 'ielts' ? 'IELTS' : `Gr. ${g.id}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stream Selector */}
              {activeStreams.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Stream</label>
                  <select
                    value={selectedStream}
                    onChange={(e) => setSelectedStream(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  >
                    <option value="all">All Streams</option>
                    {activeStreams.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Instructor Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Instructor</label>
                <select
                  value={teacherFilter}
                  onChange={(e) => setTeacherFilter(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                >
                  <option value="all">All Teachers</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bottom Sheet Actions */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    setShowMobileFilterSheet(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:underline"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilterSheet(false)}
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-neutral-900 text-white dark:bg-amber-400 dark:text-neutral-950"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Slot Detail & Quick-Action Drawer ── */}
        <SlotDetailDrawer
          open={!!activeSlotForDetail}
          onClose={() => setActiveSlotForDetail(null)}
          slot={activeSlotForDetail}
          sessionLink={activeSlotForDetail ? sessionLinksMap[activeSlotForDetail.id] : null}
          teachers={teachers}
          onEditFullSlot={handleEditFullSlotFromDetail}
          onOpenLinkModal={(slot) => {
            setSlotForLinkModal(slot);
            setLinkModalOpen(true);
          }}
          onToggleCancel={handleToggleCancel}
          onDeleteSlot={handleDeleteTrigger}
          onRefreshData={async () => {
            await Promise.all([loadData(), fetchSessionLinks()]);
          }}
        />

        {/* ── Full Add / Edit / Duplicate Drawer (SlotForm) ── */}
        <AdminDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedSlot(null);
            setEditingSlotId(null);
            setIsDuplicateMode(false);
            setSourceDuplicateSlot(null);
          }}
          title={
            isDuplicateMode
              ? 'Duplicate Class to Multiple Days'
              : editingSlotId
              ? 'Edit Class Slot'
              : 'Schedule New Class'
          }
        >
          <SlotForm
            key={isDuplicateMode ? `dup-${sourceDuplicateSlot?.id || 'active'}` : editingSlotId || 'new'}
            slot={selectedSlot}
            offerings={offerings}
            taxonomy={taxonomy}
            existingSlots={slots}
            defaultClassId={activeClass?.id || ''}
            defaultStreamId={selectedStream || ''}
            isDuplicateMode={isDuplicateMode}
            onSave={handleSaveSlot}
            onDuplicate={() => {
              if (!selectedSlot) return;
              setIsDuplicateMode(true);
              setSourceDuplicateSlot(selectedSlot);
              setEditingSlotId(null);
              setSelectedSlot({ ...selectedSlot, id: undefined } as any);
              toast.info('Duplicate mode active: select target days.');
            }}
            onCancelDuplicate={() => {
              if (sourceDuplicateSlot) {
                setSelectedSlot(sourceDuplicateSlot);
                setEditingSlotId(sourceDuplicateSlot.id);
                setIsDuplicateMode(false);
                setSourceDuplicateSlot(null);
              } else {
                setDrawerOpen(false);
              }
            }}
            onCancel={() => setDrawerOpen(false)}
          />
        </AdminDrawer>

        {/* ── Safe Clear Cohort Schedule Dialog (Requires Typed Cohort Name) ── */}
        <ClearScheduleDialog
          open={clearScheduleModalOpen}
          onClose={() => setClearScheduleModalOpen(false)}
          onConfirm={handleConfirmClearSchedule}
          cohortName={cohortDisplayName}
          slotCount={filteredSlots.length}
        />

        {/* ── Delete Confirmation Modal ── */}
        <ConfirmModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSlotToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Class Slot?"
          description="This will permanently delete this class slot from the timetable."
          confirmLabel="Delete Slot"
          danger
        />

        {/* ── Cancel Class Lecture Confirmation Modal ── */}
        <ConfirmModal
          open={cancelModalOpen}
          onClose={() => {
            setCancelModalOpen(false);
            setSlotToCancel(null);
          }}
          onConfirm={handleConfirmCancel}
          title="Cancel Class Lecture?"
          description="Are you sure you want to cancel this class session? It will appear as cancelled on student timetables."
          confirmLabel="Cancel Lecture"
          danger
        >
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              id="notifyCancelCheck"
              checked={notifyCancel}
              onChange={(e) => setNotifyCancel(e.target.checked)}
              className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
            />
            <label htmlFor="notifyCancelCheck" className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 cursor-pointer">
              Notify enrolled students via announcement
            </label>
          </div>
        </ConfirmModal>

        {/* ── Move Class Slot Confirmation Modal ── */}
        <ConfirmModal
          open={moveModalOpen}
          onClose={() => {
            setMoveModalOpen(false);
            setPendingMoveData(null);
          }}
          onConfirm={async () => {
            if (pendingMoveData) {
              await executeSaveSlot(pendingMoveData);
            }
          }}
          title="Move Class Session?"
          description={
            selectedSlot && pendingMoveData
              ? `Move class from ${DAYS_OF_WEEK_FULL[selectedSlot.day_of_week]} to ${DAYS_OF_WEEK_FULL[pendingMoveData.day_of_week]}?`
              : 'Move this class session?'
          }
          confirmLabel="Move Class"
        />

        {/* ── Schedule Conflict Warning Modal ── */}
        <ScheduleConflictModal
          conflict={conflictData}
          allSlots={slots}
          onResolve={async (data) => {
            setConflictData(null);
            await executeSaveSlot(data);
          }}
          onConfirmAnyway={async (data) => {
            setConflictData(null);
            await executeSaveSlot(data);
          }}
          onCancel={() => setConflictData(null)}
        />

        {/* ── Bulk Delete Confirmation Modal ── */}
        <ConfirmModal
          open={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          onConfirm={handleConfirmBulkDelete}
          title={`Delete ${selectedSlotIds.length} Selected Slots?`}
          description="Are you sure you want to permanently delete these selected slots?"
          confirmLabel={`Delete ${selectedSlotIds.length} Slots`}
          danger
        />

        {/* ── Advanced Class Link & Substitute Teacher Modal ── */}
        <AdminClassLinkModal
          open={linkModalOpen}
          onClose={() => {
            setLinkModalOpen(false);
            setSlotForLinkModal(null);
          }}
          slot={slotForLinkModal}
          teachers={teachers}
          onLinkUpdated={async () => {
            await Promise.all([loadData(), fetchSessionLinks()]);
          }}
        />
      </div>
    </AdminShell>
  );
};

export default ScheduleManagerPage;
