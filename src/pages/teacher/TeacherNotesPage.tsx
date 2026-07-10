import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, RotateCcw, Filter } from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { AdminNoteCard } from '../../components/admin/notes/AdminNoteCard';
import AdminDrawer from '../../components/admin/AdminDrawer';
import { TeacherNoteUploadForm } from '../../components/teacher/TeacherNoteUploadForm';
import NoteViewerModal from '../../components/student/NoteViewerModal';
import { getOfferingsForTeacher, getNotesForOfferings, insertNote, getTaxonomy } from '../../lib/db';
import { getStreamsForGrade, getSubjectsForStream, GRADES } from '../../lib/taxonomy';
import type { Note, ClassOffering } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';

export const TeacherNotesPage: React.FC = () => {
  const { profile } = useAuth();
  const teacherId = profile?.id || 't1';

  const [teacherOfferings, setTeacherOfferings] = useState<ClassOffering[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [taxonomy, setTaxonomy] = useState<any>(null);

  // ── Load teacher's offerings, notes, and taxonomy ──────────────────────
  useEffect(() => {
    getTaxonomy().then(setTaxonomy).catch(console.error);

    getOfferingsForTeacher(teacherId).then(async (offs) => {
      setTeacherOfferings(offs);
      const ids = offs.map((o) => o.id);
      const n = await getNotesForOfferings(ids).catch(() => [] as Note[]);
      setNotes(n);
    }).catch(console.error);
  }, [teacherId]);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'image'>('all');

  // 4-Layer Taxonomy Filters (Board → Grade → Stream → Subject)
  const [selectedBoard, setSelectedBoard] = useState<string>('fbise');
  const [selectedGrade, setSelectedGrade] = useState<string>('10');
  const [selectedStream, setSelectedStream] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  // Modal / Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const teacherOfferingIds = teacherOfferings.map((o) => o.id);
  const teacherScopedNotes = notes.filter((n) => teacherOfferingIds.includes(n.offering_id));

  // Enrich raw notes with class offering and teacher details
  const enrichedNotes = teacherScopedNotes.map((note) => {
    if (note.offering) return note;
    const offering = teacherOfferings.find((o) => o.id === note.offering_id);
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
  const scopedOfferings = teacherOfferings.filter((offering) => {
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
    } else {
      if (!scopedOfferings.some((o) => o.id === note.offering_id)) return false;
    }

    return matchesSearch && matchesType;
  });

  const resetFilters = () => {
    setSelectedBoard('fbise');
    setSelectedGrade('10');
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

  const handleUploadSave = async (formData: {
    offering_id: string;
    chapter_name: string;
    title: string;
    file_url: string;
    file_path: string;
    file_type: 'pdf' | 'image';
  }) => {
    let created: Note | null = null;
    if ((formData as any).id && (formData as any).created_at) {
      created = formData as unknown as Note;
    } else {
      created = await insertNote({
        offering_id: formData.offering_id,
        chapter_name: formData.chapter_name,
        title: formData.title,
        file_url: formData.file_url,
        file_path: formData.file_path,
        file_type: formData.file_type,
        uploaded_by: teacherId,
      }).catch(console.error) || null;
    }
    if (created) {
      setNotes((prev) => [created!, ...prev]);
    }
    setDrawerOpen(false);
  };

  const handleViewNote = (note: Note) => {
    setSelectedNote(note);
    setViewerOpen(true);
  };

  return (
    <TeacherShell>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Notes Manager"
          description="Upload revision resources, past papers, chapter notes, and textbook reference images for your classes."
        />
        <button
          onClick={() => setDrawerOpen(true)}
          className="btn flex items-center justify-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#262626] text-white text-xs font-bold rounded-xl shadow-sm shrink-0 self-start sm:self-center"
        >
          <Plus size={14} />
          Upload Notes
        </button>
      </div>

      {/* Class Profiles Filter Bar (Tabs Layout) - Board Selection */}
      <div className="border-b border-[#E5E5E5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex overflow-x-auto gap-6 border-transparent">
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
          {(selectedBoard !== 'fbise' || selectedGrade !== '10' || selectedStream !== 'all' || selectedSubject !== 'all' || typeFilter !== 'all' || searchTerm !== '') && (
            <button
              onClick={resetFilters}
              className="text-[10px] font-black text-amber-600 hover:text-[#111111] flex items-center gap-0.5"
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
      <div className="card bg-white border border-[#E5E5E5] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search notes, chapters, topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 py-2 text-xs w-full bg-[#FAFAFA] border-[#F0F0F0]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Layer 4: Subject Dropdown scoped to Grade+Stream */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#737373] flex items-center gap-1">
              <Filter size={12} />
              <span>Subject:</span>
            </span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer font-bold text-[#111111]"
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

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#737373]">Format:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer font-bold text-[#111111]"
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
        <div className="card text-center py-20 bg-white border border-[#E5E5E5] rounded-2xl">
          <BookOpen size={32} className="mx-auto text-[#A3A3A3] mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-[#111111]">No documents found</h3>
          <p className="text-xs text-[#737373] mt-1">
            Try resetting the filter settings (Board → Grade → Stream → Subject) or uploading new notes for your students.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <AdminNoteCard
              key={note.id}
              note={note}
              onView={handleViewNote}
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
        <TeacherNoteUploadForm
          offerings={teacherOfferings}
          onUpload={handleUploadSave}
          onCancel={() => setDrawerOpen(false)}
          initialGrade={selectedGrade !== 'all' ? selectedGrade : undefined}
          initialStream={selectedStream !== 'all' ? selectedStream : undefined}
          initialOfferingId={selectedSubject !== 'all' ? selectedSubject : undefined}
        />
      </AdminDrawer>

      {/* Note Viewer Popover */}
      {viewerOpen && selectedNote && (
        <NoteViewerModal
          note={selectedNote}
          onClose={() => {
            setViewerOpen(false);
            setSelectedNote(null);
          }}
        />
      )}
    </TeacherShell>
  );
};

export default TeacherNotesPage;
