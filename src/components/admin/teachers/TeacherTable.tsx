import React, { useState, useRef, useEffect } from 'react';
import {
  Eye,
  MoreVertical,
  HelpCircle,
  UserCheck,
  Clock,
  Lock,
  Unlock,
  Trash2,
  ExternalLink,
  Mail,
  Phone,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProfileAvatar from '../../common/ProfileAvatar';
import type { Teacher, ClassOffering, ClassSlot, Enrollment, RosterEntry } from '../../../types';

interface TeacherTableProps {
  teachers: Teacher[];
  onView: (teacher: Teacher) => void;
  offerings?: ClassOffering[];
  slots?: ClassSlot[];
  enrollments?: Enrollment[];
  roster?: RosterEntry[];
  profiles?: any[];
  onToggleAccess?: (teacher: Teacher) => void;
  onDelete?: (teacher: Teacher) => void;
}

export const TeacherTable: React.FC<TeacherTableProps> = ({
  teachers,
  onView,
  offerings = [],
  slots = [],
  enrollments = [],
  roster = [],
  profiles = [],
  onToggleAccess,
  onDelete,
}) => {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date display: "Oct 14, 2026"
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

  // Helper to resolve teacher status
  const getTeacherStatus = (teacher: Teacher): 'active' | 'not_signed_in' | 'suspended' => {
    const emailLower = (teacher.email || '').toLowerCase().trim();
    const rosterEntry = roster.find(
      (r) =>
        r.id === teacher.id ||
        r.profile_id === teacher.id ||
        (r.email && r.email.toLowerCase().trim() === emailLower)
    );

    if (teacher.is_active === false || rosterEntry?.suspended === true) {
      return 'suspended';
    }

    const matchedProfile = profiles.find(
      (p) =>
        p.id === teacher.id ||
        (rosterEntry?.profile_id && p.id === rosterEntry.profile_id) ||
        (p.email && p.email.toLowerCase().trim() === emailLower)
    );

    if (!matchedProfile || matchedProfile.onboarding_complete === false) {
      return 'not_signed_in';
    }

    return 'active';
  };

  // Workload calculations
  const getWorkload = (teacherId: string) => {
    const teacherOfferings = offerings.filter((o) => {
      const tId = o.teacher_id || o.teacher?.id;
      return tId === teacherId;
    });

    const offeringIds = teacherOfferings.map((o) => o.id);
    const classesCount = slots.filter((s) => offeringIds.includes(s.offering_id || '')).length;
    const studentCount = enrollments.filter((e) => offeringIds.includes(e.offering_id || '')).length;

    const rawSubjects = teacherOfferings.map((o) => o.subject || o.subject_name || '');
    const hasIelts = teacherOfferings.some((o) => {
      const b = (o.board_id || o.board || o.class?.board_id || '').toLowerCase();
      const s = (o.subject_name || o.subject || '').toLowerCase();
      return b === 'ielts' || s.includes('ielts');
    });

    const nonIeltsSubjects = rawSubjects.filter((s) => {
      const sLower = s.toLowerCase();
      return !sLower.includes('ielts') && s !== '';
    });

    const uniqueSubjects = Array.from(new Set(nonIeltsSubjects));
    if (hasIelts) {
      uniqueSubjects.unshift('IELTS Preparation');
    }

    return { classesCount, studentCount, uniqueSubjects };
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/75 dark:bg-neutral-800/40 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              <th className="py-3 px-4">Teacher</th>
              <th className="py-3 px-4 hidden md:table-cell">Contact</th>
              <th className="py-3 px-4">Subjects Assigned</th>
              <th className="py-3 px-3 text-center">
                <div className="inline-flex items-center gap-1 cursor-help group relative">
                  <span>Weekly class slots</span>
                  <HelpCircle className="w-3.5 h-3.5 text-neutral-400" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-30 w-48 p-2 rounded-lg bg-neutral-900 text-white text-[10px] font-normal normal-case shadow-xl pointer-events-none">
                    Total live teaching schedule periods per week across offerings.
                  </div>
                </div>
              </th>
              <th className="py-3 px-3 text-center hidden sm:table-cell">Enrolled Students</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60 text-xs text-neutral-700 dark:text-neutral-300">
            {teachers.map((teacher) => {
              const workload = getWorkload(teacher.id);
              const status = getTeacherStatus(teacher);
              const shownSubjects = workload.uniqueSubjects.slice(0, 2);
              const extraCount = workload.uniqueSubjects.length - 2;

              return (
                <tr
                  key={teacher.id}
                  onClick={() => onView(teacher)}
                  className="hover:bg-neutral-50/75 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                >
                  {/* Teacher Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar
                        avatarUrl={teacher.avatar_url}
                        name={teacher.full_name}
                        role="teacher"
                        size="sm"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-100 block leading-tight group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate max-w-[180px] sm:max-w-xs">
                          {teacher.full_name}
                        </span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium whitespace-nowrap mt-0.5 block">
                          Joined {formatDateDisplay(teacher.joining_date)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Contact Details (hidden on mobile/narrow) */}
                  <td className="py-3 px-4 hidden md:table-cell">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300 truncate max-w-[200px]">
                        <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate">{teacher.email || '—'}</span>
                      </div>
                      {teacher.phone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span>{teacher.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Subjects Assigned: Short chips */}
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                      {shownSubjects.length === 0 ? (
                        <span className="text-neutral-400 italic text-[11px]">No subjects assigned</span>
                      ) : (
                        shownSubjects.map((subj) => (
                          <span
                            key={subj}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 whitespace-nowrap"
                          >
                            {subj}
                          </span>
                        ))
                      )}
                      {extraCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(teacher);
                          }}
                          className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                          title="Click to view all subjects in profile drawer"
                        >
                          +{extraCount} more
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Weekly class slots */}
                  <td className="py-3 px-3 text-center font-bold text-neutral-900 dark:text-neutral-100">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-xs">
                      {workload.classesCount}
                    </span>
                  </td>

                  {/* Enrolled Students */}
                  <td className="py-3 px-3 text-center font-semibold text-neutral-800 dark:text-neutral-200 hidden sm:table-cell">
                    {workload.studentCount}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide whitespace-nowrap ${
                        status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : status === 'not_signed_in'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {status === 'active' ? (
                        <>
                          <UserCheck className="w-3 h-3" /> Active
                        </>
                      ) : status === 'not_signed_in' ? (
                        <>
                          <Clock className="w-3 h-3" /> Not Signed In
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> Suspended
                        </>
                      )}
                    </span>
                  </td>

                  {/* Actions Dropdown (...) Menu */}
                  <td className="py-3 px-4 text-right">
                    <div className="relative inline-flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setActiveMenuId(activeMenuId === teacher.id ? null : teacher.id)}
                        className="p-2 min-h-[44px] min-w-[44px] rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                        aria-label="More actions"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === teacher.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl z-40 py-1 text-left"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              onView(teacher);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5 text-neutral-400" />
                            <span>View Full Profile</span>
                          </button>

                          <Link
                            to="/admin/roster"
                            onClick={() => setActiveMenuId(null)}
                            className="w-full px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Open in Roster</span>
                          </Link>

                          {onToggleAccess && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                onToggleAccess(teacher);
                              }}
                              className="w-full px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2"
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

                          {onDelete && (
                            <div className="border-t border-neutral-100 dark:border-neutral-700 my-1 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onDelete(teacher);
                                }}
                                className="w-full px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Teacher...</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeacherTable;
