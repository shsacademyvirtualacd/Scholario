import React, { useState, useEffect } from 'react';
import { Plus, Calendar, Filter, RotateCcw, Megaphone } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import WeeklyGrid from '../../components/admin/schedule/WeeklyGrid';
import AdminDrawer from '../../components/admin/AdminDrawer';
import SlotForm from '../../components/admin/schedule/SlotForm';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { MOCK_ANNOUNCEMENTS } from '../../lib/mockData';
import { getAllSlots, getAllOfferings, getAllTeachers, upsertSlot, deleteSlot } from '../../lib/db';
import type { ClassSlot, ClassOffering, Teacher } from '../../types';

const BOARDS = [
  { id: 'fbise', label: 'FBISE' },
  { id: 'local', label: 'BISE (Local Board)' },
  { id: 'o_level', label: 'O Level' },
  { id: 'a_level', label: 'A Level' },
  { id: 'all', label: 'All Boards' },
];

const GRADES_BY_BOARD: Record<string, { id: string; label: string }[]> = {
  fbise: [
    { id: '9', label: 'Grade 9' },
    { id: '10', label: 'Grade 10' },
    { id: '11', label: 'Grade 11' },
    { id: '12', label: 'Grade 12' },
    { id: 'all', label: 'All Grades' },
  ],
  local: [
    { id: '9', label: 'Grade 9' },
    { id: '10', label: 'Grade 10' },
    { id: '11', label: 'Grade 11' },
    { id: '12', label: 'Grade 12' },
    { id: 'all', label: 'All Grades' },
  ],
  o_level: [
    { id: 'o1', label: 'O1' },
    { id: 'o2', label: 'O2' },
    { id: 'all', label: 'All O Levels' },
  ],
  a_level: [
    { id: 'as', label: 'AS' },
    { id: 'a2', label: 'A2' },
    { id: 'all', label: 'All A Levels' },
  ],
};

