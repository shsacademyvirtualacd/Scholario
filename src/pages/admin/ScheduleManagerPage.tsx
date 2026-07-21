import React, { useState, useEffect } from 'react';
import { Plus, Filter, RotateCcw, Megaphone, Trash2, CheckSquare } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import WeeklyGrid from '../../components/admin/schedule/WeeklyGrid';
import AdminDrawer from '../../components/admin/AdminDrawer';
import SlotForm from '../../components/admin/schedule/SlotForm';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { getAllSlots, getAllOfferings, getAllTeachers, upsertSlot, deleteSlot, deleteSlots, getTaxonomy, createAnnouncement } from '../../lib/db';
import { getSubjectsForStream } from '../../lib/db';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { toast } from 'sonner';
import { useMobile } from '../../hooks/useMobile';
import type { ClassSlot, ClassOffering, Teacher } from '../../types';

const BOARDS = [
  { id: 'fbise', label: 'FBISE' },
];

export const ScheduleManagerPage: React.FC = () => {
  const isMobile = useMobile();
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [taxonomy, setTaxonomy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSlot, setSelectedSlot] = useState<ClassSlot | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState<string | null>(null);
  const [notifyCancel, setNotifyCancel] = useState(true);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [pendingMoveData, setPendingMoveData] = useState<any>(null);
  const [clearScheduleModalOpen, setClearScheduleModalOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);

  // Filters - default to Grade 10 class-wise view for better usability
  const [selectedBoard, setSelectedBoard] = useState<string>('fbise');
  const [selectedGrade, setSelectedGrade] = useState<string>('10');
  const [selectedStream, setSelectedStream] = useState<string>('');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [showPublishBanner, setShowPublishBanner] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, o, t, tax] = await Promise.all([
        getAllSlots(),
        getAllOfferings(),
        getAllTeachers(),
        getTaxonomy()
      ]);
      setSlots(s);
      setOfferings(o);
      setTeachers(t);
      setTaxonomy(tax);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-select the first available stream whenever taxonomy loads or the grade changes.
  // This replaces the old manual setSelectedStream('all') calls and ensures the filter
  // is never left in an ambiguous empty state.
  useEffect(() => {
    if (!taxonomy) return;
    const cls = taxonomy.classes.find(
      (c: any) => c.grade === selectedGrade && c.board_id === selectedBoard
    );
    const streams = cls
      ? taxonomy.streams.filter((s: any) => s.class_id === cls.id)
      : [];
    setSelectedStream(streams.length > 0 ? streams[0].id : '');
  }, [taxonomy, selectedGrade, selectedBoard]);

  useRealtimeTable({
    table: 'class_slots',
    onAny: async () => {
      const s = await getAllSlots();
      setSlots(s);
    }
  });

  // Enrich raw slots with offering and teacher details for rendering
  const enrichedSlots = slots.map((slot) => {
    const offering = offerings.find((o) => o.id === slot.offering_id);
    const teacher = offering ? teachers.find((t) => t.id === offering.teacher_id) : undefined;
    return {
      ...slot,
      offering: offering ? { ...offering, teacher } : undefined,
    };
  });

  const activeClass = taxonomy?.classes?.find((c: any) => c.grade === selectedGrade && c.board_id === selectedBoard);
  const activeStreams = activeClass
    ? taxonomy.streams.filter((s: any) => s.class_id === activeClass.id)
    : [];

  // Apply active class-wise and teacher filters
  const filteredSlots = enrichedSlots.filter((slot) => {
    // 1. Grade match
    const slotGrade = slot.offering?.grade || taxonomy?.classes?.find((c: any) => c.id === slot.class_id)?.grade;
    const gradeMatch = selectedGrade === 'all' || String(slotGrade) === String(selectedGrade);

    // 2. Board match
    const slotBoard = slot.offering?.board || taxonomy?.classes?.find((c: any) => c.id === slot.class_id)?.board_id;
    const boardMatch = selectedBoard === 'all' || slotBoard === selectedBoard;

    // 3. Teacher match
    const slotTeacherId = slot.offering?.teacher_id;
    const teacherMatch = teacherFilter === 'all' || slotTeacherId === teacherFilter;

    // 4. Stream match
    let streamMatch = true;
    if (selectedStream && selectedStream !== '') {
      if (slot.offering_id && slot.offering) {
        // Match explicit stream_id first
        if (slot.offering.stream_id === selectedStream) {
          streamMatch = true;
        } else {
          const activeStreamName = activeStreams.find((s: any) => s.id === selectedStream)?.name || taxonomy?.streams?.find((s: any) => s.id === selectedStream)?.name;
          if (activeStreamName && slotGrade) {
            const streamSubjects = getSubjectsForStream(slotGrade, activeStreamName);
            const offeringSubject = slot.offering.subject_name || slot.offering.subject?.name;
            streamMatch = streamSubjects ? streamSubjects.includes(offeringSubject) : false;
          } else {
            streamMatch = false;
          }
        }
      } else {
        // If it's a schedule-only slot, match stream_id directly. If stream_id is null, it's common.
        streamMatch = !slot.stream_id || slot.stream_id === selectedStream;
      }
    }

    return boardMatch && gradeMatch && teacherMatch && streamMatch;
  });

  // Handle drawer save (Add / Edit)
  const handleSaveSlot = async (formData: {
    offering_id: string | null;
    custom_title?: string | null;
    class_id?: string | null;
    stream_id?: string | null;
    day_of_week: number;
    start_time: string;
    end_time: string;
    publish_to_news: boolean;
    notify_affected?: boolean;
  }) => {
    const isEditMode = !!editingSlotId;

    // Intercept move (when day or start time changes on an existing slot) with a confirmation modal
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
    const isEditMode = !!editingSlotId;
    const targetSlotId = isEditMode ? editingSlotId : undefined;
    
    try {
      await upsertSlot({
        id: targetSlotId,
        offering_id: formData.offering_id || null,
        custom_title: formData.custom_title || null,
        class_id: formData.class_id || null,
        stream_id: formData.stream_id || null,
        day_of_week: formData.day_of_week as any,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });

      // Reload slots
      await loadData();

      // Notify affected students if checked by admin alongside save
      if (formData.publish_to_news || formData.notify_affected) {
        const offering = offerings.find((o) => o.id === formData.offering_id);
        const subject = formData.custom_title || (offering ? (offering.subject_name || offering.subject?.name || 'Class') : 'Class');
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[formData.day_of_week];
        const timeStr = formData.start_time.slice(0, 5);

        const targetClassId = formData.class_id || offering?.class_id || (offering as any)?.class?.id || taxonomy?.classes?.find((c: any) => String(c.grade) === String(selectedGrade))?.id;
        const targetStreamId = formData.stream_id && formData.stream_id !== 'all' ? formData.stream_id : (offering?.stream_id || null);

        await createAnnouncement({
          title: 'Schedule Update',
          body: `${subject} on ${dayName} at ${timeStr} has been ${isEditMode ? 'rescheduled' : 'scheduled'}.`,
          severity: 'crucial',
          scope: 'class',
          class_id: targetClassId || null,
          stream_id: targetStreamId || null,
        });
        setShowPublishBanner(true);
        setTimeout(() => setShowPublishBanner(false), 4000);
      }
      toast.success(isEditMode ? 'Class slot rescheduled.' : 'Class slot scheduled successfully.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to save class slot.');
    }

    setDrawerOpen(false);
    setSelectedSlot(null);
    setEditingSlotId(null);
    setPendingMoveData(null);
    setMoveModalOpen(false);
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
      await upsertSlot({
        ...slot,
        is_cancelled: false,
      });
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
        const subject = slot.custom_title || (offering ? (offering.subject_name || offering.subject?.name || 'Class') : 'Class');
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[slot.day_of_week];
        const timeStr = slot.start_time.slice(0, 5);

        const targetClassId = slot.class_id || offering?.class_id || (offering as any)?.class?.id || taxonomy?.classes?.find((c: any) => String(c.grade) === String(selectedGrade))?.id;

        await createAnnouncement({
          title: 'Class Cancellation',
          body: `${subject} on ${dayName} at ${timeStr} has been cancelled.`,
          severity: 'crucial',
          scope: 'class',
          class_id: targetClassId || null,
          stream_id: slot.stream_id && slot.stream_id !== 'all' ? slot.stream_id : (offering?.stream_id || null),
        });
        setShowPublishBanner(true);
        setTimeout(() => setShowPublishBanner(false), 4000);
      }
      toast.success('Class slot marked as cancelled.');
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to cancel class slot.');
      throw err;
    } finally {
      setSlotToCancel(null);
    }
  };

  // Delete flow triggers modal
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
        throw err;
      } finally {
        setSlotToDelete(null);
      }
    }
  };

  // Clear entire week's schedule for currently filtered cohort
  const handleConfirmClearSchedule = async () => {
    const targetIds = filteredSlots.map((s) => s.id);
    if (targetIds.length === 0) return;

    try {
      await deleteSlots(targetIds);
      await loadData();
      toast.success(`Cleared ${targetIds.length} class slots from the schedule.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to clear schedule.');
      throw err;
    } finally {
      setClearScheduleModalOpen(false);
    }
  };

  // Toggle individual slot selection
  const handleToggleSelectSlot = (slotId: string) => {
    setSelectedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  // Select all currently filtered slots
  const handleSelectAll = () => {
    const allIds = filteredSlots.map((s) => s.id);
    setSelectedSlotIds(allIds);
  };

  // Bulk delete selected slots
  const handleConfirmBulkDelete = async () => {
    if (selectedSlotIds.length === 0) return;
    try {
      await deleteSlots(selectedSlotIds);
      await loadData();
      toast.success(`Deleted ${selectedSlotIds.length} selected class slots.`);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to delete selected slots.');
      throw err;
    } finally {
      setSelectedSlotIds([]);
      setBulkDeleteModalOpen(false);
      setSelectionMode(false);
    }
  };

  // Drawer triggers
  const handleAddTrigger = (dayOfWeekIndex: number = 0) => {
    setEditingSlotId(null);
    setSelectedSlot(null);
    setDrawerOpen(true);
    const newSlotTemplate: Partial<ClassSlot> = {
      offering_id: '',
      day_of_week: dayOfWeekIndex as any,
      start_time: '16:00:00',
      end_time: '17:30:00',
    };
    setSelectedSlot(newSlotTemplate as any);
  };

  const handleEditTrigger = (slot: ClassSlot) => {
    setEditingSlotId(slot.id);
    setSelectedSlot(slot);
    setDrawerOpen(true);
  };

  const handleDuplicateTrigger = () => {
    if (!selectedSlot) return;
    setEditingSlotId(null);
    const dupTemplate: Partial<ClassSlot> = {
      ...selectedSlot,
      id: undefined,
    };
    setSelectedSlot(dupTemplate as any);
    toast.info('Switched to Duplicate mode. Pick a day and click Add Class Slot.');
  };

  const resetFilters = () => {
    setSelectedBoard('fbise');
    setSelectedGrade('10');
    // selectedStream is reset automatically by the auto-select useEffect
    setTeacherFilter('all');
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoard(boardId);
    setSelectedGrade('10'); // Default to grade 10; stream auto-selected by effect
  };

  const handleGradeChange = (gradeId: string) => {
    setSelectedGrade(gradeId);
    // selectedStream is reset automatically by the auto-select useEffect
  };

  const activeGrades = taxonomy
    ? taxonomy.classes
        .filter((c: any) => c.board_id === 'fbise')
        .map((c: any) => ({ id: c.grade, label: c.display_name }))
    : [];



  if (loading) {
    return (
      <AdminShell>
        <div className="py-24 text-center">
          <span className="w-8 h-8 border-4 border-[#111111]/10 border-t-[#111111] rounded-full animate-spin inline-block mb-3" />
          <p className="text-xs text-[#737373] font-bold">Loading timetable slots...</p>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Schedule Manager"
          description="Build and manage class timetables, adjust timing slots, or cancel specific lectures."
        />
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center flex-wrap">
          <button
            onClick={() => {
              setSelectionMode(!selectionMode);
              if (selectionMode) setSelectedSlotIds([]);
            }}
            className={`btn flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all interactive ${
              selectionMode
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5]'
            }`}
          >
            <CheckSquare size={14} />
            <span>{selectionMode ? 'Exit Select' : 'Select'}</span>
          </button>
          {filteredSlots.length > 0 && (
            <button
              onClick={() => setClearScheduleModalOpen(true)}
              className="btn flex items-center justify-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl shadow-sm transition-all interactive"
              title="Remove all scheduled class slots for the current cohort view"
            >
              <Trash2 size={14} />
              <span>Clear Schedule ({filteredSlots.length})</span>
            </button>
          )}
          <button
            onClick={() => handleAddTrigger(0)}
            className="btn flex items-center justify-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#262626] text-white text-xs font-bold rounded-xl shadow-sm interactive"
          >
            <Plus size={14} />
            Schedule Class
          </button>
        </div>
      </div>

      {/* Published to News Notification Toast */}
      {showPublishBanner && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
          <Megaphone size={14} className="text-blue-600 shrink-0 animate-bounce" />
          <span className="text-xs font-bold text-blue-800">
            Timetable modification has been published to the student news announcements board!
          </span>
        </div>
      )}

      {/* ── Filter Bar ── */}
      {isMobile ? (
        /* Mobile: stacked compact filter card */
        <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-sm overflow-hidden">
          {/* Board row */}
          <div className="flex items-center gap-3 px-4 pt-3 pb-2 border-b border-[#F0F0F0]">
            <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide shrink-0">Board:</span>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {BOARDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleBoardChange(b.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all shrink-0 ${
                    selectedBoard === b.id
                      ? 'bg-[#F4C430] border-[#F4C430] text-[#111111]'
                      : 'bg-[#FAFAFA] border-[#E5E5E5] text-[#737373]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grade row */}
          {activeGrades.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#F0F0F0] overflow-x-auto no-scrollbar">
              <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide shrink-0">Grade:</span>
              {activeGrades.map((g: any) => (
                <button
                  key={g.id}
                  onClick={() => handleGradeChange(g.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all shrink-0 ${
                    selectedGrade === g.id
                      ? 'bg-[#111111] border-[#111111] text-white'
                      : 'bg-white border-[#E5E5E5] text-[#525252]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {/* Stream row */}
          {activeStreams.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#F0F0F0] overflow-x-auto no-scrollbar bg-[#FAFAFA]">
              <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide shrink-0">Stream:</span>
              {activeStreams.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStream(s.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all shrink-0 ${
                    selectedStream === s.id
                      ? 'bg-[#111111] border-[#111111] text-white'
                      : 'bg-white border-[#E5E5E5] text-[#525252]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}

          {/* Instructor + Reset row */}
          <div className="flex items-center gap-2 px-4 py-2.5">
            <Filter size={11} className="text-[#A3A3A3] shrink-0" />
            <span className="text-[10px] font-bold text-[#737373] shrink-0">Instructor:</span>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="input flex-1 py-1.5 px-2.5 text-[11px] bg-white border-[#E5E5E5] rounded-lg cursor-pointer"
            >
              <option value="all">All Tutors</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
            {(selectedBoard !== 'fbise' || selectedGrade !== '10' || teacherFilter !== 'all') && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-0.5 text-[10px] font-black text-amber-600 hover:text-[#111111] shrink-0 interactive"
              >
                <RotateCcw size={10} />
                Reset
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Desktop: original tab + filter bar layout */
        <>
          <div className="border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex overflow-x-auto gap-6 border-transparent">
              {BOARDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleBoardChange(b.id)}
                  className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
                    selectedBoard === b.id
                      ? 'border-[#F4C430] text-[#111111]'
                      : 'border-transparent text-[#737373] hover:text-[#111111]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pb-2 sm:pb-0">
              <div className="flex items-center gap-1 text-[11px] font-bold text-[#737373]">
                <Filter size={12} />
                <span>Instructor:</span>
              </div>
              <select
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
                className="input py-1 px-2.5 text-[10px] bg-white border-[#E5E5E5] rounded-md cursor-pointer"
              >
                <option value="all">All Tutors</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.full_name}</option>
                ))}
              </select>
              {(selectedBoard !== 'fbise' || selectedGrade !== '10' || teacherFilter !== 'all') && (
                <button
                  onClick={resetFilters}
                  className="text-[10px] font-black text-amber-600 hover:text-[#111111] flex items-center gap-0.5 interactive"
                >
                  <RotateCcw size={10} />
                  Reset
                </button>
              )}
            </div>
          </div>

          {activeGrades.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 py-2.5 bg-[#FAFAFA] px-4 border-b border-[#E5E5E5]">
              <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide mr-2">Cohort Grade:</span>
              {activeGrades.map((g: any) => (
                <button
                  key={g.id}
                  onClick={() => handleGradeChange(g.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    selectedGrade === g.id
                      ? 'bg-[#111111] border-[#111111] text-white'
                      : 'bg-white border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {activeStreams.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 py-2 bg-[#F9F9F9] px-4 border-b border-[#E5E5E5] transition-all duration-250 animate-in slide-in-from-top-1">
              <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide mr-2">Stream:</span>
              {activeStreams.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStream(s.id)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                    selectedStream === s.id
                      ? 'bg-[#111111] border-[#111111] text-white'
                      : 'bg-white border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Selection Action Bar */}
      {selectionMode && (
        <div className="p-3.5 bg-blue-50/90 border border-blue-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-blue-950 uppercase tracking-wider">
              Selected: {selectedSlotIds.length} / {filteredSlots.length}
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs font-bold text-blue-700 hover:text-blue-900 underline interactive"
            >
              Select All
            </button>
            {selectedSlotIds.length > 0 && (
              <button
                onClick={() => setSelectedSlotIds([])}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 underline interactive"
              >
                Deselect All
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedSlotIds.length > 0 && (
              <button
                onClick={() => setBulkDeleteModalOpen(true)}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all interactive"
              >
                <Trash2 size={13} />
                <span>Delete Selected ({selectedSlotIds.length})</span>
              </button>
            )}
            <button
              onClick={() => {
                setSelectionMode(false);
                setSelectedSlotIds([]);
              }}
              className="px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl interactive"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Timetable Weekly Columns */}
      <WeeklyGrid
        slots={filteredSlots}
        onAddSlot={handleAddTrigger}
        onEdit={handleEditTrigger}
        onDelete={handleDeleteTrigger}
        onToggleCancel={handleToggleCancel}
        selectionMode={selectionMode}
        selectedSlotIds={selectedSlotIds}
        onToggleSelectSlot={handleToggleSelectSlot}
      />

      {/* Add / Edit Drawer */}
      <AdminDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSlot(null);
          setEditingSlotId(null);
        }}
        title={editingSlotId ? 'Edit Class Slot' : 'Schedule New Class'}
      >
        <SlotForm
          key={editingSlotId || 'new'}
          slot={selectedSlot}
          offerings={offerings}
          taxonomy={taxonomy}
          defaultClassId={activeClass?.id || ''}
          defaultStreamId={selectedStream || ''}
          onSave={handleSaveSlot}
          onDuplicate={handleDuplicateTrigger}
          onCancel={() => {
            setDrawerOpen(false);
            setSelectedSlot(null);
            setEditingSlotId(null);
          }}
        />
      </AdminDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSlotToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Class Slot?"
        description="This will permanently delete this class slot from the timetable. All student schedules and attendance records linked to this specific slot might be affected."
        confirmLabel="Delete Slot"
        danger
      />

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        open={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSlotToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
        title="Cancel Class Session?"
        description="Are you sure you want to cancel this class session? It will appear as cancelled on student timetables."
        confirmLabel="Cancel Class"
        danger
      >
        <div className="flex items-center gap-2.5 mt-2">
          <input
            type="checkbox"
            id="notifyCancelCheck"
            checked={notifyCancel}
            onChange={(e) => setNotifyCancel(e.target.checked)}
            className="w-4.5 h-4.5 text-[#ef4444] border-gray-300 rounded focus:ring-[#ef4444] cursor-pointer"
          />
          <label htmlFor="notifyCancelCheck" className="text-xs font-bold text-[#111111] cursor-pointer selection:bg-transparent">
            Notify affected students via announcement
          </label>
        </div>
      </ConfirmModal>

      {/* Move Confirmation Modal */}
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
            ? `This will move this class from ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedSlot.day_of_week]} to ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pendingMoveData.day_of_week]}. The session on ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][selectedSlot.day_of_week]} will be relocated. Continue?`
            : 'Are you sure you want to move this class session?'
        }
        confirmLabel="Move Class Slot"
      />

      {/* Clear Cohort Schedule Confirmation Modal */}
      <ConfirmModal
        open={clearScheduleModalOpen}
        onClose={() => setClearScheduleModalOpen(false)}
        onConfirm={handleConfirmClearSchedule}
        title={`Clear Schedule for Grade ${selectedGrade}${activeStreams.find((s: any) => s.id === selectedStream) ? ` (${activeStreams.find((s: any) => s.id === selectedStream)?.name})` : ''}?`}
        description={`This will permanently delete all ${filteredSlots.length} scheduled class slots for this cohort view from the timetable. All student schedules and attendance records linked to these slots will be affected.`}
        confirmLabel={`Delete ${filteredSlots.length} Class Slots`}
        danger
      />

      {/* Multi-Select Bulk Delete Confirmation Modal */}
      <ConfirmModal
        open={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        onConfirm={handleConfirmBulkDelete}
        title={`Delete ${selectedSlotIds.length} Selected Class Slots?`}
        description={`You are about to permanently delete the following ${selectedSlotIds.length} scheduled slots from the timetable:`}
        confirmLabel={`Delete ${selectedSlotIds.length} Slots`}
        danger
      >
        <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium mt-2">
          {filteredSlots
            .filter((s) => selectedSlotIds.includes(s.id))
            .map((s) => {
              const subject = s.custom_title || s.offering?.subject_name || s.offering?.subject || 'Class';
              const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              const dayName = dayNames[s.day_of_week];
              const timeStr = s.start_time ? s.start_time.slice(0, 5) : '16:00';
              return (
                <div key={s.id} className="flex justify-between items-center py-1 border-b border-gray-200/60 last:border-0 text-gray-800">
                  <span className="font-bold text-gray-900">{subject}</span>
                  <span className="text-gray-600 font-semibold">{dayName} ({timeStr})</span>
                </div>
              );
            })}
        </div>
      </ConfirmModal>
    </AdminShell>
  );
};

export default ScheduleManagerPage;
