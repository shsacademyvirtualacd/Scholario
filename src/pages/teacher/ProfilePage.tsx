import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Calendar,
  BookOpen,
  Check,
  Copy,
  MoreVertical,
  Trash2,
  Layers,
} from 'lucide-react';
import TeacherShell from '../../components/teacher/TeacherShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { useAuth } from '../../features/auth/AuthContext';
import { getOfferingsForTeacher } from '../../lib/db';
import { toast } from 'sonner';
import { deleteProfilePicture } from '../../lib/avatarService';
import NotificationsAndPrivacyCard from '../../components/common/NotificationsAndPrivacyCard';
import type { ClassOffering } from '../../types';

export const ProfilePage: React.FC = () => {
  const { profile, user, refreshProfile } = useAuth();

  // Local info states
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState('');
  const [joiningDate, setJoiningDate] = useState<string>('');

  // Copy states
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedDate, setCopiedDate] = useState(false);

  // Avatar menu
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [removingAvatar, setRemovingAvatar] = useState(false);

  // Classes
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');

      setLoadingClasses(true);
      getOfferingsForTeacher(profile.id)
        .then((data) => {
          setClasses(data);
          if (data.length > 0 && data[0].teacher) {
            setEmail(data[0].teacher.email || user?.email || (profile as any)?.email || '');
            setJoiningDate(data[0].teacher.joining_date || '');
          } else {
            setEmail(user?.email || (profile as any)?.email || '');
            setJoiningDate('');
          }
        })
        .catch((err) => {
          console.error(err);
          setEmail(user?.email || (profile as any)?.email || '');
          setJoiningDate('');
        })
        .finally(() => {
          setLoadingClasses(false);
        });
    }
  }, [profile, user]);

  const handleCopy = (text: string, type: 'email' | 'date') => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      toast.success('Email copied to clipboard');
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedDate(true);
      toast.success('Joining date copied');
      setTimeout(() => setCopiedDate(false), 2000);
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

  // Group classes by subject
  const groupedClasses = useMemo(() => {
    const map = new Map<string, ClassOffering[]>();
    classes.forEach((cls) => {
      const subj = cls.subject_name || cls.subject || 'General Subject';
      if (!map.has(subj)) {
        map.set(subj, []);
      }
      map.get(subj)!.push(cls);
    });

    return Array.from(map.entries()).map(([subject, items]) => ({
      subject,
      items,
    }));
  }, [classes]);

  const formattedJoinDate = joiningDate
    ? new Date(joiningDate).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Active Faculty';

  return (
    <TeacherShell>
      <div className="max-w-[1000px] mx-auto space-y-6">
        {/* Page Header */}
        <SectionHeader
          title="Teacher Profile"
          subtitle="Manage your professional details, view assigned academic workload classes, and review joining statistics."
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
                  role="teacher"
                  size="2xl"
                  editable
                />
              </div>

              {/* Name (22px bold) */}
              <h2 className="text-[22px] font-black text-neutral-900 dark:text-white leading-tight">
                {fullName || 'Faculty Instructor'}
              </h2>

              {/* Role pill: FACULTY MEMBER */}
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <span className="inline-block bg-[#F2C230]/15 border border-[#F2C230]/30 text-[#B45309] dark:text-[#F2C230] text-[10px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider">
                  FACULTY MEMBER
                </span>
              </div>

              {/* Contact & Joining rows with copy-on-tap */}
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
                      {email || 'No email registered'}
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

                {/* Joining date row with copy */}
                <div
                  onClick={() => handleCopy(formattedJoinDate, 'date')}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer group"
                  title="Click to copy joining date"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Calendar size={15} className="text-neutral-400 shrink-0" />
                    <span className="truncate text-neutral-700 dark:text-neutral-300 font-medium">
                      Joined: {formattedJoinDate}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="p-1 text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200"
                    aria-label="Copy joined date"
                  >
                    {copiedDate ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ════ Right Column: Details & Workload Stack ════ */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── 1. Personal Details Card (Read-only for teacher, no edit permission exists) ── */}
            <div className="bg-white dark:bg-[#101726] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3">
                <h3 className="text-sm font-black text-neutral-900 dark:text-white">
                  Personal Details
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Instructor profile information registered in the academic directory.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                    Institutional Email
                  </span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-white mt-1 block truncate">
                    {email || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 2. Assigned Classes & Subjects (Grouped by subject with count badge & chips) ── */}
            <div className="bg-white dark:bg-[#101726] border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-neutral-100 dark:border-neutral-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-neutral-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={16} className="text-[#F2C230]" />
                    <span>Assigned Classes & Subjects</span>
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Your scheduled academic subjects and active teaching cohorts.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                  {classes.length} Total {classes.length === 1 ? 'Class' : 'Classes'}
                </span>
              </div>

              {loadingClasses ? (
                <div className="py-8 flex items-center justify-center gap-2 text-xs text-neutral-500">
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400/20 border-t-[#F2C230] animate-spin" />
                  <span>Loading academic workload...</span>
                </div>
              ) : groupedClasses.length === 0 ? (
                <div className="py-8 text-center text-xs text-neutral-400 italic">
                  No active class offerings assigned to you yet. Contact administrator to update your timetable.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {groupedClasses.map(({ subject, items }) => (
                    <div
                      key={subject}
                      className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800/80 space-y-2.5"
                    >
                      {/* Subject Header + Badge */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers size={15} className="text-[#F2C230]" />
                          <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 dark:text-neutral-100">
                            {subject}
                          </h4>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#F2C230]/15 border border-[#F2C230]/30 text-[#B45309] dark:text-[#F2C230] text-[10px] font-extrabold uppercase">
                          {items.length} {items.length === 1 ? 'class' : 'classes'}
                        </span>
                      </div>

                      {/* Chips for Grade & Board */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {items.map((cls) => {
                          const bName = String(
                            cls.board ||
                              (cls as any).class?.board?.name ||
                              (cls as any).class?.board_id ||
                              (cls as any).board_name ||
                              'Curriculum'
                          ).toUpperCase();

                          return (
                            <span
                              key={cls.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 shadow-2xs"
                            >
                              <span>Grade {cls.grade}</span>
                              <span className="text-neutral-400 font-normal">·</span>
                              <span className="text-[#B45309] dark:text-[#F2C230] font-bold">{bName}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 3. Notifications & Privacy (Consolidated ONE glass card with divider) ── */}
            <NotificationsAndPrivacyCard />
          </div>
        </div>
      </div>
    </TeacherShell>
  );
};

export default ProfilePage;