export const ScheduleManagerPage: React.FC = () => {
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSlot, setSelectedSlot] = useState<ClassSlot | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<string | null>(null);

  // Filters - default to Grade 10 class-wise view for better usability
  const [selectedBoard, setSelectedBoard] = useState<string>('fbise');
  const [selectedGrade, setSelectedGrade] = useState<string>('10');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [showPublishBanner, setShowPublishBanner] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, o, t] = await Promise.all([
        getAllSlots(),
        getAllOfferings(),
        getAllTeachers()
      ]);
      setSlots(s);
      setOfferings(o);
      setTeachers(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Enrich raw slots with offering and teacher details for rendering
  const enrichedSlots = slots.map((slot) => {
    const offering = offerings.find((o) => o.id === slot.offering_id);
    const teacher = offering ? teachers.find((t) => t.id === offering.teacher_id) : undefined;
    return {
      ...slot,
      offering: offering ? { ...offering, teacher } : undefined,
    };
  });

  // Apply active class-wise and teacher filters
  const filteredSlots = enrichedSlots.filter((slot) => {
    if (!slot.offering) return false;

    // 1. Board match
    const boardMatch = selectedBoard === 'all' || slot.offering.board === selectedBoard;

    // 2. Grade match
    const gradeMatch =
      selectedBoard === 'all' ||
      selectedGrade === 'all' ||
      slot.offering.grade === selectedGrade;

    // 3. Teacher match
    const teacherMatch = teacherFilter === 'all' || slot.offering.teacher_id === teacherFilter;

    return boardMatch && gradeMatch && teacherMatch;
  });

  // Handle drawer save (Add / Edit)
  const handleSaveSlot = async (formData: {
    offering_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    room_or_link: string;
    publish_to_news: boolean;
  }) => {
    const isEditMode = !!(selectedSlot && selectedSlot.id);
    
    try {
      const saved = await upsertSlot({
        id: isEditMode ? selectedSlot!.id : undefined,
        offering_id: formData.offering_id,
        day_of_week: formData.day_of_week as any,
        start_time: formData.start_time,
        end_time: formData.end_time,
        room_or_link: formData.room_or_link,
      });

      // Reload slots
      await loadData();

      // Publish to Student News Section if selected by admin
      if (formData.publish_to_news) {
        const offering = offerings.find((o) => o.id === formData.offering_id);
        const subject = offering ? offering.subject : 'Class';
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[formData.day_of_week];
        const timeStr = formData.start_time.slice(0, 5);

        const announcement = {
          id: `ann_${Date.now()}`,
          title: `${isEditMode ? 'Rescheduled' : 'New Class Scheduled'}: ${subject}`,
          content: `The timetable schedule for ${subject} has been updated. A class slot has been registered on ${dayName} at ${timeStr} (${formData.room_or_link}).`,
          time: 'Just now',
          date: new Date().toISOString().slice(0, 10),
          icon: '📅',
          priority: 'high' as const,
        };

        MOCK_ANNOUNCEMENTS.unshift(announcement);
        window.dispatchEvent(new CustomEvent('scholario_announcements_updated'));
        setShowPublishBanner(true);
        setTimeout(() => setShowPublishBanner(false), 4000);
      }
    } catch (err) {
      console.error(err);
    }

    setDrawerOpen(false);
    setSelectedSlot(null);
  };

  // Toggle cancellation status of class
  const handleToggleCancel = async (slotId: string, currentStatus: boolean) => {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;

    try {
      const updatedStatus = !currentStatus;
      await upsertSlot({
        ...slot,
        is_cancelled: updatedStatus,
      });

      await loadData();

      // Automatically publish to news if slot is being marked as cancelled
      if (updatedStatus) {
        const offering = offerings.find((o) => o.id === slot.offering_id);
        const subject = offering ? offering.subject : 'Class';
        const board = offering?.board === 'local' ? 'BISE' : offering?.board?.toUpperCase() || 'FBISE';
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = dayNames[slot.day_of_week];
        const timeStr = slot.start_time.slice(0, 5);

        const announcement = {
          id: `ann_cancel_${slotId}`, // Deterministic ID using slotId
          title: `⚠️ Class Cancelled: ${board} Gr. ${offering?.grade || '10'} ${subject}`,
          content: `The scheduled session for ${subject} on ${dayName} at ${timeStr} has been CANCELLED by the admin. Please plan your study slots accordingly.`,
          time: 'Just now',
          date: new Date().toISOString().slice(0, 10),
          icon: '⚠️',
          priority: 'high' as const,
        };

        // Remove any pre-existing announcement for this cancel action to avoid duplicates
        const existingIdx = MOCK_ANNOUNCEMENTS.findIndex((a) => a.id === `ann_cancel_${slotId}`);
        if (existingIdx !== -1) {
          MOCK_ANNOUNCEMENTS.splice(existingIdx, 1);
        }

        MOCK_ANNOUNCEMENTS.unshift(announcement);
        window.dispatchEvent(new CustomEvent('scholario_announcements_updated'));
        setShowPublishBanner(true);
        setTimeout(() => setShowPublishBanner(false), 4000);
      } else {
        // If uncancelled, remove the cancellation announcement
        const existingIdx = MOCK_ANNOUNCEMENTS.findIndex((a) => a.id === `ann_cancel_${slotId}`);
        if (existingIdx !== -1) {
          MOCK_ANNOUNCEMENTS.splice(existingIdx, 1);
          window.dispatchEvent(new CustomEvent('scholario_announcements_updated'));
        }
      }
    } catch (err) {
      console.error(err);
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
    const mockNewSlot: Partial<ClassSlot> = {
      offering_id: '',
      day_of_week: dayOfWeekIndex as any,
      start_time: '16:00:00',
      end_time: '17:30:00',
      room_or_link: '',
    };
    setSelectedSlot(mockNewSlot as any);
  };

  const handleEditTrigger = (slot: ClassSlot) => {
    setSelectedSlot(slot);
    setDrawerOpen(true);
  };

  const resetFilters = () => {
    setSelectedBoard('fbise');
    setSelectedGrade('10');
    setTeacherFilter('all');
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoard(boardId);
    setSelectedGrade('all'); // Show all grades for that board initially
  };

  const activeGrades = selectedBoard !== 'all' ? GRADES_BY_BOARD[selectedBoard] || [] : [];

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

          {(selectedBoard !== 'fbise' || selectedGrade !== '10' || teacherFilter !== 'all') && (
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
              onClick={() => setSelectedGrade(g.id)}
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

      {/* Timetable Weekly Columns */}
      <WeeklyGrid
        slots={filteredSlots}
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
          slot={selectedSlot && selectedSlot.id ? selectedSlot : null}
          offerings={offerings}
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
    </AdminShell>
  );
};

export default ScheduleManagerPage;
