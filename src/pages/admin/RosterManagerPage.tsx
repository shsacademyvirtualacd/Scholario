import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Users, Shield, 
  Trash2, Edit, CheckCircle, Clock, X, Save, UserCheck 
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { 
  getAllRoster, addRosterEntry, updateRosterEntry, 
  deleteRosterEntry, getAllOfferings 
} from '../../lib/db';
import type { RosterEntry, ClassOffering } from '../../types';

export const RosterManagerPage: React.FC = () => {
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters/Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');

  // Form Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add_student' | 'add_teacher' | 'edit'>('add_student');
  const [selectedEntry, setSelectedEntry] = useState<RosterEntry | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedClass, setSelectedClass] = useState(''); // Student: single offering ID
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]); // Teacher: multi-select offering IDs
  const [formError, setFormError] = useState<string | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Delete Modal States
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<RosterEntry | null>(null);

  useEffect(() => {
    Promise.all([
      getAllRoster(),
      getAllOfferings()
    ]).then(([rosterData, offeringsData]) => {
      setRoster(rosterData);
      setOfferings(offeringsData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const openAddStudent = () => {
    setSelectedEntry(null);
    setEmail('');
    setFullName('');
    // Fallback to first offering ID
    const defaultClass = offerings.length > 0 ? offerings[0].id : '';
    setSelectedClass(defaultClass);
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

    // Validation
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
        // Edit only class assignments
        const studentClass = selectedClass || (offerings.length > 0 ? offerings[0].id : '');
        const classesToSave = selectedEntry.role === 'student' ? [studentClass] : selectedClasses;
        await updateRosterEntry(selectedEntry.id, classesToSave);
        
        setRoster(prev => prev.map(r => r.id === selectedEntry.id ? { ...r, class_ids: classesToSave } : r));
        setDrawerOpen(false);
      } else {
        // Add new entry
        const role = drawerMode === 'add_student' ? 'student' : 'teacher';
        const studentClass = selectedClass || (offerings.length > 0 ? offerings[0].id : '');
        const classesToSave = role === 'student' ? [studentClass] : selectedClasses;

        // Frontend email uniqueness check before submit
        if (roster.some(r => r.email.toLowerCase() === emailTrim)) {
          setFormError('Email is already registered in the roster.');
          setFormSaving(false);
          return;
        }

        const newEntry = await addRosterEntry(emailTrim, nameTrim, role, classesToSave);
        setRoster(prev => [newEntry, ...prev]);
        setDrawerOpen(false);
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving.');
    } finally {
      setFormSaving(false);
    }
  };

  const triggerDelete = (entry: RosterEntry) => {
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (entryToDelete) {
      try {
        await deleteRosterEntry(entryToDelete.id);
        setRoster(prev => prev.filter(r => r.id !== entryToDelete.id));
        setDeleteModalOpen(false);
        setEntryToDelete(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleClassSelect = (cid: string) => {
    setSelectedClasses(prev => 
      prev.includes(cid) ? prev.filter(id => id !== cid) : [...prev, cid]
    );
  };

  // Filter roster list
  const filteredRoster = roster.filter(entry => {
    const matchesSearch = 
      entry.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || entry.role === roleFilter;
    
    const isCompleted = entry.profile_id !== null;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'completed' && isCompleted) || 
      (statusFilter === 'pending' && !isCompleted);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const totalRoster = roster.length;
  const activeCount = roster.filter(r => r.profile_id !== null).length;
  const pendingCount = totalRoster - activeCount;
  const studentCount = roster.filter(r => r.role === 'student').length;
  const teacherCount = roster.filter(r => r.role === 'teacher').length;

  // Format classes output
  const formatClasses = (entry: RosterEntry) => {
    if (entry.class_ids.length === 0) return <span className="text-zinc-400 italic">No classes assigned</span>;
    return entry.class_ids.map(cid => {
      const off = offerings.find(o => o.id === cid);
      if (!off) return null;
      return (
        <span key={cid} className="inline-block bg-[#F5F5F5] border border-[#E5E5E5] text-[#404040] text-[10px] font-bold px-2 py-0.5 rounded mr-1 mb-1">
          {off.subject} ({off.board.toUpperCase()} {off.grade})
        </span>
      );
    }).filter(Boolean);
  };

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <SectionHeader 
          title="Roster Provisioning Manager" 
          description="Manage teacher and student rosters, pre-provision users by Google email, and track onboarding status."
        />

        {/* ── Statistics Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users size={15} />
              </div>
              <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Total</span>
            </div>
            <div className="stat-value text-indigo-600">{totalRoster}</div>
            <div className="stat-label">Provisioned Entries</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={15} />
              </div>
              <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Active</span>
            </div>
            <div className="stat-value text-emerald-600">{activeCount}</div>
            <div className="stat-label">Completed Logins</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock size={15} />
              </div>
              <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Pending</span>
            </div>
            <div className="stat-value text-amber-600">{pendingCount}</div>
            <div className="stat-label">Awaiting First Login</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Shield size={15} />
              </div>
              <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Breakdown</span>
            </div>
            <div className="stat-value text-zinc-800 text-lg flex gap-3 font-semibold mt-1">
              <span>{studentCount} <span className="text-xs text-zinc-500 font-normal">Students</span></span>
              <span>{teacherCount} <span className="text-xs text-zinc-500 font-normal">Teachers</span></span>
            </div>
            <div className="stat-label">Role Distribution</div>
          </div>
        </div>

        {/* ── Actions Row ── */}
        <div className="card bg-white border border-[#E5E5E5] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-9 py-2 text-xs w-full bg-[#FAFAFA] border-[#F0F0F0]"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer"
              >
                <option value="all">All Roles</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="completed">Active (Signed In)</option>
                <option value="pending">Pending OAuth</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto self-stretch sm:self-auto justify-end">
            <button
              onClick={openAddStudent}
              className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Student
            </button>
            <button
              onClick={openAddTeacher}
              className="btn btn-secondary border border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#404040] font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Teacher
            </button>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="card bg-white border border-[#E5E5E5] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-zinc-400 text-xs">
              <Clock size={16} className="animate-spin mr-2" /> Loading roster entries...
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="text-center p-12 text-[#737373] text-xs">
              No roster entries found matching current filter parameters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
                    <th className="p-4 text-xs font-bold text-[#737373] uppercase tracking-wider">Full Name</th>
                    <th className="p-4 text-xs font-bold text-[#737373] uppercase tracking-wider">Email Address</th>
                    <th className="p-4 text-xs font-bold text-[#737373] uppercase tracking-wider">System Role</th>
                    <th className="p-4 text-xs font-bold text-[#737373] uppercase tracking-wider">Assigned Class(es)</th>
                    <th className="p-4 text-xs font-bold text-[#737373] uppercase tracking-wider">Onboarding</th>
                    <th className="p-4 text-xs font-bold text-[#737373] uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F0F0]">
                  {filteredRoster.map((entry) => {
                    const isActive = entry.profile_id !== null;
                    return (
                      <tr key={entry.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="p-4 text-xs font-bold text-[#111111]">{entry.full_name}</td>
                        <td className="p-4 text-xs text-[#525252]">{entry.email}</td>
                        <td className="p-4 text-xs">
                          <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            entry.role === 'teacher' 
                              ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {entry.role === 'teacher' ? 'Teacher' : 'Student'}
                          </span>
                        </td>
                        <td className="p-4 text-xs max-w-xs">{formatClasses(entry)}</td>
                        <td className="p-4 text-xs">
                          {isActive ? (
                            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-[10px]">
                              <UserCheck size={11} /> Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-600 text-[10px]">
                              <Clock size={11} /> Awaiting Sign-In
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-xs text-right space-x-1.5">
                          <button
                            onClick={() => openEdit(entry)}
                            className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 hover:text-zinc-800 inline-flex items-center justify-center transition-colors"
                            title="Edit class assignments"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => triggerDelete(entry)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-600 inline-flex items-center justify-center transition-colors"
                            title="Remove from roster"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── DRAWER FORM ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity" 
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-[#E5E5E5] animate-slide-in">
            {/* Header */}
            <div className="p-4 border-b border-[#F0F0F0] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-[#111111] uppercase tracking-wide">
                  {drawerMode === 'add_student' && 'Add Student to Roster'}
                  {drawerMode === 'add_teacher' && 'Add Teacher to Roster'}
                  {drawerMode === 'edit' && `Edit ${selectedEntry?.role === 'student' ? 'Student' : 'Teacher'} Roster`}
                </h3>
                <p className="text-[10px] font-medium text-[#737373] mt-0.5">
                  {drawerMode === 'edit' 
                    ? 'Adjust the active class assignments for this roster entry.' 
                    : 'Pre-provision name and email for secure Google login.'}
                </p>
              </div>
              <button 
                onClick={() => setDrawerOpen(false)} 
                className="w-7 h-7 rounded-lg border border-[#E5E5E5] hover:bg-[#FAFAFA] flex items-center justify-center text-zinc-500"
              >
                <X size={14} />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-4">
              {formError && (
                <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg">
                  ⚠️ {formError}
                </div>
              )}

              {/* Email (Disabled on Edit) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#525252] block">Email Address (Google Account)</label>
                <input
                  type="email"
                  disabled={drawerMode === 'edit'}
                  placeholder="e.g. user@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl disabled:bg-zinc-50 disabled:text-zinc-500"
                />
              </div>

              {/* Name (Disabled on Edit) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#525252] block">Full Name</label>
                <input
                  type="text"
                  disabled={drawerMode === 'edit'}
                  placeholder="e.g. Ali Hassan"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl disabled:bg-zinc-50 disabled:text-zinc-500"
                />
              </div>

              {/* Class Assignment (Student) */}
              {(drawerMode === 'add_student' || (drawerMode === 'edit' && selectedEntry?.role === 'student')) && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#525252] block">Class Assignment</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl cursor-pointer"
                  >
                    {offerings.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.subject} ({o.board.toUpperCase()} {o.grade})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Assignments (Teacher Multi-Select) */}
              {(drawerMode === 'add_teacher' || (drawerMode === 'edit' && selectedEntry?.role === 'teacher')) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#525252] block">Class Assignments (Select Multiple)</label>
                  <div className="border border-[#E5E5E5] rounded-xl p-3 max-h-56 overflow-y-auto space-y-2 bg-[#FAFAFA]">
                    {offerings.map(o => {
                      const isChecked = selectedClasses.includes(o.id);
                      return (
                        <div 
                          key={o.id}
                          onClick={() => toggleClassSelect(o.id)}
                          className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition-all ${
                            isChecked 
                              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 font-semibold' 
                              : 'bg-white border-zinc-100 text-[#404040] hover:bg-zinc-50'
                          }`}
                        >
                          <input 
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by div click
                            className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
                          />
                          <span className="text-xs">
                            {o.subject} ({o.board.toUpperCase()} {o.grade})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="pt-4 flex gap-2">
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex-1 btn btn-primary bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Save size={14} /> {formSaving ? 'Saving...' : 'Save Roster Entry'}
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="btn btn-secondary border border-[#E5E5E5] hover:bg-[#FAFAFA] text-[#404040] font-bold text-xs py-2.5 px-4 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE MODAL ── */}
      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Remove Roster Entry"
        description={`Are you sure you want to remove ${entryToDelete?.full_name} (${entryToDelete?.email}) from the roster? This will delete their profile, classes association, and logins if active.`}
        confirmLabel="Remove Entry"
        cancelLabel="Cancel"
      />
    </AdminShell>
  );
};

export default RosterManagerPage;
