import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, RotateCcw, Filter } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import AdminNoteCard from '../../components/admin/notes/AdminNoteCard';
import AdminDrawer from '../../components/admin/AdminDrawer';
import NoteUploadForm from '../../components/admin/notes/NoteUploadForm';
import ConfirmModal from '../../components/admin/ConfirmModal';
import NoteViewerModal from '../../components/student/NoteViewerModal';
import { useAuth } from '../../features/auth/AuthContext';
import { getAllNotes, deleteNote, getAllOfferings, getTaxonomy } from '../../lib/db';
import { getStreamsForGrade, getSubjectsForStream, GRADES } from '../../lib/taxonomy';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useMobile } from '../../hooks/useMobile';
import type { Note, ClassOffering } from '../../types';

export const NotesManagerPage: React.FC = () => {
  useAuth();
  const isMobile = useMobile();
  const [notes, setNotes] = useState<Note[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [taxonomy, setTaxonomy] = useState<any>(null);

  // ── Load from DB (or mock) on mount ──────────────────────────────────────
  useEffect(() => {
    getTaxonomy().then(setTaxonomy).catch(console.error);
    getAllNotes().then(setNotes).catch(console.error);
    getAllOfferings().then(setOfferings).catch(console.error);
  }, []);

  useRealtimeTable({
    table: 'notes',
    onAny: async () => {
      const n = await getAllNotes();
      setNotes(n);
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'image'>('all');

  // 4-Layer Taxonomy Filters (Board → Grade → Stream → Subject)
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
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
  const enrichedNotes = notes.map((note) => {
    if (note.offering) return note;
    const offering = offerings.find((o) => o.id === note.offering_id);
    return {
      ...note,
      offering,
    };
  });

  // Compute active grades from taxonomy or fallback
  const rawGrades = taxonomy && taxonomy.classes && taxonomy.classes.length > 0
    ? taxonomy.classes
        .filter((c: any) => c.board_id === 'fbise' || !c.board_id)
        .map((c: any) => ({ id: String(c.grade), label: c.display_name || `${c.grade}th` }))
    : GRADES.map((g) => ({ id: g.grade, label: g.displayName }));

  const seenGrades = new Set<string>();
  const activeGrades: { id: string; label: string }[] = rawGrades.filter((g: any) => {
    if (seenGrades.has(g.id)) return false;
    seenGrades.add(g.id);
    return true;
  });
  activeGrades.push({ id: 'all', label: 'All FBISE' });

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

  // Scope offerings for Subject dropdown by selected Board, Grade, and Stream
  const scopedOfferings = offerings.filter((offering) => {
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

  // Keep selectedSubject in sync when scopedOfferings change
  useEffect(() => {
    if (selectedSubject !== 'all' && !scopedOfferings.some((o) => o.id === selectedSubject)) {
      setSelectedSubject('all');
    }
  }, [selectedGrade, selectedStream, scopedOfferings, selectedSubject]);

  // Filter notes based on search term, format type, and 4-layer taxonomy selection
  const filteredNotes = enrichedNotes.filter((note) => {
    const matchesSearch =
      note.chapter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.offering?.subject_name && note.offering.subject_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (typeof note.offering?.subject === 'string' && note.offering.subject.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = typeFilter === 'all' || note.file_type === typeFilter;

    // Taxonomy 4-Layer Match
    if (selectedSubject && selectedSubject !== 'all') {
      if (note.offering_id !== selectedSubject) return false;
    } else if (selectedBoard !== 'all' || selectedGrade !== 'all' || selectedStream !== 'all') {
      if (!scopedOfferings.some((o) => o.id === note.offering_id)) return false;
    }

    return matchesSearch && matchesType;
  });

  const resetFilters = () => {
    setSelectedBoard('all');
    setSelectedGrade('all');
    setSelectedStream('all');
    setSelectedSubject('all');
    setTypeFilter('all');
    setSearchTerm('');
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
    // The upload API already inserted the row — formData IS the created note row.
    // Just prepend it to local state and close the drawer.
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
    setDeleteModalOpen(false);
    setNoteToDelete(null);
    setDeletingId(targetId);
    try {
      await deleteNote(targetId);
      setNotes((prev) => prev.filter((n) => n.id !== targetId));
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeletingId(null);
      alert(err.message || 'Failed to delete note.');
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
      {/* Upload success toast */}
      {uploadToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111111] text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-300">
          <span className="text-green-400">✓</span>
          {uploadToast}
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Notes Manager"
          description="Upload revision resources, past papers, chapter notes, and textbook reference images."
        />
        <button
          onClick={handleUploadTrigger}
          className="btn flex items-center justify-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#262626] text-white text-xs font-bold rounded-xl shadow-sm shrink-0 self-start sm:self-center interactive"
        >
          <Plus size={14} />
          Upload Notes
        </button>
      </div>

      {/* Class Profiles Filter Bar (Tabs Layout) - Board Selection */}
      <div className="border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex overflow-x-auto gap-6 border-transparent">
          <button
            onClick={() => setSelectedBoard('all')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
              selectedBoard === 'all'
                ? 'border-[#F4C430] text-[#111111]'
                : 'border-transparent text-[#737373] hover:text-[#111111]'
            }`}
          >
            All Boards
          </button>
          <button
            onClick={() => setSelectedBoard('fbise')}
            className={`pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all shrink-0 ${
              selectedBoard === 'fbise'
                ? 'border-[#F4C430] text-[#111111]'
                : 'border-transparent text-[#737373] hover:text-[#111111]'
            }`}
          >
            FBISE
          </button>
        </div>

        {/* Secondary controls (Reset) */}
        <div className="flex items-center gap-3 pb-2 sm:pb-0">
          {(selectedBoard !== 'all' || selectedGrade !== 'all' || selectedStream !== 'all' || selectedSubject !== 'all' || typeFilter !== 'all' || searchTerm !== '') && (
            <button
              onClick={resetFilters}
              className="text-[10px] font-black text-amber-600 hover:text-[#111111] flex items-center gap-0.5 interactive"
            >
              <RotateCcw size={10} />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Grade Sub-row filter - Class-wise Cohort */}
      <div className="flex flex-wrap items-center gap-1.5 py-2.5 bg-[#FAFAFA] px-4 border-b border-[#E5E5E5]">
        <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide mr-2">Cohort Grade:</span>
        {activeGrades.map((g: any) => (
          <button
            key={g.id}
            onClick={() => handleGradeChange(g.id)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
              selectedGrade === g.id
                ? 'bg-[#111111] border-[#111111] text-white shadow-sm'
                : 'bg-white border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* Stream Sub-row filter if grade is selected */}
      {selectedGrade !== 'all' && activeStreams.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 py-2 bg-[#F9F9F9] px-4 border-b border-[#E5E5E5] transition-all duration-250 animate-in slide-in-from-top-1">
          <span className="text-[9px] font-black text-[#A3A3A3] uppercase tracking-wide mr-2">Stream Cohort:</span>
          <button
            onClick={() => {
              setSelectedStream('all');
              setSelectedSubject('all');
            }}
            className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
              selectedStream === 'all'
                ? 'bg-[#F4C430] border-[#F4C430] text-[#111111] shadow-sm'
                : 'bg-white border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]'
            }`}
          >
            All Stream Schedules
          </button>
          {activeStreams.map((s: any) => (
            <button
              key={s.id || s.name}
              onClick={() => {
                setSelectedStream(s.id || s.name);
                setSelectedSubject('all');
              }}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all ${
                selectedStream === (s.id || s.name) || selectedStream === s.name
                  ? 'bg-[#111111] border-[#111111] text-white shadow-sm'
                  : 'bg-white border-[#E5E5E5] text-[#525252] hover:bg-[#F5F5F5]'
              }`}
            >
              {s.name} Stream
            </button>
          ))}
        </div>
      )}

      {/* Control bar with Subject & Format dropdowns + Search */}
      <div className="card bg-white border border-[#E5E5E5] p-4 flex flex-col gap-3 interactive">
        {/* Search */}
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search notes, chapters, topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 py-2 text-xs w-full bg-[#FAFAFA] border-[#F0F0F0]"
          />
        </div>

        {/* Filters row — stacked on mobile, inline on md+ */}
        <div className={`flex gap-3 ${isMobile ? 'flex-col' : 'flex-wrap items-center'}`}>
          {/* Layer 4: Subject Dropdown */}
          <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
            <span className="text-xs font-bold text-[#737373] flex items-center gap-1 shrink-0">
              <Filter size={12} />
              <span>Subject:</span>
            </span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className={`input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer font-bold text-[#111111] ${isMobile ? 'flex-1' : ''}`}
            >
              <option value="all">All Scoped Subjects ({scopedOfferings.length})</option>
              {scopedOfferings.map((o) => {
                const subjName = o.subject_name || (typeof o.subject === 'string' ? o.subject : o.subject?.name) || 'Class';
                const gr = o.grade || (o as any).class?.grade || '10';
                return (
                  <option key={o.id} value={o.id}>
                    {subjName} ({gr}th FBISE)
                  </option>
                );
              })}
            </select>
          </div>

          <div className={`flex items-center gap-2 ${isMobile ? 'w-full' : ''}`}>
            <span className="text-xs font-bold text-[#737373] shrink-0">Format:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className={`input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer font-bold text-[#111111] ${isMobile ? 'flex-1' : ''}`}
            >
              <option value="all">All Formats</option>
              <option value="pdf">PDF Docs</option>
              <option value="image">Image Files</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Notes */}
      {filteredNotes.length === 0 ? (
        <div className="card text-center py-20 interactive">
          <BookOpen size={32} className="mx-auto text-[#A3A3A3] mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-[#111111]">No documents found</h3>
          <p className="text-xs text-[#737373] mt-1">
            Try resetting the filter settings (Board → Grade → Stream → Subject) or uploading new notes for students.
          </p>
        </div>
      ) : (
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
          onUpload={handleUploadSave}
          onCancel={() => setDrawerOpen(false)}
          initialGrade={selectedGrade !== 'all' ? selectedGrade : undefined}
          initialStream={selectedStream !== 'all' ? selectedStream : undefined}
          initialOfferingId={selectedSubject !== 'all' ? selectedSubject : undefined}
        />
      </AdminDrawer>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setNoteToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Remove Note File?"
        description="This will permanently delete this chapter note from the student repository. Students will immediately lose access to view or download this file."
        confirmLabel="Delete File"
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
    </AdminShell>
  );
};

export default NotesManagerPage;
