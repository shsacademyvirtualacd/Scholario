import React, { useState, useEffect } from 'react';
import { Mail, Phone, Camera, Edit3, Check, AlertCircle, BookOpen, Calendar } from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { useAuth } from '../../features/auth/AuthContext';
import { getOfferingsForTeacher, updateProfile } from '../../lib/db';
import type { ClassOffering } from '../../types';

export const ProfilePage: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  
  // Local edit states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState('');
  const [joiningDate, setJoiningDate] = useState<string>('');
  
  // Classes
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  // Validation / Feedback states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      
      // Fetch teacher classes
      setLoadingClasses(true);
      getOfferingsForTeacher(profile.id)
        .then(data => {
          setClasses(data);
          // If classes are found and have teacher info, extract joining date & email
          if (data.length > 0 && data[0].teacher) {
            setEmail(data[0].teacher.email || user?.email || '');
            setJoiningDate(data[0].teacher.joining_date || '');
          } else {
            setEmail(user?.email || '');
            setJoiningDate('');
          }
        })
        .catch(err => {
          console.error(err);
          setEmail(user?.email || '');
          setJoiningDate('');
        })
        .finally(() => {
          setLoadingClasses(false);
        });
    }
  }, [profile, user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    const phoneRegex = /^\+?[0-9\s-]{10,15}$/;
    if (phone && !phoneRegex.test(phone)) {
      setError('Please enter a valid phone number.');
      return;
    }

    try {
      if (profile?.id) {
        await updateProfile(profile.id, {
          full_name: fullName.trim(),
          phone: phone.trim() || null
        });
        await refreshProfile();
        setIsEditing(false);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save details.');
    }
  };

  return (
    <TeacherShell>
      {/* Page Header */}
      <SectionHeader
        title="Teacher Profile"
        description="Manage your professional details, view assigned academic workload classes, and review joining statistics."
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-6">
        {/* Left Side: Avatar Card */}
        <div className="lg:col-span-1 bg-white border border-[#E5E5E5] rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-[#F4C430]" />
          
          {/* Avatar container */}
          <div className="relative w-24 h-24 mx-auto mt-4 mb-4 group cursor-pointer">
            <div className="w-full h-full rounded-2xl bg-[#F4C430] flex items-center justify-center text-3xl font-black text-[#111111] shadow-md border-2 border-white">
              {fullName[0]?.toUpperCase() || 'T'}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
          </div>

          <h2 className="text-lg font-extrabold text-[#111111]">{fullName}</h2>
          <span className="inline-block bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wide">
            Faculty Member
          </span>

          <div className="mt-6 pt-6 border-t border-[#F5F5F5] space-y-3.5 text-left text-xs font-semibold text-[#525252]">
            <div className="flex items-center gap-3">
              <Mail size={15} className="text-[#A3A3A3] shrink-0" />
              <span className="truncate">{email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={15} className="text-[#A3A3A3] shrink-0" />
              <span>{phone || 'No phone number'}</span>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={15} className="text-[#A3A3A3] shrink-0" />
              <span>Joined: {joiningDate ? new Date(joiningDate).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Info sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information edit card */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-[#F5F5F5] pb-3">
              <h3 className="text-sm font-bold text-[#111111]">Personal Details</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#737373] hover:text-[#111111] transition-colors"
                >
                  <Edit3 size={13} />
                  Edit details
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#FEF2F2] border border-[#fecaca] text-xs text-[#dc2626] flex items-center gap-2">
                <AlertCircle size={14} />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-[#F0FDF4] border border-[#bbf7d0] text-xs text-[#16a34a] flex items-center gap-2">
                <Check size={14} />
                <span className="font-semibold">Profile details updated successfully!</span>
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-wide mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#737373] uppercase tracking-wide mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input text-xs"
                    placeholder="+92 300 1234567"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFullName(profile?.full_name || '');
                      setPhone(profile?.phone || '');
                      setError(null);
                    }}
                    className="btn border border-[#E5E5E5] hover:bg-[#FAFAFA] text-xs font-bold px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-gold text-xs font-bold px-4 py-2"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
                  <span className="block text-[10px] text-[#A3A3A3] uppercase tracking-wide mb-0.5">Full Name</span>
                  <span className="text-[#262626]">{fullName}</span>
                </div>
                <div className="bg-[#FAFAFA] p-3 rounded-xl border border-[#F0F0F0]">
                  <span className="block text-[10px] text-[#A3A3A3] uppercase tracking-wide mb-0.5">Phone Number</span>
                  <span className="text-[#262626]">{phone || 'Not provided'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Assigned Classes */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#111111] mb-4 border-b border-[#F5F5F5] pb-3 flex items-center gap-2">
              <BookOpen size={15} className="text-[#F4C430]" />
              Assigned Classes & Subjects
            </h3>

            {loadingClasses ? (
              <div className="flex items-center gap-2 py-4">
                <div className="w-4 h-4 rounded-full border border-zinc-300 border-t-zinc-700 animate-spin" />
                <span className="text-xs text-[#737373]">Loading workload...</span>
              </div>
            ) : classes.length === 0 ? (
              <p className="text-xs text-[#737373] italic">No active class offerings assigned to you yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classes.map((cls) => (
                  <div key={cls.id} className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-[#111111]">{cls.subject_name || cls.subject}</span>
                      <span className="text-[10px] font-semibold text-[#737373]">Grade {cls.grade} (FBISE)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherShell>
  );
};

export default ProfilePage;
