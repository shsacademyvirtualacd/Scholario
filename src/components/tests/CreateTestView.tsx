import React, { useState, useMemo } from 'react';
import {
  FileCheck2,
  Settings,
  RotateCcw
} from 'lucide-react';
import { BOARDS, getGradesForBoard } from '../../lib/taxonomy';
import { FBISE_GRADE_9_CURRICULUM, normalizeFBISEGrade9Subject, FBISE_GRADE_10_CURRICULUM } from '../../lib/curriculumFBISE9';
import { fetchStoredMCQTest, getStoredShortQuestionsForChapter, getStoredLongQuestionsForChapter } from '../../lib/questionBankService';
import type { MCQQuestion } from '../../types/selfTest';
import type { StoredShortQuestion, StoredLongQuestion } from '../../types/questionBank';
import { toast } from 'sonner';
import { generateTestPDF } from './TestPDFGenerator';

export const CreateTestView: React.FC = () => {
  // Test Type Selection
  const [testType, setTestType] = useState<1 | 2 | 3>(1);

  // Scoping
  const [selectedBoard, setSelectedBoard] = useState('fbise');
  const [selectedGrade, setSelectedGrade] = useState('9');
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);

  // Question Counts
  const [mcqCount, setMcqCount] = useState<number>(10);
  const [shortCount, setShortCount] = useState<number>(5);
  const [longCount, setLongCount] = useState<number>(3);
  const [isGenerating, setIsGenerating] = useState(false);

  // Derived taxonomy
  const availableGrades = useMemo(() => getGradesForBoard(selectedBoard), [selectedBoard]);

  const currentGradeDef = useMemo(() => {
    return availableGrades.find((g) => g.grade === selectedGrade) || availableGrades[0];
  }, [availableGrades, selectedGrade]);

  const availableSubjects = useMemo(() => {
    if (!currentGradeDef) return [];
    const subjectsSet = new Set<string>();

    currentGradeDef.commonSubjects?.forEach((s) => subjectsSet.add(s));
    currentGradeDef.streams?.forEach((st) => st.subjects.forEach((s) => subjectsSet.add(s)));

    if (selectedGrade === '9' && selectedBoard === 'fbise') {
      Object.keys(FBISE_GRADE_9_CURRICULUM).forEach((s) => subjectsSet.add(s));
    }

    return Array.from(subjectsSet).sort();
  }, [currentGradeDef, selectedGrade, selectedBoard]);

  const currentChapters = useMemo(() => {
    if (selectedGrade === '9' && selectedBoard === 'fbise') {
      const canonical = normalizeFBISEGrade9Subject(selectedSubject) || selectedSubject;
      const curData = FBISE_GRADE_9_CURRICULUM[canonical];
      if (curData && curData.chapters) {
        return curData.chapters.map(ch => ch.name);
      }
    }
    if (selectedGrade === '10' && selectedBoard === 'fbise') {
      const curData = FBISE_GRADE_10_CURRICULUM[selectedSubject];
      if (curData && curData.chapters) {
        return curData.chapters.map(ch => ch.name);
      }
    }
    return [];
  }, [selectedGrade, selectedBoard, selectedSubject]);

  const shuffleArray = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGenerating(true);
      toast.info('Generating Question Paper...', { duration: 2000 });

      // 1. Fetch MCQs
      let mcqs: MCQQuestion[] = [];
      if (mcqCount > 0) {
        const mcqRes = await fetchStoredMCQTest({
          subject: selectedSubject,
          board: selectedBoard,
          grade: selectedGrade,
          count: mcqCount,
          examMode: selectedChapters.length > 0 ? 'multi_chapter' : 'full_syllabus',
          selectedChapters: selectedChapters.length > 0 ? selectedChapters : undefined,
        });

        if (mcqRes.questions.length < mcqCount) {
           toast.error(`Not enough MCQs available for this selection yet (${mcqRes.questions.length} found).`);
           setIsGenerating(false);
           return;
        }

        mcqs = mcqRes.questions;
      }

      // 2. Fetch Short Questions
      let shortQs: StoredShortQuestion[] = [];
      if ((testType === 2 || testType === 3) && shortCount > 0) {
        let pool: StoredShortQuestion[] = [];
        const chaps = selectedChapters.length > 0 ? selectedChapters : currentChapters;

        if (chaps.length > 0) {
          for (const ch of chaps) {
            const qs = await getStoredShortQuestionsForChapter(selectedSubject, ch, selectedGrade, selectedBoard);
            pool = pool.concat(qs);
          }
        } else {
          const qs = await getStoredShortQuestionsForChapter(selectedSubject, '', selectedGrade, selectedBoard);
          pool = pool.concat(qs);
        }

        if (pool.length < shortCount) {
           toast.error(`Not enough short questions available for this selection yet (${pool.length} found).`);
           setIsGenerating(false);
           return;
        }
        shortQs = shuffleArray(pool).slice(0, shortCount);
      }

      // 3. Fetch Long Questions
      let longQs: StoredLongQuestion[] = [];
      if (testType === 3 && longCount > 0) {
        let pool: StoredLongQuestion[] = [];
        const chaps = selectedChapters.length > 0 ? selectedChapters : currentChapters;

        if (chaps.length > 0) {
          for (const ch of chaps) {
            const qs = await getStoredLongQuestionsForChapter(selectedSubject, ch, selectedGrade, selectedBoard);
            pool = pool.concat(qs);
          }
        } else {
          const qs = await getStoredLongQuestionsForChapter(selectedSubject, '', selectedGrade, selectedBoard);
          pool = pool.concat(qs);
        }

        if (pool.length < longCount) {
           toast.error(`Not enough long questions available for this selection yet (${pool.length} found).`);
           setIsGenerating(false);
           return;
        }
        longQs = shuffleArray(pool).slice(0, longCount);
      }

      // 4. Generate PDF
      const success = await generateTestPDF({
        board: selectedBoard,
        grade: selectedGrade,
        subject: selectedSubject,
        mcqs,
        shortQuestions: shortQs,
        longQuestions: longQs,
        testType
      });

      if (success) {
        toast.success('Question Paper generated successfully!');
      } else {
        toast.error('Failed to generate PDF.');
      }
    } catch (err: any) {
      console.error('Generation Error:', err);
      toast.error('Error generating test: ' + (err.message || 'Unknown error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChapterToggle = (chapter: string) => {
    setSelectedChapters(prev =>
      prev.includes(chapter)
        ? prev.filter(c => c !== chapter)
        : [...prev, chapter]
    );
  };

  const handleBoardChange = (bId: string) => {
    setSelectedBoard(bId);
    setSelectedGrade('9');
    setSelectedChapters([]);
  };

  const resetForm = () => {
    setTestType(1);
    setSelectedBoard('fbise');
    setSelectedGrade('9');
    setSelectedSubject('Physics');
    setSelectedChapters([]);
    setMcqCount(10);
    setShortCount(5);
    setLongCount(3);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#E5E5E5] p-6 shadow-xs">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center shrink-0">
              <FileCheck2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#111111]">Create Custom Test</h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Generate a randomized question paper PDF from the unified question bank.
              </p>
            </div>
          </div>

          <button
            onClick={resetForm}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-600 hover:text-[#111111] transition-colors"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {/* Board & Grade Selectors (Matching standard UI) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
             <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-2">
              Select Board
            </label>
            <div className="flex flex-wrap gap-2">
              {BOARDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleBoardChange(b.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedBoard === b.id
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'bg-[#FAFAFA] border border-[#E5E5E5] text-[#525252] hover:border-[#111111]'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-2">
              Select Grade
            </label>
            <div className="flex flex-wrap gap-2">
              {availableGrades.map((g) => (
                <button
                  key={g.grade}
                  onClick={() => {
                    setSelectedGrade(g.grade);
                    setSelectedChapters([]);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedGrade === g.grade
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'bg-[#FAFAFA] border border-[#E5E5E5] text-[#525252] hover:border-[#111111]'
                  }`}
                >
                  {g.grade}th Grade
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subject & Test Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-2">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                setSelectedSubject(e.target.value);
                setSelectedChapters([]);
              }}
              className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
            >
              {availableSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
             <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-2">
              Test Type
            </label>
            <select
              value={testType}
              onChange={(e) => setTestType(Number(e.target.value) as 1 | 2 | 3)}
              className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
            >
              <option value={1}>Type 1 — MCQ Only</option>
              <option value={2}>Type 2 — MCQ + Short Questions</option>
              <option value={3}>Type 3 — MCQ + Short + Long Questions</option>
            </select>
          </div>
        </div>

        {/* Chapters */}
        <div className="mb-6">
           <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-2">
            Target Chapters (Optional, select multiple or leave empty for full syllabus)
          </label>
          {currentChapters.length > 0 ? (
             <div className="flex flex-wrap gap-2">
              {currentChapters.map((ch, idx) => (
                <button
                  key={idx}
                  onClick={() => handleChapterToggle(ch)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                    selectedChapters.includes(ch)
                      ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-xs'
                      : 'bg-white border-[#E5E5E5] text-[#525252] hover:border-blue-300'
                  }`}
                >
                  {ch}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-xs text-[#A3A3A3] italic bg-[#FAFAFA] p-3 rounded-xl border border-[#E5E5E5]">
              No predefined chapters found for this grade/subject. The generator will pull randomly from the full active bank.
            </div>
          )}
        </div>

        {/* Configuration (Counts) */}
        <div className="bg-[#FAFAFA] rounded-xl border border-[#E5E5E5] p-5 mb-6">
          <h3 className="text-sm font-black text-[#111111] mb-4 flex items-center gap-2">
            <Settings size={16} className="text-[#A3A3A3]" />
            Test Configuration
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-2">
                Number of MCQs
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={mcqCount}
                onChange={(e) => setMcqCount(Number(e.target.value))}
                className="w-full h-9 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
              />
            </div>

            {(testType === 2 || testType === 3) && (
              <div>
                <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-2">
                  Short Questions
                </label>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={shortCount}
                  onChange={(e) => setShortCount(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                />
              </div>
            )}

            {testType === 3 && (
              <div>
                <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-2">
                  Long Questions
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={longCount}
                  onChange={(e) => setLongCount(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-1 focus:ring-[#111111]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-xl bg-[#111111] text-white text-sm font-bold shadow-xs hover:bg-[#262626] transition-all cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Test PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
