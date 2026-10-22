import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, BookOpen, RotateCcw, Filter, AlertCircle, RefreshCw, X } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import AdminNoteCard from '../../components/admin/notes/AdminNoteCard';
import AdminDrawer from '../../components/admin/AdminDrawer';
import NoteUploadForm from '../../components/admin/notes/NoteUploadForm';
import ConfirmModal from '../../components/admin/ConfirmModal';
import NoteViewerModal from '../../components/student/NoteViewerModal';
import { useAuth } from '../../features/auth/AuthContext';
import { getAllNotes, deleteNote, getAllOfferings, getTaxonomy } from '../../lib/db';
import { getSubjectsForStream } from '../../lib/db';
import { getStreamsForGrade, getGradesForBoard } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useMobile } from '../../hooks/useMobile';
import { toast } from 'sonner';
import type { Note, ClassOffering } from '../../types';

const BOARDS = [
  { id: 'fbise', label: 'FBISE', fullName: 'Federal Board (FBISE)' },
  { id: 'punjab', label: 'Punjab', fullName: 'Punjab Board' },
  { id: 'sindh', label: 'Sindh', fullName: 'Sindh Board' },
  { id: 'kpk', label: 'KPK', fullName: 'KPK Board' },
  { id: 'olevel', label: 'O Levels', fullName: 'O Levels' },
  { id: 'alevel', label: 'A Levels', fullName: 'A Levels' },
  { id: 'ielts', label: 'IELTS', fullName: 'IELTS' },
];

