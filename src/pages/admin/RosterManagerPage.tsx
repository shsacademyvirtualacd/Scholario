import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Users, Shield, Trash2, Edit, 
  Clock, X, UserCheck, Lock, Unlock, Phone, GraduationCap, 
  BookOpen, Copy, Check, UserPlus, Save, ShieldAlert, DollarSign,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { 
  getAllRoster, addRosterEntry, updateRosterEntry, 
  deleteRosterEntry, getAllOfferings, toggleRosterAccess, toggleFeeSuspension, updateFeeStatus
} from '../../lib/db';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useRealtimeTable } from '../../hooks/useRealtimeTable';
import type { RosterEntry, ClassOffering } from '../../types';
import { useMobile } from '../../hooks/useMobile';

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

  // Tab section
  const [activeSection, setActiveSection] = useState<'admins' | 'students' | 'teachers'>('admins');

  // Filters/Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending_account' | 'pending_payment'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
  const [editStudentBoard, setEditStudentBoard] = useState<'fbise' | 'sindh' | 'ielts'>('fbise');
  const [editStudentClass, setEditStudentClass] = useState('');
  const [editStudentStreamId, setEditStudentStreamId] = useState('');
  const [editStudentError, setEditStudentError] = useState<string | null>(null);
  const [editStudentSaving, setEditStudentSaving] = useState(false);

  // Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<RosterEntry | null>(null);

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

  // Keep feeMap live: re-fetch enrichment data whenever any student's fee status changes
  useRealtimeTable({
    table: 'fee_statuses',
    onInsert: async () => { await fetchEnrichmentData(); },
    onUpdate: async () => { await fetchEnrichmentData(); },
  });

  // Keep offerings live: re-fetch when class_offerings change
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
      // Collect all offering IDs currently assigned to this teacher
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



    setFormSaving(true);

    try {
      if (drawerMode === 'edit' && selectedEntry) {
        const studentClass = selectedClass || (offerings.length > 0 ? offerings[0].id : '');
        const classesToSave = selectedEntry.role === 'student' ? [studentClass] : selectedClasses;
        await updateRosterEntry(selectedEntry.id, classesToSave);
        
        setRoster(prev => prev.map(r => r.id === selectedEntry.id ? { ...r, class_ids: classesToSave } : r));
        const offeringsData = await getAllOfferings().catch(() => []);
        setOfferings(offeringsData);
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

        const newEntry = await addRosterEntry(emailTrim, nameTrim, role, classesToSave, phoneTrim || undefined);
        setRoster(prev => {
          const exists = prev.some(r => r.id === newEntry.id || r.email.toLowerCase() === newEntry.email.toLowerCase());
          if (exists) return prev;
          return [newEntry, ...prev];
        });
        const offeringsData = await getAllOfferings().catch(() => []);
        setOfferings(offeringsData);
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
      toast.success(nextSuspendedState ? 'Roster access suspended.' : 'Roster access restored.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update access status.');
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
      toast.success(nextFeeSuspendedState ? 'Billing lock applied.' : 'Billing lock removed.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update billing access status.');
      toast.error(err.message || 'Failed to update billing access.');
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
      alert(err.message || 'Failed to approve payment.');
      toast.error(err.message || 'Failed to approve payment.');
    } finally {
      setProcessingIds(prev => ({ ...prev, [entryId]: false }));
    }
  };

  const triggerDelete = (entry: RosterEntry) => {
    if (entry.role === 'admin') {
      alert('Access denied: Protected administrator accounts cannot be deleted.');
      return;
    }
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      try {
        await deleteRosterEntry(entryToDelete.id);
        setRoster(prev => prev.filter(r => r.id !== entryToDelete.id && r.profile_id !== entryToDelete.id));
        
        // Re-fetch class offerings so that any classes previously assigned to the deleted teacher show as 'Unassigned' in the UI
        const offeringsData = await getAllOfferings().catch(() => []);
        setOfferings(offeringsData);

        toast.success('Roster entry deleted successfully.');
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Failed to remove account from system.');
        toast.error(err.message || 'Failed to delete roster entry.');
        throw err;
      }
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
    const p = profilesMap[entry.id] || (entry.profile_id ? profilesMap[entry.profile_id] : null) || (entry.email ? Object.values(profilesMap).find((prof: any) => (prof.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);
    return p?.phone || '—';
  };

  const getClassGrade = (entry: RosterEntry) => {
    const p = profilesMap[entry.id] || (entry.profile_id ? profilesMap[entry.profile_id] : null) || (entry.email ? Object.values(profilesMap).find((prof: any) => (prof.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);
    if (p?.class_id && classesMap[p.class_id]) {
      const cls = classesMap[p.class_id];
      const bName = cls.board_id === 'sindh' ? 'Sindh' : 'FBISE';
      return `${cls.display_name} (${bName})`;
    }
    if (entry.class_ids?.length > 0) {
      if (classesMap[entry.class_ids[0]]) {
        const cls = classesMap[entry.class_ids[0]];
        const bName = cls.board_id === 'sindh' ? 'Sindh' : 'FBISE';
        return `${cls.display_name} (${bName})`;
      }
      const firstOff = offerings.find(o => o.id === entry.class_ids[0]);
      if (firstOff) return `Grade ${firstOff.grade} (${firstOff.subject_name})`;
    }
    return 'Not Assigned';
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

  const formatClasses = (entry: RosterEntry) => {
    if (!entry.class_ids || entry.class_ids.length === 0) {
      return <span className="text-zinc-400 italic text-[11px]">No schedule classes assigned</span>;
    }
    return entry.class_ids.map(cid => {
      const off = offerings.find(o => o.id === cid);
      if (!off) return null;
      return (
        <span key={cid} className="inline-block bg-[#F5F5F5] border border-[#E5E5E5] text-[#404040] text-[10px] font-bold px-2.5 py-1 rounded-lg mr-1.5 mb-1.5">
          {off.subject_name} (Gr. {off.grade})
        </span>
      );
    }).filter(Boolean);
  };

  // Student Edit and Access Actions
  const openEditStudent = (entry: RosterEntry) => {
    const p = (entry.profile_id && profilesMap[entry.profile_id]) ||
      profilesMap[entry.id] ||
      (entry.email ? Object.values(profilesMap).find((prof: any) => (prof.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);

    setEditStudentEntry(entry);
    setEditStudentName(p?.full_name || entry.full_name || '');
    setEditStudentEmail(entry.email || p?.email || '');

    const rawBoard = (p?.board_id || p?.board || 'fbise').toLowerCase();
    const boardVal: 'fbise' | 'sindh' | 'ielts' = rawBoard === 'sindh' ? 'sindh' : rawBoard === 'ielts' ? 'ielts' : 'fbise';
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

    setEditStudentError(null);
    setEditStudentModalOpen(true);
  };

  const handleBoardChangeInModal = (newBoard: 'fbise' | 'sindh' | 'ielts') => {
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
    if (!editStudentClass) {
      setEditStudentError('Please select a grade/class level.');
      return;
    }

    setEditStudentSaving(true);
    try {
      const matchedProfile = (editStudentEntry.profile_id && profilesMap[editStudentEntry.profile_id]) ||
        profilesMap[editStudentEntry.id] ||
        (editStudentEntry.email ? Object.values(profilesMap).find((p: any) => (p.email || '').toLowerCase() === (editStudentEntry.email || '').toLowerCase()) : null);

      const studentProfileId = matchedProfile?.id || editStudentEntry.profile_id || editStudentEntry.id;
      const selectedStreamObj = streamsList.find(s => s.id === editStudentStreamId);
      const streamName = selectedStreamObj?.name || (editStudentStreamId ? 'Selected Stream' : 'General');

      // 1. Update/Upsert Profile in profiles table
      const profilePayload: any = {
        full_name: nameTrim,
        board_id: editStudentBoard,
        class_id: editStudentClass,
        stream_id: editStudentStreamId || null,
        stream: streamName,
        onboarding_complete: true,
        role: 'student'
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

      // 2. Update roster table entry
      await (supabase as any)
        .from('roster')
        .update({
          full_name: nameTrim,
          email: emailTrim,
          class_ids: [editStudentClass],
          profile_id: studentProfileId
        })
        .or(`id.eq.${editStudentEntry.id},profile_id.eq.${studentProfileId},email.eq.${editStudentEntry.email.toLowerCase()}`);

      // 3. Clear existing enrollments & re-enroll in the matching offerings
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
            .select('id, subject_id')
            .eq('class_id', editStudentClass);
          targetOfferings = offData || [];
        }

        if (subjectIds.length > 0) {
          targetOfferings = targetOfferings.filter((o: any) => subjectIds.includes(o.subject_id));
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
        console.warn('Enrollment re-sync error (non-fatal):', enrErr);
      }

      // 4. Ensure fee_statuses row exists
      try {
        const { data: existingFee } = await (supabase as any)
          .from('fee_statuses')
          .select('id')
          .eq('student_id', studentProfileId)
          .maybeSingle();
        if (!existingFee) {
          await (supabase as any).from('fee_statuses').insert({ student_id: studentProfileId, status: 'unpaid' });
        }
      } catch (feeErr) {
        console.warn('Fee status initialization warning:', feeErr);
      }

      toast.success(`Profile for ${nameTrim} updated successfully.`);
      setEditStudentModalOpen(false);
      await Promise.all([loadData(), fetchEnrichmentData()]);
    } catch (err: any) {
      console.error('Save student profile error:', err);
      setEditStudentError(err.message || 'Failed to update student profile.');
      toast.error(err.message || 'Failed to update student profile.');
    } finally {
      setEditStudentSaving(false);
    }
  };

  // Filter & Section breakdown
  const filteredRoster = useMemo(() => {
    return roster.filter(entry => {
      const effectiveRole = (profilesMap[entry.id]?.role || entry.role || 'student').trim().toLowerCase();
      if (effectiveRole !== activeSection.slice(0, -1)) return false;

      const q = searchTerm.toLowerCase();
      const matchesSearch = !q || 
        (entry.full_name || '').toLowerCase().includes(q) ||
        (entry.email || '').toLowerCase().includes(q) ||
        (entry.id || '').toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const matchedProfile = (entry.profile_id && profilesMap[entry.profile_id]) || 
        profilesMap[entry.id] || 
        (entry.email ? Object.values(profilesMap).find((p: any) => (p.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);

      const hasProfile = Boolean(matchedProfile || entry.profile_id);
      const isOnboardingComplete = Boolean(matchedProfile?.onboarding_complete);
      const isSuspended = entry.suspended === true;
      
      const profileIdForFee = matchedProfile?.id || entry.profile_id;
      const feeStatusObj = profileIdForFee ? feeMap[profileIdForFee] : null;
      const feeStatus = feeStatusObj?.status || 'unpaid';
      
      const isStudent = effectiveRole === 'student';
      const isPendingAccount = isStudent ? (!hasProfile || !isOnboardingComplete) : false;
      const isPendingPayment = isStudent ? (!isPendingAccount && feeStatus !== 'paid') : false;
      const isActive = isStudent ? (!isPendingAccount && !isPendingPayment && !isSuspended) : !isSuspended;

      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'suspended' && !isSuspended) return false;
      if (statusFilter === 'pending_account' && !isPendingAccount) return false;
      if (statusFilter === 'pending_payment' && !isPendingPayment) return false;

      return true;
    });
  }, [roster, activeSection, searchTerm, statusFilter, profilesMap, feeMap]);

  const adminCount = useMemo(() => roster.filter(r => (profilesMap[r.id]?.role || r.role || '').trim().toLowerCase() === 'admin').length, [roster, profilesMap]);
  const studentCount = useMemo(() => roster.filter(r => (profilesMap[r.id]?.role || r.role || '').trim().toLowerCase() === 'student').length, [roster, profilesMap]);
  const teacherCount = useMemo(() => roster.filter(r => (profilesMap[r.id]?.role || r.role || '').trim().toLowerCase() === 'teacher').length, [roster, profilesMap]);

  const fbiseOfferings = useMemo(() => {
    return offerings
      .filter(o => (o.board_id || o.board || o.class?.board_id || o.class?.board?.id || '').toLowerCase() === 'fbise')
      .sort((a, b) => {
        const aGrade = parseInt(String(a.grade || a.class?.grade || '99'), 10);
        const bGrade = parseInt(String(b.grade || b.class?.grade || '99'), 10);
        if (aGrade !== bGrade) return aGrade - bGrade;
        return (a.subject_name || '').localeCompare(b.subject_name || '');
      });
  }, [offerings]);

  const sindhOfferings = useMemo(() => {
    return offerings
      .filter(o => (o.board_id || o.board || o.class?.board_id || o.class?.board?.id || '').toLowerCase() === 'sindh')
      .sort((a, b) => {
        const aGrade = parseInt(String(a.grade || a.class?.grade || '99'), 10);
        const bGrade = parseInt(String(b.grade || b.class?.grade || '99'), 10);
        if (aGrade !== bGrade) return aGrade - bGrade;
        return (a.subject_name || '').localeCompare(b.subject_name || '');
      });
  }, [offerings]);

  const ieltsOfferings = useMemo(() => {
    return offerings
      .filter(o => {
        const b = (o.board_id || o.board || o.class?.board_id || o.class?.board?.id || '').toLowerCase();
        return b === 'ielts' || (o.subject_name || '').toLowerCase().includes('ielts');
      })
      .sort((a, b) => (a.subject_name || '').localeCompare(b.subject_name || ''));
  }, [offerings]);

  const otherOfferings = useMemo(() => {
    return offerings
      .filter(o => {
        const bId = (o.board_id || o.board || o.class?.board_id || o.class?.board?.id || '').toLowerCase();
        return bId !== 'fbise' && bId !== 'sindh' && bId !== 'ielts' && !(o.subject_name || '').toLowerCase().includes('ielts');
      })
      .sort((a, b) => {
        const aGrade = parseInt(String(a.grade || a.class?.grade || '99'), 10);
        const bGrade = parseInt(String(b.grade || b.class?.grade || '99'), 10);
        if (aGrade !== bGrade) return aGrade - bGrade;
        return (a.subject_name || '').localeCompare(b.subject_name || '');
      });
  }, [offerings]);

  const availableClassesForEdit = useMemo(() => {
    return classesList
      .filter(c => (c.board_id || '').toLowerCase() === editStudentBoard)
      .sort((a, b) => parseInt(a.grade || '0', 10) - parseInt(b.grade || '0', 10));
  }, [classesList, editStudentBoard]);

  const availableStreamsForEdit = useMemo(() => {
    if (!editStudentClass) return [];
    return streamsList.filter(s => s.class_id === editStudentClass);
  }, [streamsList, editStudentClass]);

  return (
    <AdminShell>
      <SectionHeader
        title="Platform Roster Management"
        description="Manage user accounts cleanly separated into three sections: Admins, Students, and Teachers. Suspend or remove accounts with safe cascading cleanup."
      />

      {/* ── Statistics Overview Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div 
          onClick={() => setActiveSection('admins')}
          className={`stat-card cursor-pointer transition-all border-2 p-4 flex flex-col justify-between ${activeSection === 'admins' ? 'border-red-500 bg-red-50/20 shadow-md' : 'border-[#E5E5E5] bg-white hover:border-red-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
              <Shield size={16} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Protected</span>
          </div>
          <div className="stat-value text-red-600 text-2xl font-black">{adminCount}</div>
          <div className="stat-label font-bold text-xs">Administrators</div>
        </div>

        <div 
          onClick={() => setActiveSection('students')}
          className={`stat-card cursor-pointer transition-all border-2 p-4 flex flex-col justify-between ${activeSection === 'students' ? 'border-indigo-500 bg-indigo-50/20 shadow-md' : 'border-[#E5E5E5] bg-white hover:border-indigo-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Enrolled</span>
          </div>
          <div className="stat-value text-indigo-600 text-2xl font-black">{studentCount}</div>
          <div className="stat-label font-bold text-xs">Students</div>
        </div>

        <div 
          onClick={() => setActiveSection('teachers')}
          className={`stat-card cursor-pointer transition-all border-2 p-4 flex flex-col justify-between ${activeSection === 'teachers' ? 'border-purple-500 bg-purple-50/20 shadow-md' : 'border-[#E5E5E5] bg-white hover:border-purple-300'}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
              <BookOpen size={16} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Faculty</span>
          </div>
          <div className="stat-value text-purple-600 text-2xl font-black">{teacherCount}</div>
          <div className="stat-label font-bold text-xs">Teachers</div>
        </div>

        <div className="stat-card bg-white border border-[#E5E5E5] p-4 flex flex-col justify-between interactive">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Users size={16} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Platform</span>
          </div>
          <div className="stat-value text-emerald-600 text-2xl font-black">{roster.length}</div>
          <div className="stat-label font-bold text-xs">Total Roster</div>
        </div>
      </div>

      {/* ── Section Navigation Tabs ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-4 mb-6">
        <div className="flex items-center gap-2 bg-[#FAFAFA] p-1 rounded-2xl border border-[#E5E5E5] max-w-full overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            onClick={() => setActiveSection('admins')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSection === 'admins'
                ? 'bg-red-600 text-white shadow-sm'
                : 'text-[#737373] hover:text-[#111111] hover:bg-white'
            }`}
          >
            <Shield size={14} /> Admins ({adminCount})
          </button>
          <button
            onClick={() => setActiveSection('students')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSection === 'students'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#737373] hover:text-[#111111] hover:bg-white'
            }`}
          >
            <GraduationCap size={14} /> Students ({studentCount})
          </button>
          <button
            onClick={() => setActiveSection('teachers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeSection === 'teachers'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-[#737373] hover:text-[#111111] hover:bg-white'
            }`}
          >
            <BookOpen size={14} /> Teachers ({teacherCount})
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {activeSection === 'teachers' && (
            <button
              onClick={openAddTeacher}
              className="btn bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all w-full sm:w-auto interactive"
            >
              <UserPlus size={14} /> Provision Teacher
            </button>
          )}
        </div>
      </div>

      {/* ── Search & Filters Bar ── */}
      <div className="card bg-white border border-[#E5E5E5] p-4 flex flex-col md:flex-row items-center justify-between gap-4 mb-6 rounded-2xl shadow-sm interactive">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder={`Search ${activeSection} by name, email, or ID...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 py-2.5 text-xs w-full bg-[#FAFAFA] border-[#E5E5E5] rounded-xl font-medium focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-[#F5F5F5] pt-3 md:pt-0">
          <span className="text-xs font-bold text-[#737373] uppercase tracking-wider">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input py-2 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-xl font-semibold text-[#111111] cursor-pointer flex-1 md:flex-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active (Paid & Verified)</option>
            <option value="suspended">Suspended Accounts</option>
            <option value="pending_account">Pending Registration</option>
            <option value="pending_payment">Pending Payment</option>
          </select>
        </div>
      </div>

      {/* ── Table Section Display ── */}
      <div className={isMobile ? "" : "card bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden shadow-sm"}>
        {loading ? (
          <div className="flex items-center justify-center p-16 text-[#737373] text-xs font-bold">
            <Clock size={16} className="animate-spin mr-2 text-[#111111]" /> Syncing {activeSection} directory...
          </div>
        ) : filteredRoster.length === 0 ? (
          <div className="text-center p-16 text-[#737373] text-xs font-medium">
            No {activeSection} found matching current filter or search parameters.
          </div>
        ) : isMobile ? (
          <div className="space-y-4 p-1 bg-transparent">
            {filteredRoster.map((entry) => {
              const matchedProfile = (entry.profile_id && profilesMap[entry.profile_id]) ||
                profilesMap[entry.id] ||
                (entry.email ? Object.values(profilesMap).find((p: any) => (p.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);
              const hasProfile = Boolean(matchedProfile || entry.profile_id);
              const isOnboardingComplete = Boolean(matchedProfile?.onboarding_complete);
              const isSuspended = entry.suspended === true;
              const profileIdForFee = matchedProfile?.id || entry.profile_id;
              const feeStatusVal = profileIdForFee ? (feeMap[profileIdForFee]?.status || 'unpaid') : 'unpaid';
              const isStudent = (matchedProfile?.role || entry.role || 'student').trim().toLowerCase() === 'student';
              const isPendingAccount = isStudent ? (!hasProfile || !isOnboardingComplete) : false;
              const isPendingPayment = isStudent ? (!isPendingAccount && feeStatusVal !== 'paid') : false;
              const isActive = isStudent ? (!isPendingAccount && !isPendingPayment && !isSuspended) : !isSuspended;
              const idShort = (entry.id || entry.profile_id || '').slice(0, 8);

              return (
                <div key={entry.id} className="bg-white rounded-2xl border border-[#E5E5E5] p-3 shadow-sm flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-[#111111] text-sm flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{entry.full_name}</span>
                        {entry.role === 'admin' && (
                          <span className="bg-red-100 text-red-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-red-200 shrink-0">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[#737373] text-[11px] font-medium mt-0.5 truncate">{entry.email}</div>
                    </div>
                    {/* Access Status Badge */}
                    <div className="shrink-0">
                      {isSuspended ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                          <Lock size={10} /> Suspended
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                          <UserCheck size={10} /> Active
                        </span>
                      ) : feeStatusVal === 'pending' ? (
                        <span className="inline-flex items-center gap-1 font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                          <Clock size={10} /> Verifying
                        </span>
                      ) : isPendingPayment ? (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                          <DollarSign size={10} /> Unpaid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
                          <Clock size={10} /> Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {activeSection === 'students' && (
                    <div className="grid grid-cols-2 gap-3 text-xs bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
                      <div>
                        <div className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mb-0.5">Phone</div>
                        <div className="font-semibold text-[#404040]">{getPhone(entry)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mb-0.5">Class</div>
                        <div className="font-semibold text-[#111111]">{getClassGrade(entry)}</div>
                      </div>
                      <div className="col-span-2 flex items-center justify-between mt-1">
                        <div>
                          <div className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mb-0.5">Stream</div>
                          <div className="font-semibold text-[#404040]">{getStream(entry)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mb-0.5">ID</div>
                          <div className="font-mono font-bold text-[#525252] flex items-center gap-1">
                            #{idShort}
                            <button onClick={() => copyToClipboard(entry.id)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                              {copiedId === entry.id ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSection === 'teachers' && (
                    <div className="text-xs text-[#525252] bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
                      {formatClasses(entry)}
                    </div>
                  )}

                  {activeSection !== 'admins' && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[#F0F0F0]">
                      {activeSection === 'students' && (
                        <button
                          onClick={() => openEditStudent(entry)}
                          className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-xl text-zinc-700 font-bold text-xs inline-flex items-center justify-center gap-1.5 transition-all"
                          title="Edit student profile"
                        >
                          <Edit size={12} /> Edit
                        </button>
                      )}

                      <button
                        disabled={processingIds[entry.id]}
                        onClick={() => handleToggleAccess(entry)}
                        className={`flex-1 min-w-[90px] py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
                          isSuspended 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                        } disabled:opacity-50`}
                      >
                        {processingIds[entry.id] ? (
                          <Clock size={12} className="animate-spin" />
                        ) : isSuspended ? (
                          <><Unlock size={12} /> Restore</>
                        ) : (
                          <><Lock size={12} /> Suspend</>
                        )}
                      </button>

                      {activeSection === 'students' && (
                        <button
                          disabled={processingIds[entry.id]}
                          onClick={() => handleToggleFeeAccess(entry)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1 transition-all ${
                            entry.fee_suspended
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          } disabled:opacity-50`}
                        >
                          {entry.fee_suspended ? <Unlock size={12} /> : <DollarSign size={12} />}
                        </button>
                      )}

                      {activeSection === 'teachers' && (
                        <button
                          onClick={() => openEdit(entry)}
                          className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 rounded-xl text-zinc-700 font-bold inline-flex items-center justify-center"
                        >
                          <Edit size={12} />
                        </button>
                      )}

                      {activeSection === 'students' && feeStatusVal === 'pending' && (
                        <button
                          onClick={() => handleApprovePayment(profileIdForFee, entry.id)}
                          disabled={processingIds[entry.id]}
                          className="px-3 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-700 hover:text-purple-800 font-bold text-xs inline-flex items-center justify-center disabled:opacity-50"
                        >
                          {processingIds[entry.id] ? <Clock size={12} className="animate-spin" /> : <Check size={12} />}
                        </button>
                      )}

                      <button
                        onClick={() => triggerDelete(entry)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 font-bold text-xs inline-flex items-center justify-center"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                  {activeSection === 'students' && (
                    <th className="p-4 text-xs font-black text-[#737373] uppercase tracking-wider hidden md:table-cell">ID</th>
                  )}
                  <th className="p-4 text-xs font-black text-[#737373] uppercase tracking-wider">Name & Email</th>
                  {activeSection === 'students' && (
                    <>
                      <th className="p-4 text-xs font-black text-[#737373] uppercase tracking-wider hidden lg:table-cell">Phone</th>
                      <th className="p-4 text-xs font-black text-[#737373] uppercase tracking-wider">Class (Grade)</th>
                      <th className="p-4 text-xs font-black text-[#737373] uppercase tracking-wider hidden sm:table-cell">Stream</th>
                    </>
                  )}
                  {activeSection === 'teachers' && (
                    <th className="p-4 text-xs font-black text-[#737373] uppercase tracking-wider">Assigned Classes / Schedule Offerings</th>
                  )}
                  {activeSection === 'admins' && (
                    <th className="p-4 text-xs font-black text-[#737373] uppercase tracking-wider">Role & Privileges</th>
                  )}
                  <th className="p-4 text-xs font-black text-[#737373] uppercase tracking-wider">Access Status</th>
                  <th className="p-4 text-xs font-black text-[#737373] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F0F0]">
                {filteredRoster.map((entry) => {
                  const matchedProfile = (entry.profile_id && profilesMap[entry.profile_id]) ||
                    profilesMap[entry.id] ||
                    (entry.email ? Object.values(profilesMap).find((p: any) => (p.email || '').toLowerCase() === (entry.email || '').toLowerCase()) : null);
                  const hasProfile = Boolean(matchedProfile || entry.profile_id);
                  const isOnboardingComplete = Boolean(matchedProfile?.onboarding_complete);
                  const isSuspended = entry.suspended === true;
                  const profileIdForFee = matchedProfile?.id || entry.profile_id;
                  const feeStatusVal = profileIdForFee ? (feeMap[profileIdForFee]?.status || 'unpaid') : 'unpaid';
                  const isStudent = (matchedProfile?.role || entry.role || 'student').trim().toLowerCase() === 'student';
                  const isPendingAccount = isStudent ? (!hasProfile || !isOnboardingComplete) : false;
                  const isPendingPayment = isStudent ? (!isPendingAccount && feeStatusVal !== 'paid') : false;
                  const isActive = isStudent ? (!isPendingAccount && !isPendingPayment && !isSuspended) : !isSuspended;
                  const idShort = (entry.id || entry.profile_id || '').slice(0, 8);

                  return (
                    <tr key={entry.id} className="hover:bg-[#FAFAFA]/70 transition-colors">
                      {activeSection === 'students' && (
                        <td className="p-4 text-xs font-mono font-bold text-[#525252] hidden md:table-cell">
                          <div className="flex items-center gap-1.5 group">
                            <span>#{idShort}</span>
                            <button
                              onClick={() => copyToClipboard(entry.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-100 rounded text-zinc-400 hover:text-zinc-700"
                              title="Copy Full ID"
                            >
                              {copiedId === entry.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                      )}

                      <td className="p-4 text-xs">
                        <div className="font-bold text-[#111111] text-sm flex items-center gap-2">
                          {entry.full_name}
                          {entry.role === 'admin' && (
                            <span className="bg-red-100 text-red-700 text-[9px] font-black uppercase px-2 py-0.5 rounded-md border border-red-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="text-[#737373] text-[11px] font-medium mt-0.5">{entry.email}</div>

                      </td>

                      {activeSection === 'students' && (
                        <>
                          <td className="p-4 text-xs font-semibold text-[#404040] hidden lg:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Phone size={13} className="text-[#A3A3A3] shrink-0" />
                              <span>{getPhone(entry)}</span>
                            </div>
                          </td>
                          <td className="p-4 text-xs font-bold text-[#111111]">
                            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-lg text-[11px]">
                              {getClassGrade(entry)}
                            </span>
                          </td>
                          <td className="p-4 text-xs font-bold text-[#404040] hidden sm:table-cell">
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg text-[11px]">
                              {getStream(entry)}
                            </span>
                          </td>
                        </>
                      )}

                      {activeSection === 'teachers' && (
                        <td className="p-4 text-xs max-w-md">
                          {formatClasses(entry)}
                        </td>
                      )}

                      {activeSection === 'admins' && (
                        <td className="p-4 text-xs">
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-xl text-xs font-bold">
                            <Shield size={13} /> System Administrator
                          </span>
                        </td>
                      )}

                      <td className="p-4 text-xs">
                        {entry.awaiting_termination && (
                          <div className="mb-1.5">
                            <span className="inline-flex items-center gap-1.5 font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide">
                              <ShieldAlert size={11} /> Termination Requested
                            </span>
                          </div>
                        )}
                        {entry.fee_suspended && (
                          <div className="mb-1.5">
                            <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide">
                              <DollarSign size={11} /> Billing Locked
                            </span>
                          </div>
                        )}
                        {isSuspended ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide">
                            <Lock size={11} /> Suspended
                          </span>
                        ) : isActive ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide">
                            <UserCheck size={11} /> Active
                          </span>
                        ) : feeStatusVal === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide">
                            <Clock size={11} /> Awaiting Verification
                          </span>
                        ) : isPendingPayment ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide">
                            <DollarSign size={11} /> Pending Payment
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-bold text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide">
                            <Clock size={11} /> Pending Registration
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-xs text-right space-x-2">
                        {activeSection === 'admins' ? (
                          <span className="text-[11px] font-bold text-[#A3A3A3] italic inline-flex items-center gap-1 bg-[#F5F5F5] px-2.5 py-1 rounded-lg border border-[#E5E5E5]">
                            <Lock size={11} /> Protected Admin
                          </span>
                        ) : (
                          <>
                            {activeSection === 'teachers' && (
                              <button
                                onClick={() => openEdit(entry)}
                                className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-500 hover:text-[#111111] inline-flex items-center justify-center transition-colors"
                                title="Edit assigned schedule offerings"
                              >
                                <Edit size={14} />
                              </button>
                            )}

                            <button
                              onClick={() => handleToggleAccess(entry)}
                              disabled={processingIds[entry.id]}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                                isSuspended 
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                              } disabled:opacity-50`}
                              title={isSuspended ? "Restore access (Reversible)" : "Suspend access (Reversible — blocks access while preserving records)"}
                            >
                              {processingIds[entry.id] ? (
                                <Clock size={13} className="animate-spin" />
                              ) : isSuspended ? (
                                <>
                                  <Unlock size={13} /> Restore
                                </>
                              ) : (
                                <>
                                  <Lock size={13} /> Suspend
                                </>
                              )}
                            </button>

                            {activeSection === 'students' && (
                              <>
                                <button
                                  onClick={() => openEditStudent(entry)}
                                  className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-xl text-zinc-700 hover:text-zinc-900 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                                  title="Edit student profile details"
                                >
                                  <Edit size={13} /> Edit
                                </button>

                                {feeStatusVal === 'pending' && (
                                  <button
                                    onClick={() => handleApprovePayment(profileIdForFee, entry.id)}
                                    disabled={processingIds[entry.id]}
                                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-700 hover:text-purple-800 font-bold text-xs inline-flex items-center gap-1.5 transition-all disabled:opacity-50"
                                    title="Student has submitted proof — approve and mark as paid"
                                  >
                                    {processingIds[entry.id] ? <Clock size={13} className="animate-spin" /> : <Check size={13} />} Approve Payment
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleFeeAccess(entry)}
                                  disabled={processingIds[entry.id]}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                                    entry.fee_suspended 
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  } disabled:opacity-50`}
                                  title={entry.fee_suspended ? "Remove Billing Lock" : "Apply Billing Lock"}
                                >
                                  {processingIds[entry.id] ? (
                                    <Clock size={13} className="animate-spin" />
                                  ) : entry.fee_suspended ? (
                                    <>
                                      <Unlock size={13} /> Unlock Billing
                                    </>
                                  ) : (
                                    <>
                                      <DollarSign size={13} /> Lock Billing
                                    </>
                                  )}
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => triggerDelete(entry)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 hover:text-red-700 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                              title="Delete account completely without leaving orphaned records"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DRAWER FORM (Add/Edit Student or Teacher) ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative w-full max-w-lg sm:max-w-xl bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA]">
              <div>
                <h3 className="text-base font-black text-[#111111]">
                  {drawerMode === 'add_teacher' && 'Provision New Teacher'}
                  {drawerMode === 'edit' && `Edit Classes — ${selectedEntry?.full_name}`}
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  {drawerMode !== 'edit' ? 'Create a pre-provisioned account by email and name.' : 'Update assigned schedule offerings across Federal and Sindh boards.'}
                </p>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-6">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              {drawerMode !== 'edit' && (
                <div className="space-y-4 pb-2 border-b border-[#E5E5E5]">
                  <div>
                    <label className="label text-xs font-bold text-[#404040] mb-1.5 block uppercase tracking-wider">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. teacher@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input w-full text-xs py-3 sm:py-2.5 bg-[#FAFAFA] border-[#E5E5E5] rounded-xl font-medium"
                    />
                    <span className="text-[10px] text-[#737373] font-medium block mt-1">
                      Must match exact email user selects during Google Sign-In.
                    </span>
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-[#404040] mb-1.5 block uppercase tracking-wider">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mr. Ahmed Khan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input w-full text-xs py-3 sm:py-2.5 bg-[#FAFAFA] border-[#E5E5E5] rounded-xl font-medium"
                    />
                  </div>
                </div>
              )}

              {drawerMode === 'add_teacher' || (drawerMode === 'edit' && selectedEntry?.role === 'teacher') ? (
                <div className="space-y-6">
                  {/* Summary Bar */}
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-purple-50/80 border border-purple-200/70 text-purple-900 text-xs font-semibold">
                    <span className="flex items-center gap-1.5 font-bold">
                      <BookOpen size={15} className="text-purple-600 shrink-0" />
                      Assigned Offerings Selected:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-700 text-white font-black text-xs shadow-sm">
                      {selectedClasses.length} total
                    </span>
                  </div>

                  {/* ── SECTION 1: Federal Board (FBISE) ── */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0" />
                        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">
                          Federal Board (FBISE)
                        </h4>
                        <span className="text-[10px] font-bold text-[#737373] bg-[#EBEBEB] px-2 py-0.5 rounded-md">
                          {fbiseOfferings.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedClasses.filter(id => fbiseOfferings.some(o => o.id === id)).length > 0 && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
                            {selectedClasses.filter(id => fbiseOfferings.some(o => o.id === id)).length} selected
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const fbiseIds = fbiseOfferings.map(o => o.id);
                            const allSelected = fbiseIds.length > 0 && fbiseIds.every(id => selectedClasses.includes(id));
                            if (allSelected) {
                              setSelectedClasses(prev => prev.filter(id => !fbiseIds.includes(id)));
                            } else {
                              setSelectedClasses(prev => Array.from(new Set([...prev, ...fbiseIds])));
                            }
                          }}
                          className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 underline transition-colors"
                        >
                          {fbiseOfferings.length > 0 && fbiseOfferings.every(o => selectedClasses.includes(o.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>

                    <div className="border border-[#E5E5E5] rounded-2xl max-h-56 overflow-y-auto divide-y divide-[#F0F0F0] bg-[#FAFAFA]/50 shadow-inner">
                      {fbiseOfferings.length === 0 ? (
                        <div className="p-4 text-xs text-[#737373] text-center">No Federal Board offerings found.</div>
                      ) : (
                        fbiseOfferings.map(off => {
                          const isChecked = selectedClasses.includes(off.id);
                          const isAssignedToThisTeacher = selectedEntry && (
                            off.teacher_id === selectedEntry.id || 
                            off.teacher_id === selectedEntry.profile_id || 
                            off.teacher?.id === selectedEntry.id || 
                            off.teacher?.id === selectedEntry.profile_id
                          );
                          return (
                            <label 
                              key={off.id}
                              className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-white transition-colors ${isChecked ? 'bg-purple-50/70 font-semibold' : ''}`}
                            >
                              <div className="pr-3">
                                <div className="text-xs font-bold text-[#111111] flex items-center gap-1.5 flex-wrap">
                                  <span>{off.subject_name} — Gr. {off.grade}</span>
                                  {off.stream && (
                                    <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-200/70 px-1.5 py-0.5 rounded">
                                      {off.stream}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] mt-0.5">
                                  {off.teacher ? (
                                    <span className={isAssignedToThisTeacher ? 'text-emerald-700 font-bold' : 'text-zinc-600'}>
                                      Current Teacher: <span className="font-bold text-zinc-800">{off.teacher.full_name}</span>
                                      {isAssignedToThisTeacher && ' (Assigned)'}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400">Current Teacher: <span className="italic text-zinc-500 font-medium">Unassigned</span></span>
                                  )}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleClassSelect(off.id)}
                                className="rounded border-[#D4D4D4] text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer shrink-0"
                              />
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* ── SECTION 2: Sindh Board ── */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-100 shrink-0" />
                        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">
                          Sindh Board
                        </h4>
                        <span className="text-[10px] font-bold text-[#737373] bg-[#EBEBEB] px-2 py-0.5 rounded-md">
                          {sindhOfferings.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedClasses.filter(id => sindhOfferings.some(o => o.id === id)).length > 0 && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md">
                            {selectedClasses.filter(id => sindhOfferings.some(o => o.id === id)).length} selected
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const sindhIds = sindhOfferings.map(o => o.id);
                            const allSelected = sindhIds.length > 0 && sindhIds.every(id => selectedClasses.includes(id));
                            if (allSelected) {
                              setSelectedClasses(prev => prev.filter(id => !sindhIds.includes(id)));
                            } else {
                              setSelectedClasses(prev => Array.from(new Set([...prev, ...sindhIds])));
                            }
                          }}
                          className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 underline transition-colors"
                        >
                          {sindhOfferings.length > 0 && sindhOfferings.every(o => selectedClasses.includes(o.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>

                    <div className="border border-[#E5E5E5] rounded-2xl max-h-56 overflow-y-auto divide-y divide-[#F0F0F0] bg-[#FAFAFA]/50 shadow-inner">
                      {sindhOfferings.length === 0 ? (
                        <div className="p-4 text-xs text-[#737373] text-center">No Sindh Board offerings found.</div>
                      ) : (
                        sindhOfferings.map(off => {
                          const isChecked = selectedClasses.includes(off.id);
                          const isAssignedToThisTeacher = selectedEntry && (
                            off.teacher_id === selectedEntry.id || 
                            off.teacher_id === selectedEntry.profile_id || 
                            off.teacher?.id === selectedEntry.id || 
                            off.teacher?.id === selectedEntry.profile_id
                          );
                          return (
                            <label 
                              key={off.id}
                              className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-white transition-colors ${isChecked ? 'bg-purple-50/70 font-semibold' : ''}`}
                            >
                              <div className="pr-3">
                                <div className="text-xs font-bold text-[#111111] flex items-center gap-1.5 flex-wrap">
                                  <span>{off.subject_name} — Gr. {off.grade}</span>
                                  {off.stream && (
                                    <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-200/70 px-1.5 py-0.5 rounded">
                                      {off.stream}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] mt-0.5">
                                  {off.teacher ? (
                                    <span className={isAssignedToThisTeacher ? 'text-emerald-700 font-bold' : 'text-zinc-600'}>
                                      Current Teacher: <span className="font-bold text-zinc-800">{off.teacher.full_name}</span>
                                      {isAssignedToThisTeacher && ' (Assigned)'}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400">Current Teacher: <span className="italic text-zinc-500 font-medium">Unassigned</span></span>
                                  )}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleClassSelect(off.id)}
                                className="rounded border-[#D4D4D4] text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer shrink-0"
                              />
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* ── SECTION 3: IELTS (Academic & General Training) ── */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between pb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100 shrink-0" />
                        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">
                          IELTS (International English)
                        </h4>
                        <span className="text-[10px] font-bold text-[#737373] bg-[#EBEBEB] px-2 py-0.5 rounded-md">
                          {ieltsOfferings.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedClasses.filter(id => ieltsOfferings.some(o => o.id === id)).length > 0 && (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md">
                            {selectedClasses.filter(id => ieltsOfferings.some(o => o.id === id)).length} selected
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const ieltsIds = ieltsOfferings.map(o => o.id);
                            const allSelected = ieltsIds.length > 0 && ieltsIds.every(id => selectedClasses.includes(id));
                            if (allSelected) {
                              setSelectedClasses(prev => prev.filter(id => !ieltsIds.includes(id)));
                            } else {
                              setSelectedClasses(prev => Array.from(new Set([...prev, ...ieltsIds])));
                            }
                          }}
                          className="text-[11px] font-bold text-zinc-600 hover:text-zinc-900 underline transition-colors"
                        >
                          {ieltsOfferings.length > 0 && ieltsOfferings.every(o => selectedClasses.includes(o.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                    </div>

                    <div className="border border-[#E5E5E5] rounded-2xl max-h-56 overflow-y-auto divide-y divide-[#F0F0F0] bg-[#FAFAFA]/50 shadow-inner">
                      {ieltsOfferings.length === 0 ? (
                        <div className="p-4 text-xs text-[#737373] text-center">No IELTS offerings found.</div>
                      ) : (
                        ieltsOfferings.map(off => {
                          const isChecked = selectedClasses.includes(off.id);
                          const isAssignedToThisTeacher = selectedEntry && (
                            off.teacher_id === selectedEntry.id || 
                            off.teacher_id === selectedEntry.profile_id || 
                            off.teacher?.id === selectedEntry.id || 
                            off.teacher?.id === selectedEntry.profile_id
                          );
                          return (
                            <label 
                              key={off.id}
                              className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-white transition-colors ${isChecked ? 'bg-amber-50/70 font-semibold' : ''}`}
                            >
                              <div className="pr-3">
                                <div className="text-xs font-bold text-[#111111] flex items-center gap-1.5 flex-wrap">
                                  <span>{off.subject_name}</span>
                                  {off.stream && (
                                    <span className="text-[9px] font-semibold text-zinc-500 bg-zinc-200/70 px-1.5 py-0.5 rounded">
                                      {off.stream}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] mt-0.5">
                                  {off.teacher ? (
                                    <span className={isAssignedToThisTeacher ? 'text-emerald-700 font-bold' : 'text-zinc-600'}>
                                      Current Teacher: <span className="font-bold text-zinc-800">{off.teacher.full_name}</span>
                                      {isAssignedToThisTeacher && ' (Assigned)'}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400">Current Teacher: <span className="italic text-zinc-500 font-medium">Unassigned</span></span>
                                  )}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleClassSelect(off.id)}
                                className="rounded border-[#D4D4D4] text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer shrink-0"
                              />
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Optional Fallback for any other boards */}
                  {otherOfferings.length > 0 && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between pb-1">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 ring-4 ring-zinc-100 shrink-0" />
                          <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">
                            Other Board Offerings
                          </h4>
                          <span className="text-[10px] font-bold text-[#737373] bg-[#EBEBEB] px-2 py-0.5 rounded-md">
                            {otherOfferings.length}
                          </span>
                        </div>
                      </div>

                      <div className="border border-[#E5E5E5] rounded-2xl max-h-48 overflow-y-auto divide-y divide-[#F0F0F0] bg-[#FAFAFA]/50 shadow-inner">
                        {otherOfferings.map(off => {
                          const isChecked = selectedClasses.includes(off.id);
                          return (
                            <label 
                              key={off.id}
                              className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-white transition-colors ${isChecked ? 'bg-purple-50/70 font-semibold' : ''}`}
                            >
                              <div className="pr-3">
                                <div className="text-xs font-bold text-[#111111]">
                                  {off.subject_name} — Gr. {off.grade}
                                </div>
                                <div className="text-[11px] text-[#737373] mt-0.5">
                                  Current Teacher: {off.teacher?.full_name || 'Unassigned'}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleClassSelect(off.id)}
                                className="rounded border-[#D4D4D4] text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer shrink-0"
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="pt-6 border-t border-[#E5E5E5] flex gap-3">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="btn flex-1 py-3 sm:py-2.5 border border-[#E5E5E5] text-[#404040] font-bold text-xs rounded-xl hover:bg-[#FAFAFA] interactive"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="btn flex-1 py-3 sm:py-2.5 bg-[#111111] hover:bg-[#262626] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 interactive"
                >
                  {formSaving ? <Clock size={14} className="animate-spin" /> : <Save size={14} />}
                  {drawerMode === 'edit' ? 'Save Assignments' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT STUDENT PROFILE MODAL ── */}
      {editStudentModalOpen && editStudentEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col my-8">
            {/* Header */}
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Edit Student Profile</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Update profile information, board, class grade, and stream</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditStudentModalOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveStudentProfile} className="p-6 space-y-5">
              {editStudentError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{editStudentError}</span>
                </div>
              )}

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editStudentName}
                  onChange={(e) => setEditStudentName(e.target.value)}
                  className="input w-full py-2.5 px-3.5 text-xs bg-zinc-50 border-zinc-200 rounded-xl font-medium focus:bg-white focus:border-purple-500"
                  placeholder="e.g. Ayesha Khan"
                />
              </div>

              {/* Email (Read-Only / Auth Account Identifier) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Email Address
                  </label>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                    <Lock size={11} className="text-zinc-500" />
                    <span>Locked (Login ID)</span>
                  </span>
                </div>
                <div className="w-full py-2.5 px-3.5 text-xs bg-zinc-100/90 border border-zinc-200 rounded-xl font-medium text-zinc-700 flex items-center justify-between cursor-not-allowed select-text">
                  <span className="font-mono">{editStudentEmail || editStudentEntry.email || 'No email associated'}</span>
                  <Lock size={13} className="text-zinc-400 shrink-0" />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
                  <span>Tied to student Google Sign-In auth account and cannot be modified.</span>
                </p>
              </div>

              {/* Board Selection (Federal / Sindh) */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Academic Board <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleBoardChangeInModal('fbise')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      editStudentBoard === 'fbise'
                        ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20'
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">Federal Board</span>
                      {editStudentBoard === 'fbise' && (
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">FBISE Curriculum</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBoardChangeInModal('sindh')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      editStudentBoard === 'sindh'
                        ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20'
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">Sindh Board</span>
                      {editStudentBoard === 'sindh' && (
                        <CheckCircle2 size={14} className="text-purple-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">BIEK / BSEK Curriculum</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleBoardChangeInModal('ielts')}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      editStudentBoard === 'ielts'
                        ? 'border-amber-600 bg-amber-50/60 ring-2 ring-amber-600/20'
                        : 'border-zinc-200 bg-zinc-50/50 hover:bg-zinc-100/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">IELTS</span>
                      {editStudentBoard === 'ielts' && (
                        <CheckCircle2 size={14} className="text-amber-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">International English</span>
                  </button>
                </div>
              </div>

              {/* Class / Grade Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Class / Grade Level <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableClassesForEdit.map((c) => {
                    const isSelected = editStudentClass === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => handleClassChangeInModal(c.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-purple-600 bg-purple-600 text-white font-bold shadow-sm'
                            : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 font-semibold'
                        }`}
                      >
                        <div className="text-xs">{c.display_name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stream Selection */}
              <div>
                <label className="block text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">
                  Academic Stream <span className="text-red-500">*</span>
                </label>
                {availableStreamsForEdit.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {availableStreamsForEdit.map((s) => {
                      const isSelected = editStudentStreamId === s.id;
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => setEditStudentStreamId(s.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all ${
                            isSelected
                              ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold ring-1 ring-purple-600/30'
                              : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-medium'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs">{s.name}</span>
                            {isSelected && <Check size={12} className="text-purple-600" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-500">
                    General Stream (Core curriculum subjects assigned automatically)
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-zinc-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditStudentModalOpen(false)}
                  className="btn flex-1 py-2.5 border border-zinc-200 text-zinc-700 font-bold text-xs rounded-xl hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editStudentSaving}
                  className="btn flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 transition-all"
                >
                  {editStudentSaving ? <Clock size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteModalOpen}
        title={`Permanently Delete ${entryToDelete?.role === 'teacher' ? 'Teacher' : 'Student'} Account?`}
        description={`Are you sure you want to delete ${entryToDelete?.full_name} (${entryToDelete?.email})? This action will permanently purge their profile, registration records, fee status, attendance logs, and class assignments. All linked records will be cleanly removed without leaving orphaned data.`}
        confirmLabel="Yes, Permanently Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmDelete}
        onClose={() => {
          setDeleteModalOpen(false);
          setEntryToDelete(null);
        }}
      />
    </AdminShell>
  );
};

export default RosterManagerPage;
