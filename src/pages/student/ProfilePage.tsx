import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  Phone,
  Mail,
  Award,
  Book,
  Edit3,
  Check,
  X,
  Loader2,
  Hash,
  Copy,
  Calendar,
  CreditCard,
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  FileText,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StudentShell from '../../components/student/StudentShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { useAuth } from '../../features/auth/AuthContext';
import {
  updateProfile,
  getEnrollmentsForStudent,
  getFeeStatus,
  getStudentIdForProfile,
  resolveGradeFeeConfig,
} from '../../lib/db';
import { getEnrolledSubjectsForStudent, getStudentBoardLabel, formatGradeDisplay } from '../../lib/taxonomy';
import { useMobile } from '../../hooks/useMobile';
import { toast } from 'sonner';
import type { Enrollment } from '../../types';
import ChatPrivacySettingCard from '../../components/chat/ChatPrivacySettingCard';
import { StudentDataRightsCard } from '../../components/student/StudentDataRightsCard';
import { PushNotificationSettings } from '../../components/common/PushNotificationSettings';
import { validatePakistaniPhoneNumber } from '../../lib/phoneValidation';
import {
  getStudentScholarshipApplication,
  submitScholarshipApplication,
  uploadScholarshipProofFile,
} from '../../lib/scholarshipService';
import { ScholarshipApplication } from '../../types/scholarship';
import { getAcademicConfig } from '../../lib/academicConfig';

