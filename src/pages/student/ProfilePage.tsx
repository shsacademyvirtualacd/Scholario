import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Award, Book, Edit3, Check, X, Camera, Loader2 } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { useAuth } from '../../features/auth/AuthContext';
import { updateProfile, getEnrollmentsForStudent, getFeeStatus } from '../../lib/db';
import { getEnrolledSubjectsForStudent } from '../../lib/taxonomy';
import { useMobile } from '../../hooks/useMobile';
import { toast } from 'sonner';
import type { Enrollment } from '../../types';

export const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const isMobile = useMobile();
  
  // Local edit states
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Dynamic data states
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [feeStatus, setFeeStatus] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Validation / Feedback states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setEmail((profile as any).user?.email || (profile as any).email || 'student@example.com');

      setLoadingData(true);
      Promise.all([
        getEnrollmentsForStudent(profile.id),
        getFeeStatus(profile.id)
      ]).then(([enrolls, status]) => {
        setEnrollments(enrolls || []);
        setFeeStatus(status || { status: 'unpaid' });
      }).catch(console.error).finally(() => setLoadingData(false));
    }
  }, [profile]);
  const primaryEnrollment = enrollments[0];

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
      setError('Please enter a valid phone number (e.g. +92 300 123 4567).');
      return;
    }

    setSaving(true);
    try {
      if (profile?.id) {
        await updateProfile(profile.id, {
          full_name: fullName.trim(),
          phone: phone.trim() || null
        });
        await refreshProfile();
        setIsEditing(false);
        setSuccess(true);
        toast.success('Profile updated successfully.');
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save details.');
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const boardLabel = profile?.class?.board?.name || enrollments[0]?.offering?.class?.board?.name || 'FBISE';
  const gradeLabel = profile?.class?.display_name || enrollments[0]?.offering?.class?.display_name || 'Not Enrolled';
  const streamLabel = profile?.stream_obj?.name || profile?.stream || (enrollments[0] as any)?.stream || enrollments[0]?.offering?.stream || 'General Stream';
  
  const paymentStatusLabel = () => {
    const status = feeStatus?.status || 'unpaid';
    if (status === 'paid') return <span className="text-[#22c55e]">Verified & Paid</span>;
    if (status === 'pending') return <span className="text-amber-500">Pending Verification</span>;
    return <span className="text-red-500">Unpaid</span>;
  };

  return (
    <StudentShell>
      {/* Page Header */}
      <SectionHeader
        title="My Profile"
        description="View and update your personal info, course enrollments, and class package details."
      />

      {loadingData ? (
        <div className="card py-16 flex flex-col items-center justify-center gap-3 interactive">
          <div className="w-8 h-8 rounded-full border-2 border-[#E5E5E5] border-t-[#F4C430] animate-spin" />
          <span className="text-xs text-[#737373] font-medium">Loading profile details...</span>
        </div>
      ) : (
        /* Main Grid Layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Side: Avatar Card */}
          <div className="lg:col-span-1 bg-white border border-[#E5E5E5] rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-[#F4C430]" />
            
            {/* Avatar container */}
            <div className="relative w-24 h-24 mx-auto mt-4 mb-4 group cursor-pointer">
              <div className="w-full h-full rounded-2xl bg-[#F4C430] flex items-center justify-center text-3xl font-black text-[#111111] shadow-md border-2 border-white">
                {fullName[0]?.toUpperCase() || 'S'}
              </div>
              
              {/* Upload Hover Indicator */}
              <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Camera size={20} />
              </div>
            </div>

            <h2 className="text-lg font-extrabold text-[#111111]">{fullName}</h2>
            <span className="inline-block bg-[#FAFAFA] border border-[#E5E5E5] text-[#737373] text-[10px] font-bold px-2 py-0.5 rounded-full mt-1.5 uppercase tracking-wide">
              Student Account
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
                    className="text-xs font-bold text-[#737373] hover:text-[#111111] flex items-center gap-1 transition-colors border border-[#E5E5E5] px-2.5 py-1 rounded-lg hover:bg-[#FAFAFA]"
                  >
                    <Edit3 size={12} />
                    Edit details
                  </button>
                )}
              </div>

              {success && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <Check size={14} /> Profile details updated successfully!
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <X size={14} /> {error}
                </div>
              )}

              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  <div className={isMobile ? 'flex flex-col gap-4' : 'grid grid-cols-2 gap-4'}>
                    <div>
                      <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="input w-full mt-1.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wide">Phone Number</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="input w-full mt-1.5"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setIsEditing(false);
                        setFullName(profile?.full_name || '');
                        setPhone(profile?.phone || '');
                        setError(null);
                      }}
                      className="btn btn-ghost border border-[#E5E5E5] hover:bg-[#F5F5F5] font-bold text-xs px-3 py-1.5 disabled:opacity-50 interactive"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn btn-primary font-bold text-xs bg-[#111111] hover:bg-black text-white px-3 py-1.5 disabled:opacity-50 flex items-center justify-center gap-1.5 interactive"
                    >
                      {saving && <Loader2 size={12} className="animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <div className={`py-2 ${isMobile ? 'flex flex-col gap-5' : 'grid grid-cols-2 gap-5'}`}>
                  <div>
                    <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide block">Full Name</span>
                    <span className="text-sm font-bold text-[#111111] mt-1 block">{fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide block">Phone Number</span>
                    <span className="text-sm font-bold text-[#111111] mt-1 block">{phone || '—'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Enrolled Course Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#111111] mb-4 border-b border-[#F5F5F5] pb-3">Course Registration</h3>
              
              <div className={`py-2 ${isMobile ? 'flex flex-col gap-5' : 'grid grid-cols-3 gap-5'}`}>
                <div className="flex gap-2.5">
                  <Award size={18} className="text-[#F4C430] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide block">Exam Board</span>
                    <span className="text-sm font-bold text-[#111111] mt-0.5 block">{boardLabel}</span>
                  </div>
                </div>
                
                <div className="flex gap-2.5">
                  <Book size={18} className="text-[#3b82f6] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide block">Grade / Class</span>
                    <span className="text-sm font-bold text-[#111111] mt-0.5 block">{gradeLabel}</span>
                  </div>
                </div>
                
                <div className="flex gap-2.5">
                  <User size={18} className="text-[#10b981] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide block">Academic Stream</span>
                    <span className="text-sm font-bold text-[#111111] mt-0.5 block capitalize">
                      {streamLabel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl text-[10px] font-bold text-[#737373] text-center">
                Please contact the SHS Academy Administrator if you need to update your registered course or subject combos.
              </div>
            </div>

            {/* Course Enrollment Details Card */}
            <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4 border-b border-[#F5F5F5] pb-3">
                <h3 className="text-sm font-bold text-[#111111]">Course Enrollment Details</h3>
                {enrollments.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md">
                    Active Subscription
                  </span>
                )}
              </div>

              <div className="space-y-4 text-xs font-semibold text-[#525252]">
                <div className="flex justify-between py-1 border-b border-[#FAFAFA]">
                  <span className="text-[#A3A3A3]">Purchased Package</span>
                  <span className="text-[#111111] capitalize">
                    {profile?.class || enrollments[0]?.offering?.class
                      ? `${gradeLabel} ${boardLabel} (${streamLabel})`
                      : 'No Active Package'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAFAFA]">
                  <span className="text-[#A3A3A3]">Enrolled Subjects</span>
                  <span className="text-[#111111] truncate max-w-[200px]" title={getEnrolledSubjectsForStudent(profile, enrollments).join(', ')}>
                    {getEnrolledSubjectsForStudent(profile, enrollments).join(', ') || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAFAFA]">
                  <span className="text-[#A3A3A3]">Enrollment Date</span>
                  <span className="text-[#111111]">
                    {primaryEnrollment?.enrolled_at
                      ? new Date(primaryEnrollment.enrolled_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#FAFAFA]">
                  <span className="text-[#A3A3A3]">Payment Status</span>
                  {paymentStatusLabel()}
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[#A3A3A3]">Access Expires</span>
                  <span className="text-[#111111]">
                    {primaryEnrollment?.enrolled_at
                      ? new Date(new Date(primaryEnrollment.enrolled_at).setFullYear(new Date(primaryEnrollment.enrolled_at).getFullYear() + 1)).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </StudentShell>
  );
};

export default ProfilePage;
