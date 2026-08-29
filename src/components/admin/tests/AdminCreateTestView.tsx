import React, { useState, useEffect, useMemo, } from 'react';
import { FileText, Loader2, BookOpen, AlertCircle, Calendar, Award, User, Target, Layers, FileDown } from 'lucide-react';
import { getGradesForBoard, BOARDS, getSubjectsForStream } from '../../../lib/taxonomy';
import { loadBankData } from '../../../lib/questionBankService';
import { generateTestPDF } from '../../../lib/pdfGenerator';
import { toast } from 'sonner';
import type { StoredMCQ } from '../../../types/questionBank';

const AdminCreateTestView: React.FC = () => {
  // Form State
  const [board, setBoard] = useState('fbise');
  const [grade, setGrade] = useState('9');
  const [stream] = useState('all');
  const [subject, setSubject] = useState('Physics');
  const [chapter, setChapter] = useState('all');
  const [title, setTitle] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [totalMarks, setTotalMarks] = useState('50');
  const [dueDate, setDueDate] = useState('');

  // Question Types Configuration
  const [includeMCQs, setIncludeMCQs] = useState(true);
  const [mcqCount, setMcqCount] = useState(10);

  const [includeShort, setIncludeShort] = useState(false);
  const [shortCount, setShortCount] = useState(5);

  const [includeLong, setIncludeLong] = useState(false);
  const [longCount, setLongCount] = useState(3);

  // Bank Data State
  const [liveBank, setLiveBank] = useState<Record<string, Record<string, StoredMCQ[]>>>({});
  const [loadingBank, setLoadingBank] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fetch Live Bank Data on mount
  useEffect(() => {
    let mounted = true;
    setLoadingBank(true);
    loadBankData()
      .then((data) => {
        if (mounted) {
          setLiveBank(data || {});
          setLoadingBank(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load bank data', err);
        if (mounted) {
          setError('Failed to load question bank data.');
          setLoadingBank(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  // Taxonomy derived state
  const availableGrades = getGradesForBoard(board);

  // Make sure we have a valid subject selection
  useEffect(() => {
    const subjects = getSubjectsForStream(grade, stream);
    if (!subjects.includes(subject) && subjects.length > 0) {
      setSubject(subjects[0]);
    }
  }, [grade, stream, subject]);

  const availableSubjects = getSubjectsForStream(grade, stream);

  // Chapter list based on selected subject in liveBank
  const availableChapters = useMemo(() => {
    // Basic capitalization fix for lookup matching
    const subjectKey = subject;
    const subjData = liveBank[subjectKey] || {};
    return Object.keys(subjData);
  }, [liveBank, subject]);

  // Ensure chapter is valid when subject changes
  useEffect(() => {
    if (availableChapters.length > 0 && !availableChapters.includes(chapter) && chapter !== 'all') {
      setChapter('all');
    } else if (availableChapters.length === 0 && chapter !== 'all') {
      setChapter('all');
    }
  }, [availableChapters, chapter]);

  // Calculate available MCQs based on filters
  const availableMCQs = useMemo(() => {
    const subjData = liveBank[subject] || {};
    if (chapter === 'all') {
      // Aggregate all chapters
      return Object.values(subjData).flat();
    }
    return subjData[chapter] || [];
  }, [liveBank, subject, chapter]);

  const handleGenerateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim() || !teacherName.trim() || !totalMarks || !dueDate) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!includeMCQs && !includeShort && !includeLong) {
      setError('Please select at least one question type to include in the test.');
      return;
    }

    if (includeMCQs && mcqCount <= 0) {
      setError('MCQ count must be greater than 0.');
      return;
    }

    if (includeMCQs && mcqCount > availableMCQs.length) {
      setError(`Not enough MCQs available. Requested ${mcqCount}, but only ${availableMCQs.length} exist in the bank for the selected filters.`);
      return;
    }

    if (includeShort || includeLong) {
      // Memory check: "explicitly handle the empty state, fail cleanly, and alert the user."
      // Since Short and Long question banks are not implemented/populated yet.
      setError('Short and Long Questions are currently not available in the Question Bank. Please select MCQs only for now.');
      return;
    }

    try {
      setGenerating(true);
      // Logic to pick random MCQs
      const shuffled = [...availableMCQs].sort(() => 0.5 - Math.random());
      const selectedMCQs = shuffled.slice(0, mcqCount);

      console.log('Selected MCQs:', selectedMCQs);
      const pdfFile = await generateTestPDF({
        board,
        grade,
        subject,
        title,
        teacherName,
        totalMarks,
        mcqs: selectedMCQs,
      });


      const { supabase } = await import('../../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) throw new Error('Not authenticated.');

      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('title', title);
      formData.append('board', board);
      formData.append('subject', subject);
      formData.append('grade', grade);
      formData.append('stream', stream);
      formData.append('total_marks', totalMarks);
      formData.append('due_date', dueDate);
      formData.append('teacher_name', teacherName);

      const res = await fetch('/api/tests/create-generated', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      if (!res.ok) {
        const errorData = (await res.json().catch(() => null)) as any;
        throw new Error(errorData?.error || `Upload failed: ${res.status} ${res.statusText}`);
      }

      await res.json();

      toast.success('Test generated and published successfully!');

      // Optionally reset form
      setTitle('');
      setTeacherName('');
      setDueDate('');


    } catch (err: any) {
      console.error('Test generation error:', err);
      setError(err.message || 'An error occurred while generating the test.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-3xl shadow-xs overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111111] flex items-center justify-center text-[#F4C430] shadow-inner">
            <Target size={20} />
          </div>
          <div>
            <h2 className="text-base font-black text-[#111111]">Generate Custom Test Paper</h2>
            <p className="text-xs text-[#737373] mt-0.5">
              Pull questions from the live Question Bank and instantly generate a printable PDF for students.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {error && (
          <div className="mb-6 p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-[#DC2626] shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-[#DC2626] leading-relaxed">{error}</p>
          </div>
        )}

        <form onSubmit={handleGenerateTest} className="space-y-6">
          {/* Metadata Section */}
          <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider flex items-center gap-2 mb-2">
              <BookOpen size={14} className="text-[#737373]" />
              Syllabus & Test Scope
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-[#737373] mb-1.5 uppercase">Board</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:ring-1 focus:ring-black"
                >
                  {BOARDS.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#737373] mb-1.5 uppercase">Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:ring-1 focus:ring-black"
                >
                  {availableGrades.map((g) => (
                    <option key={g.grade} value={g.grade}>Grade {g.grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#737373] mb-1.5 uppercase">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:ring-1 focus:ring-black"
                >
                  {availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#737373] mb-1.5 uppercase">Chapter Filter</label>
                <select
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:ring-1 focus:ring-black"
                >
                  <option value="all">All Chapters</option>
                  {availableChapters.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Col: Test Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider flex items-center gap-2 mb-2">
                <FileText size={14} className="text-[#737373]" />
                Test Details
              </h3>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">Test Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Examination - Physics"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] text-sm font-semibold focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1.5">Teacher Name <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Displayed on header"
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#E5E5E5] text-sm font-semibold focus:ring-1 focus:ring-black"
                  />
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">Total Marks <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#E5E5E5] text-sm font-semibold focus:ring-1 focus:ring-black"
                    />
                    <Award size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1.5">Due Date <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#E5E5E5] text-sm font-semibold focus:ring-1 focus:ring-black"
                    />
                    <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Question Composition */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-[#111111] uppercase tracking-wider flex items-center gap-2 mb-2">
                <Layers size={14} className="text-[#737373]" />
                Question Types & Bank Selection
              </h3>

              <div className="bg-[#FAFAFA] border border-[#E5E5E5] rounded-2xl p-4 space-y-4">
                {/* MCQ Row */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeMCQs}
                      onChange={(e) => setIncludeMCQs(e.target.checked)}
                      className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm font-bold text-[#111111]">Multiple Choice Questions (MCQs)</span>
                  </label>
                  {includeMCQs && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#737373]">COUNT:</span>
                      <input
                        type="number"
                        min="1"
                        max={availableMCQs.length || 100}
                        value={mcqCount}
                        onChange={(e) => setMcqCount(parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center text-xs font-bold border border-[#E5E5E5] rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {includeMCQs && (
                  <div className="pl-7">
                    <div className="text-[11px] font-bold text-[#10B981] bg-[#ECFDF5] px-2 py-1 rounded inline-block">
                      {loadingBank ? 'Loading...' : `${availableMCQs.length} MCQs available in live bank for this scope`}
                    </div>
                  </div>
                )}

                <div className="h-px w-full bg-[#E5E5E5]"></div>

                {/* Short Questions Row */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeShort}
                      onChange={(e) => setIncludeShort(e.target.checked)}
                      className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm font-bold text-[#111111]">Short Answer Questions</span>
                  </label>
                  {includeShort && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#737373]">COUNT:</span>
                      <input
                        type="number"
                        min="1"
                        value={shortCount}
                        onChange={(e) => setShortCount(parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center text-xs font-bold border border-[#E5E5E5] rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {includeShort && (
                   <div className="pl-7">
                     <div className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-1 rounded inline-block">
                       0 available in bank (Not yet populated)
                     </div>
                   </div>
                )}

                <div className="h-px w-full bg-[#E5E5E5]"></div>

                {/* Long Questions Row */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLong}
                      onChange={(e) => setIncludeLong(e.target.checked)}
                      className="w-4 h-4 rounded text-black border-gray-300 focus:ring-black"
                    />
                    <span className="text-sm font-bold text-[#111111]">Long / Essay Questions</span>
                  </label>
                  {includeLong && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#737373]">COUNT:</span>
                      <input
                        type="number"
                        min="1"
                        value={longCount}
                        onChange={(e) => setLongCount(parseInt(e.target.value) || 0)}
                        className="w-16 h-8 text-center text-xs font-bold border border-[#E5E5E5] rounded-lg"
                      />
                    </div>
                  )}
                </div>

                {includeLong && (
                   <div className="pl-7">
                     <div className="text-[11px] font-bold text-[#DC2626] bg-[#FEF2F2] px-2 py-1 rounded inline-block">
                       0 available in bank (Not yet populated)
                     </div>
                   </div>
                )}

              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E5E5E5] flex justify-end">
            <button
              type="submit"
              disabled={generating || loadingBank}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#111111] hover:bg-[#262626] text-white text-sm font-black transition-all shadow-md disabled:opacity-50 cursor-pointer"
            >
              {generating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Generating Test...</span>
                </>
              ) : (
                <>
                  <FileDown size={18} />
                  <span>Generate PDF & Publish Test</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminCreateTestView;
