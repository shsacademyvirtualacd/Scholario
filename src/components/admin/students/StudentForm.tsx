import React, { useState, useEffect } from 'react';
import type { Profile } from '../../../types';
import { GRADES, getStreamsForGrade } from '../../../lib/taxonomy';

interface StudentFormProps {
  student?: Profile | null;
  onSave: (data: {
    full_name: string;
    phone: string;
    stream: string;
    board: 'fbise';
    grade: string;
  }) => void;
  onCancel: () => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  student,
  onSave,
  onCancel,
}) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [stream, setStream] = useState<string>('');
  const [grade, setGrade] = useState('10');
  const [error, setError] = useState<string | null>(null);

  const getStreamsList = () => {
    return getStreamsForGrade(grade).map(s => ({
      value: s.name.toLowerCase().replace(/\s+/g, '-'),
      label: s.name,
    }));
  };

  useEffect(() => {
    const valid = getStreamsList();
    if (!valid.some(s => s.value === stream)) {
      setStream(valid[0]?.value || '');
    }
  }, [grade]);

  useEffect(() => {
    if (student) {
      setFullName(student.full_name);
      setPhone(student.phone || '');
      setStream(student.stream || '');
      setGrade('10');
    } else {
      setFullName('');
      setPhone('');
      setStream('');
      setGrade('10');
    }
    setError(null);
  }, [student]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter the student\'s full name.');
      return;
    }
    if (fullName.trim().length < 3) {
      setError('Name must be at least 3 characters long.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter a contact phone number.');
      return;
    }

    onSave({
      full_name: fullName.trim(),
      phone: phone.trim(),
      stream,
      board: 'fbise',
      grade,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Name */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Full Name</label>
        <input
          type="text"
          placeholder="e.g. Ali Hassan"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        />
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Phone Number</label>
        <input
          type="text"
          placeholder="e.g. +92 301 234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        />
      </div>

      {/* Grade */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Grade</label>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        >
          {GRADES.map(g => (
            <option key={g.grade} value={g.grade}>{g.displayName}</option>
          ))}
        </select>
      </div>

      {/* Stream Selector */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Academic Stream</label>
        <select
          value={stream}
          onChange={(e) => setStream(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        >
          {getStreamsList().map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F5F5F5] mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost text-sm font-semibold px-4 py-2 hover:bg-[#F5F5F5] rounded-xl"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn bg-[#111111] hover:bg-[#262626] text-white text-sm font-semibold px-5 py-2 rounded-xl"
        >
          {student ? 'Update Profile' : 'Enrol Student'}
        </button>
      </div>
    </form>
  );
};

export default StudentForm;
