import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookMarked } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import NoteCard from '../../components/student/NoteCard';
import NoteViewerModal from '../../components/student/NoteViewerModal';
import EmptyState from '../../components/ui/EmptyState';
import { GROUP_SUBJECTS } from '../../lib/mockData';
import { getOfferingsForStudent, getNotesForOfferings } from '../../lib/db';
import type { Note } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';

export const NotesPage: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = profile?.id || '';
  const studentGroup = profile?.stream || 'pre-engineering';
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!studentId) return;
    getOfferingsForStudent(studentId).then(async (offs) => {
      const ids = offs.map(o => o.id);
      const n = await getNotesForOfferings(ids).catch(() => [] as Note[]);
      setNotes(n);
    }).catch(console.error);
  }, [studentId]);

  // Synchronize search query from URL search parameters
  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // When student group changes, reset activeSubject to 'All'
  useEffect(() => {
    setActiveSubject('All');
  }, [studentGroup]);

  // Filter notes (already filtered by active student enrollments)
  const groupNotes = notes;

  // Extract unique subjects for the tabs based on enrolled subjects
  const enrolledSubjects = Array.from(new Set(notes.map(n => n.offering?.subject).filter(Boolean))) as string[];
  const subjects = [
    'All', 
    ...enrolledSubjects
  ];

  // Filter notes based on active subject and search term
  const filteredNotes = groupNotes.filter(note => {
    const matchesSubject = activeSubject === 'All' || note.offering?.subject === activeSubject;
    const matchesSearch = 
      note.chapter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  // Group notes by chapter
  const groupedNotes: Record<string, typeof filteredNotes> = {};
  filteredNotes.forEach(note => {
    if (!groupedNotes[note.chapter_name]) {
      groupedNotes[note.chapter_name] = [];
    }
    groupedNotes[note.chapter_name].push(note);
  });

  return (
    <StudentShell>
      {/* Page Header */}
      <SectionHeader
        title="Notes Library"
        description="Browse, preview, and download chapter-wise notes uploaded by your teachers."
      />

      {/* Filters & Search Control Bar */}
      <div className="flex flex-col xl:flex-row gap-4 items-stretch justify-between mb-6 bg-white p-4 border border-[#E5E5E5] rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by note title or chapter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9 w-full bg-[#FAFAFA]"
            />
          </div>
        </div>
        
        {/* Subject Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 self-center">
          {subjects.map(subject => (
            <button
              key={subject}
              onClick={() => setActiveSubject(subject || 'All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
                activeSubject === subject
                  ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                  : 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5]'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid View */}
      {filteredNotes.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="No notes found"
          description={
            searchTerm 
              ? `We couldn't find any notes matching "${searchTerm}". Try a different term or clear filters.`
              : "No notes are currently available for this subject."
          }
          action={
            searchTerm || activeSubject !== 'All' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveSubject('All');
                }}
                className="btn btn-ghost border border-[#E5E5E5] hover:bg-[#F5F5F5] font-bold"
              >
                Clear all filters
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedNotes).map(chapterName => (
            <div key={chapterName} className="space-y-4">
              {/* Chapter Header */}
              <div className="flex items-center gap-2 border-b border-[#E5E5E5] pb-2">
                <h2 className="text-base font-extrabold text-[#111111]">{chapterName}</h2>
                <span className="bg-[#F5F5F5] text-[#737373] text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {groupedNotes[chapterName].length} {groupedNotes[chapterName].length === 1 ? 'note' : 'notes'}
                </span>
              </div>
              
              {/* Note Cards List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedNotes[chapterName].map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onView={(n) => setSelectedNote(n)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Inline Note Previewer */}
      <NoteViewerModal
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
      />
    </StudentShell>
  );
};

export default NotesPage;
