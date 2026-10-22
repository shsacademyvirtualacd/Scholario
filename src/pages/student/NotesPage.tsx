import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, BookMarked, MessageSquare, Target } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import { StudentPageHeader } from '../../components/student/shared/StudentPageHeader';
import { StudentEmptyState } from '../../components/student/shared/StudentEmptyState';
import { StudentGridSkeleton } from '../../components/student/shared/StudentSkeleton';
import NoteCard from '../../components/student/NoteCard';
import NoteViewerModal from '../../components/student/NoteViewerModal';
import { getOfferingsForStudent, getNotesForOfferings } from '../../lib/db';
import { getEnrolledSubjectsForStudent } from '../../lib/taxonomy';
import { pageCache } from '../../lib/pageCache';
import type { Note } from '../../types';
import { useAuth } from '../../features/auth/AuthContext';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';

export const NotesPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const studentId = profile?.id || '';

  const [notes, setNotes] = useState<Note[]>([]);
  const [offerings, setOfferings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [activeSubject, setActiveSubject] = useState<string>('All');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;

    const cachedNotes = pageCache.get<Note[]>('student_notes', studentId);
    const cachedOfferings = pageCache.get<any[]>('student_offerings', studentId);
    if (cachedNotes && mounted) {
      setNotes(cachedNotes);
      if (cachedOfferings) setOfferings(cachedOfferings);
      setLoading(false);
    }

    getOfferingsForStudent(studentId)
      .then(async (offs) => {
        if (!mounted) return;
        setOfferings(offs || []);
        pageCache.set('student_offerings', offs || [], studentId);

        const ids = (offs || []).map((o) => o.id);
        const notesList = await getNotesForOfferings(ids).catch(() => [] as Note[]);
        if (!mounted) return;

        setNotes(notesList || []);
        pageCache.set('student_notes', notesList || [], studentId);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[NotesPage] Error fetching notes:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId]);

  useRealtimeTable({
    table: 'notes',
    debounceMs: 1500,
    onAny: async () => {
      if (!studentId || offerings.length === 0) return;
      const ids = offerings.map((o) => o.id);
      const notesList = await getNotesForOfferings(ids).catch(() => [] as Note[]);
      setNotes(notesList || []);
      pageCache.set('student_notes', notesList || [], studentId);
    },
  });

  // Calculate subject counts
  const enrolledSubjects = useMemo(() => {
    return getEnrolledSubjectsForStudent(profile, offerings);
  }, [profile, offerings]);

  const subjectCounts = useMemo(() => {
    const counts: Record<string, number> = { All: notes.length };
    enrolledSubjects.forEach((sub) => {
      counts[sub] = 0;
    });

    notes.forEach((note) => {
      const rawSubj =
        note.offering?.subject_name ||
        (typeof note.offering?.subject === 'string'
          ? note.offering.subject
          : note.offering?.subject?.name) ||
        '';
      if (rawSubj) {
        counts[rawSubj] = (counts[rawSubj] || 0) + 1;
      }
    });

    return counts;
  }, [notes, enrolledSubjects]);

  const subjectList = useMemo(() => {
    const set = new Set<string>(['All', ...enrolledSubjects]);
    // Also include any subjects that have notes
    notes.forEach((note) => {
      const rawSubj =
        note.offering?.subject_name ||
        (typeof note.offering?.subject === 'string'
          ? note.offering.subject
          : note.offering?.subject?.name);
      if (rawSubj) set.add(rawSubj);
    });
    return Array.from(set);
  }, [enrolledSubjects, notes]);

  // Filter notes based on active subject and search term, sorted newest first
  const filteredNotes = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return notes
      .filter((note) => {
        const rawSubj =
          note.offering?.subject_name ||
          (typeof note.offering?.subject === 'string'
            ? note.offering.subject
            : note.offering?.subject?.name) ||
          '';

        const matchesSubject =
          activeSubject === 'All' ||
          rawSubj.toLowerCase().trim() === activeSubject.toLowerCase().trim();

        const matchesSearch =
          !q ||
          (note.chapter_name || '').toLowerCase().includes(q) ||
          (note.title || '').toLowerCase().includes(q) ||
          rawSubj.toLowerCase().includes(q);

        return matchesSubject && matchesSearch;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [notes, activeSubject, searchTerm]);

  return (
    <StudentShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <StudentPageHeader
          title="Notes Library"
          description="Browse chapter-wise revision notes, lecture slides, and study PDFs uploaded by your subject teachers."
        />

        {/* ── Search & Horizontal Subject Strip ── */}
        <div className="p-4 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by note title, chapter name, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-[44px] w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-850 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400/50"
            />
          </div>

          {/* Subject Filter Chips in Single Scrollable Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {subjectList.map((subject) => {
              const count = subjectCounts[subject] || 0;
              const isSelected = activeSubject === subject;
              const hasNoNotes = subject !== 'All' && count === 0;

              return (
                <button
                  key={subject}
                  type="button"
                  onClick={() => setActiveSubject(subject)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-neutral-950 text-white dark:bg-amber-400 dark:text-neutral-950 shadow-xs'
                      : hasNoNotes
                      ? 'bg-neutral-100 dark:bg-neutral-800/50 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                  }`}
                >
                  <span>{subject}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-neutral-950'
                        : 'bg-neutral-200/60 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Main Notes Grid / Empty States ── */}
        {loading ? (
          <StudentGridSkeleton count={6} />
        ) : notes.length === 0 ? (
          /* Empty state when NO notes exist across the board */
          <StudentEmptyState
            icon={<BookMarked size={28} />}
            title="No notes for your class yet"
            description="Your teachers will upload chapter notes, formulas, and past paper answers here as classes progress."
            action={{
              label: 'Practice in Self Testing',
              onClick: () => navigate('/student/self-testing'),
            }}
            secondaryAction={{
              label: 'Message your teacher',
              onClick: () => navigate('/student/chat'),
            }}
          />
        ) : filteredNotes.length === 0 ? (
          /* Empty state when filtering or searching returns 0 results */
          <StudentEmptyState
            icon={<BookMarked size={28} />}
            title={`No notes found for "${activeSubject}"`}
            description={
              searchTerm
                ? `No notes match "${searchTerm}" in ${activeSubject}. Try clearing your search or picking another subject.`
                : `Your teacher has not uploaded any study materials for ${activeSubject} yet.`
            }
            action={{
              label: 'View all subjects',
              onClick: () => {
                setActiveSubject('All');
                setSearchTerm('');
              },
            }}
            secondaryAction={{
              label: 'Practice in Self Testing',
              onClick: () => navigate('/student/self-testing'),
            }}
          />
        ) : (
          /* Cards Grid sorted newest first */
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pb-1">
              <span>
                Showing <strong>{filteredNotes.length}</strong> {filteredNotes.length === 1 ? 'note' : 'notes'}
              </span>
              <span>Sorted newest first</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note as any}
                  onView={(n) => setSelectedNote(n)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Inline Note Previewer Modal */}
      <NoteViewerModal
        note={selectedNote}
        onClose={() => setSelectedNote(null)}
      />
    </StudentShell>
  );
};

export default NotesPage;
