import React, { useState } from 'react';
import { Mail, Phone, Camera, Edit3, Check, X, ShieldCheck } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import { useAuth } from '../../features/auth/AuthContext';
import { updateProfile, getDashboardCounts } from '../../lib/db';
import { useMobile } from '../../hooks/useMobile';

export const ProfilePage: React.FC = () => {
  const isMobile = useMobile();
  const { profile, user, refreshProfile } = useAuth();
  const [counts, setCounts] = useState({ students: 0, teachers: 0, offerings: 0, announcements: 0 });
  
  // Local edit states
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  
  // Validation / Feedback states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setEmail(user?.email || 'admin@example.com');
    }
  }, [profile, user]);

  React.useEffect(() => {
    getDashboardCounts().then(setCounts).catch(console.error);
  }, []);

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

  const adminPermissions = [
    { name: 'Schedule Management', desc: 'Create, modify, or cancel class timetable slots.', active: true },
    { name: 'Teacher Records', desc: 'Add new staff members, toggle status, and edit workloads.', active: true },
    { name: 'Student Enrollments', desc: 'Register students, view stream stats, and modify details.', active: true },
    { name: 'Notes & Syllabus Manager', desc: 'Upload chapter notes, reference files, and study sheets.', active: true },
    { name: 'System Announcements', desc: 'Broadcast global alerts and notifications to all student portals.', active: true },
  ];

  return (
    <AdminShell>
      {/* Page Header */}
      <SectionHeader
        title="Admin Profile"
        subtitle="Manage your administrator details, review system access privileges, and check platform statistics."
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Avatar Card */}
        <div className="lg:col-span-1 bg-white border border-[#E5E5E5] rounded-2xl p-6 text-center shadow-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-[#F4C430]" />
          
          {/* Avatar container */}
          <div className={`relative mx-auto mt-4 mb-4 group cursor-pointer ${isMobile ? 'w-28 h-28' : 'w-24 h-24'}`}>
            <div className={`w-full h-full rounded-2xl bg-[#F4C430] flex items-center justify-center font-black text-[#111111] shadow-md border-2 border-white ${isMobile ? 'text-4xl' : 'text-3xl'}`}>
              {fullName[0]?.toUpperCase() || 'A'}
            </div>
            <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
          </div>

          <h2 className="text-lg font-extrabold text-[#111111]">{fullName}</h2>
          <span className="inline-block bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 uppercase tracking-wide">
            Administrator Staff
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
                  className="btn btn-ghost btn-xs text-[#737373] hover:text-[#111111] interactive"
                >
                  <Edit3 size={12} className="inline mr-1" /> Edit
                </button>
              )}
            </div>

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs font-semibold">
                ✓ Profile updated successfully!
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                ⚠️ {error}
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1 block">Full Name</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1 block">Phone Number</label>
                    <input
                      type="text"
                      className="input text-sm"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1 block">Email (Login Identity)</label>
                  <input
                    type="email"
                    className="input text-sm opacity-50 cursor-not-allowed bg-zinc-50"
                    value={email}
                    disabled
                  />
                  <p className="text-[10px] text-[#A3A3A3] mt-1">To change login credentials, contact system administrators.</p>
                </div>

                <div className={`flex gap-2 pt-3 border-t border-[#F5F5F5] ${isMobile ? 'flex-col-reverse mt-2' : 'justify-end mt-4'}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setFullName(profile?.full_name || 'Ahmad Khan');
                      setPhone(profile?.phone || '+92 321 987 6543');
                      setIsEditing(false);
                      setError(null);
                    }}
                    className={`btn btn-ghost font-bold ${isMobile ? 'py-3 w-full border border-[#E5E5E5] bg-[#FAFAFA]' : 'btn-sm'}`}
                  >
                    <X size={14} className="inline mr-1" /> Cancel
                  </button>
                  <button type="submit" className={`btn btn-gold font-bold ${isMobile ? 'py-3 w-full text-sm' : 'btn-sm'}`}>
                    <Check size={14} className="inline mr-1" /> Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-xs mt-2">
                <div>
                  <span className="text-[#A3A3A3] font-bold block uppercase tracking-wider text-[10px]">Full Name</span>
                  <span className="font-extrabold text-[#111111] text-sm mt-0.5 block">{fullName}</span>
                </div>
                <div>
                  <span className="text-[#A3A3A3] font-bold block uppercase tracking-wider text-[10px]">Phone Number</span>
                  <span className="font-extrabold text-[#111111] text-sm mt-0.5 block">{phone || '—'}</span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[#A3A3A3] font-bold block uppercase tracking-wider text-[10px]">Primary Email</span>
                  <span className="font-extrabold text-[#111111] text-sm mt-0.5 block">{email}</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Admin Statistics Card */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#111111] mb-4 border-b border-[#F5F5F5] pb-3">Platform Scope Statistics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-[#EFF6FF] border border-[#EFF6FF] rounded-xl">
                <span className="text-2xl font-black text-[#3b82f6]">{counts.students}</span>
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wide block mt-1">Students</span>
              </div>
              <div className="p-3 bg-[#FFFBF0] border border-[#FFFBF0] rounded-xl">
                <span className="text-2xl font-black text-[#F4C430]">{counts.teachers}</span>
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wide block mt-1">Teachers</span>
              </div>
              <div className="p-3 bg-[#FAF5FF] border border-[#FAF5FF] rounded-xl">
                <span className="text-2xl font-black text-[#a855f7]">{counts.offerings}</span>
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wide block mt-1">Active Offerings</span>
              </div>
              <div className="p-3 bg-[#F0FDF4] border border-[#F0FDF4] rounded-xl">
                <span className="text-2xl font-black text-[#22c55e]">{counts.announcements || 0}</span>
                <span className="text-[10px] font-bold text-[#737373] uppercase tracking-wide block mt-1">Broadcasts</span>
              </div>
            </div>
          </div>

          {/* System Permissions Card */}
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-[#111111] mb-4 border-b border-[#F5F5F5] pb-3">Staff Role Permissions</h3>
            <div className="space-y-3.5">
              {adminPermissions.map((perm) => (
                <div key={perm.name} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-green-50 border border-green-200 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck size={12} className="text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111111]">{perm.name}</h4>
                    <p className="text-[11px] text-[#737373] leading-relaxed font-medium mt-0.5">{perm.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default ProfilePage;
