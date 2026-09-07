import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, ChevronRight, Loader2, ShieldCheck, GraduationCap, Briefcase } from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import ThemeToggleSwitch from './ThemeToggleSwitch';
import { useTheme } from '../../context/ThemeContext';
import type { Profile } from '../../types';

interface ProfileDropdownMenuProps {
  profile: Profile | null;
  role: 'admin' | 'teacher' | 'student';
  onSignOut?: () => Promise<void> | void;
  isSigningOut?: boolean;
  align?: 'right' | 'left';
  className?: string;
  avatarSize?: 'sm' | 'md' | 'lg';
}

export const ProfileDropdownMenu: React.FC<ProfileDropdownMenuProps> = ({
  profile,
  role,
  onSignOut,
  isSigningOut = false,
  align = 'right',
  className = '',
  avatarSize = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { isDark } = useTheme();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const profilePath =
    role === 'admin'
      ? '/admin/profile'
      : role === 'teacher'
      ? '/teacher/profile'
      : '/student/profile';

  const roleLabel =
    role === 'admin'
      ? 'Administrator'
      : role === 'teacher'
      ? 'Faculty Teacher'
      : profile?.class?.display_name || 'SHS Student';

  const RoleIcon =
    role === 'admin'
      ? ShieldCheck
      : role === 'teacher'
      ? Briefcase
      : GraduationCap;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        id="profile-dropdown-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={profile?.full_name || 'Profile & Settings'}
        className="rounded-xl overflow-hidden hover:scale-105 active:scale-95 transition-all p-0.5 border border-transparent focus:outline-hidden focus:ring-2 focus:ring-[#F4C430] cursor-pointer"
      >
        <ProfileAvatar
          avatarUrl={profile?.avatar_url}
          name={profile?.full_name ?? (role === 'admin' ? 'Administrator' : role === 'teacher' ? 'Teacher' : 'Student')}
          role={role}
          size={avatarSize}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="profile-dropdown-menu"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="profile-dropdown-trigger"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-72 sm:w-80 rounded-2xl shadow-2xl border transition-all z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden ${
            isDark
              ? 'bg-[#18181B] border-[#27272A] text-[#F4F4F5] divide-[#27272A]'
              : 'bg-white border-[#E5E5E5] text-[#111111] divide-[#F0F0F0]'
          } divide-y`}
        >
          {/* Section 1: User Identity Card */}
          <div className="p-4 flex items-center gap-3">
            <ProfileAvatar
              avatarUrl={profile?.avatar_url}
              name={profile?.full_name ?? 'User'}
              role={role}
              size="md"
              className="shrink-0 ring-2 ring-[#F4C430]/30"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-extrabold text-sm truncate leading-tight">
                  {profile?.full_name || 'Account'}
                </span>
              </div>
              <p className="text-xs text-[#71717A] truncate">
                {(profile as any)?.email || profile?.phone || 'Active Member'}
              </p>
              <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md bg-[#F4C430]/15 text-[#D4A017] text-[10px] font-extrabold tracking-wide uppercase">
                <RoleIcon size={11} />
                <span>{roleLabel}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Account Navigation */}
          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                navigate(profilePath);
              }}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                isDark
                  ? 'hover:bg-[#27272A] text-[#E4E4E7]'
                  : 'hover:bg-[#F5F5F5] text-[#262626]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-[#27272A] text-[#A1A1AA]' : 'bg-[#F5F5F5] text-[#737373]'
                  }`}
                >
                  <User size={16} />
                </div>
                <span>Profile & Account Settings</span>
              </div>
              <ChevronRight size={14} className="text-[#71717A]" />
            </button>
          </div>

          {/* Section 3: Appearance & Theme Toggle */}
          <div className="p-2">
            <div className="px-2 pt-1 pb-1.5">
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#71717A]">
                Appearance
              </span>
            </div>
            <ThemeToggleSwitch variant="switch" />
          </div>

          {/* Section 4: Sign Out */}
          {onSignOut && (
            <div className="p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setIsOpen(false);
                  await onSignOut();
                }}
                disabled={isSigningOut}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer text-red-600 ${
                  isDark ? 'hover:bg-red-950/30' : 'hover:bg-red-50'
                } disabled:opacity-50`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isDark ? 'bg-red-950/40 text-red-400' : 'bg-red-50 text-red-600'
                  }`}
                >
                  {isSigningOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                </div>
                <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileDropdownMenu;