export const ProfilePage: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const config = useMemo(() => getAcademicConfig(), []);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  // Dynamic data states
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [feeStatus, setFeeStatus] = useState<any | null>(null);
  const [feeConfig, setFeeConfig] = useState<any | null>(null);
  const [scholarshipApp, setScholarshipApp] = useState<ScholarshipApplication | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Validation / Feedback states
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);

  // Scholarship Review Modal
  const [showScholarshipModal, setShowScholarshipModal] = useState(false);
  const [reviewMarks, setReviewMarks] = useState('');
  const [reviewProofFile, setReviewProofFile] = useState<File | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Handle phone changes with validation
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhone(val);
    setPhoneTouched(true);
    if (val.trim()) {
      const res = validatePakistaniPhoneNumber(val, false);
      setPhoneError(res.isValid ? null : res.error);
    } else {
      setPhoneError(null);
    }
  };

  // Load all profile records
  const loadProfileDetails = useCallback(async () => {
    if (!profile) return;
    try {
      setLoadingData(true);
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');

      // Resolve true student email (hide placeholder emails like student@example.com)
      const rawEmail =
        user?.email ||
        (profile as any).user?.email ||
        (profile as any).email ||
        '';
      const isPlaceholder = !rawEmail || rawEmail.includes('example.com');
      setEmail(isPlaceholder ? '' : rawEmail);

      const [enrolls, status, sId, schApp] = await Promise.all([
        getEnrollmentsForStudent(profile.id).catch(() => []),
        getFeeStatus(profile.id).catch(() => ({ status: 'unpaid' })),
        getStudentIdForProfile(profile.id, rawEmail).catch(() => ''),
        getStudentScholarshipApplication(profile.id).catch(() => null),
      ]);

      setEnrollments(enrolls || []);
      setFeeStatus(status || { status: 'unpaid' });
      setStudentId(sId || '');
      setScholarshipApp(schApp);

      // Resolve fee config for student
      const primaryGrade =
        enrolls?.[0]?.offering?.class?.grade || profile.class_id || '10';
      const resolvedFee = await resolveGradeFeeConfig(
        primaryGrade,
        profile.class_id,
        (profile.board_id as any) || 'fbise',
        undefined,
        profile.id
      );
      setFeeConfig(resolvedFee);
    } catch (err) {
      console.error('Failed to load profile details:', err);
    } finally {
      setLoadingData(false);
    }
  }, [profile, user]);

  useEffect(() => {
    loadProfileDetails();
  }, [loadProfileDetails]);

  // Copy Student ID Helper
  const handleCopyStudentId = () => {
    if (studentId) {
      navigator.clipboard.writeText(studentId);
      setCopiedId(true);
      toast.success(`Copied Student ID #${studentId}`);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Save Personal Details
  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    if (!fullName.trim() || fullName.trim().length < 3) {
      setError('Please provide your full legal name.');
      return;
    }

    let normalizedPhone = phone.trim();
    if (phone.trim()) {
      const res = validatePakistaniPhoneNumber(phone, false);
      if (!res.isValid) {
        setPhoneError(res.error);
        return;
      }
      normalizedPhone = res.normalized;
    }

    setSaving(true);
    setError(null);
    try {
      await updateProfile(profile.id, {
        full_name: fullName.trim(),
        phone: normalizedPhone,
      });
      await refreshProfile();
      setIsEditing(false);
      toast.success('Personal details updated successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to save changes.');
      toast.error(err?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Submit Scholarship Review Request
  const handleSubmitScholarshipReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;

    const marksVal = parseFloat(reviewMarks);
    if (isNaN(marksVal) || marksVal < 60 || marksVal > 100) {
      toast.error('Please enter a valid marks percentage between 60 and 100.');
      return;
    }

    setSubmittingReview(true);
    try {
      let docUrl = '';
      if (reviewProofFile) {
        const uploadRes = await uploadScholarshipProofFile(reviewProofFile);
        docUrl = uploadRes.url;
      }

      const primaryClass = enrollments[0]?.offering?.class;
      const gradeStr = primaryClass?.grade ? String(primaryClass.grade) : '10';

      await submitScholarshipApplication({
        student_id: profile.id,
        applicant_name: fullName.trim(),
        applicant_email: user?.email || '',
        board: profile.board_id || 'fbise',
        class_grade: gradeStr,
        claimed_marks_percentage: marksVal,
        proof_document_url: docUrl,
        admin_notes: 'Submitted via My Profile scholarship review request',
      });

      toast.success('Scholarship review submitted for administrative evaluation.');
      setShowScholarshipModal(false);
      await loadProfileDetails();
    } catch (err: any) {
      toast.error(err?.message || 'Could not submit scholarship review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // ─── Format Labels & Fix "Grade Grade 10" Glitch ───
  const rawGrade =
    profile?.class?.display_name ||
    enrollments[0]?.offering?.class?.display_name ||
    (profile?.class?.grade ? `Grade ${profile.class.grade}` : 'Grade 10');

  // Fix "Grade Grade 10" or "Class Class" duplication
  const cleanGradeLabel = rawGrade
    .replace(/^Grade\s+Grade/gi, 'Grade ')
    .replace(/^Class\s+Class/gi, 'Class ')
    .trim();

  const boardLabel = getStudentBoardLabel(
    profile || {},
    enrollments as any,
    (enrollments || []).map((e) => e.offering).filter(Boolean) as any
  );

  const streamLabel =
    profile?.stream_obj?.name ||
    profile?.stream ||
    (enrollments[0] as any)?.stream ||
    enrollments[0]?.offering?.stream ||
    'General Stream';

  // Enrolled subjects without truncation
  const enrolledSubjectsList = useMemo(() => {
    return getEnrolledSubjectsForStudent(profile, enrollments);
  }, [profile, enrollments]);

  // Expiry & Days Left Math
  const primaryEnrollment = enrollments[0];
  const enrolledAt = primaryEnrollment?.enrolled_at ? new Date(primaryEnrollment.enrolled_at) : new Date();
  const expiryDate = new Date(enrolledAt);
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  const daysLeft = Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  // Next Due Date (estimated for monthly billing)
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + 30);

  // Scholarship status chip
  const scholarshipStatus = scholarshipApp?.status || (feeConfig?.scholarship_status === 'verified' ? 'approved' : 'none');

  return (
    <StudentShell>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SectionHeader
            title="My Profile"
            description="Manage your verified student credentials, enrolled courses, and academy subscriptions."
          />
          <button
            type="button"
            onClick={() => navigate('/student/chat')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-xs min-h-[40px]"
          >
            <MessageCircle size={15} className="text-[#E6A900]" />
            <span>Message Admin</span>
          </button>
        </div>

        {loadingData ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl py-16 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#E6A900]" />
            <span className="text-xs text-slate-500 font-medium">Loading profile details...</span>
          </div>
        ) : (
          /* ─── Responsive Layout: Mobile single col, Desktop 2 cols (Sticky Identity left, details right) ─── */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* ─── Left Column: Sticky Identity Card ─── */}
            <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-4">
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 text-center shadow-xs relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-2 bg-[#E6A900]" />

                {/* Avatar with upload support */}
                <div className="mt-2 mb-4 flex justify-center">
                  <ProfileAvatar
                    avatarUrl={profile?.avatar_url}
                    name={fullName}
                    role="student"
                    size="2xl"
                    editable
                  />
                </div>

                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  {fullName || 'Student'}
                </h2>

                <div className="flex items-center justify-center gap-1.5 mt-2 flex-wrap">
                  <span className="inline-block bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    Student Account
                  </span>
                  {studentId && (
                    <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      <Hash size={10} className="text-amber-600" />
                      <span>#{studentId}</span>
                    </span>
                  )}
                </div>

                {/* Details List & Student ID Copy */}
                <div className="mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 space-y-3">
                  {studentId && (
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <Hash size={14} className="text-amber-600 shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 block font-normal">Student ID</span>
                          <span className="font-mono font-black text-slate-900 dark:text-white">#{studentId}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyStudentId}
                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                        title="Copy Student ID"
                      >
                        {copiedId ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                        <span>{copiedId ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2.5">
                    <Mail size={15} className="text-slate-400 shrink-0" />
                    <span className="truncate">
                      {email || (
                        <span className="text-amber-600 dark:text-amber-400 italic font-normal">
                          Add email via account settings
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-slate-400 shrink-0" />
                    <span className="font-mono">{phone || 'No WhatsApp phone linked'}</span>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="mt-5 w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Edit3 size={13} />
                  <span>Edit Personal Info</span>
                </button>
              </div>
            </div>

            {/* ─── Right Column: Details Sections ─── */}
            <div className="lg:col-span-2 space-y-6">
              {/* ════ 1. PERSONAL DETAILS SECTION ════ */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <User size={16} className="text-[#E6A900]" />
                    <span>Personal Details</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-[#082B5C] dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit details</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Full Legal Name
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                      {fullName || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      WhatsApp Phone
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1 block">
                      {phone || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Google Account
                    </span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block truncate">
                      {email || 'Linked Google Account'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ════ 2. COURSE REGISTRATION SECTION ════ */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Book size={16} className="text-[#E6A900]" />
                    <span>Course Registration</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Exam Board
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                      {boardLabel}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Grade / Class Level
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">
                      {cleanGradeLabel}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Academic Stream
                    </span>
                    <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block capitalize">
                      {streamLabel}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl text-[11px] text-amber-900 dark:text-amber-300">
                  To switch academic streams or add custom subjects, message the administration via Scholario Chat.
                </div>
              </div>

              {/* ════ 3. ENROLLMENT & SUBSCRIPTION CARD ════ */}
              <div className="bg-white dark:bg-[#101726] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3 flex-wrap gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard size={16} className="text-[#E6A900]" />
                    <span>Enrollment &amp; Subscription</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    {feeStatus?.status === 'paid' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        Paid &amp; Active
                      </span>
                    ) : feeStatus?.status === 'pending' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Pending Verification
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Unpaid
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Purchased Package</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {cleanGradeLabel} {boardLabel} ({streamLabel})
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Tuition Fee</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      PKR {(feeConfig?.amount || 3000).toLocaleString()} /{config.billingLabel}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Enrollment Date</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {primaryEnrollment?.enrolled_at
                        ? new Date(primaryEnrollment.enrolled_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Active Registration'}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Next Due Date</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {nextDueDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <span className="text-slate-400">Access Expiry</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {expiryDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          daysLeft <= 0
                            ? 'bg-red-100 text-red-800'
                            : daysLeft <= 7
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {daysLeft <= 0 ? 'Expired' : `${daysLeft} days left`}
                      </span>
                    </div>
                  </div>

                  {/* Enrolled Subjects as Full Pills (No Truncation) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <span className="text-slate-400 block font-semibold">
                      Registered Subjects ({enrolledSubjectsList.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {enrolledSubjectsList.map((sub, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100"
                        >
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ─── Scholarship Row ─── */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Award size={15} className="text-[#E6A900]" />
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        Scholarship Status:
                      </span>
                      <span className="text-xs font-bold capitalize text-amber-800 dark:text-amber-300">
                        {scholarshipStatus === 'approved' || scholarshipApp?.status === 'verified'
                          ? `Approved (${scholarshipApp?.discount_percentage || feeConfig?.scholarship_discount_percentage || 40}% off)`
                          : scholarshipStatus === 'pending'
                          ? 'Under Review'
                          : scholarshipStatus === 'rejected'
                          ? 'Not Eligible'
                          : 'Not Applied'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Merit discounts of up to 60% are granted for 70%+ board marks or improvement candidates.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowScholarshipModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-xs font-bold text-slate-900 dark:text-white transition-colors cursor-pointer shrink-0"
                  >
                    Request Review
                  </button>
                </div>
              </div>

              {/* ════ 4. NOTIFICATIONS & PRIVACY ════ */}
              <PushNotificationSettings />
              <ChatPrivacySettingCard />

              {/* ════ 5. DATA RIGHTS & ERASURE ════ */}
              <StudentDataRightsCard />
            </div>
          </div>
        )}

        {/* ─── Edit Details Modal / Mobile Bottom Sheet ─── */}
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Edit Personal Details
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 text-xs text-red-700 font-semibold">
                  {error}
                </div>
              )}

              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                      WhatsApp Phone Number *
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">🇵🇰 +92 3XXXXXXXXX</span>
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono"
                  />
                  {phoneError && (
                    <p className="text-[11px] text-red-600 font-semibold mt-1">{phoneError}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email || user?.email || ''}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Managed via Google Sign-In</span>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-[#082B5C] hover:bg-[#0c3b7a] text-white text-xs font-black flex items-center gap-1.5"
                  >
                    {saving && <Loader2 size={13} className="animate-spin" />}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Scholarship Review Request Modal ─── */}
        {showScholarshipModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Award size={18} className="text-[#E6A900]" />
                  <span>Request Scholarship Review</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowScholarshipModal(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Submit your previous examination marks or roll number slip for merit fee waiver review:
              </p>

              <form onSubmit={handleSubmitScholarshipReview} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Previous Board Marks Percentage (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    required
                    placeholder="e.g. 88.5"
                    value={reviewMarks}
                    onChange={(e) => setReviewMarks(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    Upload Marksheet / Roll Number Slip (Image or PDF)
                  </label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setReviewProofFile(file);
                    }}
                    className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-200 hover:file:bg-slate-300 cursor-pointer"
                  />
                  {reviewProofFile && (
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                      Attached: {reviewProofFile.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={submittingReview}
                    onClick={() => setShowScholarshipModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 rounded-xl bg-[#082B5C] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    {submittingReview && <Loader2 size={13} className="animate-spin" />}
                    <span>Submit for Review</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
};

export default ProfilePage;
