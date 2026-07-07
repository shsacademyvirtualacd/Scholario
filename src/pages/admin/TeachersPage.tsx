import React, { useState, useEffect } from 'react';
import { Search, Filter, GraduationCap, Sparkles } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import TeacherTable from '../../components/admin/teachers/TeacherTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import TeacherDetailPanel from '../../components/admin/teachers/TeacherDetailPanel';
import { getAllTeachers } from '../../lib/db';
import type { Teacher } from '../../types';

export const TeachersPage: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // ── Load from DB (or mock) on mount ──────────────────────────────────────
  useEffect(() => {
    getAllTeachers().then(setTeachers).catch(console.error);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  // Stats calculations
  const totalCount = teachers.length;
  const activeCount = teachers.filter((t) => t.is_active).length;
  const inactiveCount = totalCount - activeCount;

  // Filter handlers
  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch = t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.email && t.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && t.is_active) ||
      (statusFilter === 'inactive' && !t.is_active);
    return matchesSearch && matchesStatus;
  });

  // Action handlers
  const handleViewDetails = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setDrawerOpen(true);
  };

  return (
    <AdminShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Teachers"
          description="Academy tutor list, teaching workloads, and scheduling metrics."
        />
        <div className="text-xs text-[#737373] bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-1.5 rounded-xl font-bold shrink-0 self-start sm:self-center">
          Managed via Roster
        </div>
      </div>

      {/* Analytics Counter Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap size={15} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Total</span>
          </div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-label">Registered Teachers</div>
        </div>

        {/* Active Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap size={15} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Active</span>
          </div>
          <div className="stat-value text-emerald-600">{activeCount}</div>
          <div className="stat-label">Tutors Engaged</div>
        </div>

        {/* Inactive Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <GraduationCap size={15} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">On Leave</span>
          </div>
          <div className="stat-value text-[#ef4444]">{inactiveCount}</div>
          <div className="stat-label">Deactivated / Inactive</div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="card bg-white border border-[#E5E5E5] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search teachers by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 py-2 text-xs w-full bg-[#FAFAFA] border-[#F0F0F0]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#737373]">
            <Filter size={14} />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer"
          >
            <option value="all">All Tutors</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Teacher Table */}
      {filteredTeachers.length === 0 ? (
        <div className="card text-center py-16">
          <Sparkles size={28} className="mx-auto text-[#A3A3A3] mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-[#111111]">No matching teachers found</h3>
          <p className="text-xs text-[#737373] mt-1">Try resetting your status filters or typing a different query name.</p>
        </div>
      ) : (
        <TeacherTable
          teachers={filteredTeachers}
          onView={handleViewDetails}
        />
      )}

      {/* Slider Drawer */}
      <AdminDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedTeacher(null);
        }}
        title="Teacher Profile Details"
      >
        {selectedTeacher && <TeacherDetailPanel teacher={selectedTeacher} />}
      </AdminDrawer>
    </AdminShell>
  );
};

export default TeachersPage;
