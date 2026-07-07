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
import { getEnrichedNotes, getEnrichedScheduleSlots } from '../../lib/mockData';
import { getOfferingsForStudent } from '../../lib/db';

interface StudentShellProps {
  children: React.ReactNode;
}

interface NotificationItem {
  id: string;
  type: 'class_reminder' | 'note_uploaded';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
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

const getMockNotifications = (stream: string): NotificationItem[] => {
  const subjects = 
    stream === 'pre-medical' || stream === 'cambridge-pre-medical'
      ? ['Biology', 'Physics']
      : stream === 'ics' || stream === 'cambridge-computer-science'
        ? ['Computer Science', 'Mathematics']
        : stream === 'cambridge-commerce'
          ? ['Accounting', 'Economics']
          : ['Mathematics', 'Physics'];

  return [
    {
      id: 'notif-1',
      type: 'class_reminder',
      title: 'Class Starting in 15 Mins',
      message: `Your ${subjects[0]} lecture starts soon. Make sure to prepare your workspace and check your Zoom link.`,
      timestamp: '15 mins before class',
      isRead: false,
    },
    {
      id: 'notif-2',
      type: 'note_uploaded',
      title: 'New Note Uploaded',
      message: `Admin uploaded the latest chapter study reference guide for ${subjects[1] || 'Physics'}.`,
      timestamp: '2 hours ago',
      isRead: false,
    },
    {
      id: 'notif-3',
      type: 'class_reminder',
      title: 'Class Starting in 15 Mins',
      message: `Your yesterday's ${subjects[0]} class completed successfully.`,
      timestamp: 'Yesterday',
      isRead: true,
    }
  ];
};

const DAYS_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const StudentShell: React.FC<StudentShellProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Universal Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    notes: any[];
    classes: any[];
  }>({ notes: [], classes: [] });

  const activeNav = location.pathname;
  const [enrolledSubjects, setEnrolledSubjects] = useState<string[]>([]);

  // Fetch enrolled subjects dynamically
  useEffect(() => {
    if (profile?.id) {
      getOfferingsForStudent(profile.id)
        .then((offs) => {
          setEnrolledSubjects(offs.map((o) => o.subject));
        })
        .catch(console.error);
    }
  }, [profile?.id]);

  // Initialize notifications dynamically based on the student's registered stream
  useEffect(() => {
    if (profile?.stream) {
      setNotifications(getMockNotifications(profile.stream));
    } else {
      setNotifications(getMockNotifications('pre-engineering'));
    }
  }, [profile?.stream]);

  // Handle live universal search querying
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ notes: [], classes: [] });
      return;
    }

    const query = searchQuery.toLowerCase();

    // 1. Filter notes matching query and enrolled subjects
    const allNotes = getEnrichedNotes();
    const matchedNotes = allNotes.filter(note => {
      const subject = note.offering?.subject;
      if (!subject || !enrolledSubjects.includes(subject)) return false;

      return (
        note.chapter_name.toLowerCase().includes(query) ||
        note.title.toLowerCase().includes(query) ||
        subject.toLowerCase().includes(query)
      );
    }).slice(0, 4);

    // 2. Filter classes matching query and enrolled subjects
    const allSlots = getEnrichedScheduleSlots();
    const matchedClasses = allSlots.filter(slot => {
      const subject = slot.offering?.subject;
      if (!subject || !enrolledSubjects.includes(subject)) return false;

      return (
        subject.toLowerCase().includes(query) ||
        (slot.offering?.teacher?.full_name && slot.offering.teacher.full_name.toLowerCase().includes(query)) ||
        (slot.room_or_link && slot.room_or_link.toLowerCase().includes(query))
      );
    }).slice(0, 4);

    setSearchResults({ notes: matchedNotes, classes: matchedClasses });
  }, [searchQuery, enrolledSubjects]);

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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: !n.isRead } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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
            const isActive = !disabled && (activeNav === path || (path !== '/student' && activeNav.startsWith(path)));
            return (
              <button
                key={path}
                onClick={() => !disabled && handleNav(path)}
                disabled={disabled}
                className={`sidebar-link w-full ${isActive ? 'active' : ''} ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <Icon size={17} className={`sidebar-icon shrink-0 ${isActive ? '' : 'text-[#525252]'}`} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Profile + logout */}
        <div className="p-3 border-t border-[#1F1F1F] space-y-2">
          {/* Sidebar Profile Card */}
          <button
            onClick={() => handleNav('/student/profile')}
            className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200 text-left ${
              activeNav === '/student/profile'
                ? 'bg-[#F4C430] text-[#111111]'
                : 'bg-[#1A1A1A] hover:bg-[#262626] text-white border border-[#2A2A2A]'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              activeNav === '/student/profile' ? 'bg-[#111111] text-[#F4C430]' : 'bg-[#F4C430] text-[#111111]'
            }`}>
              {(profile?.full_name?.[0] ?? 'S').toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold truncate leading-tight ${
                activeNav === '/student/profile' ? 'text-[#111111]' : 'text-white'
              }`}>
                {profile?.full_name ?? 'Student'}
              </p>
              <p className={`text-[10px] leading-tight mt-0.5 truncate ${
                activeNav === '/student/profile' ? 'text-[#111111]/70' : 'text-[#737373]'
              }`}>
                View profile
              </p>
            </div>
          </button>

          <button
            onClick={signOut}
            className="sidebar-link w-full text-[#737373] hover:text-red-400"
          >
            <LogOut size={17} className="shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-white border-b border-[#E5E5E5] flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-[#F5F5F5] transition-colors text-[#111111]"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </button>
            
            {/* Universal Search Container */}
            <div className="relative hidden sm:block">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                type="text"
                placeholder="Search notes, schedule…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="input pl-9 py-2 text-sm w-64 bg-[#FAFAFA] border-[#F0F0F0]"
              />

              {/* Search Results Dropdown Popover */}
              {searchFocused && searchQuery.trim() && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setSearchFocused(false)} />
                  <div className="absolute left-0 mt-2 w-80 bg-white border border-[#E5E5E5] rounded-2xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {!hasSearchResults ? (
                      <div className="p-5 text-center text-xs text-[#A3A3A3] font-semibold">
                        No matching notes or classes found
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto divide-y divide-[#F5F5F5]">
                        
                        {/* Note Results Section */}
                        {searchResults.notes.length > 0 && (
                          <div className="p-2">
                            <span className="block text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider px-2.5 py-1">
                              Matching Notes
                            </span>
                            {searchResults.notes.map(note => (
                              <button
                                key={note.id}
                                onClick={() => handleSearchResultClick('note', note)}
                                className="w-full text-left p-2 hover:bg-[#FAFAFA] rounded-xl flex items-start gap-2.5 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A] flex items-center justify-center shrink-0 mt-0.5">
                                  <BookMarked size={13} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#111111] truncate">{note.chapter_name}</p>
                                  <p className="text-[10px] text-[#737373] truncate mt-0.5">{note.title}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Class Results Section */}
                        {searchResults.classes.length > 0 && (
                          <div className="p-2">
                            <span className="block text-[9px] font-black text-[#A3A3A3] uppercase tracking-wider px-2.5 py-1">
                              Timetable Classes
                            </span>
                            {searchResults.classes.map(cls => (
                              <button
                                key={cls.id}
                                onClick={() => handleSearchResultClick('class', cls)}
                                className="w-full text-left p-2 hover:bg-[#FAFAFA] rounded-xl flex items-start gap-2.5 transition-colors"
                              >
                                <div className="w-7 h-7 rounded-lg bg-[#F5F5F5] text-[#525252] border border-[#E5E5E5] flex items-center justify-center shrink-0 mt-0.5">
                                  <Calendar size={13} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-bold text-[#111111] truncate">{cls.offering?.subject}</p>
                                  <p className="text-[10px] text-[#737373] truncate mt-0.5 flex items-center gap-1">
                                    <Clock size={10} /> {DAYS_NAME[cls.day_of_week]} at {cls.start_time.slice(0, 5)}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                        
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Notification Bell Dropdown Container */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                  notifOpen 
                    ? 'bg-[#111111] border-[#111111] text-[#F4C430]' 
                    : 'border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#525252] hover:text-[#111111]'
                }`}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#ef4444] border-2 border-white rounded-full" />
                )}
              </button>

              {notifOpen && (
                <>
                  {/* Click-out backdrop */}
                  <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
                  {/* Popover panel */}
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E5E5] rounded-2xl shadow-xl z-40 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="p-3.5 border-b border-[#F5F5F5] flex items-center justify-between bg-[#FAFAFA]">
                      <span className="text-[10px] font-black text-[#111111] uppercase tracking-wider">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-[10px] font-bold text-[#737373] hover:text-[#111111] transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="divide-y divide-[#F5F5F5] max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[#A3A3A3] font-semibold">
                          You are all caught up!
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <div
                            key={notif.id}
                            onClick={() => toggleRead(notif.id)}
                            className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                              notif.isRead ? 'bg-white hover:bg-[#FAFAFA]' : 'bg-[#FFFDF0] hover:bg-[#FFFBEA]'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              notif.type === 'class_reminder' ? 'bg-[#FFFBEB] text-[#92400E] border border-[#FDE68A]' : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {notif.type === 'class_reminder' ? <Calendar size={14} /> : <BookMarked size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-[#111111] leading-snug">{notif.title}</p>
                              <p className="text-[11px] text-[#525252] leading-relaxed mt-0.5 font-medium">{notif.message}</p>
                              <span className="text-[9px] text-[#A3A3A3] font-bold block mt-1">{notif.timestamp}</span>
                            </div>
                            {!notif.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430] shrink-0 mt-1.5" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => handleNav('/student/profile')}
              className="w-9 h-9 rounded-lg bg-[#F4C430] flex items-center justify-center text-sm font-bold text-[#111111] hover:scale-105 transition-transform"
            >
              {(profile?.full_name?.[0] ?? 'S').toUpperCase()}
            </button>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
};

export default StudentShell;
