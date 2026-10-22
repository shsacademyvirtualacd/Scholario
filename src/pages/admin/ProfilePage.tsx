import React, { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Edit3,
  Check,
  X,
  ShieldCheck,
  Loader2,
  Copy,
  Users,
  GraduationCap,
  BookMarked,
  Megaphone,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { useAuth } from '../../features/auth/AuthContext';
import { updateProfile, getDashboardCounts } from '../../lib/db';
import { useMobile } from '../../hooks/useMobile';
import { toast } from 'sonner';
import { validatePakistaniPhoneNumber } from '../../lib/phoneValidation';
import { deleteProfilePicture } from '../../lib/avatarService';
import NotificationsAndPrivacyCard from '../../components/common/NotificationsAndPrivacyCard';

export const ProfilePage: React.FC = () => {
  const isMobile = useMobile();
  const { profile, user, refreshProfile } = useAuth();
  const [counts, setCounts] = useState({ students: 0, teachers: 0, offerings: 0, announcements: 0 });

  // Local edit states
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Copy state
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Avatar action dropdown
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  // Collapsible permissions on mobile
  const [permissionsExpanded, setPermissionsExpanded] = useState(false);

  // Validation / Feedback states
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState<boolean>(false);
  const [suggestedFix, setSuggestedFix] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setEmail(user?.email || (profile as any)?.email || 'admin@scholario.pk');
    }
  }, [profile, user]);

  useEffect(() => {
    getDashboardCounts().then(setCounts).catch(console.error);
  }, []);

  const handleCopy = (text: string, type: 'email' | 'phone') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPhone(true);
      toast.success('Phone copied to clipboard');
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

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

  const handleRemovePhoto = async () => {
    setAvatarMenuOpen(false);
    if (!profile?.avatar_url || removingAvatar) return;
    setRemovingAvatar(true);
    try {
      await deleteProfilePicture();
      await refreshProfile();
      toast.success('Profile picture removed.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove picture.');
    } finally {
      setRemovingAvatar(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
          phone: normalizedPhone,
        });
        await refreshProfile();
        setIsEditing(false);
        toast.success('Profile updated successfully.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const adminPermissions = [
    { name: 'Schedule Management', desc: 'Create, modify, or cancel class timetable slots.' },
    { name: 'Teacher Records', desc: 'Add new staff members, toggle status, and edit workloads.' },
    { name: 'Student Enrollments', desc: 'Register students, view stream stats, and modify details.' },
    { name: 'Notes & Syllabus Manager', desc: 'Upload chapter notes, reference files, and study sheets.' },
    { name: 'System Announcements', desc: 'Broadcast global alerts and notifications to all student portals.' },
  ];

  return (
    <AdminShell>
      <div className="max-w-[1000px] mx-auto space-y-6">
        {/* Page Header */}
        <SectionHeader
          title="Admin Profile"
          subtitle="Manage your administrator details, review system access privileges, and check platform statistics."
        />

        {/* ── Responsive 2-Column Layout (Sticky Left on Desktop, Stacked Right) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* ════ Left Column: Sticky Identity Card (~320px) ════ */}
          <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-4">
            <div className="bg-white dark:bg-[#101726] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 text-center shadow-xs relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-[#F2C230]" />

              {/* Top right "⋯" menu for avatar removal */}
              {profile?.avatar_url && (
                <div className="absolute top-4 right-4 z-20">
                  <button
                    type="button"
                    onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Avatar options"
                    aria-label="Avatar options"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {avatarMenuOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl py-1 text-xs z-30">
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={removingAvatar}
                        className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-bold cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Remove Photo</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 96px rounded avatar with camera badge button for "Change Photo" */}
              <div className="mt-2 mb-4 flex justify-center">
                <ProfileAvatar
                  avatarUrl={profile?.avatar_url}
                  name={fullName}
                  role="admin"
                  size="2xl"
                  editable
                />
              </div>

              {/* Name (22px bold) */}
              <h2 className="text-[22px] font-black text-neutral-900 dark:text-white leading-tight">
                {fullName || 'Administrator'}
              </h2>

              {/* Role pill: ADMINISTRATOR STAFF */}
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="inline-block bg-[#F2C230]/15 border border-[#F2C230]/30 text-[#B45309] dark:text-[#F2C230] text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  ADMINISTRATOR STAFF
                </span>
              </div>

              {/* Contact rows with copy-on-tap */}
              <div className="mt-5 pt-5 border-t border-neutral-100 dark:border-neutral-800 text-left text-xs font-semibold space-y-2.5">
                {/* Email row with copy */}
                <div
                  onClick={() => handleCopy(email, 'email')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer group"
                  title="Click to copy email"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Mail size={15} className="text-neutral-400 shrink-0" />
                    <span className="truncate text-neutral-700 dark:text-neutral-300 font-medium">
                      {email}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-1 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200"
                    aria-label="Copy email"
                  >
                    {copiedEmail ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>

                {/* Phone row with copy */}
                <div
                  onClick={() => handleCopy(phone || '+92 300 0000000', 'phone')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer group"
                  title="Click to copy phone"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Phone size={15} className="text-neutral-400 shrink-0" />
                    <span className="truncate font-mono text-neutral-700 dark:text-neutral-300 font-medium">
                      {phone || 'No phone linked'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-1 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200"
                    aria-label="Copy phone"
                  >
                    {copiedPhone ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ════ Right Column: Details & Settings Stack ════ */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── 1. Personal Details Card (Editable rows here only) ── */}
            <div className="bg-white dark:bg-[#101726] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    <span>Personal Details</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Your institutional contact records and login profile.
                  </p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-neutral-800 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSave} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                        Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full text-xs font-bold px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#F2C230]/40"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
                          Phone Number
                        </label>
                        <span className="text-[10px] text-neutral-400 font-mono">🇵🇰 +92 3XXXXXXXXX</span>
                      </div>
                      <input
                        type="text"
                        value={phone}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        placeholder="+92 3058969050"
                        className={`w-full text-xs font-bold px-3 py-2 border rounded-xl bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 ${
                          phoneError && phoneTouched
                            ? 'border-red-500 focus:ring-red-500/30'
                            : 'border-neutral-300 dark:border-neutral-700 focus:ring-[#F2C230]/40'
                        }`}
                      />
                      {phoneError && phoneTouched && (
                        <div className="mt-1">
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
                              className="text-[10px] text-[#B45309] dark:text-[#F2C230] font-bold underline mt-0.5 inline-block cursor-pointer"
                            >
                              Auto-fix to {suggestedFix}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block mb-1">
                      Email (Login Google Account)
                    </label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full text-xs font-bold px-3 py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-100 dark:bg-neutral-900 text-neutral-500 cursor-not-allowed opacity-80"
                    />
                    <p className="text-[10px] text-neutral-400 mt-1">
                      Managed through your linked Google workspace account.
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => {
                        setFullName(profile?.full_name || '');
                        setPhone(profile?.phone || '');
                        setIsEditing(false);
                        setError(null);
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                    >
                      <X size={13} className="inline mr-1" />
                      <span>Cancel</span>
                    </button>

                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-[#F2C230] hover:bg-amber-400 text-neutral-950 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Check size={13} />
                      )}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">
                      Full Legal Name
                    </span>
                    <span className="text-sm font-black text-neutral-900 dark:text-white mt-1 block">
                      {fullName || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">
                      Phone Number
                    </span>
                    <span className="text-sm font-mono font-bold text-neutral-900 dark:text-white mt-1 block">
                      {phone || '—'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wide block">
                      Primary Email
                    </span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white mt-1 block truncate">
                      {email || '—'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── 2. Platform Scope Statistics (2x2 grid, single 10% gold tint for ALL tiles) ── */}
            <div className="bg-white dark:bg-[#101726] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                  Platform Scope Statistics
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Real-time operational scope across the academy.
                </p>
              </div>

              {/* 2x2 grid of equal glass tiles, 28px bold number + gold icon, 12px letter-spaced label, single 10% gold tint */}
              <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                {/* Tile 1: Students */}
                <div className="bg-[#F2C230]/10 border border-[#F2C230]/20 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[28px] font-black text-neutral-900 dark:text-neutral-100 leading-none">
                      {counts.students}
                    </span>
                    <Users size={20} className="text-[#F2C230]" />
                  </div>
                  <span className="text-[12px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Students
                  </span>
                </div>

                {/* Tile 2: Teachers */}
                <div className="bg-[#F2C230]/10 border border-[#F2C230]/20 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[28px] font-black text-neutral-900 dark:text-neutral-100 leading-none">
                      {counts.teachers}
                    </span>
                    <GraduationCap size={20} className="text-[#F2C230]" />
                  </div>
                  <span className="text-[12px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Teachers
                  </span>
                </div>

                {/* Tile 3: Active Offerings */}
                <div className="bg-[#F2C230]/10 border border-[#F2C230]/20 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[28px] font-black text-neutral-900 dark:text-neutral-100 leading-none">
                      {counts.offerings}
                    </span>
                    <BookMarked size={20} className="text-[#F2C230]" />
                  </div>
                  <span className="text-[12px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Active Offerings
                  </span>
                </div>

                {/* Tile 4: Broadcasts */}
                <div className="bg-[#F2C230]/10 border border-[#F2C230]/20 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[28px] font-black text-neutral-900 dark:text-neutral-100 leading-none">
                      {counts.announcements || 0}
                    </span>
                    <Megaphone size={20} className="text-[#F2C230]" />
                  </div>
                  <span className="text-[12px] font-extrabold uppercase tracking-wider text-neutral-600 dark:text-neutral-400">
                    Broadcasts
                  </span>
                </div>
              </div>
            </div>

            {/* ── 3. Staff Role Permissions (32px gold shield icons, 15px title, collapsible on mobile) ── */}
            <div className="bg-white dark:bg-[#101726] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                    Staff Role Permissions
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Authorized system scopes assigned to your administrator account.
                  </p>
                </div>

                {/* Mobile Accordion Toggle */}
                <button
                  type="button"
                  onClick={() => setPermissionsExpanded(!permissionsExpanded)}
                  className="sm:hidden px-3 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 cursor-pointer"
                >
                  <span>{permissionsExpanded ? 'Hide' : 'View'}</span>
                  {permissionsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {/* Permissions list (collapsible on mobile, always visible on tablet/desktop) */}
              <div
                className={`space-y-3.5 ${
                  !permissionsExpanded ? 'hidden sm:block' : 'block animate-in fade-in duration-150'
                }`}
              >
                {adminPermissions.map((perm) => (
                  <div key={perm.name} className="flex items-start gap-3.5">
                    {/* 32px gold shield icon */}
                    <div className="w-8 h-8 rounded-xl bg-[#F2C230]/15 text-[#B45309] dark:text-[#F2C230] border border-[#F2C230]/30 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      {/* Title: 15px bold */}
                      <h4 className="text-[15px] font-bold text-neutral-900 dark:text-neutral-100 leading-snug">
                        {perm.name}
                      </h4>
                      {/* 1-line description */}
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                        {perm.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 4. Notifications & Privacy (Consolidated ONE glass card with divider) ── */}
            <NotificationsAndPrivacyCard />
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default ProfilePage;
