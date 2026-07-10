import React, { useState, useEffect } from 'react';
import { ClipboardCheck, Save, Users, UserCheck, Clock, UserX, Sparkles } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import SessionSelector from '../../components/admin/attendance/SessionSelector';
import AttendanceGrid from '../../components/admin/attendance/AttendanceGrid';
import { getAllSlots, getStudentsInOffering, getAttendanceForSession, upsertAttendanceBatch, getAllAttendance } from '../../lib/db';
import type { AttendanceStatus, ClassSlot, Profile, Attendance } from '../../types';

export const AttendanceAdminPage: React.FC = () => {
  const [enrichedSlots, setEnrichedSlots] = useState<ClassSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [enrolledStudents, setEnrolledStudents] = useState<Profile[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceStatus>>({});
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  // ── Load all slots + overall attendance logs on mount ──────────────────────────────────
  useEffect(() => {
    getAllSlots().then((slots) => {
      setEnrichedSlots(slots);
      if (slots.length > 0) setSelectedSlotId(slots[0].id);
    }).catch(console.error);

    getAllAttendance().then(setAllAttendance).catch(console.error);
  }, []);

  const currentSlot = enrichedSlots.find((s) => s.id === selectedSlotId);

  // ── Load students + existing attendance when slot/date changes ───────────
  useEffect(() => {
    if (!currentSlot?.offering_id) return;
    Promise.all([
      getStudentsInOffering(currentSlot.offering_id),
      getAttendanceForSession(selectedSlotId, selectedDate),
    ]).then(([students, existingRecords]) => {
      setEnrolledStudents(students);
      const stateMap: Record<string, AttendanceStatus> = {};
      students.forEach((student) => {
        const record = existingRecords.find((r) => r.student_id === student.id);
        stateMap[student.id] = record ? record.status : 'present';
      });
      setAttendanceState(stateMap);
      setSaveSuccess(false);
    }).catch(console.error);
  }, [selectedSlotId, selectedDate, currentSlot?.offering_id]);

  // Handle status chip updates
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceState((prev) => ({ ...prev, [studentId]: status }));
    setSaveSuccess(false);
  };

  // Submit and save session logs
  const handleSaveAttendance = async () => {
    if (saving) return;
    setSaving(true);
    const records = enrolledStudents.map((student) => ({
      student_id: student.id,
      slot_id: selectedSlotId,
      session_date: selectedDate,
      status: attendanceState[student.id] ?? 'present',
    }));
    await upsertAttendanceBatch(records).catch(console.error);
    // Refresh all attendance logs to compute correct overall attendance percentage
    await getAllAttendance().then(setAllAttendance).catch(console.error);
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Stats calculation
  const totalStudentsCount = enrolledStudents.length;
  const presentCount = Object.values(attendanceState).filter((v) => v === 'present').length;
  const lateCount = Object.values(attendanceState).filter((v) => v === 'late').length;
  const absentCount = Object.values(attendanceState).filter((v) => v === 'absent').length;

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Attendance Sheet"
            description="Mark student session presence, record late entries, and track weekly attendance statistics."
          />
          <button
            onClick={handleSaveAttendance}
            disabled={saving || enrolledStudents.length === 0}
            className="btn flex items-center justify-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#262626] disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-sm shrink-0 self-start sm:self-center transition-all"
          >
            <Save size={14} />
            {saving ? 'Saving…' : 'Save Attendance Sheet'}
          </button>
        </div>

        {/* Session Selector */}
        <SessionSelector
          slots={enrichedSlots}
          selectedSlotId={selectedSlotId}
          onSelectSlot={setSelectedSlotId}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        {/* Success Toast Notification Banner */}
        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
              <Sparkles size={14} className="text-emerald-600 shrink-0" />
              <span>Success: Attendance sheet for {currentSlot?.offering?.subject} marked and updated successfully!</span>
            </div>
          </div>
        )}

        {/* Session stats counts */}
        {totalStudentsCount > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Enrolled students */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users size={15} />
                </div>
                <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Enrolled</span>
              </div>
              <div className="stat-value">{totalStudentsCount}</div>
              <div className="stat-label">Students in Class</div>
            </div>

            {/* Present */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <UserCheck size={15} />
                </div>
                <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Present</span>
              </div>
              <div className="stat-value text-emerald-600">{presentCount}</div>
              <div className="stat-label">Attending lecture</div>
            </div>

            {/* Late */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={15} />
                </div>
                <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Late</span>
              </div>
              <div className="stat-value text-amber-600">{lateCount}</div>
              <div className="stat-label">Arrived late</div>
            </div>

            {/* Absent */}
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                  <UserX size={15} />
                </div>
                <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Absent</span>
              </div>
              <div className="stat-value text-red-500">{absentCount}</div>
              <div className="stat-label">Missed session</div>
            </div>
          </div>
        )}

        {/* Student List Grid Sheet */}
        {totalStudentsCount === 0 ? (
          <div className="card text-center py-20">
            <ClipboardCheck size={32} className="mx-auto text-[#A3A3A3] mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-[#111111]">No students enrolled in this offering</h3>
            <p className="text-xs text-[#737373] mt-1">Please select another timetable slot or enrol students in this offering.</p>
          </div>
        ) : (
          <AttendanceGrid
            students={enrolledStudents}
            attendanceState={attendanceState}
            onStatusChange={handleStatusChange}
            allAttendance={allAttendance}
          />
        )}
      </div>
    </AdminShell>
  );
};

export default AttendanceAdminPage;
