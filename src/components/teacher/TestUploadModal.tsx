import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Calendar,
  Award,
  User,
} from 'lucide-react';
import { getGradesForBoard, getStreamsForGrade } from '../../lib/taxonomy';
import { uploadTestPaperToR2, getAllTeachers, getSubjectsForStream } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import type { TestPaper, Teacher } from '../../types';

interface TestUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newTest: TestPaper) => void;
  defaultBoard?: string;
  defaultGrade?: string;
  defaultSubject?: string;
}

export const TestUploadModal: React.FC<TestUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultBoard = 'fbise',
  defaultGrade = '10',
  defaultSubject = '',
}) => {
  const { user, profile } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>('');

  const [board, setBoard] = useState<string>(defaultBoard || 'fbise');
  const [grade, setGrade] = useState<string>(defaultGrade);
  const [stream, setStream] = useState<string>('all');
  const [subject, setSubject] = useState<string>(defaultSubject);
  const [title, setTitle] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [totalMarks, setTotalMarks] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    // Default 3 days from now
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Sync board default if prop changes
  useEffect(() => {
    if (defaultBoard) setBoard(defaultBoard);
  }, [defaultBoard]);

  // Fetch teachers when modal is opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingTeachers(true);

    getAllTeachers()
      .then((data) => {
        if (!isMounted) return;
        const activeList = data.filter((t) => t.is_active !== false);
        const listToUse = activeList.length > 0 ? activeList : data;
        setTeachers(listToUse);

        // Role-based defaulting:
        // If current user is a teacher, default to matching teacher or self
        if (profile?.role === 'teacher') {
          const userEmail = user?.email || (profile as any)?.email;
          const matched = listToUse.find(
            (t) =>
              (profile.full_name && t.full_name.toLowerCase() === profile.full_name.toLowerCase()) ||
              (userEmail && t.email && t.email.toLowerCase() === userEmail.toLowerCase()) ||
              t.id === profile.id
          );

          if (matched) {
            setSelectedTeacherId(matched.id);
            setSelectedTeacherName(matched.full_name);
          } else {
            setSelectedTeacherId(profile.id || '');
            setSelectedTeacherName(profile.full_name || '');
          }
        } else {
          // If admin, leave empty so admin explicitly selects the teacher
          setSelectedTeacherId('');
          setSelectedTeacherName('');
        }
      })
      .catch((err) => {
        console.error('Failed to load teachers for test upload modal:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingTeachers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, profile, user]);

  // Available grades for selected board
  const availableGrades = getGradesForBoard(board);

  // Available streams for current grade and board
  const availableStreams = getStreamsForGrade(grade, board);

  // Available subjects for selected board + grade + stream
  const availableSubjects = React.useMemo(() => {
    if (stream === 'all') {
      const gDef = availableGrades.find((g) => g.grade === grade);
      const set = new Set<string>();
      if (gDef) {
        gDef.commonSubjects?.forEach((s) => set.add(s));
        gDef.streams?.forEach((st) => st.subjects.forEach((s) => set.add(s)));
      }
      return Array.from(set).sort();
    }
    return getSubjectsForStream(grade, stream, board);
  }, [grade, stream, board, availableGrades]);

  // Reset or adjust subject when grade/stream changes
  useEffect(() => {
    if (availableSubjects.length > 0 && (!subject || !availableSubjects.includes(subject))) {
      setSubject(availableSubjects[0]);
    }
  }, [grade, stream, availableSubjects]);

  if (!isOpen) return null;

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedTeacherId(val);
    const found = teachers.find((t) => t.id === val);
    if (found) {
      setSelectedTeacherName(found.full_name);
    } else if (val && val === profile?.id) {
      setSelectedTeacherName(profile.full_name || '');
    } else if (!val) {
      setSelectedTeacherName('');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (!title) {
        setTitle(f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Please select a question paper file to upload (PDF, Image, or Doc).');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a test title or chapter name.');
      return;
    }
    if (!subject) {
      setError('Please select a subject.');
      return;
    }
    if (!selectedTeacherName.trim()) {
      setError('Please select the subject teacher for this test paper.');
      return;
    }
    if (!dueDate) {
      setError('Please set a valid due date for test submission.');
      return;
    }

    setUploading(true);
    setProgress(0);

    const parsedMarks = totalMarks.trim() ? parseInt(totalMarks.trim(), 10) : 100;
    if (totalMarks.trim() && (isNaN(parsedMarks) || parsedMarks <= 0)) {
      setError('Please enter a valid positive number for total marks (e.g. 50 or 100).');
      setUploading(false);
      return;
    }

    try {
      const fileType = file.type.includes('image')
        ? 'image'
        : file.name.endsWith('.doc') || file.name.endsWith('.docx')
        ? 'doc'
        : 'pdf';

      const result = await uploadTestPaperToR2(
        file,
        {
          title: title.trim(),
          instructions: instructions.trim() || undefined,
          board,
          subject,
          grade,
          stream,
          total_marks: parsedMarks,
          due_date: dueDate,
          teacher_id: selectedTeacherId || null,
          teacher_name: selectedTeacherName.trim(),
          uploaded_by: profile?.id || null,
          uploaded_by_name: profile?.full_name || null,
          file_type: fileType,
        },
        (pct) => setProgress(pct)
      );

      const createdTest: TestPaper = result.test || {
        id: `test_${Date.now()}`,
        title: title.trim(),
        instructions: instructions.trim() || null,
        board: board || 'fbise',
        board_id: board || 'fbise',
        subject,
        grade,
        stream,
        teacher_id: selectedTeacherId || null,
        teacher_name: selectedTeacherName.trim(),
        uploaded_by: profile?.id || null,
        uploaded_by_name: profile?.full_name || null,
        file_url: `/api/tests/view/test_${Date.now()}`,
        file_type: fileType,
        file_size_bytes: file.size,
        total_marks: parsedMarks,
        due_date: dueDate,
        published_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        submissions_count: 0,
        graded_count: 0,
      };

      onSuccess(createdTest);
      onClose();
    } catch (err: any) {
      console.error('Test upload error:', err);
      setError(err.message || 'Failed to upload test paper. Please verify file and retry.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      id="test-upload-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div
        id="test-upload-modal-container"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-[#E5E5E5] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center shadow-xs">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111111]">Upload Test Paper</h3>
              <p className="text-xs text-[#737373]">Publish an assessment paper for students with subject teacher assignment.</p>
            </div>
          </div>
          <button
            id="close-test-upload-btn"
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E5] transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs text-[#991B1B] flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-[#DC2626] mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Board Curriculum Selector */}
          <div className="border-b border-[#E5E5E5] pb-3">
            <label className="block text-xs font-bold text-[#111111] mb-2">
              Board Curriculum <span className="text-[#DC2626]">*</span>
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setBoard('fbise');
                  setGrade('10');
                  setStream('all');
                }}
                disabled={uploading}
                className={`pb-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  board === 'fbise'
                    ? 'border-[#F4C430] text-[#111111]'
                    : 'border-transparent text-[#737373] hover:text-[#111111]'
                }`}
              >
                Federal Board (FBISE)
              </button>
              <button
                type="button"
                onClick={() => {
                  setBoard('sindh');
                  setGrade('10');
                  setStream('all');
                }}
                disabled={uploading}
                className={`pb-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  board === 'sindh'
                    ? 'border-[#F4C430] text-[#111111]'
                    : 'border-transparent text-[#737373] hover:text-[#111111]'
                }`}
              >
                Sindh Board
              </button>
            </div>
          </div>

          {/* Grade & Stream Selection (Crucial Scoping) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Target Grade <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="test-grade-select"
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  setStream('all');
                }}
                disabled={uploading}
                className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
              >
                {availableGrades.map((g) => (
                  <option key={g.grade} value={g.grade}>
                    Grade {g.grade} ({g.displayName} {board === 'sindh' ? 'Sindh' : 'FBISE'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Program / Stream <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="test-stream-select"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                disabled={uploading}
                className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
              >
                <option value="all">All Streams (Common)</option>
                {availableStreams.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject & Subject Teacher (Explicit decoupled teacher selection) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Subject <span className="text-[#DC2626]">*</span>
              </label>
              <select
                id="test-subject-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={uploading}
                className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Subject Teacher <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <select
                  id="test-teacher-select"
                  value={selectedTeacherId}
                  onChange={handleTeacherChange}
                  disabled={uploading || loadingTeachers}
                  className="w-full h-10 px-3 pl-8 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                >
                  <option value="">
                    {loadingTeachers ? 'Loading teachers...' : '-- Select Subject Teacher --'}
                  </option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name}
                    </option>
                  ))}
                  {/* If the current teacher profile isn't in teachers table, allow it */}
                  {selectedTeacherName &&
                    !teachers.some((t) => t.id === selectedTeacherId || t.full_name === selectedTeacherName) && (
                      <option value={selectedTeacherId || 'custom'}>{selectedTeacherName}</option>
                    )}
                </select>
                <User size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373] pointer-events-none" />
              </div>
              <p className="text-[11px] text-[#737373] mt-1">
                {profile?.role === 'admin'
                  ? 'Select the teacher who teaches this course.'
                  : 'Assigned teacher displayed on student test papers.'}
              </p>
            </div>
          </div>

          {/* Total Marks & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Total Marks <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  id="test-total-marks-input"
                  placeholder="e.g. 50 or 100"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  disabled={uploading}
                  className="w-full h-10 px-3 pl-8 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] placeholder:text-[#A3A3A3] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                />
                <Award size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] mb-1.5">
                Submission Due Date <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="test-due-date-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={uploading}
                  className="w-full h-10 px-3 pl-8 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
                />
                <Calendar size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373]" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Test Title / Chapter <span className="text-[#DC2626]">*</span>
            </label>
            <input
              type="text"
              id="test-title-input"
              placeholder="e.g. Chapter 4: Chemical Bonding Test"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] bg-white text-sm font-semibold text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111]"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Instructions for Students <span className="text-[#737373] font-normal">(optional)</span>
            </label>
            <textarea
              id="test-instructions-input"
              rows={2}
              placeholder="e.g. Attempt all sections. Time allowed: 90 minutes. Scan your answer sheet clearly into a single PDF before uploading."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={uploading}
              className="w-full p-3 rounded-xl border border-[#E5E5E5] bg-white text-xs font-normal text-[#111111] focus:outline-hidden focus:ring-2 focus:ring-[#111111] resize-none"
            />
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1.5">
              Question Paper File <span className="text-[#DC2626]">*</span>
            </label>
            <div
              id="test-drop-zone"
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all ${
                dragActive
                  ? 'border-[#111111] bg-[#F5F5F5]'
                  : file
                  ? 'border-[#22C55E] bg-[#F0FDF4]'
                  : 'border-[#E5E5E5] bg-[#FAFAFA] hover:bg-[#F5F5F5]'
              }`}
            >
              <input
                type="file"
                id="test-file-input"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 text-[#16A34A] flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-[#111111] truncate max-w-xs">{file.name}</p>
                    <p className="text-[11px] text-[#737373]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-[#E5E5E5] text-[#525252] flex items-center justify-center mx-auto">
                    <Upload size={15} />
                  </div>
                  <p className="text-xs font-bold text-[#111111]">
                    Drag & drop question paper, or <span className="underline">browse</span>
                  </p>
                  <p className="text-[11px] text-[#737373]">Supports PDF, JPG, PNG, DOC (max 25MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar if Uploading */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#525252]">
                <span>Uploading test paper to Cloudflare storage...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#111111] transition-all duration-200 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E5E5]">
            <button
              type="button"
              id="cancel-test-upload-btn"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#525252] hover:bg-[#F5F5F5] transition-colors disabled:opacity-40 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-test-upload-btn"
              disabled={uploading || !file || !selectedTeacherName.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#262626] text-white text-xs font-extrabold transition-all shadow-xs disabled:opacity-40 disabled:hover:bg-[#111111] cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Publish Test Paper</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestUploadModal;
