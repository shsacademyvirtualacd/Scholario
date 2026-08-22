import React, { useState, useEffect } from 'react';
import {
  Users,
  Award,
  CheckCircle2,
  Calendar,
  Eye,
  Download,
  Search,
  Loader2,
  FileCheck2,
  User,
} from 'lucide-react';
import type { TestPaper, TestSubmission } from '../../types';
import { getSubmissionsForTest, gradeTestSubmission, downloadSubmissionBlob } from '../../lib/db';

interface TeacherSubmissionsPanelProps {
  selectedTest: TestPaper | null;
  onOpenTestViewer: (test: TestPaper) => void;
  onOpenSubmissionViewer: (sub: TestSubmission) => void;
}

export const TeacherSubmissionsPanel: React.FC<TeacherSubmissionsPanelProps> = ({
  selectedTest,
  onOpenTestViewer,
  onOpenSubmissionViewer,
}) => {
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all');
  const [search, setSearch] = useState<string>('');
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [marksInput, setMarksInput] = useState<{ [subId: string]: string }>({});
  const [feedbackInput, setFeedbackInput] = useState<{ [subId: string]: string }>({});
  const [savingGradeId, setSavingGradeId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchSubmissions = async () => {
    if (!selectedTest?.id) return;
    setLoading(true);
    try {
      const subs = await getSubmissionsForTest(selectedTest.id);
      setSubmissions(subs);

      // Pre-fill existing marks and feedback
      const mObj: { [id: string]: string } = {};
      const fObj: { [id: string]: string } = {};
      subs.forEach((s) => {
        if (s.marks_obtained !== null && s.marks_obtained !== undefined) {
          mObj[s.id] = String(s.marks_obtained);
        }
        if (s.teacher_feedback) {
          fObj[s.id] = s.teacher_feedback;
        }
      });
      setMarksInput(mObj);
      setFeedbackInput(fObj);
    } catch (err) {
      console.error('Error fetching submissions for test:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTest) {
      fetchSubmissions();
    } else {
      setSubmissions([]);
    }
  }, [selectedTest?.id]);

  if (!selectedTest) {
    return (
      <div
        id="teacher-submissions-empty-panel"
        className="bg-white rounded-2xl border border-[#E5E5E5] p-8 text-center flex flex-col items-center justify-center min-h-[480px] shadow-xs"
      >
        <div className="w-16 h-16 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] text-[#A3A3A3] flex items-center justify-center mb-4">
          <Users size={28} />
        </div>
        <h3 className="text-base font-extrabold text-[#111111] mb-1">Select a Test Paper</h3>
        <p className="text-xs text-[#737373] max-w-sm">
          Select a test from the left column to view incoming student answer sheets, preview submissions, and assign grades & feedback.
        </p>
      </div>
    );
  }

  const handleGradeSubmit = async (sub: TestSubmission) => {
    const rawMarks = marksInput[sub.id];
    if (rawMarks === undefined || rawMarks === '') {
      alert('Please enter marks before saving.');
      return;
    }

    const marks = Number(rawMarks);
    if (isNaN(marks) || marks < 0 || marks > selectedTest.total_marks) {
      alert(`Please enter a valid score between 0 and ${selectedTest.total_marks}`);
      return;
    }

    const feedback = feedbackInput[sub.id] || undefined;

    setSavingGradeId(sub.id);
    try {
      await gradeTestSubmission(sub.id, {
        marks_obtained: marks,
        max_marks: selectedTest.total_marks,
        teacher_feedback: feedback,
      });

      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === sub.id
            ? {
                ...s,
                status: 'graded',
                marks_obtained: marks,
                max_marks: selectedTest.total_marks,
                teacher_feedback: feedback || null,
              }
            : s
        )
      );
      setGradingSubId(null);
    } catch (err: any) {
      console.error('Error grading submission:', err);
      alert(err.message || 'Failed to save grade.');
    } finally {
      setSavingGradeId(null);
    }
  };

  const handleDownloadSub = async (sub: TestSubmission) => {
    setDownloadingId(sub.id);
    try {
      await downloadSubmissionBlob(sub);
    } catch {
      if (sub.file_url) {
        const link = document.createElement('a');
        link.href = sub.file_url;
        link.download = `${sub.student_name || 'submission'}.pdf`;
        link.target = '_blank';
        link.click();
      }
    } finally {
      setDownloadingId(null);
    }
  };

  // Filter and search submissions
  const filteredSubmissions = submissions.filter((s) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'pending' && s.status === 'submitted') ||
      (filter === 'graded' && s.status === 'graded');

    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      (s.student_name || '').toLowerCase().includes(q) ||
      (s.student_email || '').toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  const totalCount = submissions.length;
  const gradedCount = submissions.filter((s) => s.status === 'graded').length;

  return (
    <div
      id={`teacher-submission-panel-${selectedTest.id}`}
      className="bg-white rounded-2xl border border-[#E5E5E5] p-5 sm:p-6 shadow-xs space-y-6 flex flex-col"
    >
      {/* Test Overview Header */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-[#111111] text-white">
              {selectedTest.subject}
            </span>
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5]">
              Grade {selectedTest.grade} {selectedTest.stream && selectedTest.stream !== 'all' ? `• ${selectedTest.stream}` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="teacher-preview-question-paper-btn"
              onClick={() => onOpenTestViewer(selectedTest)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#111111] text-xs font-bold border border-[#E5E5E5] transition-colors"
            >
              <Eye size={14} />
              <span>Preview Question Paper</span>
            </button>
          </div>
        </div>

        <h3 className="text-lg font-extrabold text-[#111111] mb-2">{selectedTest.title}</h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0] text-xs">
          <div>
            <span className="text-[11px] text-[#737373] block">Teacher</span>
            <span className="font-bold text-[#111111] flex items-center gap-1 mt-0.5">
              <User size={12} className="text-[#737373]" /> {selectedTest.teacher_name || 'Faculty'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#737373] block">Total Marks</span>
            <span className="font-bold text-[#111111] flex items-center gap-1 mt-0.5">
              <Award size={12} className="text-[#737373]" /> {selectedTest.total_marks} Marks
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#737373] block">Due Date</span>
            <span className="font-bold text-[#111111] flex items-center gap-1 mt-0.5">
              <Calendar size={12} className="text-[#737373]" /> {new Date(selectedTest.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#737373] block">Submissions</span>
            <span className="font-bold text-[#111111] flex items-center gap-1 mt-0.5">
              <Users size={12} className="text-[#737373]" /> {totalCount} Students
            </span>
          </div>
          <div>
            <span className="text-[11px] text-[#737373] block">Evaluation Progress</span>
            <span className="font-bold text-[#15803D] flex items-center gap-1 mt-0.5">
              <CheckCircle2 size={12} /> {gradedCount} / {totalCount} Graded
            </span>
          </div>
        </div>
      </div>

      {/* Submissions Section */}
      <div className="space-y-4 flex-1">
        {/* Controls: Search & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search student by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-lg border border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
            />
          </div>

          <div className="flex items-center gap-1 bg-[#FAFAFA] p-0.5 rounded-lg border border-[#E5E5E5] self-end sm:self-auto">
            {(['all', 'pending', 'graded'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                  filter === f
                    ? 'bg-[#111111] text-white shadow-xs'
                    : 'text-[#737373] hover:text-[#111111]'
                }`}
              >
                {f === 'pending' ? 'Ungraded' : f}
              </button>
            ))}
          </div>
        </div>

        {/* List of Student Submissions */}
        {loading ? (
          <div className="py-12 text-center text-xs text-[#737373] flex flex-col items-center justify-center gap-2">
            <Loader2 size={20} className="animate-spin text-[#111111]" />
            <span>Loading student answer sheets...</span>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-8 bg-[#FAFAFA] rounded-2xl border border-[#E5E5E5] text-center">
            <FileCheck2 size={32} className="mx-auto mb-2 text-[#A3A3A3]" />
            <p className="text-xs font-bold text-[#111111]">No submissions found</p>
            <p className="text-[11px] text-[#737373] mt-0.5">
              {totalCount === 0
                ? 'No students have submitted answer sheets for this test yet.'
                : 'No submissions match your search/filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
            {filteredSubmissions.map((sub) => {
              const isGraded = sub.status === 'graded';
              const isGradingActive = gradingSubId === sub.id;

              return (
                <div
                  key={sub.id}
                  id={`student-sub-card-${sub.id}`}
                  className={`p-4 rounded-2xl border transition-all ${
                    isGraded
                      ? 'bg-white border-[#E5E5E5]'
                      : 'bg-white border-[#E5E5E5] ring-1 ring-[#F59E0B]/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#111111] text-white font-black text-xs flex items-center justify-center shrink-0">
                        {(sub.student_name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xs font-extrabold text-[#111111] truncate">{sub.student_name || 'Student'}</h5>
                          {isGraded ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]">
                              {sub.marks_obtained} / {selectedTest.total_marks} Marks
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]">
                              Ungraded
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#737373] mt-0.5">
                          Submitted: {new Date(sub.submitted_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onOpenSubmissionViewer(sub)}
                        className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#111111] text-xs font-bold border border-[#E5E5E5] transition-colors inline-flex items-center gap-1"
                        title="Preview Student Answer Sheet"
                      >
                        <Eye size={13} />
                        <span className="hidden sm:inline text-[11px]">View Paper</span>
                      </button>
                      <button
                        onClick={() => handleDownloadSub(sub)}
                        disabled={downloadingId === sub.id}
                        className="p-1.5 rounded-lg bg-[#FAFAFA] hover:bg-[#E5E5E5] text-[#111111] transition-colors border border-[#E5E5E5] disabled:opacity-40"
                        title="Download Student Answer Sheet"
                      >
                        {downloadingId === sub.id ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                      </button>
                      <button
                        onClick={() => {
                          setGradingSubId(isGradingActive ? null : sub.id);
                          if (!isGradingActive && (sub.marks_obtained !== null && sub.marks_obtained !== undefined)) {
                            setMarksInput((prev) => ({ ...prev, [sub.id]: String(sub.marks_obtained) }));
                            setFeedbackInput((prev) => ({ ...prev, [sub.id]: sub.teacher_feedback || '' }));
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all border ${
                          isGraded
                            ? 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5] hover:bg-[#E5E5E5]'
                            : 'bg-[#111111] text-white border-[#111111]'
                        }`}
                      >
                        {isGraded ? 'Edit Grade' : 'Grade'}
                      </button>
                    </div>
                  </div>

                  {/* Feedback preview if already graded & not currently editing */}
                  {isGraded && !isGradingActive && sub.teacher_feedback && (
                    <div className="mt-3 text-xs bg-[#F0FDF4] p-2.5 rounded-xl border border-[#BBF7D0] text-[#1F2937]">
                      <strong className="text-[#15803D]">Teacher's Remark: </strong>
                      <span>{sub.teacher_feedback}</span>
                    </div>
                  )}

                  {/* Inline Grading Form */}
                  {isGradingActive && (
                    <div className="mt-3 pt-3 border-t border-[#E5E5E5] bg-[#FAFAFA] p-3.5 rounded-xl space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="block text-[11px] font-bold text-[#111111] mb-1">
                            Marks Obtained (Max: {selectedTest.total_marks})
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={selectedTest.total_marks}
                            value={marksInput[sub.id] || ''}
                            onChange={(e) =>
                              setMarksInput((prev) => ({ ...prev, [sub.id]: e.target.value }))
                            }
                            placeholder={`e.g. ${Math.round(selectedTest.total_marks * 0.85)}`}
                            className="w-full h-8 px-2.5 rounded-lg border border-[#CCCCCC] bg-white text-xs font-extrabold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-[#111111] mb-1">
                          Teacher's Remark <span className="text-[#737373] font-normal">(optional)</span>
                        </label>
                        <textarea
                          rows={2}
                          value={feedbackInput[sub.id] || ''}
                          onChange={(e) =>
                            setFeedbackInput((prev) => ({ ...prev, [sub.id]: e.target.value }))
                          }
                          placeholder="e.g. Excellent presentation in Section B. Review Question 3 derivation."
                          className="w-full p-2.5 rounded-lg border border-[#CCCCCC] bg-white text-xs font-normal text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111] resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setGradingSubId(null)}
                          className="px-3 py-1.5 text-xs font-bold text-[#737373] hover:text-[#111111]"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGradeSubmit(sub)}
                          disabled={savingGradeId === sub.id}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#111111] hover:bg-[#262626] text-white text-xs font-extrabold transition-all shadow-xs disabled:opacity-50"
                        >
                          {savingGradeId === sub.id ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Saving...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} />
                              <span>Save Grade</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSubmissionsPanel;
