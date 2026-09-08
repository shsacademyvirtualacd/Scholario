import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  BookOpen,
  Award,
  Search,
  Clock,
  ChevronRight,
  Eye,
  Archive,
  Layers,
} from 'lucide-react';
import { getWrittenSubmissions } from '../../lib/writtenTestService';
import {
  getTeacherAssignedScope,
  isSubjectAuthorizedForTeacher,
  type TeacherAssignedScope,
} from '../../lib/db';
import type { WrittenSubmission } from '../../types/writtenTest';
import { WrittenTestGradingModal } from './WrittenTestGradingModal';
import { useAuth } from '../../features/auth/AuthContext';

interface WrittenTestSubmissionsListProps {
  isTeacher?: boolean;
  filterTestId?: string;
  teacherScope?: TeacherAssignedScope | null;
}

export const WrittenTestSubmissionsList: React.FC<WrittenTestSubmissionsListProps> = ({
  isTeacher = false,
  filterTestId,
  teacherScope,
}) => {
  const { profile } = useAuth();
  const userRole = (profile?.role || (isTeacher ? 'teacher' : 'admin')).toLowerCase();
  const effIsTeacher = isTeacher || userRole === 'teacher';

  const [submissions, setSubmissions] = useState<WrittenSubmission[]>([]);
  const [resolvedScope, setResolvedScope] = useState<TeacherAssignedScope | null>(teacherScope || null);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'unified' | 'short_question' | 'long_question'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'graded' | 'archived'>('all');

  // Grading Modal
  const [gradingModalOpen, setGradingModalOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<WrittenSubmission | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let activeScope = teacherScope || resolvedScope;
      if (effIsTeacher && !activeScope) {
        activeScope = await getTeacherAssignedScope(profile?.id, (profile as any)?.email, profile?.full_name);
        setResolvedScope(activeScope);
      }

      const fetchedSubs = await getWrittenSubmissions({
        testId: filterTestId,
        role: userRole,
        teacherScope: activeScope || undefined,
        teacherId: profile?.id,
      });
      setSubmissions(fetchedSubs);
    } catch (err) {
      console.error('Failed to load written test data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userRole, filterTestId, teacherScope]);

  const filteredSubmissions = useMemo(() => {
    const activeScope = teacherScope || resolvedScope;

    return submissions.filter((sub) => {
      // Direct Test ID scoping if provided
      if (filterTestId && sub.test_id !== filterTestId) return false;

      // Teacher subject-level check
      if (effIsTeacher && activeScope && activeScope.isAssigned) {
        if (!isSubjectAuthorizedForTeacher(sub.subject, activeScope, undefined, sub.grade)) {
          return false;
        }
      }

      // Type Filter
      if (typeFilter !== 'all' && sub.test_type !== typeFilter) return false;

      // Status Filter
      const isArchived = Boolean(sub.photos_purged || sub.retention_status === 'archived');
      if (statusFilter === 'pending' && (sub.status === 'graded' || isArchived)) return false;
      if (statusFilter === 'graded' && sub.status !== 'graded') return false;
      if (statusFilter === 'archived' && !isArchived) return false;

      // Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = sub.student_name.toLowerCase().includes(term);
        const matchTitle = (sub.test_title || '').toLowerCase().includes(term);
        const matchSubject = sub.subject.toLowerCase().includes(term);
        const matchId = (sub.student_id || '').toLowerCase().includes(term);
        if (!matchName && !matchTitle && !matchSubject && !matchId) return false;
      }

      return true;
    });
  }, [submissions, filterTestId, typeFilter, statusFilter, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 border border-[#E5E5E5] rounded-xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A3A3A3]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, or assessment title..."
            className="w-full h-8.5 pl-8.5 pr-3 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {/* Test Type Filter */}
          <div className="flex items-center gap-0.5 bg-[#FAFAFA] p-0.5 rounded-lg border border-[#E5E5E5]">
            {[
              { id: 'all', label: 'All Formats' },
              { id: 'unified', label: 'Class Test' },
              { id: 'short_question', label: 'Short Qs' },
              { id: 'long_question', label: 'Long Qs' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  typeFilter === t.id
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#111111]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-0.5 bg-[#FAFAFA] p-0.5 rounded-lg border border-[#E5E5E5]">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'graded', label: 'Graded' },
              { id: 'archived', label: 'Archived' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  statusFilter === s.id
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-[#525252] hover:text-[#111111]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Submissions Table / Cards */}
      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-[#737373]">
          Loading written assessment submissions...
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-8 text-center rounded-xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] space-y-1.5">
          <FileText className="w-7 h-7 text-[#A3A3A3] mx-auto" />
          <h4 className="text-xs font-bold text-[#111111]">No submissions found</h4>
          <p className="text-[11px] text-[#737373]">
            Students have not submitted any handwritten answer sheets for this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSubmissions.map((sub) => {
            const isGraded = sub.status === 'graded';
            const isArchived = Boolean(sub.photos_purged || sub.retention_status === 'archived');
            const isAutoExtended = Boolean(sub.auto_extended || sub.admin_flagged);
            const isExpired = sub.is_expired && !isAutoExtended;

            return (
              <div
                key={sub.id}
                className={`p-3 sm:p-3.5 rounded-xl border transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs ${
                  isArchived
                    ? 'border-neutral-200 bg-neutral-50/50'
                    : isGraded
                    ? 'border-emerald-200/80 hover:border-emerald-300'
                    : isAutoExtended
                    ? 'border-amber-300 bg-amber-50/30'
                    : isExpired
                    ? 'border-neutral-200 opacity-80'
                    : 'border-[#E5E5E5] hover:border-amber-400'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8.5 h-8.5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                    {sub.test_type === 'unified' ? (
                      <Layers className="w-4 h-4" />
                    ) : sub.test_type === 'short_question' ? (
                      <FileText className="w-4 h-4" />
                    ) : (
                      <BookOpen className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-[#111111] whitespace-nowrap">{sub.student_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FAFAFA] text-[#737373] border border-[#E5E5E5] whitespace-nowrap">
                        Grade {sub.grade} • {sub.subject}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black text-amber-400 whitespace-nowrap">
                        {sub.test_type === 'unified'
                          ? 'Class Assessment'
                          : sub.test_type === 'short_question'
                          ? 'Short Qs'
                          : 'Long Qs'}
                      </span>
                      {isArchived && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-200 text-neutral-800 flex items-center gap-1 whitespace-nowrap">
                          <Archive className="w-2.5 h-2.5" />
                          Archived
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-extrabold text-[#111111] mt-0.5 truncate">
                      {sub.test_title || 'Assessment'}
                    </p>
                    <p className="text-[11px] text-[#737373] mt-0.5 whitespace-nowrap">
                      Submitted: {new Date(sub.submitted_at).toLocaleString()} • {sub.answers.length} questions
                    </p>
                  </div>
                </div>

                {/* Status & Expiry Window & Action */}
                <div className="flex items-center gap-3 sm:gap-4 self-end md:self-auto shrink-0">
                  {/* Retention Indicator */}
                  <div className="text-right whitespace-nowrap shrink-0">
                    <span className="text-[10px] uppercase font-bold text-[#737373] block whitespace-nowrap leading-none mb-0.5">
                      Storage Status:
                    </span>
                    {isArchived ? (
                      <span className="text-xs font-bold text-neutral-600 flex items-center gap-1 justify-end whitespace-nowrap">
                        <Archive className="w-3 h-3 text-neutral-500 shrink-0" />
                        Photos Purged
                      </span>
                    ) : isAutoExtended ? (
                      <span className="text-xs font-extrabold text-amber-800 flex items-center gap-1 justify-end whitespace-nowrap">
                        <Clock className="w-3 h-3 shrink-0" />
                        Window Extended
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-extrabold flex items-center gap-1 justify-end whitespace-nowrap ${
                          isExpired ? 'text-red-700' : 'text-amber-800'
                        }`}
                      >
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">{isExpired ? 'Expired' : `Expires in ${sub.remaining_formatted}`}</span>
                      </span>
                    )}
                  </div>

                  {/* Score or Pending Status */}
                  <div className="text-right min-w-[75px] whitespace-nowrap shrink-0">
                    {isGraded ? (
                      <div>
                        <span className="text-xs sm:text-sm font-black text-emerald-800 whitespace-nowrap">
                          {sub.final_score} / {sub.total_marks}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 block leading-none">Graded</span>
                      </div>
                    ) : isArchived ? (
                      <span className="text-xs font-bold text-neutral-500 whitespace-nowrap">Archived</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 whitespace-nowrap">
                        Pending
                      </span>
                    )}
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setGradingModalOpen(true);
                    }}
                    className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 h-8.5 rounded-lg text-xs font-bold transition-all shadow-2xs cursor-pointer whitespace-nowrap shrink-0 ${
                      isArchived
                        ? 'bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-300'
                        : isGraded
                        ? 'bg-[#FAFAFA] hover:bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5]'
                        : 'bg-[#111111] hover:bg-[#262626] text-white'
                    }`}
                  >
                    {isArchived ? (
                      <>
                        <Archive className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">View Archive</span>
                      </>
                    ) : isGraded ? (
                      <>
                        <Eye className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">Review Grade</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-3 h-3 shrink-0" />
                        <span className="whitespace-nowrap">Grade Sheets</span>
                      </>
                    )}
                    <ChevronRight className="w-3 h-3 shrink-0" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual Grading Modal */}
      {gradingModalOpen && (
        <WrittenTestGradingModal
          isOpen={gradingModalOpen}
          submission={selectedSubmission}
          teacherScope={teacherScope || resolvedScope}
          onClose={() => {
            setGradingModalOpen(false);
            setSelectedSubmission(null);
          }}
          onGraded={(updated) => {
            setSubmissions((prev) =>
              prev.map((s) => (s.id === updated.id ? updated : s))
            );
          }}
        />
      )}
    </div>
  );
};
