import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Users, Shield, Trash2, Edit, 
  Clock, X, UserCheck, Lock, Unlock, Phone, GraduationCap, 
  BookOpen, Copy, Check, UserPlus, Save, ShieldAlert, DollarSign
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { 
  getAllRoster, addRosterEntry, updateRosterEntry, 
  deleteRosterEntry, getAllOfferings, toggleRosterAccess, toggleFeeSuspension, updateFeeStatus
} from '../../lib/db';
import { supabase } from '../../lib/supabase';
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
  const [teachersMap, setTeachersMap] = useState<Record<string, any>>({});
  const [feeMap, setFeeMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Tab section
  const [activeSection, setActiveSection] = useState<'admins' | 'students' | 'teachers'>('admins');

  // Filters/Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'pending_account' | 'pending_payment'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add_student' | 'add_teacher' | 'edit'>('add_student');
  const [selectedEntry, setSelectedEntry] = useState<RosterEntry | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<RosterEntry | null>(null);

  const fetchEnrichmentData = async () => {
    try {
      const [profilesRes, classesRes, streamsRes, teachersRes, feesRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('streams').select('*'),
        supabase.from('teachers').select('*'),
        supabase.from('fee_statuses').select('*')
      ]);

      const pMap: Record<string, any> = {};
      (profilesRes.data as any[] || []).forEach(p => { pMap[p.id] = p; });
      setProfilesMap(pMap);

      const cMap: Record<string, any> = {};
      (classesRes.data as any[] || []).forEach(c => { cMap[c.id] = c; });
      setClassesMap(cMap);

      const sMap: Record<string, any> = {};
      (streamsRes.data as any[] || []).forEach(s => { sMap[s.id] = s; });
      setStreamsMap(sMap);

      const tMap: Record<string, any> = {};
      (teachersRes.data as any[] || []).forEach(t => { 
        if (t.id) tMap[t.id] = t;
        if (t.email) tMap[t.email.toLowerCase()] = t;
      });
      setTeachersMap(tMap);

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

  // Keep feeMap live: re-fetch enrichment data whenever any student's fee status changes
  useRealtimeTable({
    table: 'fee_statuses',
    onInsert: async () => { await fetchEnrichmentData(); },
    onUpdate: async () => { await fetchEnrichmentData(); },
  });

  const openAddStudent = () => {
    setSelectedEntry(null);
    setEmail('');
    setFullName('');
    setSelectedClass('');
    setFormError(null);
    setDrawerMode('add_student');
    setDrawerOpen(true);
  };

  const openAddTeacher = () => {
    setSelectedEntry(null);
    setEmail('');
    setFullName('');
    setSelectedClasses([]);
    setFormError(null);
    setDrawerMode('add_teacher');
    setDrawerOpen(true);
  };

  const openEdit = (entry: RosterEntry) => {
    setSelectedEntry(entry);
    setEmail(entry.email);
    setFullName(entry.full_name);
    setFormError(null);
    setDrawerMode('edit');
    if (entry.role === 'student') {
      setSelectedClass(entry.class_ids[0] || '');
    } else {
      setSelectedClasses(entry.class_ids);
    }
    setDrawerOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const emailTrim = email.trim().toLowerCase();
    const nameTrim = fullName.trim();

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
        setDrawerOpen(false);
      } else {
        const role = drawerMode === 'add_student' ? 'student' : 'teacher';
        const classesToSave = role === 'student' ? [] : selectedClasses;

        if (roster.some(r => r.email.toLowerCase() === emailTrim)) {
          setFormError('Email is already registered in the roster.');
          setFormSaving(false);
          return;
        }

        const newEntry = await addRosterEntry(emailTrim, nameTrim, role, classesToSave);
        setRoster(prev => [newEntry, ...prev]);
        setDrawerOpen(false);
        await fetchEnrichmentData();
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleToggleAccess = async (entry: RosterEntry) => {
    try {
      const nextSuspendedState = !entry.suspended;
      await toggleRosterAccess(entry.id, nextSuspendedState);
      setRoster(prev => prev.map(r => r.id === entry.id ? { ...r, suspended: nextSuspendedState } : r));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update access status.');
    }
  };

  const handleToggleFeeAccess = async (entry: RosterEntry) => {
    try {
      const nextFeeSuspendedState = !entry.fee_suspended;
      await toggleFeeSuspension(entry.id, nextFeeSuspendedState);
      setRoster(prev => prev.map(r => r.id === entry.id ? { 
        ...r, 
        fee_suspended: nextFeeSuspendedState,
        awaiting_termination: nextFeeSuspendedState ? r.awaiting_termination : false
      } : r));
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update billing access status.');
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
        setDeleteModalOpen(false);
        setEntryToDelete(null);
      } catch (err: any) {
        console.error(err);
        alert(err.message || 'Failed to remove account from system.');
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
    const p = profilesMap[entry.id] || (entry.profile_id ? profilesMap[entry.profile_id] : null);
    const t = teachersMap[entry.id] || (entry.email ? teachersMap[entry.email.toLowerCase()] : null);
    return p?.phone || t?.phone || '—';
  };

  const getClassGrade = (entry: RosterEntry) => {
    const p = profilesMap[entry.id] || (entry.profile_id ? profilesMap[entry.profile_id] : null);
    if (p?.class_id && classesMap[p.class_id]) {
      return classesMap[p.class_id].display_name;
    }
    if (entry.class_ids?.length > 0) {
      const firstOff = offerings.find(o => o.id === entry.class_ids[0]);
      if (firstOff) return `Grade ${firstOff.grade} (${firstOff.subject_name})`;
    }
    return 'Not Assigned';
  };

  const getStream = (entry: RosterEntry) => {
    const p = profilesMap[entry.id] || (entry.profile_id ? profilesMap[entry.profile_id] : null);
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

  const sortedOfferings = useMemo(() => [...offerings].sort((a, b) => {
    const aGrade = parseInt(String(a.grade || '99'), 10);
    const bGrade = parseInt(String(b.grade || '99'), 10);
    if (aGrade !== bGrade) return aGrade - bGrade;
    return (a.subject_name || '').localeCompare(b.subject_name || '');
  }), [offerings]);

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
          {activeSection === 'students' && (
            <button
              onClick={openAddStudent}
              className="btn bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all w-full sm:w-auto interactive"
            >
              <UserPlus size={14} /> Provision Student
            </button>
          )}
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
                    <div className="flex gap-2 pt-2 border-t border-[#F0F0F0]">
                      <button
                        onClick={() => handleToggleAccess(entry)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
                          isSuspended 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isSuspended ? <><Unlock size={12} /> Restore</> : <><Lock size={12} /> Suspend</>}
                      </button>
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
                          onClick={async () => {
                            if (!profileIdForFee) return;
                            try {
                              await updateFeeStatus(profileIdForFee, 'paid', 'Approved via mobile roster.');
                              await fetchEnrichmentData();
                            } catch (err: any) {
                              console.error('Approve payment error:', err);
                            }
                          }}
                          className="px-4 py-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-700 hover:text-purple-800 font-bold text-xs inline-flex items-center justify-center"
                        >
                          <Check size={12} />
                        </button>
                      )}
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
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                                isSuspended 
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                              }`}
                              title={isSuspended ? "Restore access (Reversible)" : "Suspend access (Reversible — blocks access while preserving records)"}
                            >
                              {isSuspended ? (
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
                                {feeStatusVal === 'pending' && (
                                  <button
                                    onClick={async () => {
                                      if (!profileIdForFee) return;
                                      try {
                                        await updateFeeStatus(profileIdForFee, 'paid', 'Payment approved by administrator from Roster Manager.');
                                        await fetchEnrichmentData();
                                      } catch (err: any) {
                                        console.error('Approve payment error:', err);
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-purple-700 hover:text-purple-800 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                                    title="Student has submitted proof — approve and mark as paid"
                                  >
                                    <Check size={13} /> Approve Payment
                                  </button>
                                )}
                                <button
                                  onClick={() => handleToggleFeeAccess(entry)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                                    entry.fee_suspended 
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                  }`}
                                  title={entry.fee_suspended ? "Remove Billing Lock" : "Apply Billing Lock"}
                                >
                                  {entry.fee_suspended ? (
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

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA]">
              <div>
                <h3 className="text-base font-black text-[#111111]">
                  {drawerMode === 'add_student' && 'Provision New Student'}
                  {drawerMode === 'add_teacher' && 'Provision New Teacher'}
                  {drawerMode === 'edit' && `Edit Classes — ${selectedEntry?.full_name}`}
                </h3>
                <p className="text-xs text-[#737373] mt-0.5">
                  {drawerMode !== 'edit' ? 'Create a pre-provisioned account by email and name.' : 'Update assigned schedule offerings.'}
                </p>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 flex-1 overflow-y-auto space-y-5">
              {formError && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{formError}</span>
                </div>
              )}

              {drawerMode !== 'edit' && (
                <>
                  <div>
                    <label className="label text-xs font-bold text-[#404040] mb-1.5 block uppercase tracking-wider">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. student@example.com"
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
                      placeholder="e.g. Ahmed Khan"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input w-full text-xs py-3 sm:py-2.5 bg-[#FAFAFA] border-[#E5E5E5] rounded-xl font-medium"
                    />
                  </div>
                </>
              )}

              {drawerMode === 'add_teacher' || (drawerMode === 'edit' && selectedEntry?.role === 'teacher') ? (
                <div>
                  <label className="label text-xs font-bold text-[#404040] mb-2 block uppercase tracking-wider">
                    Assign Schedule Offerings
                  </label>
                  <div className="border border-[#E5E5E5] rounded-2xl max-h-64 overflow-y-auto divide-y divide-[#F0F0F0] bg-[#FAFAFA]/50">
                    {sortedOfferings.length === 0 ? (
                      <div className="p-4 text-xs text-[#737373] text-center">No class offerings available.</div>
                    ) : (
                      sortedOfferings.map(off => {
                        const isChecked = selectedClasses.includes(off.id);
                        return (
                          <label 
                            key={off.id}
                            className={`flex items-center justify-between p-3.5 cursor-pointer hover:bg-white transition-colors ${isChecked ? 'bg-purple-50/60 font-bold' : ''}`}
                          >
                            <div>
                              <div className="text-xs font-bold text-[#111111]">
                                {off.subject_name} — Gr. {off.grade}
                              </div>
                              <div className="text-[10px] text-[#737373] mt-0.5">
                                Current Teacher: {off.teacher?.full_name || 'Unassigned'}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleClassSelect(off.id)}
                              className="rounded border-[#D4D4D4] text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                            />
                          </label>
                        );
                      })
                    )}
                  </div>
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
