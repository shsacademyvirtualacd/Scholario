import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, BookMarked } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import NoteCard from '../../components/student/NoteCard';
import NoteViewerModal from '../../components/student/NoteViewerModal';
import EmptyState from '../../components/ui/EmptyState';
import { getOfferingsForStudent, getNotesForOfferings } from '../../lib/db';
import { getEnrolledSubjectsForStudent } from '../../lib/taxonomy';
import { pageCache } from '../../lib/pageCache';
import type { Note } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

export const NotesPage: React.FC = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = profile?.id || '';
  
  const cachedNotes = studentId ? pageCache.get<Note[]>('student_notes', studentId) : null;
  const cachedOfferings = studentId ? pageCache.get<any[]>('student_offerings', studentId) : null;

  const [notes, setNotes] = useState<Note[]>(cachedNotes || []);
  const [offerings, setOfferings] = useState<any[]>(cachedOfferings || []);
  const [loading, setLoading] = useState<boolean>(!cachedNotes);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;

    const initNotes = pageCache.get<Note[]>('student_notes', studentId);
    const initOffs = pageCache.get<any[]>('student_offerings', studentId);
    if (initNotes && notes.length === 0 && mounted) {
      setNotes(initNotes);
      if (initOffs) setOfferings(initOffs);
      setLoading(false);
    }

    getOfferingsForStudent(studentId).then(async (offs) => {
      if (!mounted) return;
      const currentOffs = pageCache.get<any[]>('student_offerings', studentId);
      if (!currentOffs || JSON.stringify(currentOffs) !== JSON.stringify(offs)) {
        setOfferings(offs);
        pageCache.set('student_offerings', offs, studentId);
      }

      const ids = offs.map(o => o.id);
      const n = await getNotesForOfferings(ids).catch(() => [] as Note[]);
      if (!mounted) return;
      
      const currentNotes = pageCache.get<Note[]>('student_notes', studentId);
      if (!currentNotes || JSON.stringify(currentNotes) !== JSON.stringify(n)) {
        setNotes(n);
        pageCache.set('student_notes', n, studentId);
      }
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      if (mounted) setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [studentId]);

  useRealtimeTable({
    table: 'notes',
    onAny: async () => {
      if (!studentId || offerings.length === 0) return;
      const ids = offerings.map(o => o.id);
      const n = await getNotesForOfferings(ids).catch(() => [] as Note[]);
      setNotes(n);
      pageCache.set('student_notes', n, studentId);
    }
  });

  // Synchronize search query from URL search parameters
  useEffect(() => {
    const query = searchParams.get('search');
    if (query !== null) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // Reset activeSubject to 'All' on studentId change
  useEffect(() => {
    setActiveSubject('All');
  }, [studentId]);

  // Filter notes (already filtered by active student enrollments)
  const groupNotes = notes;

  // Extract unique subjects for the tabs based on enrolled subjects
  const enrolledSubjects = getEnrolledSubjectsForStudent(profile, offerings);
  const subjects = [
    'All', 
    ...enrolledSubjects
  ];

  // Filter notes based on active subject and search term
  const filteredNotes = groupNotes.filter(note => {
    const matchesSubject = activeSubject === 'All' || note.offering?.subject === activeSubject;
    const q = searchTerm.toLowerCase();
    const matchesSearch = !q ||
      (note.chapter_name || '').toLowerCase().includes(q) ||
      (note.title || '').toLowerCase().includes(q);
    return matchesSubject && matchesSearch;
  });

  // Group notes by chapter
  const groupedNotes: Record<string, typeof filteredNotes> = {};
  filteredNotes.forEach(note => {
    const chap = note.chapter_name || 'General Notes';
    if (!groupedNotes[chap]) {
      groupedNotes[chap] = [];
    }
    groupedNotes[chap].push(note);
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
      {loading && filteredNotes.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-[#E5E5E5] p-5 shadow-xs flex flex-col justify-between h-44">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-5 bg-[#F5F5F5] rounded w-20" />
                  <div className="h-5 bg-[#F5F5F5] rounded-full w-12" />
                </div>
                <div className="h-4 bg-[#F5F5F5] rounded w-3/4" />
                <div className="h-3 bg-[#F5F5F5] rounded w-full" />
                <div className="h-3 bg-[#F5F5F5] rounded w-2/3" />
              </div>
              <div className="flex justify-between pt-3 border-t border-[#F5F5F5]">
                <div className="h-3 bg-[#F5F5F5] rounded w-16" />
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-[#F5F5F5] rounded-lg" />
                  <div className="w-7 h-7 bg-[#F5F5F5] rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
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
                    note={note as any}
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
