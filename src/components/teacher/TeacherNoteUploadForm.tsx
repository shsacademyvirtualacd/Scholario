import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileText, Image as ImageIcon, AlertCircle, Loader2, BookOpen, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ClassOffering } from '../../types';
import { uploadNoteFileToR2, getTaxonomy } from '../../lib/db';
import { getSubjectsForStream } from '../../lib/db';
import { getStreamsForGrade, GRADES } from '../../lib/taxonomy';
import { useMobile } from '../../hooks/useMobile';
import type { NoteFileType } from '../../types';

interface TeacherNoteUploadFormProps {
  offerings: ClassOffering[];
  onUpload: (data: {
    offering_id: string;
    chapter_name: string;
    title: string;
    file_url: string;
    file_path: string;
    file_type: NoteFileType;
  }) => Promise<void>;
  onCancel: () => void;
  initialGrade?: string;
  initialStream?: string;
  initialOfferingId?: string;
}

export const TeacherNoteUploadForm: React.FC<TeacherNoteUploadFormProps> = ({
  offerings,
  onUpload,
  onCancel,
  initialGrade,
  initialStream,
  initialOfferingId,
}) => {
  const isMobile = useMobile();
  const [taxonomy, setTaxonomy] = useState<any>(null);

  // Compute available boards directly from teacher's offerings
  const availableBoards = useMemo(() => {
    const bSet = new Map<string, string>();
    offerings.forEach((o) => {
      const bId = (o.board || (o as any).class?.board_id || (o as any).class?.board?.id || (o as any).board_id || 'fbise').toLowerCase();
      const bName = (o as any).class?.board?.name || (o as any).board_name || (bId === 'fbise' ? 'FBISE' : bId.toUpperCase());
      bSet.set(bId, bName);
    });
    if (bSet.size === 0) bSet.set('fbise', 'FBISE');
    return Array.from(bSet.entries()).map(([id, name]) => ({ id, name }));
  }, [offerings]);

  const defaultBoard = offerings[0]?.board || (offerings[0] as any)?.class?.board_id || availableBoards[0]?.id || 'fbise';
  const [selectedBoard, setSelectedBoard] = useState<string>(defaultBoard);

  const [selectedGrade, setSelectedGrade] = useState<string>(
    initialGrade && initialGrade !== 'all' ? initialGrade : (offerings[0]?.grade || (offerings[0] as any)?.class?.grade || '10')
  );
  const [selectedStream, setSelectedStream] = useState<string>(
    initialStream && initialStream !== 'all' ? initialStream : 'all'
  );
  const [offeringId, setOfferingId] = useState<string>(
    initialOfferingId && initialOfferingId !== 'all' ? initialOfferingId : ''
  );

  const [chapterName, setChapterName] = useState('');
  const [title, setTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadPct, setUploadPct] = useState<number>(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTaxonomy().then(setTaxonomy).catch(console.error);
  }, []);

  // Compute active grades based on teacher's offerings or taxonomy
  const activeGrades = useMemo(() => {
    const gradesFromOfferings = new Map<string, string>();
    offerings.forEach((o) => {
      const bId = (o.board || (o as any).class?.board_id || (o as any).class?.board?.id || 'fbise').toLowerCase();
      if (!selectedBoard || selectedBoard === 'all' || bId === selectedBoard.toLowerCase()) {
        const gr = String(o.grade || (o as any).class?.grade || '');
        if (gr) {
          gradesFromOfferings.set(gr, `${gr}th`);
        }
      }
    });

    if (gradesFromOfferings.size > 0) {
      return Array.from(gradesFromOfferings.entries()).map(([id, label]) => ({ id, label }));
    }

    const rawGrades = taxonomy && taxonomy.classes && taxonomy.classes.length > 0
      ? taxonomy.classes
          .filter((c: any) => !selectedBoard || selectedBoard === 'all' || c.board_id === selectedBoard || !c.board_id)
          .map((c: any) => ({ id: String(c.grade), label: c.display_name || `${c.grade}th` }))
      : GRADES.map((g) => ({ id: g.grade, label: g.displayName }));

    const seen = new Set<string>();
    return rawGrades.filter((g: any) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
  }, [offerings, selectedBoard, taxonomy]);

  // Compute active streams for selected grade
  const activeClass = taxonomy?.classes?.find(
    (c: any) => String(c.grade) === String(selectedGrade) && (c.board_id === selectedBoard || !c.board_id)
  );
  const dbStreams = activeClass && taxonomy?.streams
    ? taxonomy.streams.filter((s: any) => s.class_id === activeClass.id)
    : [];

  const activeStreams: { id: string; name: string }[] = dbStreams.length > 0
    ? dbStreams.map((s: any) => ({ id: s.id, name: s.name }))
    : getStreamsForGrade(selectedGrade).map((s) => ({ id: s.name, name: s.name }));

  // Scope offerings by selected Board, Grade, and Stream
  const scopedOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      const offGrade = String(
        offering.grade || (offering as any).class?.grade || taxonomy?.classes?.find((c: any) => c.id === (offering as any).class_id)?.grade || ''
      );
      if (selectedGrade && selectedGrade !== 'all' && offGrade !== String(selectedGrade)) {
        return false;
      }

      const offBoard = (offering.board || (offering as any).class?.board_id || (offering as any).class?.board?.id || 'fbise').toLowerCase();
      if (selectedBoard && selectedBoard !== 'all' && offBoard !== selectedBoard.toLowerCase()) {
        return false;
      }

      if (selectedStream && selectedStream !== 'all') {
        const activeStreamObj = activeStreams.find((s: any) => s.id === selectedStream || s.name === selectedStream);
        const streamName = activeStreamObj?.name || (typeof selectedStream === 'string' ? selectedStream : '');
        if (streamName && selectedGrade && selectedGrade !== 'all') {
          const streamSubjects = getSubjectsForStream(String(selectedGrade), streamName) || [];
          const offeringSubject = offering.subject_name || (typeof offering.subject === 'string' ? offering.subject : offering.subject?.name) || '';
          if (
            offering.stream_id === selectedStream ||
            (typeof offering.stream === 'string' && offering.stream === streamName) ||
            (typeof offering.stream === 'object' && offering.stream?.name === streamName) ||
            streamSubjects.includes(offeringSubject)
          ) {
            return true;
          }
          return false;
        }
        return (
          offering.stream_id === selectedStream ||
          (typeof offering.stream === 'string' && offering.stream === selectedStream) ||
          !offering.stream_id
        );
      }

      return true;
    });
  }, [offerings, selectedGrade, selectedBoard, selectedStream, activeStreams, taxonomy]);

  // Keep offeringId in sync when scopedOfferings change
  useEffect(() => {
    if (offeringId && !scopedOfferings.some((o) => o.id === offeringId)) {
      setOfferingId('');
    } else if (!offeringId && scopedOfferings.length === 1) {
      setOfferingId(scopedOfferings[0].id);
    }
  }, [selectedGrade, selectedStream, scopedOfferings, offeringId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeringId) {
      setError('Please select an assigned class offering.');
      return;
    }
    if (!chapterName.trim()) {
      setError('Please enter a chapter name or topic heading.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a note title.');
      return;
    }
    if (!selectedFile) {
      setError('Please select a PDF or image file to upload.');
      return;
    }

    try {
      setLoading(true);
      setUploadPct(0);
      setDone(false);
      setError(null);

      const name = selectedFile.name.toLowerCase();
      let fileType: NoteFileType = 'image';
      if (name.endsWith('.pdf') || selectedFile.type === 'application/pdf') fileType = 'pdf';
      else if (name.endsWith('.doc')) fileType = 'doc';
      else if (name.endsWith('.docx')) fileType = 'docx';
      else if (name.endsWith('.ppt')) fileType = 'ppt';
      else if (name.endsWith('.pptx')) fileType = 'pptx';
      else if (name.endsWith('.xls')) fileType = 'xls';
      else if (name.endsWith('.xlsx')) fileType = 'xlsx';
      else if (name.endsWith('.txt')) fileType = 'txt';

      const createdNote = await uploadNoteFileToR2(
        selectedFile,
        {
          offering_id: offeringId,
          chapter_name: chapterName.trim(),
          title: title.trim(),
          file_type: fileType,
        },
        (pct) => {
          setUploadPct(pct);
        }
      );

      setUploadPct(100);
      setDone(true);
      await onUpload(createdNote as any);
      toast.success(`"${title.trim()}" uploaded successfully.`);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload note file. Please check your network or storage permissions.');
      toast.error(err.message || 'Failed to upload note file.');
      setUploadPct(0);
      setDone(false);
    } finally {
      setLoading(false);
    }
  };

  const handleGradeChange = (gId: string) => {
    setSelectedGrade(gId);
    setSelectedStream('all');
    setOfferingId('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-1">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2.5 text-xs font-semibold text-red-700 dark:text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Progress Bar (shown during upload) */}
      {loading && (
        <div className="rounded-xl border border-[#E5E5E5] dark:border-zinc-700 bg-[#FAFAFA] dark:bg-zinc-800 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-[#111111] dark:text-zinc-100">
            <span className="flex items-center gap-2">
              {done
                ? <CheckCircle2 size={14} className="text-green-500" />
                : <Loader2 size={14} className="animate-spin text-amber-500" />
              }
              {done ? 'Upload complete — saving record...' : `Uploading file... ${uploadPct}%`}
            </span>
            <span className="text-[#A3A3A3] dark:text-zinc-400">{uploadPct}%</span>
          </div>
          <div className="h-1.5 bg-[#E5E5E5] dark:bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F4C430] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadPct}%` }}
            />
          </div>
          {selectedFile && (
            <p className="text-[10px] text-[#A3A3A3] dark:text-zinc-400 font-semibold truncate">
              {selectedFile.name} &nbsp;·&nbsp; {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          )}
        </div>
      )}

      {/* ── Layer 1: Board Curriculum (Dynamic based on teacher's assignments) ── */}
      <div className="border-b border-[#E5E5E5] dark:border-zinc-800 pb-2">
        <span className="text-[10px] font-black text-[#A3A3A3] dark:text-zinc-500 uppercase tracking-wide block mb-1.5">
          1. Board Curriculum:
        </span>
        <div className={isMobile ? 'flex flex-col gap-2' : 'flex gap-4'}>
          {availableBoards.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setSelectedBoard(b.id);
                setOfferingId('');
              }}
              className={`pb-1 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                selectedBoard === b.id
                  ? 'border-[#F4C430] text-[#111111] dark:text-zinc-100'
                  : 'border-transparent text-[#737373] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-zinc-200'
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Layer 2: Cohort Grade Pills ── */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-black text-[#A3A3A3] dark:text-zinc-500 uppercase tracking-wide block">
          2. Cohort Grade:
        </span>
        <div className={isMobile ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-1.5'}>
          {activeGrades.map((g: any) => (
            <button
              key={g.id}
              type="button"
              onClick={() => handleGradeChange(g.id)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                selectedGrade === g.id
                  ? 'bg-[#111111] dark:bg-zinc-100 border-[#111111] dark:border-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                  : 'bg-white dark:bg-zinc-800 border-[#E5E5E5] dark:border-zinc-700 text-[#525252] dark:text-zinc-300 hover:bg-[#F5F5F5] dark:hover:bg-zinc-700'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Layer 3: Stream Cohort Pills (only for grades with streams) ── */}
      {activeStreams.length > 0 && (
        <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
          <span className="text-[10px] font-black text-[#A3A3A3] dark:text-zinc-500 uppercase tracking-wide block">
            3. Stream Cohort:
          </span>
          <div className={isMobile ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-1.5'}>
            <button
              type="button"
              onClick={() => {
                setSelectedStream('all');
                setOfferingId('');
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                selectedStream === 'all'
                  ? 'bg-[#F4C430] border-[#F4C430] text-[#111111] shadow-sm'
                  : 'bg-white dark:bg-zinc-800 border-[#E5E5E5] dark:border-zinc-700 text-[#525252] dark:text-zinc-300 hover:bg-[#F5F5F5] dark:hover:bg-zinc-700'
              }`}
            >
              All Streams
            </button>
            {activeStreams.map((s: any) => (
              <button
                key={s.id || s.name}
                type="button"
                onClick={() => {
                  setSelectedStream(s.id || s.name);
                  setOfferingId('');
                }}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  selectedStream === (s.id || s.name) || selectedStream === s.name
                    ? 'bg-[#111111] dark:bg-zinc-100 border-[#111111] dark:border-zinc-100 text-white dark:text-zinc-900 shadow-sm'
                    : 'bg-white dark:bg-zinc-800 border-[#E5E5E5] dark:border-zinc-700 text-[#525252] dark:text-zinc-300 hover:bg-[#F5F5F5] dark:hover:bg-zinc-700'
                }`}
              >
                {s.name} Stream
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Layer 4: Subject Dropdown (scoped to selected Grade + Stream) ── */}
      <div className="space-y-1.5 pt-1 border-b border-[#E5E5E5] dark:border-zinc-800 pb-4">
        <label className="text-[10px] font-black text-[#A3A3A3] dark:text-zinc-500 uppercase tracking-wide block">
          4. Assigned Subject & Class Offering <span className="text-red-500">*</span>
        </label>
        <select
          value={offeringId}
          onChange={(e) => setOfferingId(e.target.value)}
          disabled={loading || scopedOfferings.length === 0}
          className="input py-2 text-xs w-full bg-[#FAFAFA] dark:bg-zinc-800 border border-[#E5E5E5] dark:border-zinc-700 rounded-xl font-bold text-[#111111] dark:text-zinc-100 focus:outline-none focus:border-[#111111] dark:focus:border-zinc-500 cursor-pointer"
          required
        >
          <option value="" disabled>
            {scopedOfferings.length === 0
              ? 'No assigned offerings found for selected Grade & Stream...'
              : `Select Subject (${scopedOfferings.length} available)...`}
          </option>
          {scopedOfferings.map((offering) => {
            const subjName = offering.subject_name || (typeof offering.subject === 'string' ? offering.subject : offering.subject?.name) || 'Class';
            const gr = offering.grade || (offering as any).class?.grade || '10';
            const brd = String(offering.board || (offering as any).class?.board_id || (offering as any).class?.board?.name || selectedBoard || 'Curriculum').toUpperCase();
            const st = typeof offering.stream === 'string' ? offering.stream : offering.stream?.name || 'All Streams';
            return (
              <option key={offering.id} value={offering.id}>
                {subjName} — Grade {gr} {brd} ({st})
              </option>
            );
          })}
        </select>
      </div>

      {/* ── Scoped Upload Form Fields (shown when all 4 layers are selected) ── */}
      {!offeringId ? (
        <div className="p-6 bg-[#FAFAFA] dark:bg-zinc-800/50 border border-dashed border-[#E5E5E5] dark:border-zinc-700 rounded-2xl text-center my-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2">
            <BookOpen size={20} />
          </div>
          <p className="text-xs font-bold text-[#111111] dark:text-zinc-100">Scope to Your Assigned Class</p>
          <p className="text-[11px] text-[#737373] dark:text-zinc-400 mt-1">
            Please choose Board → Grade → Stream → Subject above to reveal the document upload form.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          {/* Chapter Name */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#525252] dark:text-zinc-300 block">Chapter / Topic Heading <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              placeholder="e.g., Chapter 4: Quadratic Equations"
              disabled={loading}
              className="input py-2 text-xs w-full bg-[#FAFAFA] dark:bg-zinc-800 border border-[#E5E5E5] dark:border-zinc-700 rounded-xl font-semibold text-[#111111] dark:text-zinc-100 focus:outline-none focus:border-[#111111] dark:focus:border-zinc-500"
              required
            />
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#525252] dark:text-zinc-300 block">Document Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Complete Formula Sheet & Solved Exercises"
              disabled={loading}
              className="input py-2 text-xs w-full bg-[#FAFAFA] dark:bg-zinc-800 border border-[#E5E5E5] dark:border-zinc-700 rounded-xl font-semibold text-[#111111] dark:text-zinc-100 focus:outline-none focus:border-[#111111] dark:focus:border-zinc-500"
              required
            />
          </div>

          {/* File Upload Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#525252] dark:text-zinc-300 block">Document File <span className="text-red-500">*</span></label>
            <div className="relative border-2 border-dashed border-[#E5E5E5] dark:border-zinc-700 hover:border-[#111111] dark:hover:border-zinc-500 rounded-2xl p-6 text-center transition-all duration-200 bg-[#FAFAFA] dark:bg-zinc-800/60 hover:bg-white dark:hover:bg-zinc-800 cursor-pointer group">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt"
                onChange={handleFileChange}
                disabled={loading}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                required
              />
              {selectedFile ? (
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    {selectedFile.type.startsWith('image/') ? (
                      <ImageIcon size={20} />
                    ) : (
                      <FileText size={20} />
                    )}
                  </div>
                  <div className="text-xs font-bold text-[#111111] dark:text-zinc-100 truncate max-w-[240px]">
                    {selectedFile.name}
                  </div>
                  <div className="text-[10px] font-semibold text-[#737373] dark:text-zinc-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Click or drag to change
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] dark:bg-zinc-700 group-hover:bg-[#111111] dark:group-hover:bg-zinc-600 text-[#737373] dark:text-zinc-300 group-hover:text-white flex items-center justify-center transition-colors">
                    <Upload size={18} />
                  </div>
                  <div className="text-xs font-bold text-[#111111] dark:text-zinc-100">
                    Choose a Document or Image to upload
                  </div>
                  <div className="text-[10px] font-semibold text-[#737373] dark:text-zinc-400">
                    Supports PDF, PNG, JPG, WEBP, DOC, PPT, XLS, TXT up to 20 MB
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F5F5F5] dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 text-xs font-bold text-[#737373] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-zinc-100 hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 rounded-xl transition-colors interactive"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !selectedFile || !offeringId}
          className="px-5 py-2 bg-[#111111] dark:bg-zinc-100 hover:bg-[#262626] dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-900 text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all interactive"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          <span>{loading ? 'Uploading & Saving...' : 'Upload Note'}</span>
        </button>
      </div>
    </form>
  );
};

export default TeacherNoteUploadForm;
