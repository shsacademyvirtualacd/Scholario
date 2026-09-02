import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  PenTool,
  Clock,
  Send,
  CheckCircle2,
  Award,
  ChevronRight,
  Info,
  History,
  Check,
  RefreshCw,
} from 'lucide-react';
import { IELTS_WRITING_PROMPTS, type WritingPrompt } from '../../data/ielts/writingPrompts';
import {
  submitIELTSWriting,
  getStudentIELTSWritingSubmissions,
  type IELTSWritingSubmission,
} from '../../lib/ieltsWritingService';
import { useAuth } from '../../features/auth/AuthContext';

export const IELTSWritingCenter: React.FC = () => {
  const { profile, user } = useAuth();
  const [selectedPrompt, setSelectedPrompt] = useState<WritingPrompt>(IELTS_WRITING_PROMPTS[0]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [essayText, setEssayText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'write' | 'history'>('write');
  const [studentSubmissions, setStudentSubmissions] = useState<IELTSWritingSubmission[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  // Timer
  const [secondsSpent, setSecondsSpent] = useState<number>(0);
  const isTimerRunning = true;

  // Word Count
  const words = essayText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const isMinWordsMet = wordCount >= selectedPrompt.minWords;

  // Filtered prompts
  const filteredPrompts = IELTS_WRITING_PROMPTS.filter((p) => {
    if (filterCategory === 'all') return true;
    return p.category.toLowerCase().includes(filterCategory.toLowerCase());
  });

  // Timer effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && activeView === 'write') {
      interval = setInterval(() => {
        setSecondsSpent((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, activeView]);

  // Load student's past submissions
  const loadHistory = async () => {
    const studentId = profile?.id || user?.id || 'guest_student';
    setIsLoadingHistory(true);
    try {
      const subs = await getStudentIELTSWritingSubmissions(studentId);
      setStudentSubmissions(subs);
    } catch (err) {
      console.warn('Error loading history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [profile?.id, user?.id]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Submit writing for manual teacher evaluation
  const handleSubmitWriting = async () => {
    if (!essayText.trim()) return;
    setIsSubmitting(true);

    try {
      const studentId = profile?.id || user?.id || 'student_' + Math.random().toString(36).substring(2, 7);
      const studentName = profile?.full_name || (user?.user_metadata as any)?.full_name || 'IELTS Student';
      const studentEmail = (profile as any)?.email || user?.email || '';

      await submitIELTSWriting({
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail,
        student_grade: 'IELTS',
        student_stream: selectedPrompt.category.includes('GT') ? 'General Training' : 'Academic',
        prompt_id: selectedPrompt.id,
        prompt_title: selectedPrompt.title,
        prompt_category: selectedPrompt.category,
        prompt_text: selectedPrompt.promptText,
        student_response: essayText,
        word_count: wordCount,
        time_spent_seconds: secondsSpent,
      });

      setSubmissionSuccess(true);
      await loadHistory();
    } catch (err) {
      console.error('Error submitting essay:', err);
      alert('Encountered an error saving submission. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30 uppercase tracking-wider">
              <PenTool className="w-3.5 h-3.5" />
              IELTS Writing Studio & Teacher Review
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Academic & General Training Writing
            </h1>
            <p className="text-sm sm:text-base text-slate-300">
              Compose essays, reports, and letters under real IELTS conditions. Submissions are routed directly to the Teacher Portal for manual 4-criteria rubric grading and detailed teacher feedback.
            </p>
          </div>

          {/* Nav Views */}
          <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl shrink-0 backdrop-blur-md border border-white/10">
            <button
              type="button"
              onClick={() => setActiveView('write')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'write' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              Compose Writing
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveView('history');
                loadHistory();
              }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeView === 'history' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Submissions ({studentSubmissions.length})
            </button>
          </div>
        </div>
      </div>

      {activeView === 'write' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Prompts Directory (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Writing Task Catalog ({filteredPrompts.length})
                </h2>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1 mb-4">
                {['all', 'Academic', 'GT', 'Paragraph'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      filterCategory === cat
                        ? 'bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>

              {/* Prompts list */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {filteredPrompts.map((prompt) => {
                  const isSelected = selectedPrompt.id === prompt.id;
                  return (
                    <button
                      key={prompt.id}
                      type="button"
                      onClick={() => {
                        setSelectedPrompt(prompt);
                        setSubmissionSuccess(false);
                        setSecondsSpent(0);
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500/50 shadow-sm ring-1 ring-purple-500/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            {prompt.category}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Min {prompt.minWords} w
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {prompt.title}
                        </h4>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Writing Editor & Submission (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Prompt Description Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    {selectedPrompt.category}
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedPrompt.title}
                  </h2>
                </div>

                {/* Timer Display */}
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 self-start sm:self-center">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <span>{formatTimer(secondsSpent)}</span>
                </div>
              </div>

              {/* Prompt Text */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {selectedPrompt.promptText}
              </div>

              {/* Visual Data Description for Task 1 */}
              {selectedPrompt.visualDataDescription && (
                <div className="p-3.5 bg-blue-50/60 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/50 text-xs text-blue-900 dark:text-blue-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Chart / Process Data Summary:
                  </div>
                  <p>{selectedPrompt.visualDataDescription}</p>
                </div>
              )}

              {/* Instructions list */}
              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-semibold text-slate-700 dark:text-slate-300">Task Requirements:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {selectedPrompt.keyInstructions.map((inst, idx) => (
                    <li key={idx}>{inst}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Success Feedback Banner */}
            {submissionSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-start gap-3 text-emerald-900 dark:text-emerald-200 shadow-sm"
              >
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">Submission Sent to Teacher Portal!</h4>
                  <p className="text-xs">
                    Your essay has been submitted for manual grading. Your instructor can now view your complete response in the Teacher Testing Center and provide official IELTS band scores across all 4 criteria.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveView('history')}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                  >
                    View in Submissions List <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Writing Textarea Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Write Your Response:
                </span>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className={isMinWordsMet ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                    {wordCount} Words
                  </span>
                  <span className="text-slate-400">/ Min {selectedPrompt.minWords}</span>
                </div>
              </div>

              <textarea
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Type your IELTS response here. Write clearly with topic sentences, cohesive transition devices, and appropriate vocabulary..."
                rows={14}
                className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm font-sans leading-relaxed"
              />

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {isMinWordsMet ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Word count requirement reached
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">
                      Need {selectedPrompt.minWords - wordCount} more words to reach target minimum.
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitWriting}
                  disabled={isSubmitting || wordCount < 10}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Submit for Teacher Grading
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* History & Feedback View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Your Submitted Writing Tasks
              </h3>
              <p className="text-xs text-slate-500">
                Track status and view manual teacher band scores and written comments.
              </p>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {isLoadingHistory ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Loading submissions...
            </div>
          ) : studentSubmissions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <PenTool className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
              <p className="text-sm font-medium">No writing submissions recorded yet.</p>
              <p className="text-xs text-slate-400">
                Select a writing task above and submit your response for instructor grading.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {studentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {sub.prompt_category}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 dark:text-white">
                          {sub.prompt_title}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Submitted on: {new Date(sub.submitted_at).toLocaleDateString()} at{' '}
                        {new Date(sub.submitted_at).toLocaleTimeString()} • {sub.word_count} words
                      </div>
                    </div>

                    <div className="self-start sm:self-center">
                      {sub.status === 'graded' ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold">
                          <Award className="w-4 h-4 text-amber-500" />
                          Graded: Band {sub.overall_band?.toFixed(1) || '7.0'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" /> Pending Teacher Review
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submission Text */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 max-h-40 overflow-y-auto leading-relaxed">
                    {sub.student_response}
                  </div>

                  {/* Teacher Feedback if Graded */}
                  {sub.status === 'graded' && (
                    <div className="p-4 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800/50 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-300">
                        <span>Teacher Assessment & IELTS Rubric Breakdown:</span>
                        <span>Evaluated by: {sub.teacher_name || 'Assigned Instructor'}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                          <div className="text-[10px] text-slate-500">Task Achievement</div>
                          <div className="font-bold text-purple-700 dark:text-purple-300">
                            Band {sub.task_achievement_band?.toFixed(1) || '—'}
                          </div>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                          <div className="text-[10px] text-slate-500">Coherence & Cohesion</div>
                          <div className="font-bold text-purple-700 dark:text-purple-300">
                            Band {sub.coherence_cohesion_band?.toFixed(1) || '—'}
                          </div>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                          <div className="text-[10px] text-slate-500">Lexical Resource</div>
                          <div className="font-bold text-purple-700 dark:text-purple-300">
                            Band {sub.lexical_resource_band?.toFixed(1) || '—'}
                          </div>
                        </div>
                        <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-purple-200 dark:border-purple-800 text-center">
                          <div className="text-[10px] text-slate-500">Grammatical Accuracy</div>
                          <div className="font-bold text-purple-700 dark:text-purple-300">
                            Band {sub.grammatical_accuracy_band?.toFixed(1) || '—'}
                          </div>
                        </div>
                      </div>

                      {sub.teacher_feedback && (
                        <div className="text-xs text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                          <strong>Instructor Comments:</strong> {sub.teacher_feedback}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
