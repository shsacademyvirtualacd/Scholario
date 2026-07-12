import React, { useState, useEffect } from 'react';
import type { Teacher } from '../../../types';

interface TeacherFormProps {
  teacher?: Teacher | null;
  onSave: (data: {
    full_name: string;
    email: string;
    phone: string;
    joining_date: string;
    is_active: boolean;
  }) => void;
  onCancel: () => void;
}

export const TeacherForm: React.FC<TeacherFormProps> = ({
  teacher,
  onSave,
  onCancel,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [joiningDate, setJoiningDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teacher) {
      setFullName(teacher.full_name);
      setEmail(teacher.email || '');
      setPhone(teacher.phone || '');
      setJoiningDate(teacher.joining_date || '');
      setIsActive(teacher.is_active);
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setJoiningDate(new Date().toISOString().slice(0, 10));
      setIsActive(true);
    }
    setError(null);
  }, [teacher]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please enter the teacher\'s full name.');
      return;
    }
    if (fullName.trim().length < 3) {
      setError('Name must be at least 3 characters long.');
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    onSave({
      full_name: fullName.trim(),
      email: email.trim() || '',
      phone: phone.trim() || '',
      joining_date: joiningDate,
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-100 rounded-lg">
          ⚠️ {error}
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Full Name</label>
        <input
          type="text"
          placeholder="e.g. Mr. Ahmad Khan"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        />
      </div>

      {/* Email */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Email Address</label>
        <input
          type="email"
          placeholder="e.g. ahmad.khan@shs.edu.pk"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        />
      </div>

      {/* Phone */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Phone Number</label>
        <input
          type="text"
          placeholder="e.g. +92 321 987 6543"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        />
      </div>

      {/* Joining Date */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-[#525252] block">Joining Date</label>
        <input
          type="date"
          value={joiningDate}
          onChange={(e) => setJoiningDate(e.target.value)}
          className="input py-2 text-sm w-full bg-white border-[#E5E5E5] rounded-xl"
        />
      </div>

      {/* Status Toggle */}
      <div className="flex items-center gap-2 pt-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 text-[#F4C430] border-gray-300 rounded focus:ring-[#F4C430]"
        />
        <label htmlFor="isActive" className="text-xs font-bold text-[#111111] cursor-pointer selection:bg-transparent">
          Teacher is Active (permitted to teach and access system)
        </label>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F5F5F5] mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-ghost text-sm font-semibold px-4 py-2 hover:bg-[#F5F5F5] rounded-xl interactive"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn bg-[#111111] hover:bg-[#262626] text-white text-sm font-semibold px-5 py-2 rounded-xl interactive"
        >
          {teacher ? 'Update Details' : 'Add Teacher'}
        </button>
      </div>
    </form>
  );
};

export default TeacherForm;
