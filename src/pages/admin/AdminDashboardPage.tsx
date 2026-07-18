import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, ChevronRight, ArrowUpRight,
  GraduationCap, Percent, Megaphone
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import {
  getDashboardCounts,
  getAllTeachers,
  getAllOfferings,
  getAllSlots,
  getAllEnrollments
} from '../../lib/db';
import type { Teacher, ClassOffering, ClassSlot, Enrollment } from '../../types';
import { useMobile } from '../../hooks/useMobile';

// ─── Main ────────────────────────────────────────────────────────
const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [counts, setCounts] = useState({ students: 0, teachers: 0, offerings: 0, announcements: 0 });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getDashboardCounts().then(setCounts),
      getAllTeachers().then(setTeachers),
      getAllOfferings().then(setOfferings),
      getAllSlots().then(setSlots),
      getAllEnrollments().then(setEnrollments)
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Dynamic stats calculation
  const stats = [
    {
      label: 'Total Students',
      value: counts.students.toString(),
      change: '+0',
      changeLabel: 'this month',
      positive: true,
      icon: Users,
      color: '#3b82f6',
      bg: '#EFF6FF',
    },
    {
      label: 'Attendance Rate',
      value: '—',
      change: '+0%',
      changeLabel: 'vs last week',
      positive: true,
      icon: Percent,
      color: '#22c55e',
      bg: '#F0FDF4',
    },
    {
      label: 'Teachers on Staff',
      value: counts.teachers.toString(),
      change: '+0',
      changeLabel: 'this month',
      positive: true,
      icon: GraduationCap,
      color: '#F4C430',
      bg: '#FFFBF0',
    },
    {
      label: 'Recent Announcements',
      value: counts.announcements.toString(),
      change: '+0',
      changeLabel: 'total published',
      positive: true,
      icon: Megaphone,
      color: '#a855f7',
      bg: '#FAF5FF',
    },
  ];

  // Dynamic teacher workload calculation
  const teacherWorkload = teachers.map(teacher => {
    const teacherOfferings = offerings.filter(o => o.teacher_id === teacher.id);
    
    // Unique subjects
    const subjects = Array.from(new Set(teacherOfferings.map(o => o.subject_name))).join(', ') || 'N/A';
    
    // Unique boards
    const boards = 'FBISE';
    
    // Unique grades
    const grades = Array.from(new Set(teacherOfferings.map(o => o.grade))).join(' & ') || 'N/A';
    
    // Unique students count
    const offeringIds = teacherOfferings.map(o => o.id);
    const enrolledStudentIds = new Set(
      enrollments
        .filter(e => offeringIds.includes(e.offering_id))
        .map(e => e.student_id)
    );
    const studentsCount = enrolledStudentIds.size;
    
    // Classes per week
    const classesPerWeek = slots.filter(
      s => s.offering_id !== null && offeringIds.includes(s.offering_id) && !s.is_cancelled
    ).length;

    // Initials for avatar
    const initials = teacher.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return {
      name: teacher.full_name,
      avatar: initials,
      subject: subjects,
      board: boards,
      grade: grades,
      students: studentsCount,
      classesPerWeek
    };
  });

  const subjectColors: Record<string, string> = {
    'Mathematics': '#F4C430',
    'Physics': '#3b82f6',
    'Chemistry': '#22c55e',
    'Biology': '#ef4444',
    'Computer Science': '#a855f7',
    'Accounting': '#f97316',
    'Economics': '#06b6d4',
    'English': '#ec4899',
  };

  const formatTime12h = (timeStr: string) => {
    if (!timeStr) return '';
    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutesStr} ${ampm}`;
  };

  const getShortName = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[1]}`;
    }
    return fullName;
  };

  // Build upcoming classes dynamically
  const upcomingClasses = slots.filter(s => !s.is_cancelled).map(slot => {
    const offering = offerings.find(o => o.id === slot.offering_id);
    const teacher = offering ? teachers.find(t => t.id === offering.teacher_id) : null;
    const enrollmentsCount = enrollments.filter(e => e.offering_id === slot.offering_id).length;
    
    const boardLabel = 'FBISE';

    return {
      subject: offering ? `${offering.subject_name} Gr.${offering.grade}` : 'N/A',
      teacher: teacher ? getShortName(teacher.full_name) : 'N/A',
      time: formatTime12h(slot.start_time),
      board: boardLabel,
      students: enrollmentsCount,
      color: (offering && offering.subject_name) ? (subjectColors[offering.subject_name] || '#a855f7') : '#737373',
    };
  }).slice(0, 3);

  return (
    <AdminShell>
      {/* Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#111111] tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-[#737373] mt-1">
            {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {loading && (
          <span className="text-xs text-[#737373] font-bold flex items-center gap-1.5 bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-1.5 rounded-xl self-start sm:self-center">
            <span className="w-3.5 h-3.5 border-2 border-[#111111]/10 border-t-[#111111] rounded-full animate-spin inline-block" />
            Syncing database...
          </span>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const isAttendance = stat.label === 'Attendance Rate';
          return (
            <div key={stat.label} className={`bg-white border border-[#E5E5E5] rounded-2xl p-4 relative shadow-sm flex flex-col justify-between ${isAttendance ? 'opacity-40 select-none' : ''}`}>
              {isAttendance && (
                <span className="absolute top-2.5 right-2.5 text-[8px] bg-zinc-200 text-zinc-600 font-black px-1.5 py-0.5 rounded-md uppercase tracking-wider scale-95 origin-top-right">
                  Soon
                </span>
              )}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: stat.bg }}
                >
                  <stat.icon size={15} style={{ color: stat.color }} />
                </div>
              </div>
              <div>
                <div className="text-xl lg:text-2xl font-black tracking-tight text-[#111111] leading-none">{isAttendance ? '—' : stat.value}</div>
                <div className="text-[10px] font-bold text-[#737373] mt-2 uppercase tracking-wider">{stat.label}</div>
                <div className="text-[9px] text-[#A3A3A3] font-medium mt-0.5">{isAttendance ? 'Coming soon' : stat.changeLabel}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Today's classes + Low attendance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Today's upcoming classes */}
        <div className="card card-elevated interactive">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#111111]">Today's Classes</h2>
            <button
              onClick={() => navigate('/admin/schedule')}
              className="text-xs text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors"
            >
              Manage schedule <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {upcomingClasses.length === 0 ? (
              <div className="text-xs text-[#A3A3A3] font-bold text-center py-8">
                No classes scheduled for today.
              </div>
            ) : (
              upcomingClasses.map((cls, i) => (
                <div key={i} className="flex items-center gap-3.5 p-3 rounded-xl border border-[#F0F0F0] bg-white shadow-sm hover:border-[#E5E5E5] transition-all">
                  <div className="w-1 h-10 rounded-full shrink-0" style={{ background: cls.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-[#111111] truncate">{cls.subject}</div>
                    <div className="text-[10px] text-[#737373] mt-0.5 truncate">{cls.teacher} · {cls.board}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-black text-[#111111] bg-[#FAFAFA] border border-[#E5E5E5] px-2 py-0.5 rounded-md font-mono">{cls.time}</div>
                    <div className="text-[9px] text-[#A3A3A3] font-bold mt-1">{cls.students} enrolled</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low attendance alerts */}
        <div className="card card-elevated relative overflow-hidden interactive">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#111111]">⚠️ Low Attendance</h2>
            <span className="text-[9px] bg-zinc-200 text-zinc-600 font-bold px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
              Coming Soon
            </span>
          </div>
          <div className="space-y-3 opacity-40 pointer-events-none select-none">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FEF2F2] border border-[#ef444420]">
              <div className="w-8 h-8 rounded-full bg-[#ef4444] flex items-center justify-center text-xs font-bold text-white shrink-0">
                AH
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#111111]">Ali Hassan</div>
                <div className="text-xs text-[#737373]">Mathematics · 5/8 classes</div>
              </div>
              <span className="text-sm font-bold text-[#ef4444]">62%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Teachers overview ── */}
      <div className="card card-elevated interactive">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-bold text-[#111111]">Teacher Workload</h2>
          <button
            onClick={() => navigate('/admin/teachers')}
            className="btn btn-ghost btn-sm interactive"
          >
            Manage teachers <ChevronRight size={14} />
          </button>
        </div>
        {isMobile ? (
          <div className="space-y-4">
            {teacherWorkload.length === 0 ? (
              <div className="text-xs text-[#A3A3A3] font-bold text-center py-6 border border-[#E5E5E5] rounded-xl bg-[#FAFAFA]">
                No teachers registered.
              </div>
            ) : (
              teacherWorkload.map((t, i) => (
                <div key={i} className="bg-white border border-[#E5E5E5] rounded-xl p-4 flex flex-col gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#F4C430] flex items-center justify-center text-sm font-bold text-[#111111] shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-[#111111] leading-tight">{t.name}</div>
                      <div className="text-[11px] text-[#737373] mt-0.5">{t.subject} · Gr. {t.grade}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-[#F5F5F5] pt-3">
                    <div>
                      <div className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mb-0.5">Students</div>
                      <div className="text-sm font-black text-[#111111]">{t.students}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mb-0.5">Classes/wk</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-[#111111]">{t.classesPerWeek}</span>
                        <div className="progress-bar w-12 shrink-0">
                          <div className="progress-fill" style={{ width: `${Math.min((t.classesPerWeek / 10) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Subject</th>
                  <th>Board</th>
                  <th>Grade(s)</th>
                  <th>Students</th>
                  <th>Classes/wk</th>
                </tr>
              </thead>
              <tbody>
                {teacherWorkload.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-xs text-[#A3A3A3] font-bold text-center py-6">
                      No teachers registered in the database.
                    </td>
                  </tr>
                ) : (
                  teacherWorkload.map((t, i) => (
                    <tr key={i}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#F4C430] flex items-center justify-center text-xs font-bold text-[#111111] shrink-0">
                            {t.avatar}
                          </div>
                          <span className="font-medium text-[#111111]">{t.name}</span>
                        </div>
                      </td>
                      <td>{t.subject}</td>
                      <td><span className="badge badge-gray">{t.board}</span></td>
                      <td className="text-[#525252]">{t.grade}</td>
                      <td>
                        <span className="font-semibold text-[#111111]">{t.students}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar w-16">
                            <div className="progress-fill" style={{ width: `${Math.min((t.classesPerWeek / 10) * 100, 100)}%` }} />
                          </div>
                          <span className="text-xs text-[#737373]">{t.classesPerWeek}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminDashboardPage;
