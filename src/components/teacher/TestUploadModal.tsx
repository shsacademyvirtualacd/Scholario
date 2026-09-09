import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Edit3,
} from 'lucide-react';
import { getGradesForBoard, getStreamsForGrade } from '../../lib/taxonomy';
import { uploadTestPaperToR2, getAllTeachers, getAllRoster, getSubjectsForStream } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState<boolean>(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedTeacherName, setSelectedTeacherName] = useState<string>(() => profile?.full_name || 'Admin / Department Head');
  const [isCustomTeacher, setIsCustomTeacher] = useState<boolean>(false);
  const [customTeacherName, setCustomTeacherName] = useState<string>('');

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

  // Fetch teachers & roster when modal is opened
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingTeachers(true);

    Promise.all([
      getAllTeachers().catch(() => []),
      getAllRoster().catch(() => []),
    ])
      .then(([teacherRows, rosterRows]) => {
        if (!isMounted) return;

        const combinedMap = new Map<string, Teacher>();

        // 1. Add teacher table rows
        (teacherRows || []).forEach((t) => {
          if (t && t.id) combinedMap.set(t.id, t);
        });

        // 2. Add roster teachers and admins
        (rosterRows || []).forEach((r) => {
          if (r && (r.role === 'teacher' || r.role === 'admin')) {
            const existingByName = Array.from(combinedMap.values()).find(
              (x) => x.full_name.toLowerCase() === r.full_name.toLowerCase()
            );
            if (!combinedMap.has(r.id) && !existingByName) {
              combinedMap.set(r.id, {
                id: r.id,
                full_name: r.full_name,
                email: r.email,
                phone: r.phone,
                subjects: r.subjects || [],
                is_active: true,
              } as unknown as Teacher);
            }
          }
        });

        const activeList = Array.from(combinedMap.values()).filter((t) => t.is_active !== false);
        setTeachers(activeList);

        // Role-based defaulting:
        if (profile?.role === 'teacher') {
          const userEmail = user?.email || (profile as any)?.email;
          const matched = activeList.find(
            (t) =>
              (profile.full_name && t.full_name.toLowerCase() === profile.full_name.toLowerCase()) ||
              (userEmail && t.email && t.email.toLowerCase() === userEmail.toLowerCase()) ||
              t.id === profile.id
          );

          if (matched) {
            setSelectedTeacherId(matched.id);
            setSelectedTeacherName(matched.full_name);
          } else {
            setSelectedTeacherId(profile.id || 'current_teacher');
            setSelectedTeacherName(profile.full_name || 'Subject Teacher');
          }
        } else {
          // Admin role: default to first available teacher, or current admin
          if (activeList.length > 0) {
            setSelectedTeacherId(activeList[0].id);
            setSelectedTeacherName(activeList[0].full_name);
          } else {
            const fallbackName = profile?.full_name || 'Admin / Department Head';
            setSelectedTeacherId(profile?.id || 'admin_default');
            setSelectedTeacherName(fallbackName);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load teachers for test upload modal:', err);
        const fallbackName = profile?.full_name || 'Admin / Department Head';
        setSelectedTeacherId(profile?.id || 'admin_default');
        setSelectedTeacherName(fallbackName);
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
  }, [grade, stream, availableSubjects, subject]);

  const handleTeacherChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__custom__') {
      setIsCustomTeacher(true);
      setSelectedTeacherId('');
      return;
    }
    setIsCustomTeacher(false);
    setSelectedTeacherId(val);
    const found = teachers.find((t) => t.id === val);
    if (found) {
      setSelectedTeacherName(found.full_name);
    } else if (val && val === profile?.id) {
      setSelectedTeacherName(profile.full_name || 'Admin');
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

  const effectiveTeacherName = isCustomTeacher
    ? customTeacherName.trim()
    : selectedTeacherName.trim();

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
    if (!effectiveTeacherName) {
      setError('Please select or enter the subject teacher for this test paper.');
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
          teacher_id: isCustomTeacher ? null : selectedTeacherId || null,
          teacher_name: effectiveTeacherName,
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
        teacher_id: isCustomTeacher ? null : selectedTeacherId || null,
        teacher_name: effectiveTeacherName,
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

  useModalScrollLock(isOpen);

  if (!isOpen) return null;

  return createPortal(
    <div
      id="test-upload-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
    >
      <div
        id="test-upload-modal-container"
        className="modal-container bg-white dark:bg-[#18181B] w-full max-w-2xl h-[92dvh] max-h-[92dvh] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-[#E5E5E5] dark:border-[#27272A] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-[#E5E5E5] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#141416] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111111] dark:bg-[#27272A] text-white dark:text-[#F4C430] flex items-center justify-center shadow-xs shrink-0">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#111111] dark:text-[#F4F4F5]">Upload Test Paper</h3>
              <p className="text-xs text-[#737373] dark:text-[#A1A1AA]">Publish an assessment paper for students with subject teacher assignment.</p>
            </div>
          </div>
          <button
            id="close-test-upload-btn"
            onClick={onClose}
            disabled={uploading}
            className="p-1.5 rounded-lg text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F5] hover:bg-[#E5E5E5] dark:hover:bg-[#27272A] transition-colors disabled:opacity-40 cursor-pointer shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Form Body - Scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-[#FEF2F2] dark:bg-rose-950/40 border border-[#FCA5A5] dark:border-rose-800 rounded-xl text-xs text-[#991B1B] dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 text-[#DC2626] dark:text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Board Curriculum Selector */}
          <div className="border-b border-[#E5E5E5] dark:border-[#27272A] pb-3">
            <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5] mb-2">
              Board Curriculum <span className="text-[#DC2626] dark:text-rose-400">*</span>
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
                    ? 'border-[#F4C430] text-[#111111] dark:text-[#F4C430]'
                    : 'border-transparent text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F5]'
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
                    ? 'border-[#F4C430] text-[#111111] dark:text-[#F4C430]'
                    : 'border-transparent text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F5]'
                }`}
              >
                Sindh Board
              </button>
              <button
                type="button"
                onClick={() => {
                  setBoard('ielts');
                  setGrade('10');
                  setStream('all');
                }}
                disabled={uploading}
                className={`pb-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  board === 'ielts'
                    ? 'border-[#F4C430] text-[#111111] dark:text-[#F4C430]'
                    : 'border-transparent text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#F4F4F5]'
                }`}
              >
                IELTS
              </button>
            </div>
          </div>

          {/* Grade & Stream Selection (Crucial Scoping) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5] mb-1.5">
                Target Grade <span className="text-[#DC2626] dark:text-rose-400">*</span>
              </label>
              <select
                id="test-grade-select"
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  setStream('all');
                }}
                disabled={uploading}
                className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] text-sm font-semibold text-[#111111] dark:text-[#F4F4F5] focus:outline-hidden focus:ring-2 focus:ring-[#111111] dark:focus:ring-[#F4C430]"
              >
                {availableGrades.map((g) => {
                  const bLabel = board === 'sindh' ? 'Sindh' : board === 'ielts' ? 'IELTS' : board === 'fbise' ? 'FBISE' : board.toUpperCase();
                  return (
                    <option key={g.grade} value={g.grade} className="bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4F4F5]">
                      Grade {g.grade} ({g.displayName} {bLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5] mb-1.5">
                Program / Stream <span className="text-[#DC2626] dark:text-rose-400">*</span>
              </label>
              <select
                id="test-stream-select"
                value={stream}
                onChange={(e) => setStream(e.target.value)}
                disabled={uploading}
                className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] text-sm font-semibold text-[#111111] dark:text-[#F4F4F5] focus:outline-hidden focus:ring-2 focus:ring-[#111111] dark:focus:ring-[#F4C430]"
              >
                <option value="all" className="bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4F4F5]">All Streams (Common)</option>
                {availableStreams.map((s) => (
                  <option key={s.name} value={s.name} className="bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4F4F5]">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject & Subject Teacher (Explicit decoupled teacher selection) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5] mb-1.5">
                Subject <span className="text-[#DC2626] dark:text-rose-400">*</span>
              </label>
              <select
                id="test-subject-select"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={uploading}
                className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] text-sm font-semibold text-[#111111] dark:text-[#F4F4F5] focus:outline-hidden focus:ring-2 focus:ring-[#111111] dark:focus:ring-[#F4C430]"
              >
                {availableSubjects.map((sub) => (
                  <option key={sub} value={sub} className="bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4F4F5]">
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5]">
                  Subject Teacher <span className="text-[#DC2626] dark:text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomTeacher(!isCustomTeacher)}
                  className="text-[11px] font-bold text-[#F4C430] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={12} />
                  <span>{isCustomTeacher ? 'Choose from list' : 'Type name directly'}</span>
                </button>
              </div>

              {isCustomTeacher ? (
                <div className="relative">
                  <input
                    type="text"
                    id="test-custom-teacher-input"
                    placeholder="Enter teacher or faculty name"
                    value={customTeacherName}
                    onChange={(e) => setCustomTeacherName(e.target.value)}
                    disabled={uploading}
                    className="w-full h-10 px-3 pl-8 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] text-sm font-semibold text-[#111111] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-hidden focus:ring-2 focus:ring-[#111111] dark:focus:ring-[#F4C430]"
                  />
                  <User size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#A1A1AA] pointer-events-none" />
                </div>
              ) : (
                <div className="relative">
                  <select
                    id="test-teacher-select"
                    value={selectedTeacherId}
                    onChange={handleTeacherChange}
                    disabled={uploading || loadingTeachers}
                    className="w-full h-10 px-3 pl-8 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] text-sm font-semibold text-[#111111] dark:text-[#F4F4F5] focus:outline-hidden focus:ring-2 focus:ring-[#111111] dark:focus:ring-[#F4C430]"
                  >
                    {teachers.length === 0 && !profile?.full_name ? (
                      <option value="">
                        {loadingTeachers ? 'Loading teachers...' : '-- Select Subject Teacher --'}
                      </option>
                    ) : null}

                    {/* Show current user as option if available */}
                    {profile?.full_name && (
                      <option value={profile.id || 'admin_self'} className="bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4F4F5]">
                        {profile.full_name} ({profile.role === 'admin' ? 'Admin / Head' : 'Current Teacher'})
                      </option>
                    )}

                    {teachers.map((t) => (
                      <option key={t.id} value={t.id} className="bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4F4F5]">
                        {t.full_name}
                      </option>
                    ))}

                    <option value="__custom__" className="bg-white dark:bg-[#18181B] text-[#111111] dark:text-[#F4C430] font-bold">
                      + Enter Custom Teacher Name...
                    </option>
                  </select>
                  <User size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#A1A1AA] pointer-events-none" />
                </div>
              )}
              <p className="text-[11px] text-[#737373] dark:text-[#A1A1AA] mt-1">
                Assigned teacher displayed on student test papers and gradebooks.
              </p>
            </div>
          </div>

          {/* Total Marks & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5] mb-1.5">
                Total Marks <span className="text-[#DC2626] dark:text-rose-400">*</span>
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
                  className="w-full h-10 px-3 pl-8 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] text-sm font-semibold text-[#111111] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-hidden focus:ring-2 focus:ring-[#111111] dark:focus:ring-[#F4C430]"
                />
                <Award size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#A1A1AA]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5] mb-1.5">
                Submission Due Date <span className="text-[#DC2626] dark:text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="test-due-date-input"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={uploading}
                  className="w-full h-10 px-3 pl-8 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] text-sm font-semibold text-[#111111] dark:text-[#F4F4F5] focus:outline-hidden focus:ring-2 focus:ring-[#111111] dark:focus:ring-[#F4C430]"
                />
                <Calendar size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#737373] dark:text-[#A1A1AA]" />
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5] mb-1.5">
              Test Title / Chapter <span className="text-[#DC2626] dark:text-rose-400">*</span>
            </label>
            <input
              type="text"
              id="test-title-input"
              placeholder="e.g. Chapter 4: Chemical Bonding Test"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="w-full h-10 px-3 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] text-sm font-semibold text-[#111111] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-hidden focus:ring-2 focus:ring-[#111111] dark:focus:ring-[#F4C430]"
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5] mb-1.5">
              Instructions for Students <span className="text-[#737373] dark:text-[#A1A1AA] font-normal">(optional)</span>
            </label>
            <textarea
              id="test-instructions-input"
              rows={2}
              placeholder="e.g. Attempt all sections. Time allowed: 90 minutes. Scan your answer sheet clearly into a single PDF before uploading."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              disabled={uploading}
              className="w-full p-3 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] text-xs font-normal text-[#111111] dark:text-[#F4F4F5] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-hidden focus:ring-2 focus:ring-[#111111] dark:focus:ring-[#F4C430] resize-none"
            />
          </div>

          {/* File Upload Zone */}
          <div>
            <label className="block text-xs font-bold text-[#111111] dark:text-[#F4F4F5] mb-1.5">
              Question Paper File <span className="text-[#DC2626] dark:text-rose-400">*</span>
            </label>
            <div
              id="test-drop-zone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleFileDrop}
              className={`relative border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-[#111111] dark:border-[#F4C430] bg-[#F5F5F5] dark:bg-[#202024]'
                  : file
                  ? 'border-[#22C55E] dark:border-emerald-500 bg-[#F0FDF4] dark:bg-emerald-950/20'
                  : 'border-[#E5E5E5] dark:border-[#27272A] bg-[#FAFAFA] dark:bg-[#141416] hover:bg-[#F5F5F5] dark:hover:bg-[#1C1C20]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="test-file-input"
                accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                onChange={handleFileChange}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
              />
              {file ? (
                <div className="flex items-center justify-center gap-3 pointer-events-none">
                  <div className="w-9 h-9 rounded-xl bg-[#22C55E]/10 dark:bg-emerald-500/20 text-[#16A34A] dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-[#111111] dark:text-[#F4F4F5] truncate max-w-xs">{file.name}</p>
                    <p className="text-[11px] text-[#737373] dark:text-[#A1A1AA]">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to replace
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-1 pointer-events-none">
                  <div className="w-8 h-8 rounded-xl bg-[#E5E5E5] dark:bg-[#27272A] text-[#525252] dark:text-[#A1A1AA] flex items-center justify-center mx-auto">
                    <Upload size={15} />
                  </div>
                  <p className="text-xs font-bold text-[#111111] dark:text-[#F4F4F5]">
                    Drag & drop question paper, or <span className="underline text-[#111111] dark:text-[#F4C430]">browse</span>
                  </p>
                  <p className="text-[11px] text-[#737373] dark:text-[#A1A1AA]">Supports PDF, JPG, PNG, DOC (max 25MB)</p>
                </div>
              )}
            </div>
          </div>

          {/* Progress Bar if Uploading */}
          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-[#525252] dark:text-[#A1A1AA]">
                <span>Uploading test paper to Cloudflare storage...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-[#E5E5E5] dark:bg-[#27272A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#111111] dark:bg-[#F4C430] transition-all duration-200 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          </div>

          {/* Actions - Pinned Bottom Footer */}
          <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3 border-t border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#18181B] shrink-0">
            <button
              type="button"
              id="cancel-test-upload-btn"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] text-xs font-bold text-[#525252] dark:text-[#A1A1AA] hover:bg-[#F5F5F5] dark:hover:bg-[#27272A] hover:text-[#111111] dark:hover:text-[#F4F4F5] transition-colors disabled:opacity-40 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="submit-test-upload-btn"
              disabled={uploading || !file || !effectiveTeacherName}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#111111] dark:bg-[#F4C430] hover:bg-[#262626] dark:hover:bg-[#E5B520] text-white dark:text-black text-xs font-extrabold transition-all shadow-xs disabled:opacity-40 disabled:hover:bg-[#111111] dark:disabled:hover:bg-[#F4C430] cursor-pointer"
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
    </div>,
    document.body
  );
};

export default TestUploadModal;
