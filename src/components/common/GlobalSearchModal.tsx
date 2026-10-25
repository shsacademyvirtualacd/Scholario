import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Command,
  ArrowRight,
  Clock,
  Bot,
  Loader2,
  BookMarked,
  FileCheck2,
  Calendar,
  MessageSquare,
  Users,
  GraduationCap,
  Bell,
  Coins,
  ShieldAlert,
  Database,
  DollarSign,
  Sun,
  Moon,
  Laptop,
  LogOut,
  User,
  LayoutDashboard,
  Target,
  ClipboardCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../features/auth/AuthContext';
import type { Role } from '../../types';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: 'admin' | 'teacher' | 'student';
  onSignOut?: () => Promise<void> | void;
}

interface SearchItem {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  path?: string;
  action?: () => void;
  icon: any;
  keywords?: string[];
}

const RECENT_SEARCHES_KEY = 'scholario_recent_searches';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  role,
  onSignOut,
}) => {
  const navigate = useNavigate();
  const { isDark, themeMode, setThemeMode, toggleTheme } = useTheme();
  const { profile } = useAuth();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dbResults, setDbResults] = useState<SearchItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved).slice(0, 5) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Available category chips per role
  const categoryChips = useMemo(() => {
    if (role === 'admin') {
      return ['All', 'Pages', 'Students', 'Teachers', 'Classes', 'Notes', 'Tests', 'Fees', 'Actions'];
    }
    if (role === 'teacher') {
      return ['All', 'Pages', 'Classes', 'Students', 'Notes', 'Tests', 'Actions'];
    }
    return ['All', 'Pages', 'Notes', 'Tests', 'Schedule', 'Announcements', 'Actions'];
  }, [role]);

  // Static Pages & Navigation map strictly scoped per role
  const rolePages = useMemo<SearchItem[]>(() => {
    if (role === 'admin') {
      return [
        { id: 'page-admin-dash', title: 'Admin Dashboard', subtitle: 'Overview, analytics & quick actions', category: 'Pages', path: '/admin', icon: LayoutDashboard, keywords: ['home', 'overview', 'stats', 'analytics'] },
        { id: 'page-admin-chat', title: 'Faculty & Student Chat', subtitle: 'Direct messages & group channels', category: 'Pages', path: '/admin/chat', icon: MessageSquare, keywords: ['messages', 'inbox', 'communication'] },
        { id: 'page-admin-attendance', title: 'Attendance Console', subtitle: 'Teacher clock-in & student attendance', category: 'Pages', path: '/admin/attendance', icon: ClipboardCheck, keywords: ['present', 'absent', 'clock', 'staff', 'records'] },
        { id: 'page-admin-roster', title: 'Roster Manager', subtitle: 'Student directory, invites & access', category: 'Pages', path: '/admin/roster', icon: Users, keywords: ['invites', 'access', 'enrollment', 'users'] },
        { id: 'page-admin-schedule', title: 'Schedule Manager', subtitle: 'Class timetables & teacher slots', category: 'Pages', path: '/admin/schedule', icon: Calendar, keywords: ['timetable', 'slots', 'classes', 'periods'] },
        { id: 'page-admin-teachers', title: 'Teachers Directory', subtitle: 'Faculty profiles, subjects & ratings', category: 'Pages', path: '/admin/teachers', icon: GraduationCap, keywords: ['staff', 'instructors', 'faculty'] },
        { id: 'page-admin-students', title: 'Students Directory', subtitle: 'Enrollment, grades & performance', category: 'Pages', path: '/admin/students', icon: Users, keywords: ['pupils', 'roll', 'classmates'] },
        { id: 'page-admin-notes', title: 'Notes Manager', subtitle: 'Curriculum notes, PDFs & slides', category: 'Pages', path: '/admin/notes', icon: BookMarked, keywords: ['study material', 'handouts', 'documents'] },
        { id: 'page-admin-tests', title: 'Testing Center', subtitle: 'MCQ & written assessments', category: 'Pages', path: '/admin/tests', icon: FileCheck2, keywords: ['exams', 'quizzes', 'marks', 'grading'] },
        { id: 'page-admin-question-bank', title: 'Question Bank', subtitle: 'Repository of exam questions', category: 'Pages', path: '/admin/question-bank', icon: Database, keywords: ['mcqs', 'questions', 'repository'] },
        { id: 'page-admin-announcements', title: 'Announcements', subtitle: 'School-wide banners and notices', category: 'Pages', path: '/admin/announcements', icon: Bell, keywords: ['notices', 'alerts', 'broadcast'] },
        { id: 'page-admin-visibility', title: 'Visibility Requests', subtitle: 'Student profile access requests', category: 'Pages', path: '/admin/visibility-requests', icon: ShieldAlert, keywords: ['privacy', 'approvals'] },
        { id: 'page-admin-sage', title: 'Sage Academic AI', subtitle: 'Curriculum assistant & analytics', category: 'Pages', path: '/admin/sage', icon: Bot, keywords: ['ai', 'sage', 'assistant', 'bot'] },
        { id: 'page-admin-prices', title: 'Price Manager', subtitle: 'Tuition fees & pricing configuration', category: 'Pages', path: '/admin/prices', icon: DollarSign, keywords: ['pricing', 'plans', 'tuition'] },
        { id: 'page-admin-fees', title: 'Fees & Reconciliation', subtitle: 'Student fee vouchers & verification', category: 'Pages', path: '/admin/fees', icon: Coins, keywords: ['payments', 'slips', 'vouchers', 'finance'] },
        { id: 'page-admin-profile', title: 'Admin Profile', subtitle: 'Account settings & security', category: 'Pages', path: '/admin/profile', icon: User, keywords: ['account', 'settings', 'password'] },
      ];
    }
    if (role === 'teacher') {
      return [
        { id: 'page-teacher-dash', title: 'Teacher Dashboard', subtitle: 'Class schedules, active tasks & stats', category: 'Pages', path: '/teacher', icon: LayoutDashboard, keywords: ['home', 'overview'] },
        { id: 'page-teacher-chat', title: 'Teacher Chat', subtitle: 'Messages with faculty & students', category: 'Pages', path: '/teacher/chat', icon: MessageSquare, keywords: ['messages', 'inbox'] },
        { id: 'page-teacher-attendance', title: 'Faculty Attendance', subtitle: 'Clock-in / clock-out & student logs', category: 'Pages', path: '/teacher/attendance', icon: ClipboardCheck, keywords: ['clock in', 'clock out', 'presence'] },
        { id: 'page-teacher-notes', title: 'Notes Manager', subtitle: 'Upload and manage course material', category: 'Pages', path: '/teacher/notes', icon: BookMarked, keywords: ['handouts', 'pdfs', 'slides'] },
        { id: 'page-teacher-tests', title: 'Testing Center', subtitle: 'Create tests & evaluate submissions', category: 'Pages', path: '/teacher/tests', icon: FileCheck2, keywords: ['grading', 'mcq', 'written tests'] },
        { id: 'page-teacher-schedule', title: 'Class Schedule', subtitle: 'Timetable & upcoming live sessions', category: 'Pages', path: '/teacher/schedule', icon: Calendar, keywords: ['timetable', 'slots', 'calendar'] },
        { id: 'page-teacher-announcements', title: 'Announcements', subtitle: 'View institutional updates', category: 'Pages', path: '/teacher/announcements', icon: Bell, keywords: ['notices', 'alerts'] },
        { id: 'page-teacher-sage', title: 'Sage Assistant', subtitle: 'AI lesson planner and question generator', category: 'Pages', path: '/teacher/sage', icon: Bot, keywords: ['ai', 'sage', 'lesson planner'] },
        { id: 'page-teacher-profile', title: 'Faculty Profile', subtitle: 'Account & biography settings', category: 'Pages', path: '/teacher/profile', icon: User, keywords: ['account', 'settings'] },
      ];
    }
    // Student
    return [
      { id: 'page-student-dash', title: 'Student Dashboard', subtitle: 'Enrolled subjects, progress & updates', category: 'Pages', path: '/student', icon: LayoutDashboard, keywords: ['home', 'overview', 'classes'] },
      { id: 'page-student-schedule', title: 'Class Schedule', subtitle: 'Weekly timetable & live class links', category: 'Schedule', path: '/student/schedule', icon: Calendar, keywords: ['timetable', 'zoom', 'meeting', 'live'] },
      { id: 'page-student-attendance', title: 'My Attendance', subtitle: 'Attendance history & calendar', category: 'Pages', path: '/student/attendance', icon: ClipboardCheck, keywords: ['presence', 'calendar', 'absent'] },
      { id: 'page-student-notes', title: 'Study Notes', subtitle: 'Handouts, chapters & curriculum PDFs', category: 'Notes', path: '/student/notes', icon: BookMarked, keywords: ['books', 'handouts', 'pdfs', 'chapters'] },
      { id: 'page-student-tests', title: 'Testing Center', subtitle: 'Take tests & view marked results', category: 'Tests', path: '/student/tests', icon: FileCheck2, keywords: ['exams', 'marks', 'grading', 'mcqs'] },
      { id: 'page-student-self-testing', title: 'Self Testing', subtitle: 'Practice tests & instant evaluation', category: 'Tests', path: '/student/self-testing', icon: Target, keywords: ['practice', 'mock exam'] },
      { id: 'page-student-sage', title: 'Sage AI Tutor', subtitle: '24/7 personal academic tutor', category: 'Pages', path: '/student/sage', icon: Bot, keywords: ['ai tutor', 'homework help', 'bot'] },
      { id: 'page-student-chat', title: 'Class Chat', subtitle: 'Connect with peers & instructors', category: 'Pages', path: '/student/chat', icon: MessageSquare, keywords: ['messages', 'questions'] },
      { id: 'page-student-announcements', title: 'Announcements', subtitle: 'Notices, dates & circulars', category: 'Announcements', path: '/student/announcements', icon: Bell, keywords: ['circulars', 'holidays', 'notices'] },
      { id: 'page-student-checkout', title: 'Tuition & Fees', subtitle: 'Payment vouchers & fee status', category: 'Pages', path: '/student/checkout', icon: Coins, keywords: ['tuition', 'fee payment', 'voucher'] },
      { id: 'page-student-profile', title: 'My Profile', subtitle: 'Personal profile & board settings', category: 'Pages', path: '/student/profile', icon: User, keywords: ['account', 'bio', 'settings'] },
    ];
  }, [role]);

  // Static Actions (Theme toggling, Sign out, Profile)
  const systemActions = useMemo<SearchItem[]>(() => {
    const list: SearchItem[] = [
      {
        id: 'action-toggle-theme',
        title: isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: isDark ? 'Activate Crisp Day Palette' : 'Activate OLED Night Palette',
        category: 'Actions',
        icon: isDark ? Sun : Moon,
        keywords: ['theme', 'dark mode', 'light mode', 'oled', 'color'],
        action: () => toggleTheme(),
      },
      {
        id: 'action-system-theme',
        title: 'Use System Theme Preference',
        subtitle: 'Auto-sync with OS appearance',
        category: 'Actions',
        icon: Laptop,
        keywords: ['auto theme', 'os theme', 'system'],
        action: () => setThemeMode('system'),
      },
      {
        id: 'action-open-profile',
        title: 'View Account Profile',
        subtitle: profile?.full_name || 'Personal preferences & details',
        category: 'Actions',
        icon: User,
        keywords: ['profile', 'settings', 'account'],
        path: `/${role}/profile`,
      },
    ];

    if (onSignOut) {
      list.push({
        id: 'action-sign-out',
        title: 'Sign Out of Scholario',
        subtitle: 'Securely end active session',
        category: 'Actions',
        icon: LogOut,
        keywords: ['logout', 'signout', 'exit', 'disconnect'],
        action: async () => {
          onClose();
          await onSignOut();
        },
      });
    }

    return list;
  }, [isDark, toggleTheme, setThemeMode, profile?.full_name, role, onSignOut, onClose]);

  // Quick Links for empty state
  const quickLinks = useMemo<SearchItem[]>(() => {
    return rolePages.slice(0, 5);
  }, [rolePages]);

  // Debounce query (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Focus input and reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setSelectedIndex(0);
      setActiveCategory('All');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Live Role-Scoped Database Querying
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setDbResults([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const runScopedSearch = async () => {
      const q = debouncedQuery.toLowerCase();
      const results: SearchItem[] = [];

      try {
        if (role === 'admin') {
          // Admin search: Students, Teachers, Notes, Tests
          const [studentsRes, teachersRes, notesRes, testsRes] = await Promise.allSettled([
            supabase
              .from('profiles')
              .select('id, full_name, phone, role, grade, board_id')
              .eq('role', 'student')
              .ilike('full_name', `%${q}%`)
              .limit(5),
            supabase
              .from('profiles')
              .select('id, full_name, phone, role')
              .eq('role', 'teacher')
              .ilike('full_name', `%${q}%`)
              .limit(5),
            supabase
              .from('notes')
              .select('id, title, subject_name, grade')
              .ilike('title', `%${q}%`)
              .limit(5),
            supabase
              .from('tests')
              .select('id, title')
              .ilike('title', `%${q}%`)
              .limit(5),
          ]);

          if (studentsRes.status === 'fulfilled' && studentsRes.value.data) {
            studentsRes.value.data.forEach((s: any) => {
              results.push({
                id: `student-${s.id}`,
                title: s.full_name || 'Unnamed Student',
                subtitle: `Student · ${s.phone || 'No phone'}`,
                category: 'Students',
                path: `/admin/students?q=${encodeURIComponent(s.full_name || '')}`,
                icon: Users,
              });
            });
          }

          if (teachersRes.status === 'fulfilled' && teachersRes.value.data) {
            teachersRes.value.data.forEach((t: any) => {
              results.push({
                id: `teacher-${t.id}`,
                title: t.full_name || 'Faculty Member',
                subtitle: `Teacher · ${t.phone || 'Faculty'}`,
                category: 'Teachers',
                path: `/admin/teachers?q=${encodeURIComponent(t.full_name || '')}`,
                icon: GraduationCap,
              });
            });
          }

          if (notesRes.status === 'fulfilled' && notesRes.value.data) {
            notesRes.value.data.forEach((n: any) => {
              results.push({
                id: `note-${n.id}`,
                title: n.title,
                subtitle: `Note · ${n.subject_name || 'Curriculum'}`,
                category: 'Notes',
                path: '/admin/notes',
                icon: BookMarked,
              });
            });
          }

          if (testsRes.status === 'fulfilled' && testsRes.value.data) {
            testsRes.value.data.forEach((t: any) => {
              results.push({
                id: `test-${t.id}`,
                title: t.title,
                subtitle: 'Testing Center Exam',
                category: 'Tests',
                path: '/admin/tests',
                icon: FileCheck2,
              });
            });
          }
        } else if (role === 'teacher') {
          // Teacher search: Notes, Tests, Announcements
          const [notesRes, testsRes, annRes] = await Promise.allSettled([
            supabase
              .from('notes')
              .select('id, title, subject_name')
              .ilike('title', `%${q}%`)
              .limit(6),
            supabase
              .from('tests')
              .select('id, title')
              .ilike('title', `%${q}%`)
              .limit(6),
            supabase
              .from('announcements')
              .select('id, title')
              .ilike('title', `%${q}%`)
              .limit(4),
          ]);

          if (notesRes.status === 'fulfilled' && notesRes.value.data) {
            notesRes.value.data.forEach((n: any) => {
              results.push({
                id: `t-note-${n.id}`,
                title: n.title,
                subtitle: `Class Note · ${n.subject_name || 'Subject'}`,
                category: 'Notes',
                path: '/teacher/notes',
                icon: BookMarked,
              });
            });
          }

          if (testsRes.status === 'fulfilled' && testsRes.value.data) {
            testsRes.value.data.forEach((t: any) => {
              results.push({
                id: `t-test-${t.id}`,
                title: t.title,
                subtitle: 'Testing Center Assessment',
                category: 'Tests',
                path: '/teacher/tests',
                icon: FileCheck2,
              });
            });
          }

          if (annRes.status === 'fulfilled' && annRes.value.data) {
            annRes.value.data.forEach((a: any) => {
              results.push({
                id: `t-ann-${a.id}`,
                title: a.title,
                subtitle: 'School Announcement',
                category: 'Announcements',
                path: '/teacher/announcements',
                icon: Bell,
              });
            });
          }
        } else {
          // Student search: Notes, Tests, Announcements
          const [notesRes, testsRes, annRes] = await Promise.allSettled([
            supabase
              .from('notes')
              .select('id, title, subject_name')
              .ilike('title', `%${q}%`)
              .limit(6),
            supabase
              .from('tests')
              .select('id, title')
              .ilike('title', `%${q}%`)
              .limit(6),
            supabase
              .from('announcements')
              .select('id, title')
              .ilike('title', `%${q}%`)
              .limit(4),
          ]);

          if (notesRes.status === 'fulfilled' && notesRes.value.data) {
            notesRes.value.data.forEach((n: any) => {
              results.push({
                id: `s-note-${n.id}`,
                title: n.title,
                subtitle: `Study Note · ${n.subject_name || 'Class handout'}`,
                category: 'Notes',
                path: '/student/notes',
                icon: BookMarked,
              });
            });
          }

          if (testsRes.status === 'fulfilled' && testsRes.value.data) {
            testsRes.value.data.forEach((t: any) => {
              results.push({
                id: `s-test-${t.id}`,
                title: t.title,
                subtitle: 'Assigned Exam / Test',
                category: 'Tests',
                path: '/student/tests',
                icon: FileCheck2,
              });
            });
          }

          if (annRes.status === 'fulfilled' && annRes.value.data) {
            annRes.value.data.forEach((a: any) => {
              results.push({
                id: `s-ann-${a.id}`,
                title: a.title,
                subtitle: 'Notice Board Circular',
                category: 'Announcements',
                path: '/student/announcements',
                icon: Bell,
              });
            });
          }
        }
      } catch (err) {
        console.warn('[GlobalSearch] Scoped search failed gracefully:', err);
      } finally {
        if (isMounted) {
          setDbResults(results);
          setLoading(false);
        }
      }
    };

    runScopedSearch();
    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, role]);

  // Filter static pages & actions based on query
  const staticMatches = useMemo<SearchItem[]>(() => {
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();

    const matches: SearchItem[] = [];

    // Filter pages
    rolePages.forEach((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchKw = item.keywords?.some((k) => k.toLowerCase().includes(q));
      if (matchTitle || matchSub || matchKw) {
        matches.push(item);
      }
    });

    // Filter actions
    systemActions.forEach((item) => {
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchKw = item.keywords?.some((k) => k.toLowerCase().includes(q));
      if (matchTitle || matchSub || matchKw) {
        matches.push(item);
      }
    });

    return matches;
  }, [debouncedQuery, rolePages, systemActions]);

  // Combined and Category-filtered items
  const allResults = useMemo<SearchItem[]>(() => {
    const combined = [...staticMatches, ...dbResults];
    if (activeCategory === 'All') return combined;
    return combined.filter((i) => i.category.toLowerCase() === activeCategory.toLowerCase());
  }, [staticMatches, dbResults, activeCategory]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [allResults]);

  // Execute an item action or route
  const handleSelectItem = (item: SearchItem) => {
    // Save to recent searches if typed
    if (debouncedQuery.trim()) {
      saveRecentSearch(debouncedQuery.trim());
    }

    onClose();

    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const saveRecentSearch = (text: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== text.toLowerCase());
      const updated = [text, ...filtered].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const removeRecentSearch = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s !== text);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (allResults.length > 0 ? (prev + 1) % allResults.length : 0));
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (allResults.length > 0 ? (prev - 1 + allResults.length) % allResults.length : 0));
        return;
      }

      if (e.key === 'Enter') {
        if (allResults.length > 0 && allResults[selectedIndex]) {
          e.preventDefault();
          handleSelectItem(allResults[selectedIndex]);
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const currentIdx = categoryChips.indexOf(activeCategory);
        const nextIdx = e.shiftKey
          ? (currentIdx - 1 + categoryChips.length) % categoryChips.length
          : (currentIdx + 1) % categoryChips.length;
        setActiveCategory(categoryChips[nextIdx]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, allResults, selectedIndex, activeCategory, categoryChips]);

  // Scroll active item into view
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const activeEl = resultsContainerRef.current.querySelector('[data-selected="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  // Highlight helper
  const renderHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark key={i} className="bg-[rgba(242,194,48,0.32)] dark:bg-[rgba(242,194,48,0.24)] text-[#8A6A00] dark:text-[#F2C230] font-bold rounded-xs px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Surface: Fullscreen sheet on mobile (<640px), centered dialog on tablet & desktop */}
      <div
        className="relative z-10 w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[70vh] h-[85dvh] sm:h-auto flex flex-col rounded-t-[28px] sm:rounded-[24px] bg-white dark:bg-[#121214] border-t sm:border border-black/[0.08] dark:border-white/[0.14] shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-220 ease-out"
        style={{
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
        }}
      >
        {/* Top Header: Input + Cancel button */}
        <div className="p-3 sm:p-4 border-b border-black/[0.08] dark:border-white/[0.10] flex items-center gap-2.5 shrink-0 bg-white/70 dark:bg-[#121214]/70">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-3.5 text-neutral-400 dark:text-neutral-500 pointer-events-none flex items-center justify-center">
              {loading ? <Loader2 size={18} className="animate-spin text-[#F2C230]" /> : <Search size={18} />}
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                role === 'admin'
                  ? 'Search students, faculty, notes, tests, pages...'
                  : role === 'teacher'
                  ? 'Search classes, notes, tests, pages...'
                  : 'Search notes, tests, schedule, announcements...'
              }
              className="w-full h-12 pl-10 pr-9 rounded-xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 text-sm sm:text-base font-medium outline-hidden border border-transparent focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/30 transition-all"
            />

            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-2.5 p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                aria-label="Clear search query"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="sm:hidden px-3 h-11 flex items-center justify-center text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onClose}
            className="hidden sm:flex w-9 h-9 items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close search"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scope Filter Chips */}
        <div className="px-3 sm:px-4 py-2 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center gap-1.5 overflow-x-auto hide-scrollbar shrink-0 bg-neutral-50/50 dark:bg-black/20">
          {categoryChips.map((chip) => {
            const isActive = activeCategory.toLowerCase() === chip.toLowerCase();
            return (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveCategory(chip)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#111111] dark:bg-white text-white dark:text-[#111111] shadow-xs'
                    : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400 hover:bg-black/[0.08] dark:hover:bg-white/[0.12]'
                }`}
              >
                {chip}
              </button>
            );
          })}
        </div>

        {/* Results Area */}
        <div ref={resultsContainerRef} className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 custom-scrollbar min-h-0">
          {/* Empty Query State: Show Recent Searches & Quick Links */}
          {!debouncedQuery && (
            <div className="space-y-4 py-2">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between px-3 py-1 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} />
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-[11px] font-semibold text-neutral-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="space-y-1 mt-1">
                    {recentSearches.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => setQuery(item)}
                        className="group flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5 text-neutral-700 dark:text-neutral-300 text-sm font-medium">
                          <Clock size={15} className="text-neutral-400" />
                          <span>{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, item)}
                          className="p-1 rounded-md text-neutral-400 hover:text-neutral-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label={`Remove ${item} from recent`}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Navigation Links */}
              <div>
                <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5">
                  Quick Links
                </div>
                <div className="space-y-1 mt-1">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectItem(item)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[rgba(242,194,48,0.14)] dark:bg-[rgba(242,194,48,0.18)] text-[#8A6A00] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                            <Icon size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-neutral-400 shrink-0 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Query Active & No Results */}
          {debouncedQuery && !loading && allResults.length === 0 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-white/[0.06] text-neutral-400 flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">
                No matching results found for "{debouncedQuery}"
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs mx-auto">
                Try searching for a different keyword, page title, or change the category filter above.
              </p>
            </div>
          )}

          {/* Results List */}
          {allResults.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                data-selected={isSelected}
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex items-center justify-between p-3 rounded-xl transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[rgba(242,194,48,0.14)] dark:bg-[rgba(242,194,48,0.16)] text-neutral-900 dark:text-white before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-[#F2C230] before:rounded-r'
                    : 'hover:bg-neutral-100 dark:hover:bg-white/[0.06] text-neutral-700 dark:text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#F2C230] text-[#111111]'
                        : 'bg-neutral-100 dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300'
                    }`}
                  >
                    <Icon size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                        {renderHighlightedText(item.title, debouncedQuery)}
                      </p>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-200/80 dark:bg-white/[0.10] text-neutral-600 dark:text-neutral-300 shrink-0">
                        {item.category}
                      </span>
                    </div>
                    {item.subtitle && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                        {renderHighlightedText(item.subtitle, debouncedQuery)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <ArrowRight
                    size={16}
                    className={`transition-transform ${
                      isSelected ? 'translate-x-0.5 text-[#8A6A00] dark:text-[#F2C230]' : 'text-neutral-400'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Keyboard Helper Footer */}
        <div className="hidden sm:flex items-center justify-between px-4 py-2.5 border-t border-black/[0.08] dark:border-white/[0.10] bg-neutral-50 dark:bg-[#111113] text-[11px] text-neutral-500 dark:text-neutral-400 shrink-0">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono shadow-2xs ml-0.5">↓</kbd>
              {' '}to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono shadow-2xs">↵</kbd>
              {' '}to select
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono shadow-2xs">Tab</kbd>
              {' '}category
            </span>
          </div>

          <div>
            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 font-mono shadow-2xs">Esc</kbd>
            {' '}to close
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearchModal;
