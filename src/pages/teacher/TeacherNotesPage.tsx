import React, { useState, useEffect } from 'react';
import { Plus, Search, BookOpen } from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { AdminNoteCard } from '../../components/admin/notes/AdminNoteCard';
import AdminDrawer from '../../components/admin/AdminDrawer';
import { NoteUploadForm } from '../../components/admin/notes/NoteUploadForm';
import ConfirmModal from '../../components/admin/ConfirmModal';
import NoteViewerModal from '../../components/student/NoteViewerModal';
import { getOfferingsForTeacher, getNotesForOfferings, insertNote, deleteNote } from '../../lib/db';
import type { Note, ClassOffering } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';

export const TeacherNotesPage: React.FC = () => {
  const { profile } = useAuth();
  const teacherId = profile?.id || 't1';

  const [teacherOfferings, setTeacherOfferings] = useState<ClassOffering[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  // ── Load teacher's offerings, then scoped notes ────────────────────────
  useEffect(() => {
    getOfferingsForTeacher(teacherId).then(async (offs) => {
      setTeacherOfferings(offs);
      const ids = offs.map((o) => o.id);
      const n = await getNotesForOfferings(ids).catch(() => [] as Note[]);
      setNotes(n);
    }).catch(console.error);
  }, [teacherId]);
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'pdf' | 'image'>('all');

  // Modal / Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

  const teacherOfferingIds = teacherOfferings.map((o) => o.id);

  // Derive only notes for this teacher's offerings
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

  // Filter notes based on search term, subject, and format type
  const filteredNotes = enrichedNotes.filter((note) => {
    const matchesSearch =
      note.chapter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (note.offering?.subject && note.offering.subject.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSubject = subjectFilter === 'all' || note.offering_id === subjectFilter;
    const matchesType = typeFilter === 'all' || note.file_type === typeFilter;

    return matchesSearch && matchesSubject && matchesType;
  });

  // Action handlers
  const handleUploadTrigger = () => {
    setDrawerOpen(true);
  };

  const handleUploadSave = async (formData: {
    offering_id: string;
    chapter_name: string;
    title: string;
    file_url: string;
    file_type: 'pdf' | 'image';
  }) => {
    const created = await insertNote({
      offering_id: formData.offering_id,
      chapter_name: formData.chapter_name,
      title: formData.title,
      file_url: formData.file_url,
      file_type: formData.file_type,
      uploaded_by: teacherId,
    }).catch(console.error);
    if (created) {
      setNotes((prev) => [created, ...prev]);
    }
    setDrawerOpen(false);
  };

  const handleDeleteTrigger = (noteId: string) => {
    setNoteToDelete(noteId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (noteToDelete) {
      await deleteNote(noteToDelete).catch(console.error);
      setNotes((prev) => prev.filter((n) => n.id !== noteToDelete));
      setNoteToDelete(null);
      setDeleteModalOpen(false);
    }
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
          onClick={handleUploadTrigger}
          className="btn flex items-center justify-center gap-1.5 px-4 py-2 bg-[#111111] hover:bg-[#262626] text-white text-xs font-bold rounded-xl shadow-sm shrink-0 self-start sm:self-center"
        >
          <Plus size={14} />
          Upload Notes
        </button>
      </div>

      {/* Control bar */}
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
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#737373]">Class:</span>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer"
            >
              <option value="all">All Assigned Classes</option>
              {teacherOfferings.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.subject} ({o.grade} {o.board.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#737373]">Format:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer"
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
          <p className="text-xs text-[#737373] mt-1">Try resetting the filter settings or uploading new notes for your students.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <AdminNoteCard
              key={note.id}
              note={note}
              onView={handleViewNote}
              onDelete={handleDeleteTrigger}
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
          offerings={teacherOfferings}
          onUpload={handleUploadSave}
          onCancel={() => setDrawerOpen(false)}
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
        description="This will permanently delete this chapter note from the student repository. Students in your class will immediately lose access to view or download this file."
        confirmLabel="Delete File"
        danger
      />

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