export const NotesManagerPage: React.FC = () => {
  useAuth();
  const isMobile = useMobile();
  const [notes, setNotes] = useState<Note[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [taxonomy, setTaxonomy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Load from DB on mount with proper error/loading handling ──────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [taxRes, notesRes, offeringsRes] = await Promise.all([
        getTaxonomy().catch((err) => {
          console.warn('Taxonomy fetch fallback:', err);
          return null;
        }),
        getAllNotes(),
        getAllOfferings(),
      ]);
      setTaxonomy(taxRes);
      setNotes(notesRes || []);
      setOfferings(offeringsRes || []);
    } catch (err: any) {
      console.error('Failed to load notes data:', err);
      setLoadError(err?.message || 'Failed to load notes repository.');
      toast.error('Unable to fetch notes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useRealtimeTable({
    table: 'notes',
    onAny: async () => {
      try {
        const n = await getAllNotes();
        setNotes(n || []);
      } catch (e) {
        console.error('Realtime notes refresh error:', e);
      }
    },
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'image'>('all');

  // 4-Layer Taxonomy Filters (Board → Grade → Stream → Subject)
  const [selectedBoard, setSelectedBoard] = useState<string>('fbise');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Modal / Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadToast, setUploadToast] = useState<string | null>(null);

  // Enrich raw notes with class offering and teacher details
  const enrichedNotes = useMemo(() => {
    return notes.map((note) => {
      if (note.offering) return note;
      const offering = offerings.find((o) => o.id === note.offering_id);
      return {
        ...note,
        offering,
      };
    });
  }, [notes, offerings]);

  // Compute active grades from taxonomy or fallback
  const rawGrades = useMemo(() => {
    if (taxonomy && taxonomy.classes && taxonomy.classes.length > 0) {
      return taxonomy.classes
        .filter((c: any) => c.board_id === selectedBoard || (!c.board_id && selectedBoard === 'fbise'))
        .map((c: any) => ({ id: String(c.grade), label: c.display_name || `${c.grade}th` }));
    }
    return getGradesForBoard(selectedBoard).map((g) => ({ id: g.grade, label: g.displayName }));
  }, [taxonomy, selectedBoard]);

  const activeGrades = useMemo(() => {
    const seen = new Set<string>();
    const grades: { id: string; label: string }[] = rawGrades.filter((g: any) => {
      if (seen.has(g.id)) return false;
      seen.add(g.id);
      return true;
    });
    const currentBoard = BOARDS.find((b) => b.id === selectedBoard)?.label || 'Board';
    grades.push({ id: 'all', label: `All ${currentBoard}` });
    return grades;
  }, [rawGrades, selectedBoard]);

  // Compute active streams for selected grade
  const activeStreams: { id: string; name: string }[] = useMemo(() => {
    const activeClass = taxonomy?.classes?.find(
      (c: any) => String(c.grade) === String(selectedGrade) && (c.board_id === selectedBoard || !c.board_id)
    );
    const dbStreams = activeClass && taxonomy?.streams
      ? taxonomy.streams.filter((s: any) => s.class_id === activeClass.id)
      : [];

    return dbStreams.length > 0
      ? dbStreams.map((s: any) => ({ id: s.id, name: s.name }))
      : getStreamsForGrade(selectedGrade, selectedBoard).map((s) => ({ id: s.name, name: s.name }));
  }, [taxonomy, selectedGrade, selectedBoard]);

  // Scope offerings for Subject dropdown by selected Board, Grade, and Stream
  const scopedOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      const offGrade = String(
        offering.grade || (offering as any).class?.grade || taxonomy?.classes?.find((c: any) => c.id === (offering as any).class_id)?.grade || ''
      );
      if (selectedGrade && selectedGrade !== 'all' && offGrade !== String(selectedGrade)) {
        return false;
      }

      const offBoard = offering.board || (offering as any).class?.board_id || taxonomy?.classes?.find((c: any) => c.id === (offering as any).class_id)?.board_id || 'fbise';
      if (selectedBoard && selectedBoard !== 'all' && offBoard !== selectedBoard) {
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
  }, [offerings, selectedGrade, selectedBoard, selectedStream, taxonomy, activeStreams]);

  // Keep selectedSubject in sync when scopedOfferings change
  useEffect(() => {
    if (selectedSubject !== 'all' && !scopedOfferings.some((o) => o.id === selectedSubject)) {
      setSelectedSubject('all');
    }
  }, [selectedGrade, selectedStream, scopedOfferings, selectedSubject]);

  // Filter notes based on search term, format type, and 4-layer taxonomy selection
  const filteredNotes = useMemo(() => {
    return enrichedNotes.filter((note) => {
      const matchesSearch =
        note.chapter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.offering?.subject_name && note.offering.subject_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof note.offering?.subject === 'string' && note.offering.subject.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = typeFilter === 'all' || note.file_type === typeFilter;

      // Board match
      const offBoard = note.offering?.board || (note.offering as any)?.class?.board_id || taxonomy?.classes?.find((c: any) => c.id === (note.offering as any)?.class_id)?.board_id || 'fbise';
      if (selectedBoard && selectedBoard !== 'all' && offBoard !== selectedBoard) {
        return false;
      }

      // Taxonomy 4-Layer Match
      if (selectedSubject && selectedSubject !== 'all') {
        if (note.offering_id !== selectedSubject) return false;
      } else if (selectedGrade !== 'all' || selectedStream !== 'all') {
        if (!scopedOfferings.some((o) => o.id === note.offering_id)) return false;
      }

      return matchesSearch && matchesType;
    });
  }, [enrichedNotes, searchTerm, typeFilter, selectedBoard, selectedSubject, selectedGrade, selectedStream, scopedOfferings, taxonomy]);

  const hasActiveFilters =
    selectedBoard !== 'fbise' ||
    selectedGrade !== 'all' ||
    selectedStream !== 'all' ||
    selectedSubject !== 'all' ||
    typeFilter !== 'all' ||
    searchTerm.trim() !== '';

  const resetFilters = () => {
    setSelectedBoard('fbise');
    setSelectedGrade('all');
    setSelectedStream('all');
    setSelectedSubject('all');
    setTypeFilter('all');
    setSearchTerm('');
  };

  const handleBoardChange = (boardId: string) => {
    setSelectedBoard(boardId);
    setSelectedGrade('all');
    setSelectedStream('all');
    setSelectedSubject('all');
  };

  const handleGradeChange = (gId: string) => {
    setSelectedGrade(gId);
    setSelectedStream('all');
    setSelectedSubject('all');
  };

  const handleUploadTrigger = () => {
    setDrawerOpen(true);
  };

  const handleUploadSave = async (formData: any) => {
    if (formData?.id) {
      setNotes((prev) => [formData as Note, ...prev]);
    }
    setDrawerOpen(false);
    setUploadToast(`"${formData?.title || 'Note'}" uploaded successfully`);
    setTimeout(() => setUploadToast(null), 4000);
  };

  const handleDeleteTrigger = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    const targetId = noteToDelete;
    setDeletingId(targetId);
    try {
      await deleteNote(targetId);
      setNotes((prev) => prev.filter((n) => n.id !== targetId));
      toast.success('Note deleted successfully.');
      setDeleteModalOpen(false);
      setNoteToDelete(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete note.');
      throw err;
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setViewerOpen(true);
  };

  return (
    <AdminShell>
      <div className="space-y-5">
        {/* Upload success toast */}
        {uploadToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#111111] dark:bg-[#1E1E22] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300 border border-[#2E2E33]">
            <span className="text-emerald-400">✓</span>
            <span>{uploadToast}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-[#111111] dark:text-[#FAFAFA] tracking-tight">
                Notes Manager
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#F4C430]/20 text-[#B45309] dark:text-[#FBBF24] border border-[#F4C430]/40 shrink-0">
                UI v2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#737373] dark:text-[#A1A1AA] mt-1 font-medium">
              Upload revision resources, past papers, chapter notes, and textbook reference images.
            </p>
          </div>

          <button
            type="button"
            onClick={handleUploadTrigger}
            className="min-h-[44px] px-4 py-2.5 bg-[#111111] hover:bg-[#262626] dark:bg-[#F4C430] dark:hover:bg-[#E5B520] text-white dark:text-[#111111] text-xs font-bold rounded-xl shadow-sm shrink-0 self-start sm:self-center transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C430]"
          >
            <Plus size={16} />
            <span>Upload Notes</span>
          </button>
        </div>

        {/* Board Selector Tabs (Short labels so they never cut off) */}
        <div className="border-b border-[#E5E5E5] dark:border-[#27272A] flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex overflow-x-auto no-scrollbar gap-2 sm:gap-4 max-w-full pb-1">
            {BOARDS.map((b) => {
              const isActive = selectedBoard === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleBoardChange(b.id)}
                  title={b.fullName}
                  className={`min-h-[44px] sm:min-h-[40px] px-3 pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#F4C430] rounded-t-lg ${
                    isActive
                      ? 'border-[#F4C430] text-[#111111] dark:text-[#FAFAFA]'
                      : 'border-transparent text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA]'
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>

          {/* Reset Filters action */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 pb-2 sm:pb-0">
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Grade Sub-row filter - Class-wise Cohort */}
        <div className="flex flex-wrap items-center gap-2 py-3 bg-[#FAFAFA] dark:bg-[#18181B] px-4 rounded-xl border border-[#E5E5E5] dark:border-[#27272A]">
          <span className="text-[10px] font-black text-[#737373] dark:text-[#A1A1AA] uppercase tracking-wider mr-1 shrink-0">
            Cohort Grade:
          </span>
          {activeGrades.map((g: any) => {
            const isSelected = selectedGrade === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => handleGradeChange(g.id)}
                className={`min-h-[44px] sm:min-h-[32px] px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C430] ${
                  isSelected
                    ? 'bg-[#111111] dark:bg-[#F4C430] border-[#111111] dark:border-[#F4C430] text-white dark:text-[#111111] shadow-sm'
                    : 'bg-white dark:bg-[#202024] border-[#E5E5E5] dark:border-[#2E2E33] text-[#525252] dark:text-[#D4D4D8] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A30]'
                }`}
              >
                {g.label}
              </button>
            );
          })}
        </div>

        {/* Stream Sub-row filter if grade is selected */}
        {selectedGrade !== 'all' && activeStreams.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 py-2.5 bg-[#F9F9F9] dark:bg-[#1A1A1E] px-4 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] transition-all animate-in slide-in-from-top-1">
            <span className="text-[10px] font-black text-[#737373] dark:text-[#A1A1AA] uppercase tracking-wider mr-1 shrink-0">
              Stream Cohort:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedStream('all');
                setSelectedSubject('all');
              }}
              className={`min-h-[44px] sm:min-h-[32px] px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${
                selectedStream === 'all'
                  ? 'bg-[#F4C430] border-[#F4C430] text-[#111111] shadow-sm'
                  : 'bg-white dark:bg-[#202024] border-[#E5E5E5] dark:border-[#2E2E33] text-[#525252] dark:text-[#D4D4D8] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A30]'
              }`}
            >
              All Stream Schedules
            </button>
            {activeStreams.map((s: any) => {
              const isSelected = selectedStream === (s.id || s.name) || selectedStream === s.name;
              return (
                <button
                  key={s.id || s.name}
                  type="button"
                  onClick={() => {
                    setSelectedStream(s.id || s.name);
                    setSelectedSubject('all');
                  }}
                  className={`min-h-[44px] sm:min-h-[32px] px-3 py-1 rounded-full text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#111111] dark:bg-[#F4C430] border-[#111111] dark:border-[#F4C430] text-white dark:text-[#111111] shadow-sm'
                      : 'bg-white dark:bg-[#202024] border-[#E5E5E5] dark:border-[#2E2E33] text-[#525252] dark:text-[#D4D4D8] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A30]'
                  }`}
                >
                  {s.name} Stream
                </button>
              );
            })}
          </div>
        )}

        {/* Control Bar: Search + Subject & Format Dropdowns */}
        <div className="bg-white dark:bg-[#18181B] border border-[#E5E5E5] dark:border-[#27272A] rounded-xl p-4 flex flex-col gap-3 shadow-sm">
          {/* Search Input */}
          <div className="relative w-full">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3] dark:text-[#71717A]" />
            <input
              type="text"
              placeholder="Search notes by chapter, title, topic or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-10 py-2 text-xs bg-[#FAFAFA] dark:bg-[#202024] border border-[#E5E5E5] dark:border-[#2E2E33] rounded-xl text-[#111111] dark:text-[#FAFAFA] placeholder:text-[#A3A3A3] dark:placeholder:text-[#71717A] focus:outline-none focus:ring-2 focus:ring-[#F4C430]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#A3A3A3] hover:text-[#111111] dark:hover:text-[#FAFAFA]"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filters row: Subject + Format */}
          <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-wrap items-center'}`}>
            {/* Subject Selector */}
            <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : 'flex-1 max-w-sm'}`}>
              <label htmlFor="subject-filter" className="text-xs font-bold text-[#737373] dark:text-[#A1A1AA] flex items-center gap-1 shrink-0">
                <Filter size={13} />
                <span>Subject:</span>
              </label>
              <select
                id="subject-filter"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={loading}
                className={`min-h-[44px] py-2 px-3 text-xs bg-[#FAFAFA] dark:bg-[#202024] border border-[#E5E5E5] dark:border-[#2E2E33] rounded-xl cursor-pointer font-bold text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#F4C430] ${
                  isMobile ? 'flex-1' : 'w-full'
                }`}
              >
                <option value="all">
                  {loading ? 'Loading subjects...' : `All Scoped Subjects (${scopedOfferings.length})`}
                </option>
                {scopedOfferings.map((o) => {
                  const subjName = o.subject_name || (typeof o.subject === 'string' ? o.subject : o.subject?.name) || 'Class';
                  const gr = o.grade || (o as any).class?.grade || '10';
                  const bId = (o.board || (o as any).class?.board_id || '').toLowerCase();
                  const boardLabel =
                    bId === 'punjab' ? 'Punjab' :
                    bId === 'sindh' ? 'Sindh' :
                    bId === 'kpk' ? 'KPK' :
                    bId === 'ielts' ? 'IELTS' :
                    bId === 'olevel' ? 'O Levels' :
                    bId === 'alevel' ? 'A Levels' :
                    'FBISE';
                  return (
                    <option key={o.id} value={o.id}>
                      {subjName} ({gr}th {boardLabel})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Format Selector */}
            <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
              <label htmlFor="format-filter" className="text-xs font-bold text-[#737373] dark:text-[#A1A1AA] shrink-0">
                Format:
              </label>
              <select
                id="format-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className={`min-h-[44px] py-2 px-3 text-xs bg-[#FAFAFA] dark:bg-[#202024] border border-[#E5E5E5] dark:border-[#2E2E33] rounded-xl cursor-pointer font-bold text-[#111111] dark:text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[#F4C430] ${
                  isMobile ? 'flex-1' : ''
                }`}
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF Documents</option>
                <option value="image">Image Files</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Content Area: Loading / Error / Empty / Grid */}
        {loading ? (
          /* Skeleton Loader (Never show 0 while data is still loading) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading notes">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#18181B] border border-[#E5E5E5] dark:border-[#27272A] rounded-xl p-4 flex flex-col justify-between animate-pulse min-h-[170px]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
                  <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
                <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#F5F5F5] dark:border-[#27272A]">
                  <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                  <div className="flex gap-2">
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    <div className="h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          /* Error state with retry */
          <div className="bg-white dark:bg-[#18181B] border border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center shadow-sm">
            <AlertCircle size={36} className="mx-auto text-red-500 mb-3" />
            <h3 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA]">Unable to Load Notes</h3>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-1 max-w-md mx-auto">
              {loadError}
            </p>
            <button
              type="button"
              onClick={fetchData}
              className="mt-4 min-h-[44px] px-4 py-2 bg-[#111111] dark:bg-[#F4C430] hover:bg-[#262626] dark:hover:bg-[#E5B520] text-white dark:text-[#111111] text-xs font-bold rounded-xl shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <RefreshCw size={14} />
              <span>Retry Loading</span>
            </button>
          </div>
        ) : filteredNotes.length === 0 ? (
          /* Friendly Empty State */
          <div className="bg-white dark:bg-[#18181B] border border-[#E5E5E5] dark:border-[#27272A] rounded-2xl p-12 text-center shadow-sm">
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <BookOpen size={28} />
            </div>
            <h3 className="text-base font-bold text-[#111111] dark:text-[#FAFAFA]">
              {hasActiveFilters ? 'No Matching Notes Found' : 'No Academic Notes in Repository'}
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-1.5 max-w-md mx-auto font-medium">
              {hasActiveFilters
                ? 'No notes match your current search and filter combination. Try resetting filters or exploring another grade/subject.'
                : 'Get started by uploading revision guides, solved chapter exercises, and reference notes for enrolled students.'}
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="min-h-[44px] px-4 py-2 bg-white dark:bg-[#202024] border border-[#E5E5E5] dark:border-[#2E2E33] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A30] text-[#111111] dark:text-[#FAFAFA] text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Clear All Filters</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleUploadTrigger}
                className="min-h-[44px] px-4 py-2 bg-[#111111] dark:bg-[#F4C430] hover:bg-[#262626] dark:hover:bg-[#E5B520] text-white dark:text-[#111111] text-xs font-bold rounded-xl shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={15} />
                <span>Upload First Note</span>
              </button>
            </div>
          </div>
        ) : (
          /* Notes Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <AdminNoteCard
                key={note.id}
                note={note}
                onView={handleViewNote}
                onDelete={handleDeleteTrigger}
                deleting={deletingId === note.id}
              />
            ))}
          </div>
        )}

        {/* Upload Drawer */}
        <AdminDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title="Upload Academic Reference Note"
        >
          <NoteUploadForm
            offerings={offerings}
            taxonomy={taxonomy}
            initialBoard={selectedBoard}
            onUpload={handleUploadSave}
            onCancel={() => setDrawerOpen(false)}
            initialGrade={selectedGrade !== 'all' ? selectedGrade : undefined}
            initialStream={selectedStream !== 'all' ? selectedStream : undefined}
            initialOfferingId={selectedSubject !== 'all' ? selectedSubject : undefined}
          />
        </AdminDrawer>

        {/* Delete Confirmation Modal (Safety for destructive action) */}
        <ConfirmModal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setNoteToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Academic Note?"
          description="Are you sure you want to remove this note file? Once deleted, students enrolled in this offering will immediately lose access to view and download it."
          confirmLabel="Delete Note"
          cancelLabel="Keep File"
          danger
        />

        {/* Note Viewer Popover (shared from Student portal) */}
        {viewerOpen && selectedNote && (
          <NoteViewerModal
            note={selectedNote}
            onClose={() => {
              setViewerOpen(false);
              setSelectedNote(null);
            }}
          />
        )}
      </div>
    </AdminShell>
  );
};

export default NotesManagerPage;
