import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  BookMarked,
  LogOut,
  Bell,
  Search,
  Menu,
  Clock,
  CreditCard
} from 'lucide-react';
import Logo from '../ui/Logo';
import { useAuth } from '../../features/auth/AuthContext';
import { getOfferingsForStudent, getSlotsForStudent, getNotesForOfferings } from '../../lib/db';
import { getEnrolledSubjectsForStudent } from '../../lib/taxonomy';
import { NotificationBell } from '../common/NotificationBell';

interface StudentShellProps {
  children: React.ReactNode;
}

interface NavItem {
  icon: any;
  label: string;
  path: string;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/student' },
  { icon: BookMarked,      label: 'Notes',      path: '/student/notes' },
  { icon: Calendar,        label: 'Schedule',   path: '/student/schedule' },
  { icon: Bell,            label: 'Announcements', path: '/student/announcements' },
  { icon: CreditCard,      label: 'Fee Checkout', path: '/student/checkout' },
];
const DAYS_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const StudentShell: React.FC<StudentShellProps> = ({ children }) => {
  const { profile, signOut, feeStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Universal Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    notes: any[];
    classes: any[];
  }>({ notes: [], classes: [] });

  const activeNav = location.pathname;
  const [enrolledSubjects, setEnrolledSubjects] = useState<string[]>([]);
  const [studentSlots, setStudentSlots] = useState<any[]>([]);
  const [studentNotes, setStudentNotes] = useState<any[]>([]);

  // Fetch enrolled subjects, slots, and notes dynamically
  useEffect(() => {
    if (profile?.id) {
      getOfferingsForStudent(profile.id)
        .then((offs) => {
          setEnrolledSubjects(getEnrolledSubjectsForStudent(profile, offs));
          const ids = offs.map(o => o.id);
          return getNotesForOfferings(ids);
        })
        .then(setStudentNotes)
        .catch(console.error);

      getSlotsForStudent(profile.id)
        .then(setStudentSlots)
        .catch(console.error);
    }
  }, [profile?.id]);

  // Handle live universal search querying
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ notes: [], classes: [] });
      return;
    }

    const query = searchQuery.toLowerCase();

    // 1. Filter notes matching query and enrolled subjects
    const matchedNotes = studentNotes.filter(note => {
      const subject = note.offering?.subject;
      if (!subject || !enrolledSubjects.includes(subject)) return false;

      return (
        (note.chapter_name || '').toLowerCase().includes(query) ||
        (note.title || '').toLowerCase().includes(query) ||
        subject.toLowerCase().includes(query)
      );
    }).slice(0, 4);

    // 2. Filter classes matching query and enrolled subjects
    const matchedClasses = studentSlots.filter(slot => {
      const subject = slot.custom_title || slot.offering?.subject;
      if (!subject || (!slot.custom_title && !enrolledSubjects.includes(subject))) return false;

      return (
        subject.toLowerCase().includes(query) ||
        (slot.offering?.teacher?.full_name && slot.offering.teacher.full_name.toLowerCase().includes(query)) ||
        (slot.room_or_link && slot.room_or_link.toLowerCase().includes(query))
      );
    }).slice(0, 4);

    setSearchResults({ notes: matchedNotes, classes: matchedClasses });
  }, [searchQuery, enrolledSubjects, studentNotes, studentSlots]);


  const handleNav = (path: string) => {
    setSidebarOpen(false);
    navigate(path);
  };

  const handleSearchResultClick = (type: 'note' | 'class', item: any) => {
    setSearchQuery('');
    setSearchFocused(false);
    if (type === 'note') {
      navigate(`/student/notes?search=${encodeURIComponent(item.chapter_name)}`);
    } else {
      navigate(`/student/schedule?day=${item.day_of_week}`);
    }
  };

  const hasSearchResults = searchResults.notes.length > 0 || searchResults.classes.length > 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-[#1F1F1F] shrink-0">
          <Logo size="sm" variant="full" darkMode />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, path, disabled }) => {
            const isBlocked = feeStatus !== 'paid' && path !== '/student/checkout';
            const isActive = !disabled && !isBlocked && (activeNav === path || (path !== '/student' && activeNav.startsWith(path)));
            return (
              <button
                key={path}
                onClick={() => !disabled && !isBlocked && handleNav(path)}
                disabled={disabled || isBlocked}
                title={isBlocked ? "Unlocks after payment verification" : undefined}
                className={`sidebar-link w-full ${isActive ? 'active' : ''} ${
                  disabled || isBlocked ? 'opacity-40 cursor-not-allowed' : 'interactive'
                }`}
              >
                <Icon size={17} className={`sidebar-icon shrink-0 ${isActive ? '' : 'text-[#525252]'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile + logout */}
        <div className="p-3 border-t border-[#1F1F1F] space-y-2">
          {/* Sidebar Profile Card (Non-interactive) */}
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1A1A1A] text-white border border-[#2A2A2A]">
            <div className="w-8 h-8 rounded-lg bg-[#F4C430] text-[#111111] flex items-center justify-center font-bold text-xs shrink-0">
              {(profile?.full_name?.[0] ?? 'S').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate leading-tight text-white">
                {profile?.full_name ?? 'Student'}
              </p>
              <p className="text-[10px] leading-tight mt-0.5 truncate text-[#737373]">
                {profile?.class?.display_name || 'SHS Student'}
              </p>
            </div>
          </div>

          <button
            onClick={signOut}
            className="sidebar-link w-full text-[#737373] hover:text-red-400 interactive"
          >
            <LogOut size={17} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen max-w-full overflow-x-hidden page-transition">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 sm:px-6 shrink-0 max-w-full overflow-x-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors text-[#111111] shrink-0 interactive"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>
            <div className="flex-1" />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <button
              onClick={() => feeStatus === 'paid' && navigate('/student/profile')}
              disabled={feeStatus !== 'paid'}
              title={feeStatus !== 'paid' ? "Unlocks after payment verification" : undefined}
              className={`w-9 h-9 rounded-lg bg-[#111111] flex items-center justify-center text-sm font-bold text-white ${
                feeStatus !== 'paid' ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 transition-transform interactive'
              }`}
            >
              {(profile?.full_name?.[0] ?? 'S').toUpperCase()}
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 overflow-y-auto overflow-x-hidden bg-[#FAFAFA] max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentShell;
