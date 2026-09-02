import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  RotateCcw,
  ChevronRight,
  Info,
} from 'lucide-react';
import { IELTS_READING_PASSAGES, type ReadingPassage } from '../../data/ielts/readingPassages';

export const IELTSReadingCenter: React.FC = () => {
  const [selectedPassage, setSelectedPassage] = useState<ReadingPassage>(IELTS_READING_PASSAGES[0]);
  const [userAnswers, setUserAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'split' | 'passage' | 'questions'>('split');
  const [highlightedParagraph, setHighlightedParagraph] = useState<string | null>(null);

  // Handle selecting an answer
  const handleSelectOption = (questionId: string, optionKey: 'A' | 'B' | 'C' | 'D') => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  // Reset test
  const handleResetPassageTest = () => {
    setUserAnswers({});
    setIsSubmitted(false);
    setHighlightedParagraph(null);
  };

  // Calculate score
  const totalQuestions = selectedPassage.questions.length;
  const correctCount = selectedPassage.questions.filter(
    (q) => userAnswers[q.id] === q.correctAnswer
  ).length;
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  // Approximate IELTS Band
  const getReadingBand = (correct: number, total: number): number => {
    const ratio = correct / total;
    if (ratio >= 0.9) return 9.0;
    if (ratio >= 0.8) return 8.0;
    if (ratio >= 0.7) return 7.0;
    if (ratio >= 0.6) return 6.0;
    if (ratio >= 0.5) return 5.5;
    return 4.5;
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-blue-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30 uppercase tracking-wider">
              <BookOpen className="w-3.5 h-3.5" />
              IELTS Reading Comprehension Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Authentic Passages & Auto-Graded Questions
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Select any of the 3 comprehensive reading passages. Read the labeled paragraphs and answer the tied comprehension questions with instant feedback and paragraph citations.
            </p>
          </div>

          {/* Quick Passage Tabs */}
          <div className="flex flex-wrap md:flex-col gap-2 shrink-0">
            {IELTS_READING_PASSAGES.map((passage) => {
              const isSelected = selectedPassage.id === passage.id;
              return (
                <button
                  key={passage.id}
                  type="button"
                  onClick={() => {
                    setSelectedPassage(passage);
                    handleResetPassageTest();
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all text-left flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                >
                  <span>Passage {passage.number}: {passage.moduleType}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Passage Info Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              Passage {selectedPassage.number} ({selectedPassage.moduleType})
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> ~{selectedPassage.estimatedReadingMinutes} min read
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              • {selectedPassage.wordCount} words
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {selectedPassage.title}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {selectedPassage.subtitle}
          </p>
        </div>

        {/* View Toggle (Mobile / Small Screens) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={() => setActiveTab('split')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'split' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Split View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('passage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'passage' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Full Passage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'questions' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-sm' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Questions ({selectedPassage.questions.length})
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Passage Reader (6 or 12 cols based on view) */}
        {(activeTab === 'split' || activeTab === 'passage') && (
          <div className={`${activeTab === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4`}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm max-h-[750px] overflow-y-auto space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Reading Passage Text
                </span>
                <span className="text-xs text-slate-400">
                  Click any paragraph to highlight
                </span>
              </div>

              {selectedPassage.paragraphs.map((p) => {
                const isHighlighted = highlightedParagraph === p.label || highlightedParagraph === `Paragraph ${p.label}`;
                return (
                  <div
                    key={p.label}
                    onClick={() => setHighlightedParagraph(isHighlighted ? null : p.label)}
                    className={`p-4 rounded-xl transition-all cursor-pointer border ${
                      isHighlighted
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400/60 shadow-sm'
                        : 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                        {p.label}
                      </span>
                      {p.heading && (
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {p.heading}
                        </h4>
                      )}
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-serif">
                      {p.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Right: Auto-Graded Comprehension Questions */}
        {(activeTab === 'split' || activeTab === 'questions') && (
          <div className={`${activeTab === 'split' ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-5`}>
            {/* Score Banner when Submitted */}
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-lg flex items-center justify-between gap-4"
              >
                <div>
                  <div className="text-xs text-blue-300 font-medium">Test Results Completed</div>
                  <div className="text-2xl font-black mt-0.5">
                    {correctCount} / {totalQuestions} Correct ({scorePercent}%)
                  </div>
                  <div className="text-xs text-blue-200 mt-1">
                    Estimated Reading Band: <strong>Band {getReadingBand(correctCount, totalQuestions).toFixed(1)}</strong>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetPassageTest}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Try Again
                </button>
              </motion.div>
            )}

            {/* Questions List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-h-[750px] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  Comprehension Questions ({selectedPassage.questions.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Answer all questions below
                </span>
              </div>

              <div className="space-y-6">
                {selectedPassage.questions.map((q, qIndex) => {
                  const selectedOpt = userAnswers[q.id];
                  const optionLetters: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

                  return (
                    <div
                      key={q.id}
                      className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-3"
                    >
                      {/* Question Header */}
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {qIndex + 1}
                        </span>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {q.question}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setHighlightedParagraph(q.paragraphRef.replace('Paragraph ', ''));
                              setActiveTab('split');
                            }}
                            className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            <Info className="w-3 h-3" /> Clue in: {q.paragraphRef}
                          </button>
                        </div>
                      </div>

                      {/* Options Grid */}
                      <div className="space-y-2 pt-1 pl-9">
                        {q.options.map((optionText, optIdx) => {
                          const letter = optionLetters[optIdx];
                          const isThisSelected = selectedOpt === letter;
                          const isThisCorrect = q.correctAnswer === letter;

                          let btnClasses = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 text-slate-800 dark:text-slate-200';

                          if (isSubmitted) {
                            if (isThisCorrect) {
                              btnClasses = 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-medium';
                            } else if (isThisSelected && !isThisCorrect) {
                              btnClasses = 'bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200 line-through';
                            }
                          } else if (isThisSelected) {
                            btnClasses = 'bg-blue-50 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 text-blue-900 dark:text-blue-200 font-semibold ring-1 ring-blue-500';
                          }

                          return (
                            <button
                              key={letter}
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleSelectOption(q.id, letter)}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start gap-3 ${btnClasses}`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md text-[11px] font-bold flex items-center justify-center shrink-0 ${
                                  isThisSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {letter}
                              </span>
                              <span className="leading-relaxed">{optionText}</span>
                              {isSubmitted && isThisCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                              )}
                              {isSubmitted && isThisSelected && !isThisCorrect && (
                                <XCircle className="w-4 h-4 text-rose-600 ml-auto shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Explanation Reveal */}
                      {isSubmitted && (
                        <div className="mt-3 p-3 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/50 text-xs text-blue-950 dark:text-blue-200 pl-9 space-y-1">
                          <div className="font-bold text-blue-900 dark:text-blue-300">
                            Explanation ({q.paragraphRef}):
                          </div>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit & Check Answers Button */}
              {!isSubmitted ? (
                <button
                  type="button"
                  onClick={() => setIsSubmitted(true)}
                  disabled={Object.keys(userAnswers).length === 0}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Check Answers & Score Test ({Object.keys(userAnswers).length}/{totalQuestions} Answered)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleResetPassageTest}
                  className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" /> Reset and Retake Passage {selectedPassage.number}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
