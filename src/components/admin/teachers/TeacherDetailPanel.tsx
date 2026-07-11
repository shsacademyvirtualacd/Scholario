import React, { useState, useEffect } from 'react';
import { Calendar, Phone, Mail, Clock, MapPin, Video } from 'lucide-react';
import type { Teacher, ClassOffering, ClassSlot } from '../../../types';
import { getOfferingsForTeacher, getSlotsForTeacher, getStudentsForTeacher } from '../../../lib/db';

interface TeacherDetailPanelProps {
  teacher: Teacher;
}

const DAYS_NAME = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TeacherDetailPanel: React.FC<TeacherDetailPanelProps> = ({ teacher }) => {
  const [offerings, setOfferings] = useState<ClassOffering[]>([]);
  const [slots, setSlots] = useState<ClassSlot[]>([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getOfferingsForTeacher(teacher.id),
      getSlotsForTeacher(teacher.id),
      getStudentsForTeacher(teacher.id)
    ]).then(([o, s, stds]) => {
      setOfferings(o);
      setSlots(s);
      setStudentCount(stds.length);
    }).catch(console.error).finally(() => setLoading(false));
  }, [teacher.id]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
  };

  const sortedSlots = [...slots].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time));

  if (loading) {
    return (
      <div className="py-24 text-center">
        <span className="w-8 h-8 border-4 border-[#111111]/10 border-t-[#111111] rounded-full animate-spin inline-block mb-3" />
        <p className="text-xs text-[#737373] font-bold">Loading teacher workloads...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profiler block */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-[#F5F5F5]">
        <div className="w-16 h-16 rounded-full bg-[#FFF9E6] text-[#F4C430] border-2 border-[#FDE68A] flex items-center justify-center text-xl font-bold mb-3 shadow-inner">
          {getInitials(teacher.full_name)}
        </div>
        <h3 className="text-lg font-black text-[#111111]">{teacher.full_name}</h3>
        <span className={`badge ${teacher.is_active ? 'badge-gold' : 'badge-gray'} mt-1.5`}>
          {teacher.is_active ? 'Active Status' : 'Inactive Status'}
        </span>
        <p className="text-[10px] text-[#A3A3A3] font-bold uppercase tracking-wider mt-3 flex items-center gap-1">
          <Calendar size={11} />
          Joined {teacher.joining_date || 'N/A'}
        </p>
      </div>

      {/* Contact Details */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Contact Details</h4>
        <div className="space-y-2 bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-3.5 text-xs text-[#525252] font-semibold">
          <div className="flex items-center gap-2">
            <Mail size={13} className="text-[#A3A3A3] shrink-0" />
            <span className="truncate">{teacher.email || 'No email address registered'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone size={13} className="text-[#A3A3A3] shrink-0" />
            <span>{teacher.phone || 'No phone number registered'}</span>
          </div>
        </div>
      </div>

      {/* Key stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-3 text-center">
          <div className="text-xl font-black text-[#111111]">{sortedSlots.length}</div>
          <div className="text-[10px] text-[#737373] font-bold uppercase mt-0.5">Classes / Wk</div>
        </div>
        <div className="bg-[#FAFAFA] border border-[#F0F0F0] rounded-xl p-3 text-center">
          <div className="text-xl font-black text-[#111111]">{studentCount}</div>
          <div className="text-[10px] text-[#737373] font-bold uppercase mt-1">Active Students</div>
        </div>
      </div>

      {/* Schedule Slots */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-[#111111] uppercase tracking-wider">Assigned Classes</h4>
        {sortedSlots.length === 0 ? (
          <div className="text-xs text-[#A3A3A3] font-semibold text-center py-6 bg-[#FAFAFA] border border-dashed border-[#E5E5E5] rounded-xl">
            No classes scheduled for this teacher.
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedSlots.map((slot) => {
              const isOnline = slot.room_or_link?.toLowerCase().includes('http') || slot.room_or_link?.toLowerCase().includes('zoom');
              const offering = offerings.find(o => o.id === slot.offering_id);
              return (
                <div
                  key={slot.id}
                  className={`border border-[#E5E5E5] rounded-xl p-3 bg-white flex justify-between gap-3 ${
                    slot.is_cancelled ? 'opacity-50' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold bg-[#F5F5F5] border border-[#E5E5E5] text-[#737373] px-1.5 py-0.5 rounded uppercase tracking-wider">
                      {DAYS_NAME[slot.day_of_week]}
                    </span>
                    <h5 className="text-xs font-bold text-[#111111] mt-1.5 truncate">
                      {offering?.subject} (Grade {offering?.grade})
                    </h5>
                    <div className="flex items-center gap-1 text-[10px] text-[#A3A3A3] font-bold mt-1">
                      <Clock size={10} />
                      <span>{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</span>
                    </div>
                  </div>

                  {isOnline ? (
                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold px-2 py-0.5 rounded border self-center truncate max-w-[120px] bg-blue-50 border-blue-100 text-blue-600">
                      <Video size={9} className="text-blue-500" />
                      <a href={slot.room_or_link!.startsWith('http') ? slot.room_or_link! : `https://${slot.room_or_link}`} target="_blank" rel="noreferrer" className="truncate hover:underline">
                        Join Class
                      </a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[9px] font-extrabold px-2 py-0.5 rounded border self-center truncate max-w-[120px] bg-[#F5F5F5] border-[#E5E5E5] text-[#525252]">
                      <MapPin size={9} className="text-[#737373]" />
                      <span className="truncate">TBD</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDetailPanel;
