import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, Shield, Trash2, Edit, 
  Clock, X, UserCheck, Lock, Unlock, Phone, GraduationCap, 
  BookOpen, Copy, Check, UserPlus, Save, ShieldAlert, DollarSign,
  CheckCircle2, XCircle, MoreVertical, Eye, AlertTriangle
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { 
  getAllRoster, addRosterEntry, updateRosterEntry, 
  deleteRosterEntry, getAllOfferings, toggleRosterAccess, toggleFeeSuspension, updateFeeStatus,
  notifyTeacherOverlappingClasses
} from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { RosterEntry, ClassOffering } from '../../types';
import { useMobile } from '../../hooks/useMobile';
import { validatePakistaniPhoneNumber } from '../../lib/phoneValidation';
import { formatStudentId } from '../../lib/studentId';
import { 
  getStudentSubjectPlanSync, 
  saveStudentSubjectPlan, 
  calculateSubjectEnrollmentFee,
} from '../../lib/subjectEnrollmentService';
import { getSubjectsForStream, getDefaultPrice, formatShortClassAndBoard, BOARDS, getBoardDef, formatGradeDisplay, BoardId } from '../../lib/taxonomy';

interface StatusBadgeProps {
  role?: 'student' | 'teacher' | 'admin';
  showPayment?: boolean;
  isSuspended: boolean;
  isActive?: boolean;
  feeStatusVal?: string;
  isPendingPayment?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  role = 'student',
  showPayment = true,
  isSuspended,
  isActive = false,
  feeStatusVal = 'unpaid',
  isPendingPayment = false,
  size = 'md',
}) => {
  const isTeacher = role === 'teacher' || !showPayment;
  const iconSize = size === 'sm' ? 11 : 12;
  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';

  // For teachers: badge depends ONLY on account status (active vs suspended).
  if (isTeacher) {
    if (isSuspended) {
      return (
        <span className={`inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full tracking-wide whitespace-nowrap shrink-0 ${paddingClass}`}>
          <Lock size={iconSize} /> Suspended
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full tracking-wide whitespace-nowrap shrink-0 ${paddingClass}`}>
        <UserCheck size={iconSize} /> Active
      </span>
    );
  }

  // Student & Admin status badge behavior
  if (isSuspended) {
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full tracking-wide whitespace-nowrap shrink-0 ${paddingClass}`}>
        <Lock size={iconSize} /> Suspended
      </span>
    );
  }

  if (isActive && feeStatusVal === 'paid') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-full tracking-wide whitespace-nowrap shrink-0 ${paddingClass}`}>
        <CheckCircle2 size={iconSize} /> Active · Paid
      </span>
    );
  }

  if (feeStatusVal === 'pending') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-full tracking-wide whitespace-nowrap shrink-0 ${paddingClass}`}>
        <Clock size={iconSize} /> Awaiting Review
      </span>
    );
  }

  if (isPendingPayment || feeStatusVal === 'unpaid') {
    return (
      <span className={`inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full tracking-wide whitespace-nowrap shrink-0 ${paddingClass}`}>
        <DollarSign size={iconSize} /> Unpaid
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-full tracking-wide whitespace-nowrap shrink-0 ${paddingClass}`}>
      <Clock size={iconSize} /> Pending
    </span>
  );
};

export const RosterManagerPage: React.FC = () => {
  const isMobile = useMobile();
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});
  const [classesMap, setClassesMap] = useState<Record<string, any>>({});
  const [streamsMap, setStreamsMap] = useState<Record<string, any>>({});
  const [feeMap, setFeeMap] = useState<Record<string, any>>({});
  const [classesList, setClassesList] = useState<any[]>([]);
  const [streamsList, setStreamsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab section: merged segmented tabs
  const [activeSection, setActiveSection] = useState<'admins' | 'students' | 'teachers'>('students');

  // Filters/Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Row Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Detail Drawer state (opens when clicking a row or selecting 'View Details')
  const [detailEntry, setDetailEntry] = useState<RosterEntry | null>(null);

  // Form Drawer states (Add/Edit Teacher)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add_teacher' | 'edit'>('add_teacher');
  const [selectedEntry, setSelectedEntry] = useState<RosterEntry | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});

  // Edit Student Profile Modal States
  const [editStudentModalOpen, setEditStudentModalOpen] = useState(false);
  const [editStudentEntry, setEditStudentEntry] = useState<RosterEntry | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentBoard, setEditStudentBoard] = useState<BoardId>('fbise');
  const [editStudentClass, setEditStudentClass] = useState('');
  const [editStudentStreamId, setEditStudentStreamId] = useState('');
  const [editStudentFeeStatus, setEditStudentFeeStatus] = useState<'unpaid' | 'pending' | 'paid'>('unpaid');
  const [editStudentEnrollmentMode, setEditStudentEnrollmentMode] = useState<'all' | 'custom'>('all');
  const [editStudentSubjects, setEditStudentSubjects] = useState<string[]>([]);
  const [editStudentError, setEditStudentError] = useState<string | null>(null);
  const [editStudentSaving, setEditStudentSaving] = useState(false);

  // Delete Modal States with typed-name confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<RosterEntry | null>(null);
  const [deleteConfirmNameInput, setDeleteConfirmNameInput] = useState('');
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Scroll locking hooks
  useModalScrollLock(editStudentModalOpen);
  useModalScrollLock(drawerOpen);
  useModalScrollLock(Boolean(detailEntry));
  useModalScrollLock(deleteModalOpen);

  // Close row menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuId(null);
      }
    };
    if (activeMenuId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeMenuId]);

  const fetchEnrichmentData = async () => {
    try {
      const [profilesRes, classesRes, streamsRes, feesRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('streams').select('*'),
        supabase.from('fee_statuses').select('*')
      ]);

      const cList = (classesRes.data as any[] || []);
      const sList = (streamsRes.data as any[] || []);

      setClassesList(cList);
      setStreamsList(sList);

      const pMap: Record<string, any> = {};
      (profilesRes.data as any[] || []).forEach(p => { pMap[p.id] = p; });
      setProfilesMap(pMap);

      const cMap: Record<string, any> = {};
      cList.forEach(c => { cMap[c.id] = c; });
      setClassesMap(cMap);

      const sMap: Record<string, any> = {};
      sList.forEach(s => { sMap[s.id] = s; });
      setStreamsMap(sMap);

      const fMap: Record<string, any> = {};
      (feesRes.data as any[] || []).forEach(f => {
        if (f.student_id) fMap[f.student_id] = f;
      });
      setFeeMap(fMap);
    } catch (e) {
      console.error('Failed to fetch enrichment maps:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const rosterData = await getAllRoster().catch(err => {
        console.error('getAllRoster error:', err);
        return [];
      });
      setRoster(rosterData);

      const offeringsData = await getAllOfferings().catch(() => []);
      setOfferings(offeringsData);

      await fetchEnrichmentData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useRealtimeTable({
    table: 'roster',
    onAny: async () => {
      const rosterData = await getAllRoster().catch(() => []);
      setRoster(rosterData);
    }
  });

  useRealtimeTable({
    table: 'profiles',
    onAny: async () => { await fetchEnrichmentData(); },
  });

  useRealtimeTable({
    table: 'fee_statuses',
    onInsert: async () => { await fetchEnrichmentData(); },
    onUpdate: async () => { await fetchEnrichmentData(); },
  });

  useRealtimeTable({
    table: 'class_offerings',
    onAny: async () => {
      const offeringsData = await getAllOfferings().catch(() => []);
      setOfferings(offeringsData);
    }
  });

  const openAddTeacher = () => {
    setSelectedEntry(null);
    setEmail('');
    setFullName('');
    setPhone('');
    setSelectedClasses([]);
    setFormError(null);
    setDrawerMode('add_teacher');
    setDrawerOpen(true);
  };

  const openEdit = (entry: RosterEntry) => {
    setSelectedEntry(entry);
    setEmail(entry.email);
    setFullName(entry.full_name);
    setPhone('');
    setFormError(null);
    setDrawerMode('edit');
    if (entry.role === 'student') {
      setSelectedClass(entry.class_ids[0] || '');
    } else {
      const assignedFromOfferings = offerings
        .filter(o => {
          const tId = o.teacher_id || o.teacher?.id;
          return tId && (tId === entry.id || tId === entry.profile_id);
        })
        .map(o => o.id);
      const combined = Array.from(new Set([...(entry.class_ids || []), ...assignedFromOfferings]));
      setSelectedClasses(combined);
    }
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emailTrim = email.trim().toLowerCase();
    const nameTrim = fullName.trim();
    const phoneTrim = phone.trim();

    if (!emailTrim || !nameTrim) {
      setFormError('Please fill out all required fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setFormError('Please enter a valid email address.');
      return;
    }

    let normalizedPhone: string | undefined = undefined;
    if (phoneTrim) {
      const phoneValidation = validatePakistaniPhoneNumber(phoneTrim, false);
      if (!phoneValidation.isValid) {
        setFormError(phoneValidation.error);
        return;
      }
      normalizedPhone = phoneValidation.normalized;
    }

    setFormSaving(true);

    try {
      if (drawerMode === 'edit' && selectedEntry) {
        const studentClass = selectedClass || (offerings.length > 0 ? offerings[0].id : '');
        const classesToSave = selectedEntry.role === 'student' ? [studentClass] : selectedClasses;
        const teacherTargetId = selectedEntry.role === 'teacher' ? (selectedEntry.profile_id || selectedEntry.id) : undefined;
        
        await updateRosterEntry(selectedEntry.id, classesToSave, teacherTargetId);
        
        const [freshRoster, freshOfferings] = await Promise.all([
          getAllRoster().catch(() => []),
          getAllOfferings().catch(() => [])
        ]);
        if (freshRoster && freshRoster.length > 0) setRoster(freshRoster);
        if (freshOfferings && freshOfferings.length > 0) setOfferings(freshOfferings);

        if (selectedEntry.role === 'teacher' && classesToSave.length >= 2 && teacherTargetId) {
          try {
            const { data: assignedSlots } = await (supabase as any)
              .from('class_slots')
              .select('id, offering_id, start_time, offering:class_offerings(*)')
              .in('offering_id', classesToSave);

            if (assignedSlots && assignedSlots.length >= 2) {
              const byTime = new Map<string, any[]>();
              assignedSlots.forEach((s: any) => {
                if (s.start_time) {
                  const arr = byTime.get(s.start_time) || [];
                  arr.push(s);
                  byTime.set(s.start_time, arr);
                }
              });

              byTime.forEach((group, time) => {
                if (group.length >= 2) {
                  const [h, m] = time.split(':').map(Number);
                  const period = h >= 12 ? 'PM' : 'AM';
                  const h12 = h % 12 || 12;
                  const timeFormatted = `${h12}:${String(m).padStart(2, '0')} ${period}`;
                  const names = group.map((s: any) => {
                    const subj = s.offering?.subject_name || 'Class';
                    const gr = s.offering?.grade || '';
                    return gr ? `${subj} (Gr. ${gr})` : subj;
                  });
                  notifyTeacherOverlappingClasses(
                    teacherTargetId,
                    names,
                    timeFormatted,
                    `assign_${Date.now()}`
                  );
                }
              });
            }
          } catch (slotErr) {
            console.warn('[RosterManagerPage] overlap check warning:', slotErr);
          }
        }

        toast.success('Roster entry updated successfully.');
        setDrawerOpen(false);
      } else {
        const role = 'teacher';
        const classesToSave = selectedClasses;

        if (roster.some(r => r.email.toLowerCase() === emailTrim)) {
          setFormError('Email is already registered in the roster.');
          setFormSaving(false);
          return;
        }

        const newEntry = await addRosterEntry(emailTrim, nameTrim, role, classesToSave, normalizedPhone);
        
        const [freshRoster, freshOfferings] = await Promise.all([
          getAllRoster().catch(() => []),
          getAllOfferings().catch(() => [])
        ]);
        if (freshRoster && freshRoster.length > 0) {
          setRoster(freshRoster);
        } else {
          setRoster(prev => [newEntry, ...prev]);
        }
        if (freshOfferings && freshOfferings.length > 0) setOfferings(freshOfferings);

        toast.success('Teacher added to roster successfully.');
        setDrawerOpen(false);
        await fetchEnrichmentData();
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
      toast.error(err.message || 'Failed to save roster entry.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggleAccess = async (entry: RosterEntry) => {
    setProcessingIds(prev => ({ ...prev, [entry.id]: true }));
    try {
      const nextSuspendedState = !entry.suspended;
      await toggleRosterAccess(entry.id, nextSuspendedState);
      setRoster(prev => prev.map(r => r.id === entry.id ? { ...r, suspended: nextSuspendedState } : r));
      if (detailEntry?.id === entry.id) {
        setDetailEntry(prev => prev ? { ...prev, suspended: nextSuspendedState } : null);
      }
      toast.success(nextSuspendedState ? 'Roster access suspended.' : 'Roster access restored.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update roster access.');
    } finally {
      setProcessingIds(prev => ({ ...prev, [entry.id]: false }));
    }
  };

  const handleToggleFeeAccess = async (entry: RosterEntry) => {
    setProcessingIds(prev => ({ ...prev, [entry.id]: true }));
    try {
      const nextFeeSuspendedState = !entry.fee_suspended;
      await toggleFeeSuspension(entry.id, nextFeeSuspendedState);
      setRoster(prev => prev.map(r => r.id === entry.id ? { 
        ...r, 
        fee_suspended: nextFeeSuspendedState,
        awaiting_termination: nextFeeSuspendedState ? r.awaiting_termination : false
      } : r));
      if (detailEntry?.id === entry.id) {
        setDetailEntry(prev => prev ? { ...prev, fee_suspended: nextFeeSuspendedState } : null);
      }
      toast.success(nextFeeSuspendedState ? 'Billing lock applied.' : 'Billing lock removed.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update billing access.');
    } finally {
      setProcessingIds(prev => ({ ...prev, [entry.id]: false }));
    }
  };

  const handleSetStudentFeeStatus = async (
    entry: RosterEntry,
    newStatus: 'unpaid' | 'pending' | 'paid',
    customNote?: string
  ) => {
    setProcessingIds(prev => ({ ...prev, [entry.id]: true }));
    try {
      const matchedProfile = (entry.profile_id && profilesMap[entry.profile_id]) ||
        profilesMap[entry.id] ||
        (entry.email ? Object.values(profilesMap).find((p: any) => (p.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);

      const studentProfileId = matchedProfile?.id || entry.profile_id || entry.id;

      if (!matchedProfile && !profilesMap[studentProfileId]) {
        const { data: existingProf } = await (supabase as any)
          .from('profiles')
          .select('id')
          .eq('id', studentProfileId)
          .maybeSingle();

        if (!existingProf) {
          await (supabase as any)
            .from('profiles')
            .upsert({
              id: studentProfileId,
              full_name: entry.full_name || 'Student',
              role: 'student',
              onboarding_complete: true
            }, { onConflict: 'id' });
        }
      }

      const note = customNote || `Admin override: Set to ${newStatus.toUpperCase()} from Roster Manager.`;
      await updateFeeStatus(studentProfileId, newStatus, note);

      if (newStatus === 'paid' && (entry.fee_suspended || entry.awaiting_termination)) {
        await toggleFeeSuspension(entry.id, false);
        setRoster(prev => prev.map(r => r.id === entry.id ? { ...r, fee_suspended: false, awaiting_termination: false } : r));
      }

      await fetchEnrichmentData();
      toast.success(`Access for ${entry.full_name} set to ${newStatus.toUpperCase()}.`);
    } catch (err: any) {
      console.error('handleSetStudentFeeStatus error:', err);
      toast.error(err.message || 'Failed to update access status.');
    } finally {
      setProcessingIds(prev => ({ ...prev, [entry.id]: false }));
    }
  };

  const handleApprovePayment = async (profileId: string, entryId: string) => {
    setProcessingIds(prev => ({ ...prev, [entryId]: true }));
    try {
      await updateFeeStatus(profileId, 'paid', 'Payment approved by administrator from Roster Manager.');
      await fetchEnrichmentData();
      toast.success('Payment approved successfully.');
    } catch (err: any) {
      console.error('Approve payment error:', err);
      toast.error(err.message || 'Failed to approve payment.');
    } finally {
      setProcessingIds(prev => ({ ...prev, [entryId]: false }));
    }
  };

  const triggerDelete = (entry: RosterEntry) => {
    if (entry.role === 'admin') {
      toast.error('Protected administrator accounts cannot be deleted.');
      return;
    }
    setEntryToDelete(entry);
    setDeleteConfirmNameInput('');
    setDeleteModalOpen(true);
    setActiveMenuId(null);
  };

  const confirmDelete = async () => {
    if (!entryToDelete) return;
    const requiredName = (entryToDelete.full_name || '').trim().toLowerCase();
    const enteredName = deleteConfirmNameInput.trim().toLowerCase();
    if (enteredName !== requiredName) {
      toast.error('The entered name does not match. Deletion cancelled.');
      return;
    }

    setDeleteSubmitting(true);
    try {
      await deleteRosterEntry(entryToDelete.id);
      setRoster(prev => prev.filter(r => r.id !== entryToDelete.id && r.profile_id !== entryToDelete.id));
      
      const offeringsData = await getAllOfferings().catch(() => []);
      setOfferings(offeringsData);

      if (detailEntry?.id === entryToDelete.id) {
        setDetailEntry(null);
      }

      toast.success(`${entryToDelete.full_name} was completely removed.`);
      setDeleteModalOpen(false);
      setEntryToDelete(null);
      setDeleteConfirmNameInput('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to delete roster entry.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const toggleClassSelect = (cid: string) => {
    setSelectedClasses(prev => 
      prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]
    );
  };

  const copyToClipboard = (idText: string) => {
    navigator.clipboard.writeText(idText);
    setCopiedId(idText);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper getters for enrichment
  const getPhone = (entry: RosterEntry) => {
    if (entry.role === 'teacher') return '—';
    if ((entry as any)?.phone) return (entry as any).phone;

    let p = profilesMap[entry.id] || (entry.profile_id ? profilesMap[entry.profile_id] : null);

    if (!p && entry.profile_id) {
      p = Object.values(profilesMap).find((prof: any) => prof.id === entry.profile_id);
    }

    if (!p && entry.email) {
      const emailLower = entry.email.trim().toLowerCase();
      p = Object.values(profilesMap).find((prof: any) => 
        (prof.email && prof.email.trim().toLowerCase() === emailLower) ||
        (prof.user?.email && prof.user.email.trim().toLowerCase() === emailLower)
      );
    }

    if (!p && entry.full_name) {
      const nameLower = entry.full_name.trim().toLowerCase();
      p = Object.values(profilesMap).find((prof: any) => 
        prof.full_name && prof.full_name.trim().toLowerCase() === nameLower
      );
    }

    return p?.phone || '—';
  };

  const getClassGrade = (entry: RosterEntry) => {
    const p = profilesMap[entry.id] || (entry.profile_id ? profilesMap[entry.profile_id] : null) || (entry.email ? Object.values(profilesMap).find((prof: any) => (prof.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);
    if (p?.class_id && classesMap[p.class_id]) {
      const cls = classesMap[p.class_id];
      const bDef = getBoardDef(cls.board_id);
      const bName = bDef?.shortName || bDef?.name || cls.board?.name || cls.board_id?.toUpperCase() || 'Curriculum';
      return `${cls.display_name} (${bName})`;
    }

    const teacherOff = offerings.find(o => {
      const tId = o.teacher_id || o.teacher?.id;
      return (tId && (tId === entry.id || tId === entry.profile_id)) || (entry.class_ids && entry.class_ids.includes(o.id));
    });
    if (teacherOff) {
      const rawBoard = String(teacherOff.board_id || teacherOff.board || '').toLowerCase();
      const bName = rawBoard.includes('punjab') ? 'Punjab' : rawBoard.includes('federal') || rawBoard.includes('fbise') ? 'Federal' : 'General';
      return `Grade ${teacherOff.grade} (${teacherOff.subject_name} · ${bName})`;
    }

    if (entry.class_ids?.length > 0) {
      if (classesMap[entry.class_ids[0]]) {
        const cls = classesMap[entry.class_ids[0]];
        const bDef = getBoardDef(cls.board_id);
        const bName = bDef?.shortName || bDef?.name || cls.board?.name || cls.board_id?.toUpperCase() || 'Curriculum';
        return `${cls.display_name} (${bName})`;
      }
      const firstOff = offerings.find(o => o.id === entry.class_ids[0]);
      if (firstOff) return `Grade ${firstOff.grade} (${firstOff.subject_name})`;
    }
    return 'Not Assigned';
  };

  const getShortClassGrade = (entry: RosterEntry) => {
    const full = getClassGrade(entry);
    if (!full || full === 'Not Assigned') return full;
    const stream = getStream(entry);
    const p = profilesMap[entry.id] || (entry.profile_id ? profilesMap[entry.profile_id] : null);
    const bDef = getBoardDef(p?.board_id || p?.board);
    return formatShortClassAndBoard({
      gradeName: full,
      boardName: bDef?.shortName || (full.toLowerCase().includes('punjab') ? 'Punjab' : full.toLowerCase().includes('sindh') ? 'Sindh' : full.toLowerCase().includes('ielts') ? 'IELTS' : full.toLowerCase().includes('fbise') || full.toLowerCase().includes('federal') ? 'FBISE' : full),
      streamName: stream,
    });
  };

  const getStream = (entry: RosterEntry) => {
    const p = profilesMap[entry.id] || (entry.profile_id ? profilesMap[entry.profile_id] : null) || (entry.email ? Object.values(profilesMap).find((prof: any) => (prof.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);
    if (p?.stream_id && streamsMap[p.stream_id]) {
      return streamsMap[p.stream_id].name;
    }
    if (p?.stream) {
      return p.stream.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    return 'General Stream';
  };

  // Get assigned offering list for a teacher
  const getTeacherAssignedOfferings = (entry: RosterEntry) => {
    const assignedOfferingIds = new Set<string>(entry.class_ids || []);
    offerings.forEach(o => {
      const tId = o.teacher_id || o.teacher?.id;
      if (tId && (tId === entry.id || tId === entry.profile_id)) {
        assignedOfferingIds.add(o.id);
      }
    });

    return Array.from(assignedOfferingIds)
      .map(id => offerings.find(o => o.id === id))
      .filter((o): o is ClassOffering => Boolean(o));
  };

  // Render teacher class chips with clean truncation (first 2 + '+N more')
  const renderTeacherClasses = (entry: RosterEntry, inDrawer = false) => {
    const teacherOfferings = getTeacherAssignedOfferings(entry);

    if (teacherOfferings.length === 0) {
      return <span className="text-zinc-400 italic text-[11px]">No classes assigned</span>;
    }

    const maxShown = inDrawer ? 100 : 2;
    const shown = teacherOfferings.slice(0, maxShown);
    const remainingCount = teacherOfferings.length - maxShown;

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {shown.map(off => {
          const rawBoard = String(off.board_id || off.board || off.class?.board_id || '').toLowerCase();
          const isIelts = rawBoard === 'ielts' || (off.subject_name || '').toLowerCase().includes('ielts');
          const boardName = isIelts ? 'IELTS' : rawBoard.includes('punjab') ? 'Punjab' : rawBoard.includes('sindh') ? 'Sindh' : 'FBISE';

          return (
            <span 
              key={off.id}
              className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap shadow-2xs ${
                isIelts 
                  ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' 
                  : 'bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700'
              }`}
            >
              {off.subject_name || 'Class'} {off.grade ? `(Gr. ${off.grade} · ${boardName})` : `(${boardName})`}
            </span>
          );
        })}
        {!inDrawer && remainingCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDetailEntry(entry);
            }}
            className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 transition-colors"
            title="Click to view all assigned classes in detail drawer"
          >
            +{remainingCount} more
          </button>
        )}
      </div>
    );
  };

  // Student Edit and Access Actions
  const openEditStudent = (entry: RosterEntry) => {
    const p = (entry.profile_id && profilesMap[entry.profile_id]) ||
      profilesMap[entry.id] ||
      (entry.email ? Object.values(profilesMap).find((prof: any) => (prof.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);

    setEditStudentEntry(entry);
    setEditStudentName(p?.full_name || entry.full_name || '');
    setEditStudentEmail(entry.email || p?.email || '');

    const rawBoard = (p?.board_id || p?.board || 'fbise').toLowerCase() as BoardId;
    const validBoards: BoardId[] = ['fbise', 'punjab', 'sindh', 'ielts', 'olevel', 'alevel', 'kpk'];
    const boardVal: BoardId = validBoards.includes(rawBoard) ? rawBoard : 'fbise';
    setEditStudentBoard(boardVal);

    const boardClasses = classesList.filter(c => (c.board_id || '').toLowerCase() === boardVal);
    let classId = p?.class_id || (entry.class_ids && entry.class_ids[0]) || '';
    if (!boardClasses.some(c => c.id === classId)) {
      classId = boardClasses[0]?.id || '';
    }
    setEditStudentClass(classId);

    const classStreams = streamsList.filter(s => s.class_id === classId);
    let streamId = p?.stream_id || '';
    if (!classStreams.some(s => s.id === streamId)) {
      streamId = classStreams[0]?.id || '';
    }
    setEditStudentStreamId(streamId);

    const profileIdForFee = p?.id || entry.profile_id || entry.id;
    const currentFeeStatus = (profileIdForFee && feeMap[profileIdForFee]?.status) || 'unpaid';
    setEditStudentFeeStatus(currentFeeStatus as 'unpaid' | 'pending' | 'paid');

    const plan = getStudentSubjectPlanSync(profileIdForFee);
    if (plan && plan.plan_type === 'custom' && plan.subjects.length > 0) {
      setEditStudentEnrollmentMode('custom');
      setEditStudentSubjects(plan.subjects);
    } else if (Array.isArray(p?.subjects) && p.subjects.length > 0 && p?.plan_type === 'custom') {
      setEditStudentEnrollmentMode('custom');
      setEditStudentSubjects(p.subjects);
    } else {
      setEditStudentEnrollmentMode('all');
      setEditStudentSubjects([]);
    }

    setEditStudentError(null);
    setEditStudentModalOpen(true);
  };

  const handleBoardChangeInModal = (newBoard: BoardId) => {
    setEditStudentBoard(newBoard);
    const newClasses = classesList
      .filter(c => (c.board_id || '').toLowerCase() === newBoard)
      .sort((a, b) => parseInt(a.grade || '0', 10) - parseInt(b.grade || '0', 10));

    const currentClassObj = classesList.find(c => c.id === editStudentClass);
    const matchedGradeClass = newClasses.find(c => c.grade === currentClassObj?.grade) || newClasses[0];

    const targetClassId = matchedGradeClass?.id || '';
    setEditStudentClass(targetClassId);

    const newStreams = streamsList.filter(s => s.class_id === targetClassId);
    const currentStreamObj = streamsList.find(s => s.id === editStudentStreamId);
    const matchedStream = newStreams.find(s => s.name === currentStreamObj?.name) || newStreams[0];
    setEditStudentStreamId(matchedStream ? matchedStream.id : '');
  };

  const handleClassChangeInModal = (newClassId: string) => {
    setEditStudentClass(newClassId);
    const newStreams = streamsList.filter(s => s.class_id === newClassId);
    const currentStreamObj = streamsList.find(s => s.id === editStudentStreamId);
    const matchedStream = newStreams.find(s => s.name === currentStreamObj?.name) || newStreams[0];
    setEditStudentStreamId(matchedStream ? matchedStream.id : '');
  };

  const handleSaveStudentProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editStudentEntry) return;
    setEditStudentError(null);

    const nameTrim = editStudentName.trim();
    const emailTrim = (editStudentEntry.email || editStudentEmail || '').trim().toLowerCase();

    if (!nameTrim) {
      setEditStudentError('Please enter the student\'s full name.');
      return;
    }
    let classIdToUse = editStudentClass;
    if (!classIdToUse) {
      if (editStudentBoard === 'ielts') {
        const ieltsClass = classesList.find(c => (c.board_id || '').toLowerCase() === 'ielts') || classesList.find(c => (c.grade || '').toLowerCase() === 'ielts');
        classIdToUse = ieltsClass ? ieltsClass.id : 'ielts';
      } else {
        setEditStudentError('Please select a grade/class level.');
        return;
      }
    }

    setEditStudentSaving(true);
    try {
      const matchedProfile = (editStudentEntry.profile_id && profilesMap[editStudentEntry.profile_id]) ||
        profilesMap[editStudentEntry.id] ||
        (editStudentEntry.email ? Object.values(profilesMap).find((p: any) => (p.email || '').toLowerCase() === (editStudentEntry.email || '').toLowerCase()) : null);

      const studentProfileId = matchedProfile?.id || editStudentEntry.profile_id || editStudentEntry.id;
      
      let streamName = 'General';
      let finalStreamId: string | null = editStudentStreamId || null;

      if (editStudentBoard === 'ielts') {
        const isGt =
          editStudentStreamId === 'general-training' ||
          editStudentStreamId?.toLowerCase().includes('general') ||
          streamsList.find(s => s.id === editStudentStreamId)?.name?.toLowerCase().includes('general') ||
          streamsList.find(s => s.id === editStudentStreamId)?.name?.toLowerCase().includes('gt');
        streamName = isGt ? 'General Training' : 'Academic';
        const matchedStream = streamsList.find(s => s.class_id === classIdToUse && (isGt ? (s.name.toLowerCase().includes('general') || s.name.toLowerCase().includes('gt')) : s.name.toLowerCase().includes('academic')));
        finalStreamId = matchedStream ? matchedStream.id : null;
      } else {
        const selectedStreamObj = streamsList.find(s => s.id === editStudentStreamId);
        streamName = selectedStreamObj?.name || (editStudentStreamId ? 'Selected Stream' : 'General');
      }

      const isCustomPlan = editStudentEnrollmentMode === 'custom' && editStudentSubjects.length > 0;
      const finalSubjects = isCustomPlan ? editStudentSubjects : null;
      const finalPlanType = isCustomPlan ? 'custom' : 'all';

      saveStudentSubjectPlan(studentProfileId, {
        subjects: finalSubjects || [],
        plan_type: finalPlanType
      });

      const profilePayload: any = {
        full_name: nameTrim,
        board_id: editStudentBoard,
        class_id: classIdToUse,
        stream_id: finalStreamId,
        stream: streamName,
        onboarding_complete: true,
        role: 'student',
        subjects: finalSubjects,
        plan_type: finalPlanType
      };

      if (matchedProfile) {
        const { error: profErr } = await (supabase as any)
          .from('profiles')
          .update(profilePayload)
          .eq('id', studentProfileId);
        if (profErr) throw profErr;
      } else {
        const { error: profInsErr } = await (supabase as any)
          .from('profiles')
          .upsert({ id: studentProfileId, ...profilePayload }, { onConflict: 'id' });
        if (profInsErr) throw profInsErr;
      }

      await (supabase as any)
        .from('roster')
        .update({
          full_name: nameTrim,
          email: emailTrim,
          class_ids: [editStudentClass],
          profile_id: studentProfileId,
          subjects: finalSubjects,
          plan_type: finalPlanType
        })
        .or(`id.eq.${editStudentEntry.id},profile_id.eq.${studentProfileId},email.eq.${editStudentEntry.email.toLowerCase()}`);

      try {
        await (supabase as any).from('enrollments').delete().eq('student_id', studentProfileId);

        let subjectIds: string[] = [];
        if (editStudentStreamId) {
          const { data: ssData } = await (supabase as any)
            .from('stream_subjects')
            .select('subject_id')
            .eq('stream_id', editStudentStreamId);
          subjectIds = (ssData || []).map((ss: any) => ss.subject_id);
        }

        let targetOfferings = offerings.filter(o => o.class_id === editStudentClass);
        if (targetOfferings.length === 0) {
          const { data: offData } = await (supabase as any)
            .from('class_offerings')
            .select('id, subject_id, subject')
            .eq('class_id', editStudentClass);
          targetOfferings = offData || [];
        }

        if (subjectIds.length > 0) {
          targetOfferings = targetOfferings.filter((o: any) => subjectIds.includes(o.subject_id));
        }

        if (isCustomPlan) {
          targetOfferings = targetOfferings.filter((o: any) => {
            const offSubj = (o.subject || o.subject_name || '').toLowerCase();
            return editStudentSubjects.some(s => {
              const sLower = s.toLowerCase();
              return offSubj.includes(sLower) || sLower.includes(offSubj);
            });
          });
        }

        if (targetOfferings.length > 0) {
          const enrollInserts = targetOfferings.map((o: any) => ({
            student_id: studentProfileId,
            offering_id: o.id,
            total_classes: 48
          }));
          await (supabase as any).from('enrollments').insert(enrollInserts);
        }
      } catch (enrErr) {
        console.warn('Enrollment re-sync warning:', enrErr);
      }

      try {
        await updateFeeStatus(
          studentProfileId,
          editStudentFeeStatus,
          `Admin updated status to ${editStudentFeeStatus.toUpperCase()} via Edit Student Profile modal.`
        );
        if (editStudentFeeStatus === 'paid' && (editStudentEntry.fee_suspended || editStudentEntry.awaiting_termination)) {
          await toggleFeeSuspension(editStudentEntry.id, false);
        }
      } catch (feeErr) {
        console.warn('Fee status update warning:', feeErr);
      }

      toast.success(`Profile for ${nameTrim} updated successfully.`);
      setEditStudentModalOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('handleSaveStudentProfile error:', err);
      setEditStudentError(err.message || 'Failed to update student profile.');
      toast.error(err.message || 'Failed to save student profile.');
    } finally {
      setEditStudentSaving(false);
    }
  };

  // Section counts
  const adminCount = useMemo(() => roster.filter(r => r.role === 'admin').length, [roster]);
  const studentCount = useMemo(() => roster.filter(r => r.role === 'student').length, [roster]);
  const teacherCount = useMemo(() => roster.filter(r => r.role === 'teacher').length, [roster]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return roster.filter(entry => {
      // Role match
      if (activeSection === 'admins' && entry.role !== 'admin') return false;
      if (activeSection === 'students' && entry.role !== 'student') return false;
      if (activeSection === 'teachers' && entry.role !== 'teacher') return false;

      const matchedProfile = (entry.profile_id && profilesMap[entry.profile_id]) ||
        profilesMap[entry.id] ||
        (entry.email ? Object.values(profilesMap).find((p: any) => (p.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);
      const hasProfile = Boolean(matchedProfile || entry.profile_id);
      const isOnboardingComplete = Boolean(matchedProfile?.onboarding_complete);
      const isSuspended = entry.suspended === true;

      // Status Filter logic
      if (statusFilter !== 'all') {
        if (activeSection === 'teachers') {
          if (statusFilter === 'active' && isSuspended) return false;
          if (statusFilter === 'suspended' && !isSuspended) return false;
          if (statusFilter === 'not_signed_in' && (hasProfile && isOnboardingComplete)) return false;
          if (statusFilter === 'no_classes') {
            const assigned = getTeacherAssignedOfferings(entry);
            if (assigned.length > 0) return false;
          }
        } else if (activeSection === 'students') {
          const profileIdForFee = matchedProfile?.id || entry.profile_id || entry.id;
          const feeStatusVal = profileIdForFee ? (feeMap[profileIdForFee]?.status || 'unpaid') : 'unpaid';
          
          if (statusFilter === 'active' && (isSuspended || feeStatusVal !== 'paid')) return false;
          if (statusFilter === 'suspended' && !isSuspended) return false;
          if (statusFilter === 'pending_review' && feeStatusVal !== 'pending') return false;
          if (statusFilter === 'pending_payment' && feeStatusVal !== 'unpaid') return false;
          if (statusFilter === 'not_signed_in' && (hasProfile && isOnboardingComplete)) return false;
        } else if (activeSection === 'admins') {
          if (statusFilter === 'active' && isSuspended) return false;
          if (statusFilter === 'suspended' && !isSuspended) return false;
        }
      }

      // Search matching
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const nameMatch = (entry.full_name || '').toLowerCase().includes(q);
        const emailMatch = (entry.email || '').toLowerCase().includes(q);
        const phoneMatch = getPhone(entry).toLowerCase().includes(q);
        const idMatch = (entry.id || '').toLowerCase().includes(q) || formatStudentId(entry.id).toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || idMatch;
      }

      return true;
    });
  }, [roster, activeSection, statusFilter, searchTerm, profilesMap, feeMap, offerings]);

  // Board offerings for teacher provisioning
  const regularBoards = useMemo(() => {
    return BOARDS.filter(b => b.id !== 'ielts');
  }, []);

  const boardOfferingsMap = useMemo(() => {
    const map: Record<string, ClassOffering[]> = {};
    regularBoards.forEach(b => {
      map[b.id] = offerings.filter(o => {
        const rawBoard = String(o.board_id || o.board || o.class?.board_id || '').toLowerCase();
        return rawBoard === b.id || rawBoard.includes(b.id);
      });
    });
    return map;
  }, [regularBoards, offerings]);

  const ieltsOfferings = useMemo(() => {
    return offerings.filter(o => {
      const rawBoard = String(o.board_id || o.board || o.class?.board_id || '').toLowerCase();
      return rawBoard === 'ielts' || (o.subject_name || '').toLowerCase().includes('ielts');
    });
  }, [offerings]);

  const otherOfferings = useMemo(() => {
    return offerings.filter(o => {
      const rawBoard = String(o.board_id || o.board || o.class?.board_id || '').toLowerCase();
      const isKnown = BOARDS.some(b => rawBoard === b.id || rawBoard.includes(b.id)) || (o.subject_name || '').toLowerCase().includes('ielts');
      return !isKnown;
    });
  }, [offerings]);

  // Available subjects for selected class in student edit modal
  const availableModalSubjects = useMemo(() => {
    if (editStudentBoard === 'ielts') {
      return ['Listening', 'Reading', 'Writing', 'Speaking'];
    }
    const currentClassObj = classesList.find(c => c.id === editStudentClass);
    const grade = currentClassObj?.grade || '9';
    const currentStreamObj = streamsList.find(s => s.id === editStudentStreamId);
    const streamName = currentStreamObj?.name || 'Science';
    return getSubjectsForStream(grade, editStudentBoard, streamName);
  }, [classesList, streamsList, editStudentClass, editStudentStreamId, editStudentBoard]);

  // Admin calculated fee
  const adminCalculatedSubjectFee = useMemo(() => {
    if (editStudentEnrollmentMode !== 'custom' || editStudentBoard === 'ielts') return null;
    const currentClassObj = classesList.find(c => c.id === editStudentClass);
    const grade = currentClassObj?.grade || '9';
    const currentStreamObj = streamsList.find(s => s.id === editStudentStreamId);
    const streamName = currentStreamObj?.name || 'General';
    const defaultStreamPrice = getDefaultPrice(grade, editStudentBoard, streamName);
    return calculateSubjectEnrollmentFee({
      grade,
      boardId: editStudentBoard,
      streamName,
      selectedSubjects: editStudentSubjects,
      enrollmentMode: editStudentEnrollmentMode,
      baseTuitionFee: defaultStreamPrice,
    });
  }, [classesList, streamsList, editStudentClass, editStudentStreamId, editStudentBoard, editStudentSubjects, editStudentEnrollmentMode]);

  return (
    <AdminShell>
      <SectionHeader
        title="Roster Manager"
        description="Directory of platform administrators, enrolled students, and faculty members. Tap any row to inspect details or manage access."
      />

      {/* ── UNIFIED SEGMENTED TAB BAR WITH COUNTS ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="inline-flex items-center p-1 bg-zinc-100 dark:bg-neutral-800 rounded-2xl border border-zinc-200 dark:border-neutral-700 max-w-full overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => { setActiveSection('students'); setStatusFilter('all'); }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSection === 'students'
                ? 'bg-white dark:bg-neutral-900 text-indigo-700 dark:text-indigo-400 shadow-sm border border-zinc-200/80 dark:border-neutral-700'
                : 'text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-neutral-100'
            }`}
          >
            <GraduationCap size={15} />
            <span>Students</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSection === 'students' 
                ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300' 
                : 'bg-zinc-200 dark:bg-neutral-700 text-zinc-700 dark:text-neutral-300'
            }`}>
              {studentCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSection('teachers'); setStatusFilter('all'); }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSection === 'teachers'
                ? 'bg-white dark:bg-neutral-900 text-purple-700 dark:text-purple-400 shadow-sm border border-zinc-200/80 dark:border-neutral-700'
                : 'text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-neutral-100'
            }`}
          >
            <BookOpen size={15} />
            <span>Teachers</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSection === 'teachers' 
                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300' 
                : 'bg-zinc-200 dark:bg-neutral-700 text-zinc-700 dark:text-neutral-300'
            }`}>
              {teacherCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveSection('admins'); setStatusFilter('all'); }}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              activeSection === 'admins'
                ? 'bg-white dark:bg-neutral-900 text-red-700 dark:text-red-400 shadow-sm border border-zinc-200/80 dark:border-neutral-700'
                : 'text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-neutral-100'
            }`}
          >
            <Shield size={15} />
            <span>Admins</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              activeSection === 'admins' 
                ? 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300' 
                : 'bg-zinc-200 dark:bg-neutral-700 text-zinc-700 dark:text-neutral-300'
            }`}>
              {adminCount}
            </span>
          </button>
        </div>

        {/* Action Button & Platform Count */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs font-semibold text-zinc-500 dark:text-neutral-400">
            Total Roster: <strong className="text-zinc-900 dark:text-neutral-100">{roster.length}</strong> accounts
          </span>

          {activeSection === 'teachers' && (
            <button
              onClick={openAddTeacher}
              className="min-h-[44px] px-4 py-2 bg-[#F4C430] hover:bg-[#E5B520] text-zinc-950 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer"
            >
              <UserPlus size={15} /> Provision Teacher
            </button>
          )}
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 p-3.5 sm:p-4 rounded-2xl shadow-xs mb-5 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={`Search ${activeSection} by name, email, phone, or ID...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl font-medium focus:bg-white dark:focus:bg-neutral-900 text-zinc-900 dark:text-neutral-100 min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          <label htmlFor="roster-status-filter" className="text-xs font-bold text-zinc-500 dark:text-neutral-400 uppercase tracking-wider shrink-0">Filter:</label>
          <select
            id="roster-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] py-2 px-3 text-xs bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl font-semibold text-zinc-900 dark:text-neutral-100 cursor-pointer flex-1 md:flex-none"
          >
            {activeSection === 'teachers' ? (
              <>
                <option value="all">All Teachers</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Accounts</option>
                <option value="not_signed_in">Not Yet Signed In</option>
                <option value="no_classes">No Classes Assigned</option>
              </>
            ) : activeSection === 'students' ? (
              <>
                <option value="all">All Students</option>
                <option value="active">Active · Paid</option>
                <option value="pending_review">Awaiting Review</option>
                <option value="pending_payment">Unpaid</option>
                <option value="suspended">Suspended Accounts</option>
                <option value="not_signed_in">Not Yet Signed In</option>
              </>
            ) : (
              <>
                <option value="all">All Admins</option>
                <option value="active">Active Only</option>
                <option value="suspended">Suspended Accounts</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* ── TABLE / CARD DIRECTORY ── */}
      <div className="bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-16 text-zinc-500 text-xs font-bold gap-2">
            <Clock size={16} className="animate-spin text-zinc-900 dark:text-neutral-100" /> Syncing {activeSection} directory...
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="text-center p-16 text-zinc-500 dark:text-neutral-400 text-xs font-medium">
            No {activeSection} found matching current filter or search criteria.
          </div>
        ) : isMobile ? (
          /* Mobile Card Directory */
          <div className="divide-y divide-zinc-100 dark:divide-neutral-800">
            {filteredRoster.map((entry) => {
              const matchedProfile = (entry.profile_id && profilesMap[entry.profile_id]) ||
                profilesMap[entry.id] ||
                (entry.email ? Object.values(profilesMap).find((p: any) => (p.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);
              const hasProfile = Boolean(matchedProfile || entry.profile_id);
              const isOnboardingComplete = Boolean(matchedProfile?.onboarding_complete);
              const isSuspended = entry.suspended === true;
              const isTeacher = entry.role === 'teacher';
              const isStudent = entry.role === 'student';

              const profileIdForFee = isStudent ? (matchedProfile?.id || entry.profile_id || entry.id) : undefined;
              const feeStatusVal = isStudent && profileIdForFee ? (feeMap[profileIdForFee]?.status || 'unpaid') : undefined;
              const isPendingAccount = isStudent ? (!hasProfile || !isOnboardingComplete) : false;
              const isPendingPayment = isStudent ? (!isPendingAccount && feeStatusVal !== 'paid') : false;
              const isActive = isStudent ? (!isPendingAccount && !isPendingPayment && !isSuspended) : !isSuspended;
              const idShort = formatStudentId(entry.id || entry.profile_id || '');

              return (
                <div 
                  key={entry.id} 
                  onClick={() => setDetailEntry(entry)}
                  className="p-4 hover:bg-zinc-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer flex flex-col gap-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-zinc-900 dark:text-neutral-100 text-sm flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{entry.full_name}</span>
                        {entry.role === 'admin' && (
                          <span className="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 shrink-0">
                            Admin
                          </span>
                        )}
                        {isStudent && (
                          <span className="text-[10px] font-mono text-zinc-500 font-bold">#{idShort}</span>
                        )}
                      </div>
                      <div className="text-zinc-500 dark:text-neutral-400 text-xs font-medium truncate mt-0.5">{entry.email}</div>
                    </div>

                    <StatusBadge
                      role={isTeacher ? 'teacher' : isStudent ? 'student' : 'admin'}
                      showPayment={!isTeacher}
                      isSuspended={isSuspended}
                      isActive={isActive}
                      feeStatusVal={feeStatusVal}
                      isPendingPayment={isPendingPayment}
                      size="sm"
                    />
                  </div>

                  {/* Metadata Row */}
                  {isStudent && (
                    <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-neutral-300 bg-zinc-50 dark:bg-neutral-800/70 px-3 py-2 rounded-xl">
                      <div className="font-semibold truncate max-w-[200px]" title={getClassGrade(entry)}>
                        {getShortClassGrade(entry)} · {getStream(entry)}
                      </div>
                      {getPhone(entry) !== '—' && (
                        <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                          <Phone size={11} /> {getPhone(entry)}
                        </div>
                      )}
                    </div>
                  )}

                  {isTeacher && (
                    <div className="pt-1">
                      {renderTeacherClasses(entry, false)}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-100 dark:border-neutral-800 text-xs">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailEntry(entry);
                      }}
                      className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline min-h-[44px] inline-flex items-center gap-1"
                    >
                      <Eye size={13} /> View Details
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === entry.id ? null : entry.id);
                        }}
                        className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:bg-neutral-800"
                        aria-label="Actions"
                      >
                        <MoreVertical size={16} />
                      </button>

                      {activeMenuId === entry.id && (
                        <div 
                          ref={menuRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-0 bottom-full mb-1 w-48 bg-white dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl shadow-xl z-30 py-1"
                        >
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setDetailEntry(entry);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                          >
                            <Eye size={13} /> View Full Profile
                          </button>

                          {isStudent && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                openEditStudent(entry);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <Edit size={13} /> Edit Profile & Plan
                            </button>
                          )}

                          {isTeacher && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                openEdit(entry);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              <Edit size={13} /> Edit Class Assignments
                            </button>
                          )}

                          {entry.role !== 'admin' && (
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleToggleAccess(entry);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                            >
                              {isSuspended ? <Unlock size={13} /> : <Lock size={13} />}
                              {isSuspended ? 'Restore Access' : 'Suspend Account'}
                            </button>
                          )}

                          {isStudent && (
                            <>
                              {feeStatusVal === 'pending' && profileIdForFee && (
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleApprovePayment(profileIdForFee, entry.id);
                                  }}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2"
                                >
                                  <Check size={13} /> Approve Payment
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setActiveMenuId(null);
                                  handleSetStudentFeeStatus(entry, feeStatusVal === 'paid' ? 'unpaid' : 'paid');
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-700 flex items-center gap-2"
                              >
                                {feeStatusVal === 'paid' ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                                {feeStatusVal === 'paid' ? 'Revoke Paid Access' : 'Grant Paid Access'}
                              </button>
                            </>
                          )}

                          {entry.role !== 'admin' && (
                            <div className="border-t border-zinc-100 dark:border-neutral-700 my-1 pt-1">
                              <button
                                onClick={() => triggerDelete(entry)}
                                className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2"
                              >
                                <Trash2 size={13} /> Delete Account...
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop & Tablet Table (Fits without horizontal scroll at 1366px) */
          <div className="w-full">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-neutral-800 bg-zinc-50/80 dark:bg-neutral-800/50">
                  {activeSection === 'students' && (
                    <th className="p-3.5 text-xs font-black text-zinc-500 dark:text-neutral-400 uppercase tracking-wider w-28 whitespace-nowrap">
                      Student ID
                    </th>
                  )}
                  <th className="p-3.5 text-xs font-black text-zinc-500 dark:text-neutral-400 uppercase tracking-wider min-w-[200px]">
                    User Details
                  </th>
                  {activeSection === 'students' && (
                    <th className="p-3.5 text-xs font-black text-zinc-500 dark:text-neutral-400 uppercase tracking-wider w-64">
                      Class & Stream
                    </th>
                  )}
                  {activeSection === 'teachers' && (
                    <th className="p-3.5 text-xs font-black text-zinc-500 dark:text-neutral-400 uppercase tracking-wider">
                      Assigned Offerings
                    </th>
                  )}
                  {activeSection === 'admins' && (
                    <th className="p-3.5 text-xs font-black text-zinc-500 dark:text-neutral-400 uppercase tracking-wider">
                      Role & Privileges
                    </th>
                  )}
                  <th className="p-3.5 text-xs font-black text-zinc-500 dark:text-neutral-400 uppercase tracking-wider w-44">
                    Status
                  </th>
                  <th className="p-3.5 text-xs font-black text-zinc-500 dark:text-neutral-400 uppercase tracking-wider text-right w-28">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-neutral-800">
                {filteredRoster.map((entry) => {
                  const matchedProfile = (entry.profile_id && profilesMap[entry.profile_id]) ||
                    profilesMap[entry.id] ||
                    (entry.email ? Object.values(profilesMap).find((p: any) => (p.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);
                  const hasProfile = Boolean(matchedProfile || entry.profile_id);
                  const isOnboardingComplete = Boolean(matchedProfile?.onboarding_complete);
                  const isSuspended = entry.suspended === true;
                  const isTeacher = entry.role === 'teacher';
                  const isStudent = entry.role === 'student';

                  const profileIdForFee = isStudent ? (matchedProfile?.id || entry.profile_id || entry.id) : undefined;
                  const feeStatusVal = isStudent && profileIdForFee ? (feeMap[profileIdForFee]?.status || 'unpaid') : undefined;
                  const isPendingAccount = isStudent ? (!hasProfile || !isOnboardingComplete) : false;
                  const isPendingPayment = isStudent ? (!isPendingAccount && feeStatusVal !== 'paid') : false;
                  const isActive = isStudent ? (!isPendingAccount && !isPendingPayment && !isSuspended) : !isSuspended;
                  const idShort = formatStudentId(entry.id || entry.profile_id || '');

                  return (
                    <tr 
                      key={entry.id} 
                      onClick={() => setDetailEntry(entry)}
                      className="hover:bg-zinc-50/70 dark:hover:bg-neutral-800/40 transition-colors cursor-pointer group"
                    >
                      {activeSection === 'students' && (
                        <td className="p-3.5 text-xs font-mono font-bold text-zinc-600 dark:text-neutral-400 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>#{idShort}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(entry.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-200 dark:hover:bg-neutral-700 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-neutral-200 cursor-pointer"
                              title="Copy Student UUID"
                            >
                              {copiedId === entry.id ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                            </button>
                          </div>
                        </td>
                      )}

                      <td className="p-3.5 text-xs">
                        <div className="font-bold text-zinc-900 dark:text-neutral-100 text-sm flex items-center gap-1.5 truncate">
                          <span className="truncate">{entry.full_name}</span>
                          {entry.role === 'admin' && (
                            <span className="bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300 text-[9px] font-black uppercase px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 shrink-0">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-zinc-500 dark:text-neutral-400 text-xs font-medium truncate mt-0.5">{entry.email}</div>
                        {activeSection === 'students' && getPhone(entry) !== '—' && (
                          <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 dark:text-neutral-400 mt-0.5">
                            <Phone size={10} className="text-zinc-400" />
                            <span>{getPhone(entry)}</span>
                          </div>
                        )}
                      </td>

                      {activeSection === 'students' && (
                        <td className="p-3.5 text-xs">
                          <div className="flex flex-col gap-0.5 max-w-full">
                            <span 
                              className="font-bold text-zinc-900 dark:text-neutral-100 truncate text-xs"
                              title={getClassGrade(entry)}
                            >
                              {getShortClassGrade(entry)}
                            </span>
                            <span 
                              className="text-[11px] text-zinc-500 dark:text-neutral-400 truncate"
                              title={getStream(entry)}
                            >
                              {getStream(entry)}
                            </span>
                          </div>
                        </td>
                      )}

                      {activeSection === 'teachers' && (
                        <td className="p-3.5 text-xs">
                          {renderTeacherClasses(entry, false)}
                        </td>
                      )}

                      {activeSection === 'admins' && (
                        <td className="p-3.5 text-xs">
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-xl text-xs font-bold">
                            <Shield size={12} /> System Administrator
                          </span>
                        </td>
                      )}

                      <td className="p-3.5 text-xs whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {entry.awaiting_termination && (
                            <span className="inline-flex items-center gap-1 font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide">
                              <ShieldAlert size={10} /> Term Requested
                            </span>
                          )}
                          {isStudent && entry.fee_suspended && (
                            <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide">
                              <DollarSign size={10} /> Billing Locked
                            </span>
                          )}
                          <StatusBadge
                            role={isTeacher ? 'teacher' : isStudent ? 'student' : 'admin'}
                            showPayment={!isTeacher}
                            isSuspended={isSuspended}
                            isActive={isActive}
                            feeStatusVal={feeStatusVal}
                            isPendingPayment={isPendingPayment}
                            size="md"
                          />
                        </div>
                      </td>

                      <td className="p-3.5 text-xs text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setDetailEntry(entry)}
                            className="min-h-[44px] min-w-[44px] p-2 hover:bg-zinc-100 dark:hover:bg-neutral-800 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-neutral-100 inline-flex items-center justify-center transition-colors cursor-pointer"
                            title="View user details"
                          >
                            <Eye size={15} />
                          </button>

                          {entry.role === 'admin' ? (
                            <span className="text-[10px] font-bold text-zinc-400 italic px-2 py-1 bg-zinc-100 dark:bg-neutral-800 rounded-lg">
                              Protected
                            </span>
                          ) : (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveMenuId(activeMenuId === entry.id ? null : entry.id)}
                                className="min-h-[44px] min-w-[44px] p-2 hover:bg-zinc-100 dark:hover:bg-neutral-800 rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-neutral-100 inline-flex items-center justify-center transition-colors cursor-pointer"
                                aria-label="More actions"
                              >
                                <MoreVertical size={15} />
                              </button>

                              {activeMenuId === entry.id && (
                                <div 
                                  ref={menuRef}
                                  className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-neutral-900 border border-zinc-200 dark:border-neutral-800 rounded-xl shadow-xl z-30 py-1"
                                >
                                  {isStudent && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        openEditStudent(entry);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Edit size={13} /> Edit Profile & Plan
                                    </button>
                                  )}

                                  {isTeacher && (
                                    <button
                                      onClick={() => {
                                        setActiveMenuId(null);
                                        openEdit(entry);
                                      }}
                                      className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Edit size={13} /> Edit Class Offerings
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      handleToggleAccess(entry);
                                    }}
                                    disabled={processingIds[entry.id]}
                                    className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                                  >
                                    {isSuspended ? <Unlock size={13} /> : <Lock size={13} />}
                                    {isSuspended ? 'Restore Access' : 'Suspend Account'}
                                  </button>

                                  {isStudent && (
                                    <>
                                      {feeStatusVal === 'pending' && profileIdForFee && (
                                        <button
                                          onClick={() => {
                                            setActiveMenuId(null);
                                            handleApprovePayment(profileIdForFee, entry.id);
                                          }}
                                          disabled={processingIds[entry.id]}
                                          className="w-full text-left px-3 py-2 text-xs font-semibold text-purple-700 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Check size={13} /> Approve Payment
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handleSetStudentFeeStatus(entry, feeStatusVal === 'paid' ? 'unpaid' : 'paid');
                                        }}
                                        disabled={processingIds[entry.id]}
                                        className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        {feeStatusVal === 'paid' ? <XCircle size={13} /> : <CheckCircle2 size={13} />}
                                        {feeStatusVal === 'paid' ? 'Revoke Paid Access' : 'Grant Paid Access'}
                                      </button>

                                      <button
                                        onClick={() => {
                                          setActiveMenuId(null);
                                          handleToggleFeeAccess(entry);
                                        }}
                                        disabled={processingIds[entry.id]}
                                        className="w-full text-left px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-neutral-200 hover:bg-zinc-50 dark:hover:bg-neutral-800 flex items-center gap-2 cursor-pointer"
                                      >
                                        <DollarSign size={13} />
                                        {entry.fee_suspended ? 'Unlock Billing' : 'Lock Billing'}
                                      </button>
                                    </>
                                  )}

                                  <div className="border-t border-zinc-100 dark:border-neutral-800 my-1 pt-1">
                                    <button
                                      onClick={() => triggerDelete(entry)}
                                      className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer"
                                    >
                                      <Trash2 size={13} /> Delete Account...
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DETAIL DRAWER (Side sheet on desktop/tablet, bottom sheet on mobile) ── */}
      {detailEntry && createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" 
            onClick={() => setDetailEntry(null)}
          />

          <div className="relative w-full max-w-full sm:max-w-md md:max-w-lg bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 overflow-hidden">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-neutral-800 flex items-center justify-between bg-zinc-50 dark:bg-neutral-800/60 shrink-0">
              <div className="min-w-0 pr-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-black text-zinc-900 dark:text-neutral-100 truncate">
                    {detailEntry.full_name}
                  </h3>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${
                    detailEntry.role === 'admin' 
                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' 
                      : detailEntry.role === 'teacher'
                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                  }`}>
                    {detailEntry.role}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5 truncate">{detailEntry.email}</p>
              </div>

              <button 
                onClick={() => setDetailEntry(null)}
                className="min-h-[44px] min-w-[44px] p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-neutral-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800 shrink-0 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5">
              {/* Profile Card */}
              <div className="p-4 bg-zinc-50 dark:bg-neutral-800/50 rounded-2xl border border-zinc-200/80 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 dark:text-neutral-400 uppercase tracking-wider">Account Status</span>
                  <StatusBadge
                    role={detailEntry.role}
                    showPayment={detailEntry.role === 'student'}
                    isSuspended={detailEntry.suspended === true}
                    isActive={!detailEntry.suspended}
                    feeStatusVal={feeMap[detailEntry.profile_id || detailEntry.id]?.status}
                    isPendingPayment={feeMap[detailEntry.profile_id || detailEntry.id]?.status === 'unpaid'}
                    size="md"
                  />
                </div>

                {detailEntry.role === 'student' && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-200/60 dark:border-neutral-700">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Student ID</span>
                      <span className="text-xs font-mono font-bold text-zinc-800 dark:text-neutral-200">
                        #{formatStudentId(detailEntry.id || detailEntry.profile_id || '')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-bold block">Phone</span>
                      <span className="text-xs font-mono font-bold text-zinc-800 dark:text-neutral-200">
                        {getPhone(detailEntry)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Specific Section Info */}
              {detailEntry.role === 'student' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-zinc-900 dark:text-neutral-100 uppercase tracking-wider">
                    Academic Enrollment
                  </h4>
                  <div className="p-4 border border-zinc-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-800 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Curriculum & Grade:</span>
                      <span className="font-bold text-zinc-900 dark:text-neutral-100">{getClassGrade(detailEntry)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Stream:</span>
                      <span className="font-bold text-zinc-900 dark:text-neutral-100">{getStream(detailEntry)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-500">Fee Status:</span>
                      <span className="font-bold uppercase text-purple-700 dark:text-purple-400">
                        {feeMap[detailEntry.profile_id || detailEntry.id]?.status || 'unpaid'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      openEditStudent(detailEntry);
                      setDetailEntry(null);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 dark:hover:bg-indigo-950/60 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                  >
                    <Edit size={14} /> Edit Student Profile & Curriculum
                  </button>
                </div>
              )}

              {detailEntry.role === 'teacher' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-zinc-900 dark:text-neutral-100 uppercase tracking-wider">
                      Assigned Class Offerings
                    </h4>
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-400">
                      {getTeacherAssignedOfferings(detailEntry).length} total
                    </span>
                  </div>

                  <div className="p-4 border border-zinc-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-800">
                    {renderTeacherClasses(detailEntry, true)}
                  </div>

                  <button
                    onClick={() => {
                      openEdit(detailEntry);
                      setDetailEntry(null);
                    }}
                    className="w-full min-h-[44px] py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-950/60 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                  >
                    <Edit size={14} /> Edit Assigned Schedule Offerings
                  </button>
                </div>
              )}

              {detailEntry.role === 'admin' && (
                <div className="p-4 bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs mb-1">
                    <Shield size={14} /> Protected Administrator
                  </div>
                  <p className="text-xs text-zinc-600 dark:text-neutral-400">
                    This account possesses system-wide root administrative privileges across Scholario LMS. Protected administrator accounts cannot be deleted or suspended.
                  </p>
                </div>
              )}

              {/* Direct Actions */}
              {detailEntry.role !== 'admin' && (
                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-neutral-800">
                  <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-2">Account Controls</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleToggleAccess(detailEntry)}
                      disabled={processingIds[detailEntry.id]}
                      className="min-h-[44px] p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 hover:bg-zinc-100 text-zinc-800 dark:text-neutral-200"
                    >
                      {detailEntry.suspended ? <Unlock size={14} /> : <Lock size={14} />}
                      {detailEntry.suspended ? 'Restore Access' : 'Suspend Account'}
                    </button>

                    {detailEntry.role === 'student' && (
                      <button
                        onClick={() => handleToggleFeeAccess(detailEntry)}
                        disabled={processingIds[detailEntry.id]}
                        className="min-h-[44px] p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 hover:bg-zinc-100 text-zinc-800 dark:text-neutral-200"
                      >
                        <DollarSign size={14} />
                        {detailEntry.fee_suspended ? 'Unlock Billing' : 'Lock Billing'}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => triggerDelete(detailEntry)}
                    className="w-full min-h-[44px] p-2.5 mt-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 border border-red-200 dark:border-red-800 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} /> Permanently Delete Account...
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── TEACHER DRAWER FORM (Add/Edit Teacher) ── */}
      {drawerOpen && createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative w-full max-w-full sm:max-w-lg md:max-w-xl bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-neutral-800 flex items-center justify-between bg-zinc-50 dark:bg-neutral-800/60 shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="text-base font-black text-zinc-900 dark:text-neutral-100 truncate">
                  {drawerMode === 'add_teacher' && 'Provision New Teacher'}
                  {drawerMode === 'edit' && `Edit Classes — ${selectedEntry?.full_name}`}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5 break-words">
                  {drawerMode !== 'edit' ? 'Create a pre-provisioned teacher account by email and name.' : 'Update assigned schedule offerings across all boards.'}
                </p>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-neutral-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800 shrink-0 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto min-h-0 space-y-6 overscroll-contain">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠️</span>
                    <span>{formError}</span>
                  </div>
                )}

                {drawerMode !== 'edit' && (
                  <div className="space-y-4 pb-2 border-b border-zinc-200 dark:border-neutral-800">
                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 mb-1.5 block uppercase tracking-wider">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. teacher@scholario.me"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full min-h-[44px] text-xs px-3 py-2 bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl font-medium text-zinc-900 dark:text-neutral-100"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 mb-1.5 block uppercase tracking-wider">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mr. Tariq Mahmood"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full min-h-[44px] text-xs px-3 py-2 bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl font-medium text-zinc-900 dark:text-neutral-100"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 block uppercase tracking-wider">
                          Phone Number (Optional)
                        </label>
                        <span className="text-[10px] text-zinc-500 font-medium">🇵🇰 +92 3XXXXXXXXX</span>
                      </div>
                      <input
                        type="text"
                        placeholder="+92 3058969050"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full min-h-[44px] text-xs px-3 py-2 bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl font-medium text-zinc-900 dark:text-neutral-100"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 font-bold">
                      <BookOpen size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
                      Assigned Offerings Selected:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-700 text-white font-black text-xs shadow-xs">
                      {selectedClasses.length} total
                    </span>
                  </div>

                  {/* Regular Boards */}
                  {regularBoards.map((b) => {
                    const bOffers = boardOfferingsMap[b.id] || [];
                    const bIds = bOffers.map(o => o.id);
                    const selectedCount = selectedClasses.filter(id => bIds.includes(id)).length;
                    const allSelected = bIds.length > 0 && bIds.every(id => selectedClasses.includes(id));

                    return (
                      <div key={b.id} className="space-y-2.5 pt-2">
                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-black text-zinc-900 dark:text-neutral-100 uppercase tracking-wider">
                              {b.name}
                            </h4>
                            <span className="text-[10px] font-bold text-zinc-600 bg-zinc-100 dark:bg-neutral-800 px-2 py-0.5 rounded-md">
                              {bOffers.length}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedCount > 0 && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-100 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                                {selectedCount} selected
                              </span>
                            )}
                            {bOffers.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (allSelected) {
                                    setSelectedClasses(prev => prev.filter(id => !bIds.includes(id)));
                                  } else {
                                    setSelectedClasses(prev => Array.from(new Set([...prev, ...bIds])));
                                  }
                                }}
                                className="text-[11px] font-bold text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-neutral-100 underline transition-colors cursor-pointer"
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="border border-zinc-200 dark:border-neutral-800 rounded-2xl max-h-56 overflow-y-auto divide-y divide-zinc-100 dark:divide-neutral-800 bg-zinc-50/50 dark:bg-neutral-900/50">
                          {bOffers.length === 0 ? (
                            <div className="p-4 text-xs text-zinc-500 text-center">No {b.shortName} offerings found.</div>
                          ) : (
                            bOffers.map(off => {
                              const isChecked = selectedClasses.includes(off.id);
                              return (
                                <label 
                                  key={off.id}
                                  className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-white dark:hover:bg-neutral-800 transition-colors ${isChecked ? 'bg-purple-50/70 dark:bg-purple-950/30 font-semibold' : ''}`}
                                >
                                  <div className="pr-3">
                                    <div className="text-xs font-bold text-zinc-900 dark:text-neutral-100 flex items-center gap-1.5 flex-wrap">
                                      <span>{off.subject_name} — {formatGradeDisplay(off.grade || '', b.id)}</span>
                                      {off.stream && (
                                        <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-200/70 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
                                          {off.stream}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] mt-0.5 text-zinc-500">
                                      Teacher: <span className="font-semibold">{off.teacher?.full_name || 'Unassigned'}</span>
                                    </div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleClassSelect(off.id)}
                                    className="rounded border-zinc-300 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer shrink-0"
                                  />
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* IELTS */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-black text-zinc-900 dark:text-neutral-100 uppercase tracking-wider">
                          IELTS Track
                        </h4>
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 rounded-md">
                          Unified
                        </span>
                      </div>
                    </div>

                    <div className="border border-zinc-200 dark:border-neutral-800 rounded-2xl bg-zinc-50/50 dark:bg-neutral-900/50 p-1">
                      {ieltsOfferings.map(off => {
                        const isChecked = selectedClasses.includes(off.id);
                        return (
                          <label 
                            key={off.id}
                            className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer hover:bg-white dark:hover:bg-neutral-800 transition-all ${isChecked ? 'bg-amber-50/80 dark:bg-amber-950/30 font-semibold border border-amber-200' : ''}`}
                          >
                            <div className="pr-3">
                              <span className="text-xs font-bold text-zinc-900 dark:text-neutral-100">IELTS Preparation</span>
                              <p className="text-[11px] text-zinc-500 mt-0.5">Unified Listening, Reading, Writing, Speaking.</p>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleClassSelect(off.id)}
                              className="rounded border-zinc-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer shrink-0"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {otherOfferings.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <h4 className="text-xs font-black text-zinc-900 dark:text-neutral-100 uppercase tracking-wider">
                        Other Offerings
                      </h4>
                      <div className="border border-zinc-200 dark:border-neutral-800 rounded-2xl max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-neutral-800 bg-zinc-50/50">
                        {otherOfferings.map(off => (
                          <label key={off.id} className="flex items-center justify-between p-3.5 cursor-pointer">
                            <span className="text-xs font-bold text-zinc-900">{off.subject_name} — Gr. {off.grade}</span>
                            <input
                              type="checkbox"
                              checked={selectedClasses.includes(off.id)}
                              onChange={() => toggleClassSelect(off.id)}
                              className="rounded border-zinc-300 text-purple-600 w-4 h-4"
                            />
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Footer */}
              <div className="p-4 sm:px-6 sm:py-4 border-t border-zinc-200 dark:border-neutral-800 flex gap-3 bg-zinc-50/80 dark:bg-neutral-800/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="min-h-[44px] flex-1 py-2.5 border border-zinc-200 dark:border-neutral-700 text-zinc-700 dark:text-neutral-300 font-bold text-xs rounded-xl hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="min-h-[44px] flex-1 py-2.5 bg-[#F4C430] hover:bg-[#E5B520] text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {formSaving ? <Clock size={14} className="animate-spin" /> : <Save size={14} />}
                  {drawerMode === 'add_teacher' ? 'Provision Teacher' : 'Save Assignments'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── EDIT STUDENT PROFILE MODAL ── */}
      {editStudentModalOpen && editStudentEntry && createPortal(
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative bg-white dark:bg-neutral-900 w-full max-w-full sm:max-w-lg md:max-w-xl rounded-2xl shadow-2xl border border-zinc-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-neutral-800 flex items-center justify-between bg-zinc-50 dark:bg-neutral-800/50 shrink-0">
              <div className="min-w-0 pr-2">
                <h3 className="text-base font-black text-zinc-900 dark:text-neutral-100 truncate">
                  Edit Student Profile & Plan
                </h3>
                <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5 truncate">
                  {editStudentEntry.full_name} ({editStudentEntry.email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditStudentModalOpen(false)}
                className="min-h-[44px] min-w-[44px] p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-neutral-200 rounded-lg shrink-0 flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStudentProfile} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-4">
                {editStudentError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                    ⚠️ {editStudentError}
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 mb-1 block uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    className="w-full min-h-[44px] text-xs px-3 py-2 bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl font-medium text-zinc-900 dark:text-neutral-100"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 mb-1 block uppercase">Board / System</label>
                    <select
                      value={editStudentBoard}
                      onChange={(e) => handleBoardChangeInModal(e.target.value as BoardId)}
                      className="w-full min-h-[44px] text-xs px-3 py-2 bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl font-semibold text-zinc-900 dark:text-neutral-100"
                    >
                      {BOARDS.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 mb-1 block uppercase">Grade / Level</label>
                    <select
                      value={editStudentClass}
                      onChange={(e) => handleClassChangeInModal(e.target.value)}
                      className="w-full min-h-[44px] text-xs px-3 py-2 bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl font-semibold text-zinc-900 dark:text-neutral-100"
                    >
                      {classesList
                        .filter(c => (c.board_id || '').toLowerCase() === editStudentBoard)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.display_name || c.name || `Grade ${c.grade}`}</option>
                        ))}
                    </select>
                  </div>
                </div>

                {editStudentBoard !== 'ielts' && (
                  <div>
                    <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 mb-1 block uppercase">Stream</label>
                    <select
                      value={editStudentStreamId}
                      onChange={(e) => setEditStudentStreamId(e.target.value)}
                      className="w-full min-h-[44px] text-xs px-3 py-2 bg-zinc-50 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 rounded-xl font-semibold text-zinc-900 dark:text-neutral-100"
                    >
                      {streamsList
                        .filter(s => s.class_id === editStudentClass)
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                  </div>
                )}

                {/* Enrollment Plan: All vs Custom */}
                <div className="pt-2 border-t border-zinc-100 dark:border-neutral-800">
                  <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 mb-2 block uppercase">Subject Plan</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditStudentEnrollmentMode('all');
                        setEditStudentSubjects([]);
                      }}
                      className={`min-h-[44px] p-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        editStudentEnrollmentMode === 'all'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300'
                          : 'border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300'
                      }`}
                    >
                      All Stream Subjects
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditStudentEnrollmentMode('custom')}
                      className={`min-h-[44px] p-2.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                        editStudentEnrollmentMode === 'custom'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300'
                          : 'border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300'
                      }`}
                    >
                      Custom Subject Plan
                    </button>
                  </div>

                  {editStudentEnrollmentMode === 'custom' && (
                    <div className="p-3 bg-zinc-50 dark:bg-neutral-800/60 rounded-xl border border-zinc-200 dark:border-neutral-700 space-y-2">
                      <span className="text-[11px] font-bold text-zinc-600 dark:text-neutral-300 block">Select Enrolled Subjects:</span>
                      <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                        {availableModalSubjects.map(subj => {
                          const isChecked = editStudentSubjects.includes(subj);
                          return (
                            <label key={subj} className="flex items-center gap-2 p-1.5 text-xs text-zinc-800 dark:text-neutral-200 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setEditStudentSubjects(prev => prev.filter(s => s !== subj));
                                  } else {
                                    setEditStudentSubjects(prev => [...prev, subj]);
                                  }
                                }}
                                className="rounded border-zinc-300 text-indigo-600"
                              />
                              <span className="truncate">{subj}</span>
                            </label>
                          );
                        })}
                      </div>

                      {adminCalculatedSubjectFee && (
                        <div className="pt-2 border-t border-zinc-200 dark:border-neutral-700 flex justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
                          <span>Calculated Tuition ({adminCalculatedSubjectFee.subjectCount} subjects):</span>
                          <span>PKR {adminCalculatedSubjectFee.finalFee.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Institutional Fee & Access Status */}
                <div className="pt-2 border-t border-zinc-100 dark:border-neutral-800">
                  <label className="text-xs font-bold text-zinc-700 dark:text-neutral-300 mb-2 block uppercase">Institutional Access Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditStudentFeeStatus('unpaid')}
                      className={`min-h-[44px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        editStudentFeeStatus === 'unpaid'
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold'
                          : 'border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="text-xs block font-bold">Unpaid</span>
                      <span className="text-[9px] text-zinc-500 block">Gated</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStudentFeeStatus('pending')}
                      className={`min-h-[44px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        editStudentFeeStatus === 'pending'
                          ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold'
                          : 'border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="text-xs block font-bold">Reviewing</span>
                      <span className="text-[9px] text-zinc-500 block">Pending</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEditStudentFeeStatus('paid')}
                      className={`min-h-[44px] p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        editStudentFeeStatus === 'paid'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold'
                          : 'border-zinc-200 dark:border-neutral-700 bg-zinc-50 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300'
                      }`}
                    >
                      <span className="text-xs block font-bold">Paid</span>
                      <span className="text-[9px] text-zinc-500 block">Full Access</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-zinc-200 dark:border-neutral-800 flex gap-3 bg-zinc-50 dark:bg-neutral-800/80 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditStudentModalOpen(false)}
                  className="min-h-[44px] flex-1 py-2.5 border border-zinc-200 dark:border-neutral-700 text-zinc-700 dark:text-neutral-300 font-bold text-xs rounded-xl hover:bg-white dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editStudentSaving}
                  className="min-h-[44px] flex-1 py-2.5 bg-[#F4C430] hover:bg-[#E5B520] text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                >
                  {editStudentSaving ? <Clock size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── PERMANENT DELETE CONFIRMATION WITH TYPED FULL NAME ── */}
      {deleteModalOpen && entryToDelete && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative bg-white dark:bg-neutral-900 w-full max-w-full sm:max-w-md rounded-2xl shadow-2xl p-5 border border-red-200 dark:border-red-900/60 flex flex-col space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-neutral-100">
                  Delete {entryToDelete.role === 'teacher' ? 'Faculty' : 'Student'} Account
                </h3>
                <p className="text-xs text-zinc-500 dark:text-neutral-400">
                  Permanent cascading removal
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 dark:text-neutral-300 leading-relaxed">
              This action will permanently delete <strong>{entryToDelete.full_name}</strong> ({entryToDelete.email}). All profile data, institutional fee records, attendance logs, and scheduled assignments will be completely cleaned up without leaving orphaned data.
            </p>

            <div className="p-3 bg-red-50/70 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl space-y-2">
              <label className="text-[11px] font-bold text-red-900 dark:text-red-300 block">
                Type <span className="font-mono underline select-all">{entryToDelete.full_name}</span> to confirm:
              </label>
              <input
                type="text"
                placeholder={entryToDelete.full_name}
                value={deleteConfirmNameInput}
                onChange={(e) => setDeleteConfirmNameInput(e.target.value)}
                className="w-full min-h-[44px] text-xs px-3 py-2 bg-white dark:bg-neutral-800 border border-red-300 dark:border-red-800 rounded-lg text-zinc-900 dark:text-neutral-100 font-bold focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setEntryToDelete(null);
                  setDeleteConfirmNameInput('');
                }}
                className="min-h-[44px] flex-1 py-2.5 border border-zinc-200 dark:border-neutral-700 text-zinc-700 dark:text-neutral-300 font-bold text-xs rounded-xl hover:bg-zinc-50 dark:hover:bg-neutral-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleteSubmitting || 
                  deleteConfirmNameInput.trim().toLowerCase() !== (entryToDelete.full_name || '').trim().toLowerCase()
                }
                onClick={confirmDelete}
                className="min-h-[44px] flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleteSubmitting ? <Clock size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AdminShell>
  );
};

export default RosterManagerPage;
