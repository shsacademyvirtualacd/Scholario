import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Mail,
  Clock,
  Video,
  ExternalLink,
  Phone,
  MessageCircle,
  Lock,
  Unlock,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileAvatar from '../../common/ProfileAvatar';
import type { Teacher, ClassOffering, ClassSlot } from '../../../types';
import { getOfferingsForTeacher, getSlotsForTeacher, getStudentsForTeacher } from '../../../lib/db';

interface TeacherDetailPanelProps {
  teacher: Teacher;
  status?: 'active' | 'not_signed_in' | 'suspended';
  onToggleAccess?: () => void;
}

const DAYS_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const TeacherDetailPanel: React.FC<TeacherDetailPanelProps> = ({
  teacher,
  status = 'active',
  onToggleAccess,
}) => {
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getOfferingsForTeacher(teacher.id),
      getSlotsForTeacher(teacher.id),
      getStudentsForTeacher(teacher.id),
    ])
      .then(([o, s, stds]) => {
        setOfferings(o);
        setSlots(s);
        setStudentCount(stds.length);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [teacher.id]);

  const formatDateDisplay = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  // Pakistani phone formatting helper
  const formatPhoneDisplay = (rawPhone?: string | null) => {
    if (!rawPhone) return null;
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('92') && digits.length === 12) {
      return `+92 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
    }
    if (digits.startsWith('0') && digits.length === 11) {
      return `+92 ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    return rawPhone;
  };

  const formattedPhone = formatPhoneDisplay(teacher.phone);
  const whatsappUrl = teacher.phone
    ? `https://wa.me/${teacher.phone.replace(/\D/g, '').replace(/^0/, '92')}`
    : null;

  const sortedSlots = [...slots].sort(
    (a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)
  );

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
          Loading teacher profile and workload...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden text-neutral-800 dark:text-neutral-200">
      {/* Header Profile Block */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-neutral-200 dark:border-neutral-800 w-full">
        <ProfileAvatar
          avatarUrl={teacher.avatar_url}
          name={teacher.full_name}
          role="teacher"
          size="xl"
          className="mb-3 shadow-md"
        />
        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 break-words max-w-full px-2">
          {teacher.full_name}
        </h3>

        {/* Status Pill */}
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${
              status === 'active'
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : status === 'not_signed_in'
                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}
          >
            {status === 'active' ? (
              <>
                <UserCheck className="w-3.5 h-3.5" /> Active Status
              </>
            ) : status === 'not_signed_in' ? (
              <>
                <Clock className="w-3.5 h-3.5" /> Awaiting Initial Sign In
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" /> Account Suspended
              </>
            )}
          </span>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-2.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Joined {formatDateDisplay(teacher.joining_date)}</span>
        </p>

        {/* Open in Roster Action Button */}
        <div className="mt-4 flex items-center gap-2">
          <Link
            to="/admin/roster"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Roster</span>
          </Link>

          {onToggleAccess && (
            <button
              type="button"
              onClick={onToggleAccess}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              {status === 'suspended' ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Restore Access</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Suspend Account</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Key Workload Metrics */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-800/40 text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{sortedSlots.length}</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5 uppercase tracking-wide">
            Weekly class slots
          </div>
        </div>
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-800/40 text-center">
          <div className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{studentCount}</div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium mt-0.5 uppercase tracking-wide">
            Enrolled Students
          </div>
        </div>
      </div>

      {/* Contact Details */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Contact Details
        </h4>
        <div className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-800/40 space-y-2.5 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <Mail className="w-4 h-4 text-neutral-400 shrink-0" />
            <span className="truncate">{teacher.email || 'No email address registered'}</span>
          </div>

          {formattedPhone ? (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
              <div className="flex items-center gap-2.5 min-w-0">
                <Phone className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="font-medium">{formattedPhone}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a
                  href={`tel:${teacher.phone}`}
                  className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                  title="Call Teacher"
                >
                  <Phone className="w-3.5 h-3.5" />
                </a>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 text-neutral-400 pt-1 border-t border-neutral-200/60 dark:border-neutral-700/60">
              <Phone className="w-4 h-4 shrink-0" />
              <span>No phone number registered</span>
            </div>
          )}
        </div>
      </div>

      {/* Assigned Subjects */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Assigned Offerings ({offerings.length})
          </h4>
        </div>
        {offerings.length === 0 ? (
          <div className="text-xs text-neutral-400 text-center py-4 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
            No class offerings assigned yet.
          </div>
        ) : (
          <div className="space-y-2">
            {offerings.map((off) => (
              <div
                key={off.id}
                className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between text-xs"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {off.subject_name || off.subject || 'Class'}
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Grade {off.grade || '—'} · {off.board_name || off.board_id || 'Curriculum'}
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  Offering
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Schedule Slots */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Weekly Live Schedule Slots ({sortedSlots.length})
        </h4>
        {sortedSlots.length === 0 ? (
          <div className="text-xs text-neutral-400 text-center py-6 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
            No weekly teaching slots scheduled for this tutor.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSlots.map((slot) => {
              const offering = offerings.find((o) => o.id === slot.offering_id);
              return (
                <div
                  key={slot.id}
                  className={`p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between gap-3 text-xs ${
                    slot.is_cancelled ? 'opacity-50' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 uppercase tracking-wide">
                      {DAYS_NAME[slot.day_of_week]}
                    </span>
                    <h5 className="font-semibold text-neutral-900 dark:text-neutral-100 mt-1 truncate">
                      {offering?.subject_name || offering?.subject || 'Class'} (Grade {offering?.grade || '—'})
                    </h5>
                    <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>
                        {formatTime(slot.start_time)} – {formatTime(slot.end_time)} PKT
                      </span>
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shrink-0">
                    <Video className="w-3 h-3" />
                    <span>Live</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDetailPanel;
