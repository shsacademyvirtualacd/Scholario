import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  BookOpen,
  Award,
  Search,
  Clock,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { getWrittenSubmissions } from '../../lib/writtenTestService';
import type { WrittenSubmission } from '../../types/writtenTest';
import { WrittenTestGradingModal } from './WrittenTestGradingModal';

interface WrittenTestSubmissionsListProps {
  isTeacher?: boolean;
  filterTestId?: string;
}

export const WrittenTestSubmissionsList: React.FC<WrittenTestSubmissionsListProps> = ({
  isTeacher: _isTeacher = false,
  filterTestId,
}) => {
  const [submissions, setSubmissions] = useState<WrittenSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'short_question' | 'long_question'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'graded' | 'expired'>('all');

  // Grading Modal
  const [gradingModalOpen, setGradingModalOpen] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<WrittenSubmission | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedSubs = await getWrittenSubmissions();
      setSubmissions(fetchedSubs);
    } catch (err) {
      console.error('Failed to load written test data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // Direct Test ID scoping if provided
      if (filterTestId && sub.test_id !== filterTestId) return false;

      // Type Filter
      if (typeFilter !== 'all' && sub.test_type !== typeFilter) return false;

      // Status Filter
      if (statusFilter === 'pending' && (sub.status === 'graded' || sub.is_expired)) return false;
      if (statusFilter === 'graded' && sub.status !== 'graded') return false;
      if (statusFilter === 'expired' && !sub.is_expired) return false;

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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 border border-[#E5E5E5] rounded-2xl shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A3A3A3]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, or assessment title..."
            className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:ring-1 focus:ring-[#111111]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Test Type Filter */}
          <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5]">
            {[
              { id: 'all', label: 'All Formats' },
              { id: 'short_question', label: 'Short Qs' },
              { id: 'long_question', label: 'Long Qs' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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
          <div className="flex items-center gap-1 bg-[#FAFAFA] p-1 rounded-xl border border-[#E5E5E5]">
            {[
              { id: 'all', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'graded', label: 'Graded' },
              { id: 'expired', label: 'Expired' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
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
        <div className="p-12 text-center text-xs font-bold text-[#737373]">
          Loading written assessment submissions...
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-[#E5E5E5] bg-[#FAFAFA] space-y-2">
          <FileText className="w-8 h-8 text-[#A3A3A3] mx-auto" />
          <h4 className="text-xs font-bold text-[#111111]">No submissions found</h4>
          <p className="text-[11px] text-[#737373]">
            Students have not submitted any handwritten answer sheets for this filter.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub) => {
            const isGraded = sub.status === 'graded';
            const isExpired = sub.is_expired;

            return (
              <div
                key={sub.id}
                className={`p-4 rounded-2xl border transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                  isGraded
                    ? 'border-emerald-200/80 hover:border-emerald-300'
                    : isExpired
                    ? 'border-neutral-200 opacity-80'
                    : 'border-[#E5E5E5] hover:border-amber-400'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
                    {sub.test_type === 'short_question' ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <BookOpen className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-[#111111]">{sub.student_name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAFAFA] text-[#737373] border border-[#E5E5E5]">
                        Grade {sub.grade} • {sub.subject}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black text-amber-400">
                        {sub.test_type === 'short_question' ? 'Short Qs' : 'Long Qs'}
                      </span>
                    </div>
                    <p className="text-xs font-extrabold text-[#111111] mt-1">
                      {sub.test_title || 'Written Assessment'}
                    </p>
                    <p className="text-[11px] text-[#737373] mt-0.5">
                      Submitted: {new Date(sub.submitted_at).toLocaleString()} • {sub.answers.length} handwritten sheets attached
                    </p>
                  </div>
                </div>

                {/* Status & Expiry Window & Action */}
                <div className="flex items-center gap-4 self-end md:self-auto shrink-0">
                  {/* 24h Expiry Indicator */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-[#737373] block">
                      R2 Retention:
                    </span>
                    <span
                      className={`text-xs font-extrabold flex items-center gap-1 ${
                        isExpired
                          ? 'text-red-700'
                          : 'text-amber-800'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {isExpired ? 'Expired' : `Expires in ${sub.remaining_formatted}`}
                    </span>
                  </div>

                  {/* Score or Pending Status */}
                  <div className="text-right min-w-[90px]">
                    {isGraded ? (
                      <div>
                        <span className="text-sm font-black text-emerald-800">
                          {sub.final_score} / {sub.total_marks}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 block">Graded</span>
                      </div>
                    ) : isExpired ? (
                      <span className="text-xs font-bold text-neutral-400">Past Window</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
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
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-xs ${
                      isGraded
                        ? 'bg-[#FAFAFA] hover:bg-[#F5F5F5] text-[#111111] border border-[#E5E5E5]'
                        : isExpired
                        ? 'bg-[#FAFAFA] text-[#737373] border border-[#E5E5E5]'
                        : 'bg-[#111111] hover:bg-[#262626] text-white'
                    }`}
                  >
                    {isGraded ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review Grade</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-3.5 h-3.5" />
                        <span>Grade Sheets</span>
                      </>
                    )}
                    <ChevronRight className="w-3.5 h-3.5" />
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
