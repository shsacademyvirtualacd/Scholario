import React, { useState, useMemo } from 'react';
import {
  UserCheck, Search, CheckCircle2,
  AlertTriangle, Clock, Calendar, Check, X,
  RefreshCw, ChevronDown, ChevronRight,
  ShieldCheck, Users
} from 'lucide-react';
import type { Teacher, ClassOffering, ClassSlot, Profile, TeacherAttendanceRating } from '../../types';
import { formatTime12h } from '../../lib/scheduleUtils';

interface TeacherAttendanceRatingsAdminViewProps {
  ratings: TeacherAttendanceRating[];
  teachers: Teacher[];
  offerings: ClassOffering[];
  slots: ClassSlot[];
  students: Profile[];
  loading: boolean;
  onRefresh: () => void;
}

interface SessionRatingGroup {
  sessionKey: string;
  slotId: string;
  sessionDate: string;
  teacherId: string | null;
  teacherName: string;
  subjectName: string;
  gradeLevel: string;
  boardName: string;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: number;
  votes: Array<{
    id: string;
    studentId: string;
    studentName: string;
    studentPhone?: string;
    rating: 'present' | 'absent';
    createdAt: string;
  }>;
  presentCount: number;
  absentCount: number;
  totalVotes: number;
  presenceRatio: number; // 0 to 100
}

