import React, { useState, useEffect } from 'react';
import {
  PenTool,
  Clock,
  CheckCircle2,
  FileText,
  Award,
  Search,
  RefreshCw,
  Check,
  MessageSquare,
} from 'lucide-react';
import {
  getAllIELTSWritingSubmissions,
  gradeIELTSWritingSubmission,
  type IELTSWritingSubmission,
} from '../../lib/ieltsWritingService';
import { useAuth } from '../../features/auth/AuthContext';

export const TeacherIELTSWritingGrading: React.FC = () => {
  const { profile, user } = useAuth();
  const [submissions, setSubmissions] = useState<IELTSWritingSubmission[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSubmission, setSelectedSubmission] = useState<IELTSWritingSubmission | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Grading Form State
  const [taskAchievement, setTaskAchievement] = useState<number>(7.0);
  const [coherenceCohesion, setCoherenceCohesion] = useState<number>(7.0);
  const [lexicalResource, setLexicalResource] = useState<number>(7.0);
  const [grammaticalAccuracy, setGrammaticalAccuracy] = useState<number>(7.0);
  const [teacherFeedback, setTeacherFeedback] = useState<string>('');
  const [isSavingGrade, setIsSavingGrade] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const loadSubmissions = async () => {
    setIsLoading(true);
    try {
      const data = await getAllIELTSWritingSubmissions();
      setSubmissions(data);
      if (data.length > 0 && !selectedSubmission) {
        setSelectedSubmission(data[0]);
        initGradingForm(data[0]);
      }
    } catch (err) {
      console.error('Error fetching IELTS submissions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, []);

  const initGradingForm = (sub: IELTSWritingSubmission) => {
    setTaskAchievement(sub.task_achievement_band || 7.0);
    setCoherenceCohesion(sub.coherence_cohesion_band || 7.0);
    setLexicalResource(sub.lexical_resource_band || 7.0);
    setGrammaticalAccuracy(sub.grammatical_accuracy_band || 7.0);
    setTeacherFeedback(sub.teacher_feedback || '');
    setSaveSuccess(false);
  };

  // Compute overall band (average rounded to nearest 0.5)
  const computedOverallBand = Math.round(((taskAchievement + coherenceCohesion + lexicalResource + grammaticalAccuracy) / 4) * 2) / 2;

  const handleSelectSubmission = (sub: IELTSWritingSubmission) => {
    setSelectedSubmission(sub);
    initGradingForm(sub);
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;
    setIsSavingGrade(true);
    setSaveSuccess(false);

    try {
      const teacherName = profile?.full_name || (user?.user_metadata as any)?.full_name || 'Instructor';
      const teacherId = profile?.id || user?.id || 'teacher_id';

      const updated = await gradeIELTSWritingSubmission(selectedSubmission.id, {
        teacher_id: teacherId,
        teacher_name: teacherName,
        overall_band: computedOverallBand,
        task_achievement_band: taskAchievement,
        coherence_cohesion_band: coherenceCohesion,
        lexical_resource_band: lexicalResource,
        grammatical_accuracy_band: grammaticalAccuracy,
        teacher_feedback: teacherFeedback,
      });

      setSelectedSubmission(updated);
      setSaveSuccess(true);
      await loadSubmissions();
    } catch (err) {
      console.error('Error saving grade:', err);
      alert('Failed to save manual grade. Please retry.');
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Filtered submissions
  const filteredList = submissions.filter((sub) => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        sub.student_name.toLowerCase().includes(q) ||
        sub.prompt_title.toLowerCase().includes(q) ||
        sub.prompt_category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold border border-purple-500/30">
            <PenTool className="w-3.5 h-3.5" />
            Teacher Assessment Portal
          </div>
          <h1 className="text-2xl font-bold">IELTS Writing Submissions & Manual Grading</h1>
          <p className="text-sm text-slate-300 max-w-2xl">
            Review student responses submitted via the Testing Center. Apply the official 4-criteria IELTS rubric (Band 1.0–9.0) and provide customized feedback.
          </p>
        </div>

        {/* Pending Badge */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-purple-500/30 flex items-center justify-center text-purple-300">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-300">Pending Evaluation</div>
            <div className="text-xl font-bold text-white">{pendingCount} Submissions</div>
          </div>
        </div>
      </div>

      {/* Main Layout: Submissions Queue + Grading Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Submissions Queue (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            {/* Search & Filters */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or task..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={loadSubmissions}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'
                }`}
              >
                All ({submissions.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('submitted')}
                className={`py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === 'submitted' ? 'bg-white dark:bg-slate-700 shadow-sm text-purple-600 font-bold' : 'text-slate-500'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('graded')}
                className={`py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === 'graded' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 font-bold' : 'text-slate-500'
                }`}
              >
                Graded ({submissions.length - pendingCount})
              </button>
            </div>

            {/* Submissions List */}
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading writing submissions...
              </div>
            ) : filteredList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <FileText className="w-6 h-6 mx-auto opacity-40" />
                <p>No matching submissions found.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {filteredList.map((sub) => {
                  const isSelected = selectedSubmission?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSelectSubmission(sub)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500/60 ring-1 ring-purple-500/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                              {sub.student_name}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {sub.prompt_category}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                            {sub.prompt_title}
                          </p>
                          <div className="text-[10px] text-slate-400">
                            {new Date(sub.submitted_at).toLocaleDateString()} • {sub.word_count} words
                          </div>
                        </div>

                        <div className="shrink-0">
                          {sub.status === 'graded' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                              Band {sub.overall_band?.toFixed(1)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                              Review
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Grading Workbench (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedSubmission ? (
            <div className="space-y-6">
              {/* Submission Content Review Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">
                      {selectedSubmission.prompt_category}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {selectedSubmission.prompt_title}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Student: <strong>{selectedSubmission.student_name}</strong>
                  </div>
                </div>

                {/* Prompt Text Reference */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                  <strong className="block text-slate-900 dark:text-white mb-1">Task Prompt:</strong>
                  {selectedSubmission.prompt_text}
                </div>

                {/* Student's Written Response */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>Student's Response ({selectedSubmission.word_count} words):</span>
                    <span className="text-slate-400 text-[11px]">
                      Time spent: {Math.round(selectedSubmission.time_spent_seconds / 60)} mins
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white whitespace-pre-wrap font-serif leading-relaxed max-h-72 overflow-y-auto">
                    {selectedSubmission.student_response}
                  </div>
                </div>
              </div>

              {/* Official 4-Criteria IELTS Rubric Card */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">
                      IELTS 4-Criteria Manual Evaluation
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-900 dark:text-purple-300 font-bold text-sm border border-purple-200 dark:border-purple-800">
                    Overall: Band {computedOverallBand.toFixed(1)}
                  </div>
                </div>

                {/* 4 Rubric Criteria Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Task Achievement */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Task Achievement / Response
                      </label>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        Band {taskAchievement.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4.0"
                      max="9.0"
                      step="0.5"
                      value={taskAchievement}
                      onChange={(e) => setTaskAchievement(parseFloat(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  {/* Coherence & Cohesion */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Coherence & Cohesion
                      </label>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        Band {coherenceCohesion.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4.0"
                      max="9.0"
                      step="0.5"
                      value={coherenceCohesion}
                      onChange={(e) => setCoherenceCohesion(parseFloat(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  {/* Lexical Resource */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Lexical Resource
                      </label>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        Band {lexicalResource.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4.0"
                      max="9.0"
                      step="0.5"
                      value={lexicalResource}
                      onChange={(e) => setLexicalResource(parseFloat(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>

                  {/* Grammatical Range & Accuracy */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Grammatical Range & Accuracy
                      </label>
                      <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                        Band {grammaticalAccuracy.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="4.0"
                      max="9.0"
                      step="0.5"
                      value={grammaticalAccuracy}
                      onChange={(e) => setGrammaticalAccuracy(parseFloat(e.target.value))}
                      className="w-full accent-purple-600"
                    />
                  </div>
                </div>

                {/* Teacher Written Feedback */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-purple-600" />
                    Teacher Written Feedback & Suggestions:
                  </label>
                  <textarea
                    value={teacherFeedback}
                    onChange={(e) => setTeacherFeedback(e.target.value)}
                    placeholder="Provide specific feedback on vocabulary selection, paragraph cohesion, thesis clarity, and grammatical precision..."
                    rows={4}
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                {saveSuccess && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Grade and feedback successfully recorded! The student can view their updated evaluation in the student Testing Center.
                  </div>
                )}

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSaveGrade}
                  disabled={isSavingGrade}
                  className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSavingGrade ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Saving Evaluation...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" /> Save Manual IELTS Grade & Publish Feedback
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              Select a submission from the left queue to begin manual grading.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
