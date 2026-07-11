import React, { useState, useEffect } from 'react';
import { Plus, Filter, RotateCcw, Megaphone } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import WeeklyGrid from '../../components/admin/schedule/WeeklyGrid';
import AdminDrawer from '../../components/admin/AdminDrawer';
import SlotForm from '../../components/admin/schedule/SlotForm';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { getAllSlots, getAllOfferings, getAllTeachers, upsertSlot, deleteSlot, getTaxonomy, createAnnouncement } from '../../lib/db';
import { getSubjectsForStream } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { ClassSlot, ClassOffering, Teacher } from '../../types';

const BOARDS = [
  { id: 'fbise', label: 'FBISE' },
];

export const ScheduleManagerPage: React.FC = () => {
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [taxonomy, setTaxonomy] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [selectedSlot, setSelectedSlot] = useState<ClassSlot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [slotToCancel, setSlotToCancel] = useState<string | null>(null);
  const [notifyCancel, setNotifyCancel] = useState(true);

  // Filters - default to Grade 10 class-wise view for better usability
  const [selectedBoard, setSelectedBoard] = useState<string>('fbise');
  const [selectedGrade, setSelectedGrade] = useState<string>('10');
  const [selectedStream, setSelectedStream] = useState<string>('all');
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
    if (selectedStream !== 'all') {
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
    const isEditMode = !!(selectedSlot && selectedSlot.id);
    
    try {
      await upsertSlot({
        id: isEditMode ? selectedSlot!.id : undefined,
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
    } catch (err) {
      console.error(err);
    }

    setDrawerOpen(false);
    setSelectedSlot(null);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    } finally {
      setCancelModalOpen(false);
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
      } catch (err) {
        console.error(err);
      }
      setSlotToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  // Drawer triggers
  const handleAddTrigger = (dayOfWeekIndex: number = 0) => {
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
    setSelectedSlot(slot);
    setDrawerOpen(true);
  };

  const resetFilters = () => {
    setSelectedBoard('fbise');
    setSelectedGrade('10');
    setSelectedStream('all');
    setTeacherFilter('all');
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoard(boardId);
    setSelectedGrade('all'); // Show all grades for that board initially
    setSelectedStream('all');
  };

  const handleGradeChange = (gradeId: string) => {
    setSelectedGrade(gradeId);
    setSelectedStream('all'); // Reset stream when grade changes
  };

  const activeGrades = taxonomy
    ? [
        ...taxonomy.classes
          .filter((c: any) => c.board_id === 'fbise')
          .map((c: any) => ({ id: c.grade, label: c.display_name })),
        { id: 'all', label: 'All FBISE' }
      ]
    : [];

  // Compute offerings specifically for the Add/Edit drawer context based on active grade & stream tabs
  const targetGrade = (selectedSlot && selectedSlot.id)
    ? (selectedSlot.offering?.grade || taxonomy?.classes?.find((c: any) => c.id === selectedSlot.class_id)?.grade || selectedGrade)
    : selectedGrade;

  const targetStreamId = (selectedSlot && selectedSlot.id)
    ? (selectedSlot.offering?.stream_id || selectedSlot.stream_id || selectedStream)
    : selectedStream;

  const filteredOfferingsForDrawer = offerings.filter((offering) => {
    // Always include currently selected slot's offering when editing so it is never hidden
    if (selectedSlot && selectedSlot.id && offering.id === selectedSlot.offering_id) {
      return true;
    }

    // Filter by grade if targetGrade is specified and not 'all'
    const offeringGrade = offering.grade || taxonomy?.classes?.find((c: any) => c.id === offering.class_id)?.grade;
    if (targetGrade && targetGrade !== 'all' && String(offeringGrade) !== String(targetGrade)) {
      return false;
    }

    // Filter by board if selectedBoard is not 'all'
    const offeringBoard = offering.board || taxonomy?.classes?.find((c: any) => c.id === offering.class_id)?.board_id;
    if (selectedBoard !== 'all' && offeringBoard !== selectedBoard) {
      return false;
    }

    // Filter by stream if targetStreamId is specified and not 'all'
    if (targetStreamId && targetStreamId !== 'all') {
      const activeStreamObj = activeStreams.find((s: any) => s.id === targetStreamId) || taxonomy?.streams?.find((s: any) => s.id === targetStreamId);
      if (activeStreamObj && targetGrade) {
        const streamSubjects = getSubjectsForStream(targetGrade, activeStreamObj.name) || [];
        const offeringSubject = offering.subject_name || offering.subject?.name;
        if (offering.stream_id === targetStreamId || (streamSubjects && streamSubjects.includes(offeringSubject))) {
          return true;
        }
        return false;
      }
      return offering.stream_id === targetStreamId || !offering.stream_id;
    }

    return true;
  });

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
        <button
          onClick={() => handleAddTrigger(0)}
          className="btn flex items-center justify-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#262626] text-white text-xs font-bold rounded-xl shadow-sm shrink-0 self-start sm:self-center"
        >
          <Plus size={14} />
          Schedule Class
        </button>
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

      {/* Class Profiles Filter Bar (Tabs Layout) - Board Selection */}
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

        {/* Secondary filters (Teacher) */}
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
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>

          {(selectedBoard !== 'fbise' || selectedGrade !== '10' || selectedStream !== 'all' || teacherFilter !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-[10px] font-black text-amber-600 hover:text-[#111111] flex items-center gap-0.5"
            >
              <RotateCcw size={10} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Grade Sub-row filter - Extremely user-friendly and class-wise */}
      {activeGrades.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 py-2.5 bg-[#FAFAFA] px-4 border-b border-[#E5E5E5]">
          <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide mr-2">Cohort Grade:</span>
          {activeGrades.map((g) => (
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

      {/* Stream Sub-row filter if grade is selected */}
      {selectedGrade !== 'all' && activeStreams.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 py-2 bg-[#F9F9F9] px-4 border-b border-[#E5E5E5] transition-all duration-250 animate-in slide-in-from-top-1">
          <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide mr-2">Stream Cohort:</span>
          <button
            onClick={() => setSelectedStream('all')}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
              selectedStream === 'all'
                ? 'bg-[#F4C430] border-[#F4C430] text-[#111111]'
                : 'bg-white border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]'
            }`}
          >
            All Stream Schedules
          </button>
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
              {s.name} Stream
            </button>
          ))}
        </div>
      )}

      {/* Timetable Weekly Columns */}
      <WeeklyGrid
        slots={filteredSlots}
        onAddSlot={handleAddTrigger}
        onEdit={handleEditTrigger}
        onDelete={handleDeleteTrigger}
        onToggleCancel={handleToggleCancel}
      />

      {/* Add / Edit Drawer */}
      <AdminDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedSlot(null);
        }}
        title={selectedSlot && selectedSlot.id ? 'Edit Class Slot' : 'Schedule New Class'}
      >
        <SlotForm
          slot={selectedSlot}
          offerings={filteredOfferingsForDrawer}
          taxonomy={taxonomy}
          defaultClassId={activeClass?.id || ''}
          defaultStreamId={selectedStream !== 'all' ? selectedStream : ''}
          onSave={handleSaveSlot}
          onCancel={() => {
            setDrawerOpen(false);
            setSelectedSlot(null);
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
    </AdminShell>
  );
};

export default ScheduleManagerPage;
