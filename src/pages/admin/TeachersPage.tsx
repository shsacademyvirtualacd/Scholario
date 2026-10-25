import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Users,
  GraduationCap,
  Eye,
  HelpCircle,
  Lock,
  UserCheck,
  Clock,
  SlidersHorizontal,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import TeacherTable from '../../components/admin/teachers/TeacherTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import TeacherDetailPanel from '../../components/admin/teachers/TeacherDetailPanel';
import ConfirmModal from '../../components/admin/ConfirmModal';
import {
  getAllTeachers,
  getAllOfferings,
  getAllSlots,
  getAllEnrollments,
  getAllRoster,
  toggleRosterAccess,
  deleteRosterEntry,
  updateTeacher,
} from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import { useMobile } from '../../hooks/useMobile';
import { toast } from 'sonner';
import type { Teacher, ClassOffering, ClassSlot, Enrollment, RosterEntry } from '../../types';

export const TeachersPage: React.FC = () => {
  const isMobile = useMobile();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'not_signed_in' | 'suspended'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Destructive modal states
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionTeacher, setActionTeacher] = useState<Teacher | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'restore' | 'delete'>('suspend');

  // Load data
  const loadAllData = async () => {
    try {
      setLoading(true);
      const [tData, oData, sData, eData, rData, pRes] = await Promise.all([
        getAllTeachers().catch(() => []),
        getAllOfferings().catch(() => []),
        getAllSlots().catch(() => []),
        getAllEnrollments().catch(() => []),
        getAllRoster().catch(() => []),
        (async () => {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('id, full_name, email, role, onboarding_complete, avatar_url, phone');
            return data || [];
          } catch {
            return [];
          }
        })(),
      ]);

      setTeachers(tData || []);
      setOfferings(oData || []);
      setSlots(sData || []);
      setEnrollments(eData || []);
      setRoster(rData || []);
      setProfiles(pRes || []);
    } catch (err) {
      console.error('[TeachersPage] Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Realtime updates
  useRealtimeTable({
    table: 'teachers',
    onAny: async () => {
      const data = await getAllTeachers().catch(() => []);
      setTeachers(data);
    },
  });

  useRealtimeTable({
    table: 'roster',
    onAny: async () => {
      const data = await getAllRoster().catch(() => []);
      setRoster(data);
    },
  });

  // Helper to resolve teacher status
  const getTeacherStatus = (teacher: Teacher): 'active' | 'not_signed_in' | 'suspended' => {
    const emailLower = (teacher.email || '').toLowerCase().trim();
    const rosterEntry = roster.find(
      (r) =>
        r.id === teacher.id ||
        r.profile_id === teacher.id ||
        (r.email && r.email.toLowerCase().trim() === emailLower)
    );

    if (teacher.is_active === false || rosterEntry?.suspended === true) {
      return 'suspended';
    }

    const matchedProfile = profiles.find(
      (p) =>
        p.id === teacher.id ||
        (rosterEntry?.profile_id && p.id === rosterEntry.profile_id) ||
        (p.email && p.email.toLowerCase().trim() === emailLower)
    );

    if (!matchedProfile || matchedProfile.onboarding_complete === false) {
      return 'not_signed_in';
    }

    return 'active';
  };

  // Workload calculations per teacher
  const getWorkload = (teacherId: string) => {
    const teacherOfferings = offerings.filter((o) => {
      const tId = o.teacher_id || o.teacher?.id;
      return tId === teacherId;
    });

    const offeringIds = teacherOfferings.map((o) => o.id);
    const classesCount = slots.filter((s) => offeringIds.includes(s.offering_id || '')).length;
    const studentCount = enrollments.filter((e) => offeringIds.includes(e.offering_id || '')).length;

    const rawSubjects = teacherOfferings.map((o) => o.subject || o.subject_name || '');
    const hasIelts = teacherOfferings.some((o) => {
      const b = (o.board_id || o.board || o.class?.board_id || '').toLowerCase();
      const s = (o.subject_name || o.subject || '').toLowerCase();
      return b === 'ielts' || s.includes('ielts');
    });

    const nonIeltsSubjects = rawSubjects.filter((s) => {
      const sLower = s.toLowerCase();
      return !sLower.includes('ielts') && s !== '';
    });

    const uniqueSubjects = Array.from(new Set(nonIeltsSubjects));
    if (hasIelts) {
      uniqueSubjects.unshift('IELTS Preparation');
    }

    return {
      classesCount,
      studentCount,
      uniqueSubjects,
      offerings: teacherOfferings,
    };
  };

  // Teacher stats
  const totalCount = teachers.length;
  const activeCount = useMemo(() => teachers.filter((t) => getTeacherStatus(t) === 'active').length, [teachers, roster, profiles]);
  const notSignedInCount = useMemo(() => teachers.filter((t) => getTeacherStatus(t) === 'not_signed_in').length, [teachers, roster, profiles]);
  const suspendedCount = useMemo(() => teachers.filter((t) => getTeacherStatus(t) === 'suspended').length, [teachers, roster, profiles]);

  // Subject list for filter
  const allAvailableSubjects = useMemo(() => {
    const set = new Set<string>();
    offerings.forEach((o) => {
      const subj = o.subject_name || o.subject;
      if (subj) set.add(subj);
    });
    return Array.from(set).sort();
  }, [offerings]);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const q = searchTerm.toLowerCase().trim();
      const nameMatch = t.full_name.toLowerCase().includes(q);
      const emailMatch = (t.email || '').toLowerCase().includes(q);
      const phoneMatch = (t.phone || '').includes(q);
      if (q && !nameMatch && !emailMatch && !phoneMatch) return false;

      const status = getTeacherStatus(t);
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (subjectFilter !== 'all') {
        const workload = getWorkload(t.id);
        const teaches = workload.uniqueSubjects.some((s) => s.toLowerCase() === subjectFilter.toLowerCase());
        if (!teaches) return false;
      }

      return true;
    });
  }, [teachers, searchTerm, statusFilter, subjectFilter, roster, profiles, offerings, slots, enrollments]);

  // Action handlers
  const handleViewDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDrawerOpen(true);
  };

  const handleToggleAccess = (teacher: Teacher) => {
    const status = getTeacherStatus(teacher);
    setActionTeacher(teacher);
    setActionType(status === 'suspended' ? 'restore' : 'suspend');
    setConfirmModalOpen(true);
  };

  const handleDeleteTeacher = (teacher: Teacher) => {
    setActionTeacher(teacher);
    setActionType('delete');
    setConfirmModalOpen(true);
  };

  const executeAction = async () => {
    if (!actionTeacher) return;

    try {
      const emailLower = (actionTeacher.email || '').toLowerCase().trim();
      const rosterEntry = roster.find(
        (r) =>
          r.id === actionTeacher.id ||
          r.profile_id === actionTeacher.id ||
          (r.email && r.email.toLowerCase().trim() === emailLower)
      );

      if (actionType === 'delete') {
        if (rosterEntry) {
          await deleteRosterEntry(rosterEntry.id);
        }
        await (supabase as any).from('teachers').delete().eq('id', actionTeacher.id);
        setTeachers((prev) => prev.filter((t) => t.id !== actionTeacher.id));
        toast.success(`${actionTeacher.full_name} was removed from the academy faculty.`);
        if (selectedTeacher?.id === actionTeacher.id) {
          setDrawerOpen(false);
          setSelectedTeacher(null);
        }
      } else {
        const suspend = actionType === 'suspend';
        if (rosterEntry) {
          await toggleRosterAccess(rosterEntry.id, suspend);
        }
        await updateTeacher(actionTeacher.id, { is_active: !suspend });
        setTeachers((prev) =>
          prev.map((t) => (t.id === actionTeacher.id ? { ...t, is_active: !suspend } : t))
        );
        toast.success(
          suspend
            ? `${actionTeacher.full_name}'s teaching account was suspended.`
            : `${actionTeacher.full_name}'s account was restored to active.`
        );
      }
      setConfirmModalOpen(false);
      setActionTeacher(null);
    } catch (err: any) {
      console.error('[TeachersPage] Action error:', err);
      toast.error(err.message || 'Operation failed. Please try again.');
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
                Teachers
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                UI v2
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Academy faculty, teaching workloads, weekly class schedule slots, and student allocations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/admin/roster"
              className="inline-flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-lg text-xs sm:text-sm font-semibold bg-amber-400 hover:bg-amber-500 text-neutral-900 transition-colors shadow-xs"
            >
              <Users className="w-4 h-4" />
              <span>Open in Roster</span>
            </Link>
          </div>
        </div>

        {/* ── 4 STAT CARDS (ALIGNED WITH ROSTER) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Total */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Faculty</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {loading ? (
                <div className="h-8 w-14 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
              ) : (
                totalCount
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Registered platform tutors
            </p>
          </div>

          {/* Card 2: Active */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Active</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {loading ? (
                <div className="h-8 w-14 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
              ) : (
                activeCount
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Signed in & currently teaching
            </p>
          </div>

          {/* Card 3: Not Yet Signed In */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Not Signed In</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400">
              {loading ? (
                <div className="h-8 w-14 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
              ) : (
                notSignedInCount
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Provisioned awaiting login
            </p>
          </div>

          {/* Card 4: Suspended */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Suspended</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
              {loading ? (
                <div className="h-8 w-14 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
              ) : (
                suspendedCount
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-1">
              Access deactivated or on leave
            </p>
          </div>
        </div>

        {/* ── SEARCH & FILTER CONTROLS ── */}
        <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search teachers by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 min-h-[44px] text-xs sm:text-sm bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              {/* Status Filter */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 min-h-[44px] text-xs sm:text-sm font-medium bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  aria-label="Filter teachers by status"
                >
                  <option value="all">All Statuses ({totalCount})</option>
                  <option value="active">Active Only ({activeCount})</option>
                  <option value="not_signed_in">Not Yet Signed In ({notSignedInCount})</option>
                  <option value="suspended">Suspended ({suspendedCount})</option>
                </select>
              </div>

              {/* Subject Filter */}
              <div className="flex-1 sm:flex-none">
                <select
                  value={subjectFilter}
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="w-full sm:w-auto px-3 py-2 min-h-[44px] text-xs sm:text-sm font-medium bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 rounded-lg text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                  aria-label="Filter teachers by subject"
                >
                  <option value="all">All Subjects</option>
                  {allAvailableSubjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              {(searchTerm || statusFilter !== 'all' || subjectFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSubjectFilter('all');
                  }}
                  className="px-3 py-2 min-h-[44px] text-xs font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Filter Summary */}
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1">
            <span>
              Showing <strong className="text-neutral-900 dark:text-neutral-100">{filteredTeachers.length}</strong> of{' '}
              {totalCount} teachers
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Weekly class slots = scheduled live periods per week</span>
            </div>
          </div>
        </div>

        {/* ── TEACHER DIRECTORY: SKELETON / EMPTY / TABLE / MOBILE ── */}
        {loading ? (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 space-y-4">
            <div className="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800/60 animate-pulse rounded-lg" />
              ))}
            </div>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-12 text-center space-y-3">
            <Users className="w-8 h-8 mx-auto text-neutral-400" />
            <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              No matching teachers found
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
              We couldn't find any tutors matching your search or filters. Try adjusting your query or resetting filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setSubjectFilter('all');
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[44px] rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : isMobile ? (
          /* Mobile Stacked Card View (<640px) */
          <div className="space-y-3">
            {filteredTeachers.map((teacher) => {
              const workload = getWorkload(teacher.id);
              const status = getTeacherStatus(teacher);
              const shownSubjects = workload.uniqueSubjects.slice(0, 2);
              const extraSubjectsCount = workload.uniqueSubjects.length - 2;

              return (
                <div
                  key={teacher.id}
                  onClick={() => handleViewDetails(teacher)}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-3 cursor-pointer hover:border-amber-400/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold flex items-center justify-center text-xs shrink-0">
                        {teacher.full_name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                          {teacher.full_name}
                        </h4>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          Joined {teacher.joining_date ? new Date(teacher.joining_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide shrink-0 ${
                        status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : status === 'not_signed_in'
                          ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800'
                      }`}
                    >
                      {status === 'active' ? (
                        <>
                          <UserCheck className="w-3 h-3" /> Active
                        </>
                      ) : status === 'not_signed_in' ? (
                        <>
                          <Clock className="w-3 h-3" /> Not Signed In
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" /> Suspended
                        </>
                      )}
                    </span>
                  </div>

                  {/* Contact info */}
                  <div className="text-xs text-neutral-600 dark:text-neutral-300 space-y-1">
                    {teacher.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Subject Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {shownSubjects.length === 0 ? (
                      <span className="text-[11px] text-neutral-400 italic">No assigned subjects</span>
                    ) : (
                      shownSubjects.map((subj) => (
                        <span
                          key={subj}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700"
                        >
                          {subj}
                        </span>
                      ))
                    )}
                    {extraSubjectsCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        +{extraSubjectsCount} more
                      </span>
                    )}
                  </div>

                  {/* Workload Metrics & Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                    <div className="flex items-center gap-4 text-neutral-500 dark:text-neutral-400">
                      <div>
                        Slots/Wk:{' '}
                        <strong className="text-neutral-900 dark:text-neutral-100">{workload.classesCount}</strong>
                      </div>
                      <div>
                        Students:{' '}
                        <strong className="text-neutral-900 dark:text-neutral-100">{workload.studentCount}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(teacher);
                        }}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 min-h-[44px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop / Tablet Table View */
          <TeacherTable
            teachers={filteredTeachers}
            onView={handleViewDetails}
            offerings={offerings}
            slots={slots}
            enrollments={enrollments}
            roster={roster}
            profiles={profiles}
            onToggleAccess={handleToggleAccess}
            onDelete={handleDeleteTeacher}
          />
        )}

        {/* ── PROFILE & WORKLOAD DRAWER ── */}
        <AdminDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setSelectedTeacher(null);
          }}
          title="Teacher Profile & Workload"
        >
          {selectedTeacher && (
            <TeacherDetailPanel
              teacher={selectedTeacher}
              status={getTeacherStatus(selectedTeacher)}
              onToggleAccess={() => handleToggleAccess(selectedTeacher)}
            />
          )}
        </AdminDrawer>

        {/* ── CONFIRMATION MODAL FOR DESTRUCTIVE ACTIONS ── */}
        <ConfirmModal
          open={confirmModalOpen}
          onClose={() => {
            setConfirmModalOpen(false);
            setActionTeacher(null);
          }}
          onConfirm={executeAction}
          title={
            actionType === 'delete'
              ? `Remove ${actionTeacher?.full_name}?`
              : actionType === 'suspend'
              ? `Suspend ${actionTeacher?.full_name}?`
              : `Restore Access for ${actionTeacher?.full_name}?`
          }
          description={
            actionType === 'delete'
              ? `This will remove ${actionTeacher?.full_name} from the active teacher directory and disconnect their account. Are you sure you want to proceed?`
              : actionType === 'suspend'
              ? `Suspending this teacher will disable their portal login and notify their enrolled students of faculty leave.`
              : `Restoring this teacher will re-enable their portal access and reactivate their class timetable.`
          }
          confirmLabel={
            actionType === 'delete'
              ? 'Delete Teacher'
              : actionType === 'suspend'
              ? 'Suspend Teacher'
              : 'Restore Access'
          }
          cancelLabel="Cancel"
          danger={actionType === 'delete'}
        />
      </div>
    </AdminShell>
  );
};

export default TeachersPage;
