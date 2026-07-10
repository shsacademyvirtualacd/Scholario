import React, { useState, useEffect } from 'react';
import { Search, Filter, Users, Sparkles } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import StudentTable from '../../components/admin/students/StudentTable';
import AdminDrawer from '../../components/admin/AdminDrawer';
import StudentDetailPanel from '../../components/admin/students/StudentDetailPanel';
import { getAllStudents, getAllEnrollments, getAllOfferings } from '../../lib/db';
import type { Profile, Enrollment, ClassOffering } from '../../types';

export const StudentsAdminPage: React.FC = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);

  // ── Load from DB (or mock) on mount ──────────────────────────────────────
  useEffect(() => {
    Promise.all([
      getAllStudents().then(setStudents),
      getAllEnrollments().then(setEnrollments),
      getAllOfferings().then(setOfferings)
    ]).catch(console.error);
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [streamFilter, setStreamFilter] = useState<'all' | 'pre-medical' | 'pre-engineering' | 'ics'>('all');

  // Drawer States
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);

  // Compute student stats
  const totalCount = students.length;

  // Search and Filter logical execution
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.phone && s.phone.includes(searchTerm));
    const matchesStream = streamFilter === 'all' || s.stream === streamFilter;
    return matchesSearch && matchesStream;
  });

  // Action handlers
  const handleViewTrigger = (student: Profile) => {
    setSelectedStudent(student);
    setDrawerOpen(true);
  };

  return (
    <AdminShell>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Students"
          description="Enrolment list of academy students, check stream filters, and view profile details."
        />
        <div className="text-xs text-[#737373] bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-1.5 rounded-xl font-bold shrink-0 self-start sm:self-center">
          Managed via Roster
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Card */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={15} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Total</span>
          </div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-label">Enrolled Students</div>
        </div>

        {/* Avg Attendance Card */}
        <div className="stat-card relative opacity-40 select-none">
          <span className="absolute top-2 right-2 text-[8px] bg-zinc-200 text-zinc-600 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Soon
          </span>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users size={15} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Avg Attendance</span>
          </div>
          <div className="stat-value text-emerald-600">—</div>
          <div className="stat-label">Class presence rate</div>
        </div>

        {/* Attendance Warnings Card */}
        <div className="stat-card relative opacity-40 select-none">
          <span className="absolute top-2 right-2 text-[8px] bg-zinc-200 text-zinc-600 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
            Soon
          </span>
          <div className="flex items-center justify-between mb-2">
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Users size={15} />
            </div>
            <span className="text-[10px] font-black text-[#A3A3A3] uppercase tracking-wider">Risk Alerts</span>
          </div>
          <div className="stat-value text-red-500">—</div>
          <div className="stat-label">Students below 70% rate</div>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="card bg-white border border-[#E5E5E5] p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
          <input
            type="text"
            placeholder="Search students by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9 py-2 text-xs w-full bg-[#FAFAFA] border-[#F0F0F0]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#737373]">
            <Filter size={14} />
            <span>Academic Stream:</span>
          </div>
          <select
            value={streamFilter}
            onChange={(e) => setStreamFilter(e.target.value as any)}
            className="input py-1.5 px-3 text-xs bg-[#FAFAFA] border-[#E5E5E5] rounded-lg cursor-pointer"
          >
            <option value="all">All Streams</option>
            <option value="pre-engineering">Pre-Engineering</option>
            <option value="pre-medical">Pre-Medical</option>
            <option value="ics">ICS</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      {filteredStudents.length === 0 ? (
        <div className="card text-center py-16">
          <Sparkles size={28} className="mx-auto text-[#A3A3A3] mb-3 animate-pulse" />
          <h3 className="text-sm font-bold text-[#111111]">No matching students found</h3>
          <p className="text-xs text-[#737373] mt-1">Try tweaking your search keywords or choosing a different stream filter.</p>
        </div>
      ) : (
        <StudentTable
          students={filteredStudents}
          onView={handleViewTrigger}
          enrollments={enrollments}
          offerings={offerings}
        />
      )}

      {/* Slide-over Detail / Form Drawer */}
      <AdminDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedStudent(null);
        }}
        title="Student Profile Details"
      >
        {selectedStudent && <StudentDetailPanel student={selectedStudent} />}
      </AdminDrawer>
    </AdminShell>
  );
};

export default StudentsAdminPage;