export const TeacherAttendanceRatingsAdminView: React.FC<TeacherAttendanceRatingsAdminViewProps> = ({
  ratings,
  teachers,
  offerings,
  slots,
  students,
  loading,
  onRefresh,
}) => {
  // Filter States
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [ratioFilter, setRatioFilter] = useState<'all' | '100' | 'mixed' | 'absent_only'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Build lookups for fast resolution
  const teacherMap = useMemo(() => new Map(teachers.map(t => [t.id, t])), [teachers]);
  const studentMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const slotMap = useMemo(() => new Map(slots.map(s => [s.id, s])), [slots]);
  const offeringMap = useMemo(() => new Map(offerings.map(o => [o.id, o])), [offerings]);

  // Aggregate ratings per session (slot_id + session_date)
  const sessionGroups: SessionRatingGroup[] = useMemo(() => {
    const groupMap = new Map<string, SessionRatingGroup>();

    ratings.forEach(r => {
      const sessionKey = `${r.slot_id}__${r.session_date}`;
      const slot = r.slot || slotMap.get(r.slot_id);
      const offering = slot?.offering || (slot?.offering_id ? offeringMap.get(slot.offering_id) : undefined);
      const teacher = r.teacher || (r.teacher_id ? teacherMap.get(r.teacher_id) : undefined) || offering?.teacher;
      const student = r.student || studentMap.get(r.student_id);

      const teacherName = teacher?.full_name || 'Assigned Instructor';
      const rawSubj = slot?.custom_title || (offering as any)?.subject_name || offering?.subject || 'Class';
      const subjectName = typeof rawSubj === 'string' ? rawSubj : (rawSubj as any)?.name || 'Class';
      const gradeLevel = offering?.class?.display_name || offering?.grade || '';
      const boardName = offering?.class?.board?.name || offering?.board || '';

      const voteEntry = {
        id: r.id,
        studentId: r.student_id,
        studentName: student?.full_name || 'Student',
        studentPhone: student?.phone || undefined,
        rating: r.rating,
        createdAt: r.created_at,
      };

      if (!groupMap.has(sessionKey)) {
        groupMap.set(sessionKey, {
          sessionKey,
          slotId: r.slot_id,
          sessionDate: r.session_date,
          teacherId: r.teacher_id || teacher?.id || null,
          teacherName,
          subjectName,
          gradeLevel,
          boardName,
          startTime: slot?.start_time,
          endTime: slot?.end_time,
          dayOfWeek: slot?.day_of_week,
          votes: [voteEntry],
          presentCount: r.rating === 'present' ? 1 : 0,
          absentCount: r.rating === 'absent' ? 1 : 0,
          totalVotes: 1,
          presenceRatio: r.rating === 'present' ? 100 : 0,
        });
      } else {
        const group = groupMap.get(sessionKey)!;
        // Avoid duplicate student votes in same session view if any
        if (!group.votes.some(v => v.studentId === r.student_id)) {
          group.votes.push(voteEntry);
          if (r.rating === 'present') group.presentCount += 1;
          if (r.rating === 'absent') group.absentCount += 1;
          group.totalVotes += 1;
          group.presenceRatio = Math.round((group.presentCount / group.totalVotes) * 100);
        }
      }
    });

    return Array.from(groupMap.values()).sort((a, b) => {
      // Sort primarily by date descending, then start_time
      if (b.sessionDate !== a.sessionDate) {
        return b.sessionDate.localeCompare(a.sessionDate);
      }
      return (b.startTime || '').localeCompare(a.startTime || '');
    });
  }, [ratings, teacherMap, studentMap, slotMap, offeringMap]);

  // Overall Aggregate Statistics
  const overallStats = useMemo(() => {
    let totalVotes = 0;
    let presentVotes = 0;
    let absentVotes = 0;
    let perfectSessions = 0;
    let flaggedSessions = 0;

    sessionGroups.forEach(g => {
      totalVotes += g.totalVotes;
      presentVotes += g.presentCount;
      absentVotes += g.absentCount;
      if (g.presenceRatio === 100) perfectSessions += 1;
      if (g.absentCount > 0) flaggedSessions += 1;
    });

    const overallRatio = totalVotes > 0 ? Math.round((presentVotes / totalVotes) * 100) : 100;

    return {
      totalVotes,
      presentVotes,
      absentVotes,
      totalSessionsRated: sessionGroups.length,
      perfectSessions,
      flaggedSessions,
      overallRatio,
    };
  }, [sessionGroups]);

  // Unique Subjects for filter
  const uniqueSubjects = useMemo(() => {
    const subs = new Set<string>();
    sessionGroups.forEach(g => {
      if (g.subjectName) subs.add(g.subjectName);
    });
    return Array.from(subs).sort();
  }, [sessionGroups]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessionGroups.filter(g => {
      // Teacher filter
      if (selectedTeacherId !== 'all' && g.teacherId !== selectedTeacherId) {
        return false;
      }
      // Subject filter
      if (selectedSubject !== 'all' && g.subjectName !== selectedSubject) {
        return false;
      }
      // Date filter
      if (selectedDate && g.sessionDate !== selectedDate) {
        return false;
      }
      // Presence Ratio filter
      if (ratioFilter === '100' && g.presenceRatio !== 100) return false;
      if (ratioFilter === 'mixed' && (g.presenceRatio === 100 || g.presenceRatio === 0)) return false;
      if (ratioFilter === 'absent_only' && g.presenceRatio !== 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTeacher = g.teacherName.toLowerCase().includes(q);
        const matchesSubject = g.subjectName.toLowerCase().includes(q);
        const matchesGrade = g.gradeLevel.toLowerCase().includes(q);
        const matchesStudent = g.votes.some(v => v.studentName.toLowerCase().includes(q));
        if (!matchesTeacher && !matchesSubject && !matchesGrade && !matchesStudent) {
          return false;
        }
      }

      return true;
    });
  }, [sessionGroups, selectedTeacherId, selectedSubject, selectedDate, ratioFilter, searchQuery]);

  const toggleExpandSession = (sessionKey: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionKey)) next.delete(sessionKey);
      else next.add(sessionKey);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSessions(new Set(filteredSessions.map(s => s.sessionKey)));
  };

  const collapseAll = () => {
    setExpandedSessions(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Verified Ratio */}
        <div className="stat-card flex flex-col justify-between min-h-[120px] interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">
              Teacher Presence Ratio
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111]">{overallStats.overallRatio}%</div>
            <div className="text-xs text-[#737373] font-medium mt-0.5">
              {overallStats.presentVotes} of {overallStats.totalVotes} student votes verified
            </div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] font-bold text-emerald-700">
            <span>Formula: Present / Total Votes Cast</span>
            <span>{overallStats.overallRatio >= 90 ? '✓ Excellent' : 'Requires Review'}</span>
          </div>
        </div>

        {/* Total Votes Cast */}
        <div className="stat-card flex flex-col justify-between min-h-[120px] interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">
              Total Ratings Cast
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111]">{overallStats.totalVotes}</div>
            <div className="text-xs text-[#737373] font-medium mt-0.5">
              Across {overallStats.totalSessionsRated} distinct class sessions
            </div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] font-bold text-blue-700">
            <span>1 locked vote / student / session</span>
            <span>Confidential</span>
          </div>
        </div>

        {/* 100% Present Sessions */}
        <div className="stat-card flex flex-col justify-between min-h-[120px] interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">
              100% Present Sessions
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={15} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{overallStats.perfectSessions}</div>
            <div className="text-xs text-[#737373] font-medium mt-0.5">
              Unanimous student confirmation
            </div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] font-bold text-emerald-700">
            <span>Zero absence claims</span>
            <span>{overallStats.totalSessionsRated > 0 ? Math.round((overallStats.perfectSessions / overallStats.totalSessionsRated) * 100) : 0}% of sessions</span>
          </div>
        </div>

        {/* Flagged / Inconsistent Sessions */}
        <div
          onClick={() => setRatioFilter(ratioFilter === 'mixed' ? 'all' : 'mixed')}
          className={`stat-card flex flex-col justify-between min-h-[120px] cursor-pointer transition-all ${
            overallStats.flaggedSessions > 0 ? 'hover:border-rose-300' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#737373] uppercase tracking-wide">
              Flagged Absences
            </span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              overallStats.flaggedSessions > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-400'
            }`}>
              <AlertTriangle size={15} />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black ${overallStats.flaggedSessions > 0 ? 'text-rose-600' : 'text-[#111111]'}`}>
              {overallStats.flaggedSessions}
            </div>
            <div className="text-xs text-[#737373] font-medium mt-0.5">
              {overallStats.absentVotes} total absence votes logged
            </div>
          </div>
          <div className="pt-2 border-t border-[#F5F5F5] flex items-center justify-between text-[10px] font-bold text-rose-700">
            <span>Filter flagged sessions</span>
            <ChevronRight size={12} />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 sm:p-5 border border-[#E5E5E5] bg-white rounded-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737373]" />
            <input
              type="text"
              placeholder="Search teacher, subject, grade, or student..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-10 pr-4 py-2 text-xs w-full bg-[#FAFAFA] border-[#E5E5E5] rounded-xl focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A3A3A3] hover:text-[#111111]"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={expandAll}
              className="text-xs font-semibold text-[#737373] hover:text-[#111111] px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs font-semibold text-[#737373] hover:text-[#111111] px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-colors"
            >
              Collapse All
            </button>
            <button
              onClick={onRefresh}
              className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
              title="Refresh Teacher Ratings"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#F0F0F0]">
          {/* Teacher Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-1">
              Teacher
            </label>
            <select
              value={selectedTeacherId}
              onChange={e => setSelectedTeacherId(e.target.value)}
              className="input-field text-xs py-2 w-full bg-[#FAFAFA] border-[#E5E5E5] rounded-xl focus:bg-white"
            >
              <option value="all">All Teachers ({teachers.length})</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Dropdown */}
          <div>
            <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-1">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="input-field text-xs py-2 w-full bg-[#FAFAFA] border-[#E5E5E5] rounded-xl focus:bg-white"
            >
              <option value="all">All Subjects</option>
              {uniqueSubjects.map(sub => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Session Date */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold text-[#737373] uppercase tracking-wider">
                Session Date
              </label>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="text-[10px] text-amber-700 hover:underline font-bold"
                >
                  Clear Date
                </button>
              )}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="input-field text-xs py-2 w-full bg-[#FAFAFA] border-[#E5E5E5] rounded-xl focus:bg-white"
            />
          </div>

          {/* Presence Ratio Filter */}
          <div>
            <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wider mb-1">
              Presence Ratio
            </label>
            <select
              value={ratioFilter}
              onChange={e => setRatioFilter(e.target.value as any)}
              className="input-field text-xs py-2 w-full bg-[#FAFAFA] border-[#E5E5E5] rounded-xl focus:bg-white"
            >
              <option value="all">All Ratios</option>
              <option value="100">100% Present Only</option>
              <option value="mixed">Mixed / Flagged (1% - 99%)</option>
              <option value="absent_only">0% Present (All Absent)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <div className="flex items-start gap-3 p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl text-xs text-amber-900">
        <ShieldCheck size={16} className="text-amber-700 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">Confidential Quality Assurance Metric:</span> Student votes for teacher presence are strictly anonymous to teachers and other students. The aggregate presence ratio is computed as <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono font-bold text-amber-950">(Present Votes / Total Votes Cast) × 100%</code>, counting only students who actively cast a vote for that session.
        </div>
      </div>

      {/* Session Breakdown List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="card p-5 border border-[#E5E5E5] bg-white rounded-2xl space-y-3">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-6 bg-gray-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="card p-12 text-center border border-dashed border-[#E5E5E5] bg-[#FAFAFA] rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E5E5E5] text-[#A3A3A3] flex items-center justify-center mx-auto mb-3">
              <UserCheck size={24} />
            </div>
            <h3 className="text-sm font-bold text-[#111111]">No teacher ratings found</h3>
            <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">
              {ratings.length === 0
                ? 'No student votes have been cast yet. Once students verify teacher attendance on their dashboards, ratings will aggregate here automatically.'
                : 'No session matched your active search or filter criteria. Try clearing some filters.'}
            </p>
            {(selectedTeacherId !== 'all' || selectedSubject !== 'all' || selectedDate || ratioFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedTeacherId('all');
                  setSelectedSubject('all');
                  setSelectedDate('');
                  setRatioFilter('all');
                  setSearchQuery('');
                }}
                className="btn btn-secondary text-xs mt-4"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          filteredSessions.map(session => {
            const isExpanded = expandedSessions.has(session.sessionKey);
            const ratio = session.presenceRatio;
            const ratioColor =
              ratio === 100
                ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                : ratio >= 50
                ? 'text-amber-800 bg-amber-50 border-amber-300'
                : 'text-rose-700 bg-rose-50 border-rose-300';

            const barColor =
              ratio === 100 ? 'bg-emerald-500' : ratio >= 50 ? 'bg-amber-500' : 'bg-rose-500';

            return (
              <div
                key={session.sessionKey}
                className="card card-elevated border border-[#E5E5E5] bg-white rounded-2xl overflow-hidden transition-all shadow-xs hover:border-[#D4D4D4]"
              >
                {/* Session Header Card */}
                <div
                  onClick={() => toggleExpandSession(session.sessionKey)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer select-none hover:bg-[#FAFAFA]/70 transition-colors"
                >
                  {/* Left: Teacher & Class details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#111111] text-[#F4C430] flex items-center justify-center font-bold text-sm shrink-0">
                      {(session.teacherName?.[0] || 'T').toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-sm font-extrabold text-[#111111] truncate">
                          {session.teacherName}
                        </span>
                        <span className="text-xs font-bold text-[#737373]">·</span>
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {session.subjectName}
                        </span>
                        {session.gradeLevel && (
                          <span className="text-[11px] font-semibold text-[#737373]">
                            {session.gradeLevel} {session.boardName ? `(${session.boardName})` : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#737373] mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-[#111111]">
                          <Calendar size={12} className="text-[#737373]" />
                          {session.sessionDate}
                        </span>
                        {session.startTime && session.endTime && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} className="text-[#737373]" />
                              {formatTime12h(session.startTime)} - {formatTime12h(session.endTime)}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{session.totalVotes} student vote{session.totalVotes !== 1 ? 's' : ''} cast</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Presence Ratio & Progress */}
                  <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                    <div className="flex flex-col items-start md:items-end gap-1.5 min-w-[140px]">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${ratioColor}`}>
                          {ratio}% Present
                        </span>
                      </div>
                      
                      {/* Mini visual ratio bar */}
                      <div className="w-full md:w-32 h-2 rounded-full bg-gray-100 overflow-hidden flex">
                        <div
                          className={`h-full ${barColor} transition-all duration-500`}
                          style={{ width: `${ratio}%` }}
                        />
                        <div
                          className="h-full bg-rose-200 transition-all duration-500"
                          style={{ width: `${100 - ratio}%` }}
                        />
                      </div>

                      <div className="text-[10px] text-[#737373] font-semibold">
                        {session.presentCount} Present · {session.absentCount} Absent
                      </div>
                    </div>

                    <div className="p-1 rounded-lg hover:bg-gray-100 text-[#737373]">
                      <ChevronDown
                        size={18}
                        className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Individual Student Votes Section */}
                {isExpanded && (
                  <div className="border-t border-[#E5E5E5] bg-[#FAFAFA] p-4 sm:p-5 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#737373] flex items-center gap-1.5">
                        <Users size={13} />
                        <span>Individual Student Votes ({session.votes.length})</span>
                      </h4>
                      <span className="text-[11px] text-[#737373]">
                        Denom: {session.totalVotes} active votes
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                      {session.votes.map(vote => (
                        <div
                          key={vote.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 shadow-2xs ${
                            vote.rating === 'present'
                              ? 'bg-white border-emerald-200'
                              : 'bg-white border-rose-200'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#111111] truncate">
                              {vote.studentName}
                            </div>
                            <div className="text-[10px] text-[#737373] mt-0.5">
                              {new Date(vote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>

                          <div className="shrink-0">
                            {vote.rating === 'present' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 text-[11px] font-extrabold">
                                <Check size={12} strokeWidth={3} className="text-emerald-600" />
                                Present
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-300 text-[11px] font-extrabold">
                                <X size={12} strokeWidth={3} className="text-rose-600" />
                                Absent
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TeacherAttendanceRatingsAdminView;
