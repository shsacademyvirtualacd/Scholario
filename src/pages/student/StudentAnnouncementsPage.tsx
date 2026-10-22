import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Calendar,
  Search,
  AlertCircle,
  FileText,
  CreditCard,
  Clock,
  ExternalLink,
  CheckCircle2,
  Bell
} from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import StudentPageHeader from '../../components/student/shared/StudentPageHeader';
import StudentBottomSheet from '../../components/student/shared/StudentBottomSheet';
import StudentEmptyState from '../../components/student/shared/StudentEmptyState';
import { getAnnouncements } from '../../lib/db';
import { MathText } from '../../components/common/MathText';
import { pageCache } from '../../lib/pageCache';
import { formatPKTDateTime } from '../../utils/studentFormatting';
import type { Announcement } from '../../types';

type CategoryFilter = 'all' | 'unread' | 'classes' | 'tests';

const READ_STORAGE_KEY = 'scholario_read_announcements_v2';

export const StudentAnnouncementsPage: React.FC = () => {
  const cachedAnn = pageCache.get<Announcement[]>('student_announcements');
  const [announcements, setAnnouncements] = useState<Announcement[]>(cachedAnn || []);
  const [loading, setLoading] = useState(!cachedAnn || cachedAnn.length === 0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<CategoryFilter>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Read IDs tracking in localStorage
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(READ_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (announcements.length === 0) {
      setLoading(true);
    }
    getAnnouncements()
      .then((data) => {
        setAnnouncements(data);
        pageCache.set('student_announcements', data);
      })
      .catch((err) => console.error('[StudentAnnouncements] Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      setReadIds(updated);
      try {
        localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save read announcements:', e);
      }
    }
  };

  const getCategory = (ann: Announcement): 'classes' | 'tests' | 'fee' | 'general' => {
    const text = `${ann.title} ${ann.body}`.toLowerCase();
    if (text.includes('test') || text.includes('quiz') || text.includes('exam') || text.includes('assessment')) return 'tests';
    if (text.includes('class') || text.includes('lecture') || text.includes('reschedul') || text.includes('timing') || text.includes('session')) return 'classes';
    if (text.includes('fee') || text.includes('tuition') || text.includes('dues') || text.includes('payment') || text.includes('challan')) return 'fee';
    return 'general';
  };

  const getCategoryMeta = (cat: 'classes' | 'tests' | 'fee' | 'general') => {
    switch (cat) {
      case 'classes':
        return {
          icon: Clock,
          color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900',
          label: 'Class Update',
        };
      case 'tests':
        return {
          icon: FileText,
          color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900',
          label: 'Testing & Exams',
        };
      case 'fee':
        return {
          icon: CreditCard,
          color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900',
          label: 'Tuition & Dues',
        };
      default:
        return {
          icon: Megaphone,
          color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900',
          label: 'General Notice',
        };
    }
  };

  const isRecentUnread = (ann: Announcement) => {
    const isUnread = !readIds.includes(ann.id);
    const isRecent = (Date.now() - new Date(ann.created_at).getTime()) < 48 * 60 * 60 * 1000;
    return isUnread && isRecent;
  };

  // Counts for filter chips
  const counts = useMemo(() => {
    let unreadCount = 0;
    let classesCount = 0;
    let testsCount = 0;

    announcements.forEach((a) => {
      if (!readIds.includes(a.id)) unreadCount++;
      const cat = getCategory(a);
      if (cat === 'classes') classesCount++;
      if (cat === 'tests') testsCount++;
    });

    return {
      all: announcements.length,
      unread: unreadCount,
      classes: classesCount,
      tests: testsCount,
    };
  }, [announcements, readIds]);

  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter((ann) => {
        // Search filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match = ann.title.toLowerCase().includes(q) || ann.body.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Category / tab filter
        if (activeFilter === 'unread') return !readIds.includes(ann.id);
        if (activeFilter === 'classes') return getCategory(ann) === 'classes';
        if (activeFilter === 'tests') return getCategory(ann) === 'tests';

        return true;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [announcements, searchTerm, activeFilter, readIds]);

  return (
    <StudentShell>
      <div className="space-y-4 max-w-5xl mx-auto">
        <StudentPageHeader
          title="Announcements"
          badge="UI v2"
          description="Official broadcasts, schedule updates, and test notifications from your academy."
        />

        {/* Search & Filter Chips Row */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-3 sm:p-4 shadow-xs space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search announcements by keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 text-xs sm:text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Filter Chips in a single scrollable row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            <button
              onClick={() => setActiveFilter('all')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeFilter === 'all'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-750'
              }`}
            >
              All ({counts.all})
            </button>

            <button
              onClick={() => setActiveFilter('unread')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                activeFilter === 'unread'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-750'
              }`}
            >
              <span>Unread</span>
              {counts.unread > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
              <span>({counts.unread})</span>
            </button>

            <button
              onClick={() => setActiveFilter('classes')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeFilter === 'classes'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-750'
              }`}
            >
              Classes ({counts.classes})
            </button>

            <button
              onClick={() => setActiveFilter('tests')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeFilter === 'tests'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                  : 'bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-750'
              }`}
            >
              Tests ({counts.tests})
            </button>
          </div>
        </div>

        {/* Announcements Stream */}
        <div className="space-y-3">
          {loading && announcements.length === 0 ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="p-4 sm:p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 h-28"
                />
              ))}
            </div>
          ) : announcements.length === 0 ? (
            <StudentEmptyState
              icon={Bell}
              title="No announcements right now"
              description="Check back before your next class for new updates, test notifications, and schedules."
            />
          ) : filteredAnnouncements.length === 0 ? (
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-8 text-center space-y-3">
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                No matching announcements found
              </p>
              <p className="text-xs text-neutral-500">
                Try switching filters or clearing your search keywords.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setActiveFilter('all');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            filteredAnnouncements.map((ann) => {
              const cat = getCategory(ann);
              const meta = getCategoryMeta(cat);
              const Icon = meta.icon;
              const hasNewDot = isRecentUnread(ann);
              const isUrgent = ann.severity === 'crucial' || (ann as any).is_urgent;

              return (
                <div
                  key={ann.id}
                  onClick={() => {
                    markAsRead(ann.id);
                    setSelectedAnnouncement(ann);
                  }}
                  className={`group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer relative ${
                    isUrgent
                      ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 hover:border-rose-300'
                      : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Category Icon */}
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${meta.color}`}
                    >
                      <Icon size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top Meta Line: Category, Date, and Urgent/New Pills */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-neutral-500 dark:text-neutral-400">
                            {meta.label}
                          </span>
                          <span className="text-neutral-300 dark:text-neutral-700">•</span>
                          <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                            {formatPKTDateTime(ann.created_at)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isUrgent && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold tracking-wide uppercase shadow-2xs flex items-center gap-1">
                              <AlertCircle size={10} /> Urgent
                            </span>
                          )}
                          {hasNewDot && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-neutral-900 text-[10px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 animate-ping" />
                              New
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title in bold */}
                      <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        <MathText text={ann.title} />
                      </h3>

                      {/* 2-line snippet */}
                      <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 line-clamp-2 mt-1 leading-relaxed font-normal">
                        {ann.body}
                      </p>

                      <div className="flex items-center justify-between pt-2 mt-1 text-[11px] text-neutral-400">
                        <span>
                          {ann.scope === 'class'
                            ? `Class specific · ${ann.stream?.name || 'All streams'}`
                            : 'Academy-wide notice'}
                        </span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400 group-hover:underline">
                          Read full notice →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Announcement Detail Bottom Sheet */}
        <StudentBottomSheet
          isOpen={!!selectedAnnouncement}
          onClose={() => setSelectedAnnouncement(null)}
          title={selectedAnnouncement?.title || 'Notice Details'}
        >
          {selectedAnnouncement && (
            <div className="space-y-4">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-600 dark:text-neutral-300">
                    {getCategoryMeta(getCategory(selectedAnnouncement)).label}
                  </span>
                  <span className="text-neutral-300">•</span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {formatPKTDateTime(selectedAnnouncement.created_at)}
                  </span>
                </div>

                {selectedAnnouncement.severity === 'crucial' && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                    <AlertCircle size={11} /> Urgent Notice
                  </span>
                )}
              </div>

              {/* Full Body Text */}
              <div className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-normal whitespace-pre-wrap">
                <MathText text={selectedAnnouncement.body} />
              </div>

              {/* Target / Scope Info */}
              <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
                <div>
                  <span className="font-bold text-neutral-800 dark:text-neutral-100 block">
                    Distribution Scope
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    {selectedAnnouncement.scope === 'class'
                      ? `Grade ${selectedAnnouncement.class?.grade || ''} ${selectedAnnouncement.stream?.name || 'All streams'}`
                      : 'All SHS Virtual Academy students'}
                  </span>
                </div>
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>

              {/* Close Button */}
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold hover:bg-neutral-800 transition-colors"
              >
                Close Notice
              </button>
            </div>
          )}
        </StudentBottomSheet>
      </div>
    </StudentShell>
  );
};

export default StudentAnnouncementsPage;
