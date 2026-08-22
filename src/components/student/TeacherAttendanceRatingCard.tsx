import React, { useState } from 'react';
import { Check, X, Lock, UserCheck, Clock, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import type { ClassSlot, TeacherAttendanceRating, TeacherAttendanceRatingVote } from '../../types';
import {
  getPKTNow,
  findActiveOrRecentSlotForRating,
  getSlotSubject,
  formatTime12h
} from '../../lib/scheduleUtils';
import { submitTeacherAttendanceRating } from '../../lib/db';

interface TeacherAttendanceRatingCardProps {
  slots: ClassSlot[];
  studentId: string;
  ratings: TeacherAttendanceRating[];
  onRatingSubmitted: (rating: TeacherAttendanceRating) => void;
}

export const TeacherAttendanceRatingCard: React.FC<TeacherAttendanceRatingCardProps> = ({
  slots,
  studentId,
  ratings,
  onRatingSubmitted,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const pktnow = getPKTNow();
  const target = findActiveOrRecentSlotForRating(slots, pktnow);

  if (!target) {
    return (
      <div className="card card-elevated p-4 sm:p-5 border border-[#E5E5E5] bg-white rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] flex items-center justify-center text-[#737373] shrink-0">
            <UserCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111111]">Was your teacher present?</h3>
            <p className="text-xs text-[#737373] mt-0.5">
              Teacher attendance verification will activate when your next class is in-session or recently completed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { slot, sessionDate, isOngoing, statusLabel } = target;
  const teacher = slot.offering?.teacher;
  const teacherName = teacher?.full_name || 'Assigned Instructor';
  const teacherId = slot.offering?.teacher_id || teacher?.id || null;
  const subjectName = getSlotSubject(slot);
  const gradeLevel = slot.offering?.class?.display_name || slot.offering?.grade || '';

  // Check if student has already voted for this slot + session date
  const existingVote = ratings.find(
    r => r.slot_id === slot.id && r.session_date === sessionDate
  );
  const hasVoted = Boolean(existingVote);
  const userChoice = existingVote?.rating;

  const handleVote = async (vote: TeacherAttendanceRatingVote) => {
    if (hasVoted || submitting || !studentId) return;

    setSubmitting(true);
    try {
      const created = await submitTeacherAttendanceRating(
        studentId,
        slot.id,
        sessionDate,
        teacherId,
        vote
      );
      onRatingSubmitted(created);
      toast.success(
        vote === 'present'
          ? 'Marked teacher as Present ✓. Thank you for verifying!'
          : 'Marked teacher as Absent ✕. Response recorded for administration.'
      );
    } catch (err: any) {
      console.error('Failed to submit teacher attendance rating:', err);
      // In case of duplicate submission or network issue
      if (err?.message?.includes('duplicate') || err?.message?.includes('uq_student_slot_session')) {
        toast.info('You have already submitted a vote for this session.');
      } else {
        toast.error('Could not submit vote. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card card-elevated p-4 sm:p-5 border border-[#E5E5E5] bg-white rounded-2xl shadow-xs transition-all">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Session & Teacher Details */}
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
            isOngoing ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-[#F4C430]/20 text-[#111111] border border-[#F4C430]/30'
          }`}>
            <UserCheck size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#737373]">
                Teacher Attendance Verification
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                isOngoing
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-200'
              }`}>
                {isOngoing ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Class In Session
                  </>
                ) : (
                  <>
                    <Clock size={10} />
                    {statusLabel}
                  </>
                )}
              </span>
            </div>

            <h3 className="text-base font-extrabold text-[#111111] leading-tight truncate">
              Was <span className="text-amber-700 underline decoration-amber-300 underline-offset-2">{teacherName}</span> present for class?
            </h3>

            <div className="flex items-center gap-2 text-xs text-[#737373] mt-1 flex-wrap">
              <span className="font-semibold text-[#111111]">{subjectName}</span>
              {gradeLevel && <span>• {gradeLevel}</span>}
              <span>• {formatTime12h(slot.start_time)} - {formatTime12h(slot.end_time)}</span>
              <span>({sessionDate})</span>
            </div>
          </div>
        </div>

        {/* Action / Voted State */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 shrink-0 md:pl-4 md:border-l md:border-[#E5E5E5]">
          {hasVoted ? (
            <div className="w-full flex flex-col items-start sm:items-end gap-1.5">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {userChoice === 'present' ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-800 border-2 border-emerald-500 rounded-xl font-bold text-xs shadow-xs w-full justify-center sm:w-auto">
                    <Check size={16} strokeWidth={3} className="text-emerald-600" />
                    <span>You marked: Present ✓</span>
                    <Lock size={12} className="text-emerald-500 ml-1" />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-800 border-2 border-rose-500 rounded-xl font-bold text-xs shadow-xs w-full justify-center sm:w-auto">
                    <X size={16} strokeWidth={3} className="text-rose-600" />
                    <span>You marked: Absent ✕</span>
                    <Lock size={12} className="text-rose-500 ml-1" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#737373] font-medium">
                <ShieldCheck size={12} className="text-emerald-600" />
                <span>Vote locked & private to administration</span>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-start sm:items-end gap-1.5">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleVote('present')}
                  disabled={submitting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 interactive cursor-pointer"
                >
                  <Check size={15} strokeWidth={3} />
                  <span>Present</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleVote('absent')}
                  disabled={submitting}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-rose-50 text-rose-700 hover:text-rose-800 border border-rose-300 hover:border-rose-400 active:scale-95 font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 interactive cursor-pointer"
                >
                  <X size={15} strokeWidth={3} />
                  <span>Absent</span>
                </button>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-[#737373] font-medium">
                <Lock size={11} />
                <span>1-time locked vote for this session</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default TeacherAttendanceRatingCard;
