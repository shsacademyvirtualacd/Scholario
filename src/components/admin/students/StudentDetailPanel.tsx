import React, { useState, useEffect } from 'react';
import { Phone, Mail, Calendar } from 'lucide-react';
import type { Profile, Enrollment, ClassOffering, Teacher, RosterEntry } from '../../../types';
import { getEnrollmentsForStudent, getAllOfferings, getAllTeachers, getAllRoster } from '../../../lib/db';

interface StudentDetailPanelProps {
  student: Profile;
}

export const StudentDetailPanel: React.FC<StudentDetailPanelProps> = ({ student }) => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getEnrollmentsForStudent(student.id),
      getAllOfferings(),
      getAllTeachers(),
      getAllRoster()
    ]).then(([e, o, t, r]) => {
      setEnrollments(e);
      setOfferings(o);
      setTeachers(t);
      setRoster(r);
    }).catch(console.error).finally(() => setLoading(false));
  }, [student.id]);

  // Enrich enrollments for this student with offering/teacher data
  const studentEnrollments = enrollments.map(e => {
    const offering = offerings.find(o => o.id === e.offering_id);
    const teacher = offering ? teachers.find(t => t.id === offering.teacher_id) : undefined;
    return {
      ...e,
      offering: offering ? { ...offering, teacher } : undefined
    };
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const boardLabel = student.class?.board?.name || 'No Board';
  const gradeLabel = student.class?.display_name || 'No Grade';

  const rosterEntry = roster.find(r => r.profile_id === student.id);
  const emailDisplay = rosterEntry ? rosterEntry.email : 'No email address registered';

  if (loading) {
    return (
      <div className="py-24 text-center">
        <span className="w-8 h-8 border-4 border-[#111111]/10 border-t-[#111111] rounded-full animate-spin inline-block mb-3" />
        <p className="text-xs text-[#737373] font-bold">Loading student profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Profile card */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-[#F5F5F5]">
        <div className="w-16 h-16 rounded-full bg-[#FAFAFA] text-[#111111] border-2 border-[#E5E5E5] flex items-center justify-center text-xl font-bold mb-3 shadow-inner">
          {getInitials(student.full_name)}
        </div>
        <h3 className="text-lg font-black text-[#111111]">{student.full_name}</h3>
        <span className="badge badge-gold mt-1.5 uppercase text-[9px] font-bold py-0.5 px-2.5 rounded-md border border-[#FDE68A]">
          {student.stream_obj?.name || student.stream || 'General Stream'} Stream
        </span>
        <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mt-3">
          {gradeLabel} · {boardLabel}
        </p>
      </div>

      {/* Info Card */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Contact & Profile</h4>
        <div className="space-y-2 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-3.5 text-xs text-[#525252] font-semibold">
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-[#A3A3A3] shrink-0" />
            <span>{student.phone || 'No phone number registered'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-[#A3A3A3] shrink-0" />
            <span>{emailDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={13} className="text-[#A3A3A3] shrink-0" />
            <span>Registered: {rosterEntry?.created_at ? new Date(rosterEntry.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
          </div>
        </div>
      </div>

      {/* Subject list */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Enrolled Subjects</h4>
        <div className="space-y-2">
          {studentEnrollments.length === 0 ? (
            <div className="text-xs text-[#A3A3A3] font-semibold text-center py-4 bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
              No subjects enrolled.
            </div>
          ) : (
            studentEnrollments.map((e) => (
              <div key={e.id} className="bg-white border border-[#E5E5E5] rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h5 className="text-xs font-bold text-[#111111] truncate">{e.offering?.subject}</h5>
                  <p className="text-[10px] text-[#737373] mt-0.5 font-medium truncate">{e.offering?.teacher?.full_name || 'TBA'}</p>
                </div>
                <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded uppercase shrink-0">
                  Active
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDetailPanel;
