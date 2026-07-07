import React, { useState, useEffect } from 'react';
import type { Profile } from '../../../types';

interface StudentFormProps {
  student?: Profile | null;
  onSave: (data: {
    full_name: string;
    phone: string;
    stream: 'pre-medical' | 'pre-engineering' | 'ics';
    board: 'local' | 'fbise' | 'o_level' | 'a_level';
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
  const [stream, setStream] = useState<'pre-medical' | 'pre-engineering' | 'ics'>('pre-engineering');
  const [board, setBoard] = useState<'local' | 'fbise' | 'o_level' | 'a_level'>('fbise');
  const [grade, setGrade] = useState('10');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (student) {
      setFullName(student.full_name);
      setPhone(student.phone || '');
      setStream(student.stream || 'pre-engineering');
      // For mock simplicity, default to FBISE 10 if not present
      setBoard('fbise');
      setGrade('10');
    } else {
      setFullName('');
      setPhone('');
      setStream('pre-engineering');
      setBoard('fbise');
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
      board,
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

      {/* Stream Selector */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Academic Stream</label>
        <select
          value={stream}
          onChange={(e) => setStream(e.target.value as any)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        >
          <option value="pre-engineering">Pre-Engineering (Math, Phys, Chem)</option>
          <option value="pre-medical">Pre-Medical (Bio, Phys, Chem)</option>
          <option value="ics">ICS (CompSci, Math, Phys)</option>
        </select>
      </div>

      {/* Board & Grade Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-[#525252] block">Education Board</label>
          <select
            value={board}
            onChange={(e) => setBoard(e.target.value as any)}
            className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
          >
            <option value="fbise">FBISE</option>
            <option value="local">Local Board</option>
            <option value="o_level">O Level</option>
            <option value="a_level">A Level</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#525252] block">Grade / Year</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
          >
            <option value="9">Grade 9</option>
            <option value="10">Grade 10</option>
            <option value="11">Grade 11</option>
            <option value="12">Grade 12</option>
            <option value="o1">O1</option>
            <option value="o2">O2</option>
            <option value="as">AS Level</option>
            <option value="a2">A2 Level</option>
          </select>
        </div>
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
