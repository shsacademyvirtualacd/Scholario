import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Award, Book, Edit3, Check, X, Loader2, Hash } from 'lucide-react';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { useAuth } from '../../features/auth/AuthContext';
import { updateProfile, getEnrollmentsForStudent, getFeeStatus, getStudentIdForProfile } from '../../lib/db';
import { getEnrolledSubjectsForStudent } from '../../lib/taxonomy';
import { useMobile } from '../../hooks/useMobile';
import { toast } from 'sonner';
import type { Enrollment } from '../../types';
import ChatPrivacySettingCard from '../../components/chat/ChatPrivacySettingCard';
import { validatePakistaniPhoneNumber } from '../../lib/phoneValidation';

export const ProfilePage: React.FC = () => {
  const { profile, refreshProfile } = useAuth();
  const isMobile = useMobile();
  
  // Local edit states
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  
  // Dynamic data states
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [feeStatus, setFeeStatus] = useState<any | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Validation / Feedback states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);
  const [suggestedFix, setSuggestedFix] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    setPhoneTouched(true);

    if (val.trim()) {
      const res = validatePakistaniPhoneNumber(val, false);
      if (!res.isValid) {
        setPhoneError(res.error);
        setSuggestedFix(res.suggestedFix || null);
      } else {
        setPhoneError(null);
        setSuggestedFix(null);
      }
    } else {
      setPhoneError(null);
      setSuggestedFix(null);
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    if (phone.trim()) {
      const res = validatePakistaniPhoneNumber(phone, false);
      if (!res.isValid) {
        setPhoneError(res.error);
        setSuggestedFix(res.suggestedFix || null);
      } else {
        setPhoneError(null);
        setSuggestedFix(null);
      }
    } else {
      setPhoneError(null);
      setSuggestedFix(null);
    }
  };

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      const currentEmail = (profile as any).user?.email || (profile as any).email || 'student@example.com';
      setEmail(currentEmail);

      setLoadingData(true);
      Promise.all([
        getEnrollmentsForStudent(profile.id),
        getFeeStatus(profile.id),
        getStudentIdForProfile(profile.id, currentEmail)
      ]).then(([enrolls, status, sId]) => {
        setEnrollments(enrolls || []);
        setFeeStatus(status || { status: 'unpaid' });
        setStudentId(sId);
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

    let normalizedPhone: string | null = null;
    if (phone && phone.trim()) {
      const phoneValidation = validatePakistaniPhoneNumber(phone, false);
      if (!phoneValidation.isValid) {
        setPhoneTouched(true);
        setPhoneError(phoneValidation.error);
        setSuggestedFix(phoneValidation.suggestedFix || null);
        setError(phoneValidation.error);
        toast.error(phoneValidation.error);
        return;
      }
      normalizedPhone = phoneValidation.normalized;
    }

    setSaving(true);
    try {
      if (profile?.id) {
        await updateProfile(profile.id, {
          full_name: fullName.trim(),
          phone: normalizedPhone
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
            
            {/* Avatar container with R2 upload/change support */}
            <div className="mt-4 mb-4">
              <ProfileAvatar
                avatarUrl={profile?.avatar_url}
                name={fullName}
                role="student"
                size="2xl"
                editable
              />
            </div>

            <h2 className="text-lg font-extrabold text-[#111111]">{fullName}</h2>
            <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-block bg-[#FAFAFA] border border-[#E5E5E5] text-[#737373] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Student Account
              </span>
              {studentId && (
                <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full">
                  <Hash size={10} className="text-amber-600 shrink-0" />
                  <span>Student ID: #{studentId}</span>
                </span>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-[#F5F5F5] space-y-3.5 text-left text-xs font-semibold text-[#525252]">
              {studentId && (
                <div className="flex items-center gap-3">
                  <Hash size={15} className="text-[#A3A3A3] shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#737373] font-sans font-medium">Student ID:</span>
                    <span className="font-mono font-bold text-[#111111]">#{studentId}</span>
                  </div>
                </div>
              )}
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
                  <div className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wide block">Student ID</span>
                      <span className="text-xs font-mono font-bold text-[#111111]">#{studentId || '—'}</span>
                    </div>
                    <span className="text-[10px] bg-white border border-[#E5E5E5] text-[#737373] px-2 py-0.5 rounded-full font-medium">Permanent Credential</span>
                  </div>

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
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-bold text-[#737373] uppercase tracking-wide">Phone Number</label>
                        <span className="text-[10px] text-[#A3A3A3] font-medium">🇵🇰 +92 3XXXXXXXXX</span>
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        placeholder="+92 3058969050"
                        className={`input w-full mt-1.5 transition-colors ${
                          phoneError && phoneTouched
                            ? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                            : ''
                        }`}
                      />
                      {phoneError && phoneTouched && (
                        <div className="mt-1 text-left">
                          <p className="text-[11px] text-red-600 font-semibold leading-tight">
                            {phoneError}
                          </p>
                          {suggestedFix && (
                            <button
                              type="button"
                              onClick={() => {
                                setPhone(suggestedFix);
                                setPhoneError(null);
                                setSuggestedFix(null);
                              }}
                              className="text-[10px] text-indigo-600 font-bold underline mt-0.5 inline-block hover:text-indigo-800 cursor-pointer"
                            >
                              Auto-fix to {suggestedFix}
                            </button>
                          )}
                        </div>
                      )}
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
                <div className={`py-2 ${isMobile ? 'flex flex-col gap-5' : 'grid grid-cols-3 gap-5'}`}>
                  <div>
                    <span className="text-[10px] font-bold text-[#A3A3A3] uppercase tracking-wide block">Student ID</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Hash size={13} className="text-amber-600 shrink-0" />
                      <span className="text-sm font-mono font-bold text-[#111111]">#{studentId || '—'}</span>
                    </div>
                  </div>
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
                Please contact the SHS Virtual Academy Administrator if you need to update your registered course or subject combos.
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

            {/* Chat Presence & Privacy Card */}
            <ChatPrivacySettingCard />
          </div>
        </div>
      )}
    </StudentShell>
  );
};

export default ProfilePage;
