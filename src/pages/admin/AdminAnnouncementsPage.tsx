import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Megaphone,
  Calendar,
  Sparkles,
  CheckCircle2,
  Loader2,
  Eye,
  Edit3,
  Globe,
  LayoutDashboard,
  Users,
  GraduationCap,
  RotateCcw,
  Check,
  X,
  ArrowRight,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { toast } from 'sonner';
import { useAuth } from '../../features/auth/AuthContext';
import {
  getAdminAnnouncements,
  saveAnnouncement,
  toggleAnnouncementActive,
  deleteAnnouncementById,
  resetAnnouncementDismissals,
} from '../../lib/announcementService';
import type { Announcement, AnnouncementType } from '../../types';

export const AdminAnnouncementsPage: React.FC = () => {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'dashboard'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal State for Create/Edit
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewTab, setPreviewTab] = useState<'write' | 'preview'>('write');

  // Form states
  const [formType, setFormType] = useState<AnnouncementType>('dashboard');
  const [formRoles, setFormRoles] = useState<string[]>(['all']);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formBadge, setFormBadge] = useState('');
  const [formActionLabel, setFormActionLabel] = useState('');
  const [formActionUrl, setFormActionUrl] = useState('');
  const [formSeverity, setFormSeverity] = useState<'normal' | 'crucial'>('normal');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formStartsAt, setFormStartsAt] = useState('');
  const [formEndsAt, setFormEndsAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Live Preview Modal State (shows actual student/public preview)
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAdminAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      console.error('[AdminAnnouncements] Fetch error:', err);
      toast.error('Failed to load announcements: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const openCreateModal = (type: AnnouncementType = 'dashboard') => {
    setEditingId(null);
    setFormType(type);
    setFormRoles(type === 'public' ? ['all'] : ['student']);
    setFormTitle('');
    setFormBody('');
    setFormBadge(type === 'public' ? 'Admissions Open' : 'Platform Guide');
    setFormActionLabel(type === 'public' ? 'Enroll Now' : 'Explore Feature');
    setFormActionUrl(type === 'public' ? '/register' : '/student/schedule');
    setFormSeverity('normal');
    setFormIsActive(true);
    setFormStartsAt(new Date().toISOString().slice(0, 16));
    setFormEndsAt('');
    setPreviewTab('write');
    setIsEditModalOpen(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingId(ann.id);
    setFormType(ann.announcement_type || 'dashboard');
    setFormRoles(Array.isArray(ann.target_roles) ? ann.target_roles : ['all']);
    setFormTitle(ann.title);
    setFormBody(ann.body);
    setFormBadge(ann.badge_label || '');
    setFormActionLabel(ann.action_label || '');
    setFormActionUrl(ann.action_url || '');
    setFormSeverity(ann.severity || 'normal');
    setFormIsActive(ann.is_active ?? true);
    setFormStartsAt(
      ann.starts_at ? new Date(ann.starts_at).toISOString().slice(0, 16) : ''
    );
    setFormEndsAt(
      ann.ends_at ? new Date(ann.ends_at).toISOString().slice(0, 16) : ''
    );
    setPreviewTab('write');
    setIsEditModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formBody.trim()) {
      toast.error('Please enter both headline title and announcement body.');
      return;
    }

    try {
      setSubmitting(true);
      const payload: Partial<Announcement> = {
        id: editingId || undefined,
        title: formTitle.trim(),
        body: formBody.trim(),
        announcement_type: formType,
        target_roles: formType === 'public' ? ['all'] : formRoles,
        badge_label: formBadge.trim() || null,
        action_label: formActionLabel.trim() || null,
        action_url: formActionUrl.trim() || null,
        severity: formSeverity,
        is_active: formIsActive,
        starts_at: formStartsAt ? new Date(formStartsAt).toISOString() : new Date().toISOString(),
        ends_at: formEndsAt ? new Date(formEndsAt).toISOString() : null,
        created_by: profile?.id || null,
      };

      await saveAnnouncement(payload);
      toast.success(editingId ? 'Announcement updated successfully!' : 'Announcement created and published!');
      setIsEditModalOpen(false);
      fetchAnnouncements();
    } catch (err: any) {
      console.error('[AdminAnnouncements] Save error:', err);
      toast.error(err.message || 'Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (ann: Announcement) => {
    const nextState = !ann.is_active;
    try {
      await toggleAnnouncementActive(ann.id, nextState);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, is_active: nextState } : a))
      );
      toast.success(`Announcement ${nextState ? 'activated' : 'paused'}.`);
    } catch (err: any) {
      toast.error('Failed to update status: ' + err.message);
    }
  };

  const handleResetDismissals = async (ann: Announcement) => {
    try {
      await resetAnnouncementDismissals(ann.id);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === ann.id ? { ...a, dismissal_count: 0 } : a))
      );
      toast.success(`Dismissals reset! All users will now see this notice again upon dashboard landing.`);
    } catch (err: any) {
      toast.error('Failed to reset dismissals: ' + err.message);
    }
  };

  const handleDeleteTrigger = (id: string) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteAnnouncementById(selectedId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== selectedId));
      toast.success('Announcement removed permanently.');
    } catch (err: any) {
      toast.error('Failed to delete announcement: ' + err.message);
    } finally {
      setSelectedId(null);
    }
  };

  // Filter and sort
  const filteredAnnouncements = announcements
    .filter((a) => {
      if (activeTab === 'public') return a.announcement_type === 'public';
      if (activeTab === 'dashboard') return a.announcement_type === 'dashboard';
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.created_at || a.starts_at || 0).getTime();
      const timeB = new Date(b.created_at || b.starts_at || 0).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  // Aggregate stats
  const publicCount = announcements.filter((a) => a.announcement_type === 'public' && a.is_active).length;
  const dashboardCount = announcements.filter((a) => a.announcement_type === 'dashboard' && a.is_active).length;
  const totalDismissals = announcements.reduce((acc, curr) => acc + (curr.dismissal_count || 0), 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Announcement & Notice System"
            subtitle="Manage public admissions banners and role-targeted onboarding guides for students and teachers."
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => openCreateModal('public')}
              className="px-3.5 py-2 rounded-xl border border-[#D4D4D4] bg-white text-[#111111] hover:bg-[#F5F5F5] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Globe size={14} className="text-[#F4C430]" />
              <span>New Public Notice</span>
            </button>
            <button
              onClick={() => openCreateModal('dashboard')}
              className="px-4 py-2 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-xs font-black shadow-sm transition-all flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
            >
              <Plus size={15} className="text-[#F4C430]" />
              <span>New Dashboard Guide</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#737373] mb-1">
              <span>Total Notices</span>
              <Megaphone size={16} className="text-[#111111]" />
            </div>
            <p className="text-2xl font-black text-[#111111]">{announcements.length}</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Across all platforms</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#737373] mb-1">
              <span>Active Public Popup</span>
              <Globe size={16} className="text-[#F4C430]" />
            </div>
            <p className="text-2xl font-black text-[#111111]">{publicCount}</p>
            <p className="text-[11px] text-[#16a34a] font-semibold mt-0.5">Pre-login admissions</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#737373] mb-1">
              <span>Active Portal Guides</span>
              <LayoutDashboard size={16} className="text-[#2563eb]" />
            </div>
            <p className="text-2xl font-black text-[#111111]">{dashboardCount}</p>
            <p className="text-[11px] text-[#2563eb] font-semibold mt-0.5">Role onboarding & updates</p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E5E5E5] shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-[#737373] mb-1">
              <span>Account Dismissals</span>
              <CheckCircle2 size={16} className="text-[#16a34a]" />
            </div>
            <p className="text-2xl font-black text-[#111111]">{totalDismissals}</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Don't show again clicks</p>
          </div>
        </div>

        {/* Tab Selection & Search Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#E5E5E5]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-[#111111] text-white shadow-2xs'
                  : 'bg-[#FAFAFA] text-[#737373] hover:bg-[#F5F5F5]'
              }`}
            >
              All Notices ({announcements.length})
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'public'
                  ? 'bg-[#111111] text-white shadow-2xs'
                  : 'bg-[#FAFAFA] text-[#737373] hover:bg-[#F5F5F5]'
              }`}
            >
              <Globe size={13} className="text-[#F4C430]" />
              <span>Public Admissions ({announcements.filter((a) => a.announcement_type === 'public').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-[#111111] text-white shadow-2xs'
                  : 'bg-[#FAFAFA] text-[#737373] hover:bg-[#F5F5F5]'
              }`}
            >
              <LayoutDashboard size={13} className="text-[#2563eb]" />
              <span>Dashboard Manuals ({announcements.filter((a) => a.announcement_type === 'dashboard').length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#737373]">
            <span>Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
              className="bg-[#FAFAFA] border border-[#E5E5E5] text-[#111111] rounded-lg px-2.5 py-1 text-xs font-bold outline-none cursor-pointer hover:bg-[#F5F5F5]"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Announcements List */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-[#E5E5E5]">
            <Loader2 size={28} className="animate-spin text-[#F4C430] mb-3" />
            <span className="text-xs text-[#737373] font-bold">Loading notices...</span>
          </div>
        ) : filteredAnnouncements.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-white rounded-3xl border border-[#E5E5E5] p-6">
            <div className="w-14 h-14 rounded-full bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center text-[#A3A3A3] mb-3">
              <Megaphone size={24} />
            </div>
            <h3 className="font-bold text-[#111111] text-base">No announcements found</h3>
            <p className="text-xs text-[#737373] max-w-sm mt-1 mb-4">
              Create a public admissions notice or a role-targeted onboarding manual to guide students and faculty.
            </p>
            <button
              onClick={() => openCreateModal('dashboard')}
              className="btn btn-gold text-xs font-black px-4 py-2"
            >
              Create First Announcement
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAnnouncements.map((ann) => {
              const isPublic = ann.announcement_type === 'public';
              const targetRoles = Array.isArray(ann.target_roles) ? ann.target_roles : ['all'];
              const isExpired = ann.ends_at && new Date(ann.ends_at).getTime() < Date.now();

              return (
                <div
                  key={ann.id}
                  className={`p-5 rounded-3xl border transition-all bg-white shadow-2xs hover:shadow-md flex flex-col md:flex-row md:items-start justify-between gap-4 ${
                    ann.is_active ? 'border-[#E5E5E5]' : 'border-[#F0F0F0] opacity-75 bg-[#FAFAFA]'
                  }`}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={`p-3 rounded-2xl border shrink-0 flex items-center justify-center ${
                        isPublic
                          ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#D97706]'
                          : 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                      }`}
                    >
                      {isPublic ? <Globe size={22} /> : <LayoutDashboard size={22} />}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`badge text-[10px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full border ${
                            isPublic
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-800 border-blue-200'
                          }`}
                        >
                          {isPublic ? '🌐 Public Website Popup' : '📱 Portal Notice'}
                        </span>

                        <span
                          className={`badge text-[10px] font-bold py-0.5 px-2.5 rounded-full border ${
                            ann.is_active && !isExpired
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : isExpired
                              ? 'bg-gray-100 text-gray-600 border-gray-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ann.is_active && !isExpired
                            ? '● Active Now'
                            : isExpired
                            ? '✕ Expired'
                            : '○ Paused'}
                        </span>

                        {ann.badge_label && (
                          <span className="badge bg-[#FAFAFA] text-[#525252] border border-[#E5E5E5] text-[10px] font-bold py-0.5 px-2.5 rounded-full">
                            {ann.badge_label}
                          </span>
                        )}

                        {!isPublic && (
                          <span className="badge bg-[#FAFAFA] text-[#525252] border border-[#E5E5E5] text-[10px] font-bold py-0.5 px-2 rounded-full flex items-center gap-1">
                            <Users size={11} />
                            <span>
                              {targetRoles.includes('all')
                                ? 'All Roles'
                                : targetRoles.join(' & ')}
                            </span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-black text-[#111111] text-base leading-snug">
                        {ann.title}
                      </h3>

                      {/* Snippet */}
                      <p className="text-xs text-[#525252] line-clamp-2 leading-relaxed">
                        {ann.body.replace(/[#*`_]/g, '')}
                      </p>

                      {/* Meta Footer */}
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-[#A3A3A3] font-medium flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {ann.starts_at ? new Date(ann.starts_at).toLocaleDateString() : 'Immediate'}
                          {ann.ends_at && ` – ${new Date(ann.ends_at).toLocaleDateString()}`}
                        </span>

                        {ann.action_label && (
                          <>
                            <span>•</span>
                            <span className="text-[#111111] font-semibold flex items-center gap-1">
                              CTA: "{ann.action_label}" &rarr; {ann.action_url || '/'}
                            </span>
                          </>
                        )}

                        {!isPublic && (
                          <>
                            <span>•</span>
                            <span className="text-[#16a34a] font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              {ann.dismissal_count || 0} accounts dismissed
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#F0F0F0] w-full md:w-auto justify-end">
                    {/* Preview Button */}
                    <button
                      onClick={() => setPreviewAnnouncement(ann)}
                      className="px-3 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-[#525252] hover:text-[#111111] hover:bg-[#F5F5F5] text-xs font-bold transition-all flex items-center gap-1"
                      title="Preview how users see this notice"
                    >
                      <Eye size={13} />
                      <span>Preview</span>
                    </button>

                    {/* Reset Dismissals */}
                    {!isPublic && (ann.dismissal_count || 0) > 0 && (
                      <button
                        onClick={() => handleResetDismissals(ann)}
                        className="px-2.5 py-1.5 rounded-xl border border-[#E5E5E5] bg-white text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] text-xs font-semibold transition-all flex items-center gap-1"
                        title="Reset dismissals so all users re-see this notice"
                      >
                        <RotateCcw size={12} />
                        <span>Reset ({ann.dismissal_count})</span>
                      </button>
                    )}

                    {/* Toggle Active Switch */}
                    <button
                      onClick={() => handleToggleActive(ann)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        ann.is_active
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      }`}
                    >
                      {ann.is_active ? 'Active' : 'Paused'}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(ann)}
                      className="p-2 rounded-xl text-[#525252] hover:text-[#111111] hover:bg-[#F0F0F0] transition-all"
                      title="Edit Announcement"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteTrigger(ann.id)}
                      className="p-2 rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      title="Delete Announcement"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── Create / Edit Announcement Modal ─── */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden flex flex-col max-h-[92vh]">
              {/* Header */}
              <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between bg-[#FAFAFA]">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#111111] text-[#F4C430]">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h2 className="font-black text-[#111111] text-lg">
                      {editingId ? 'Edit Announcement' : 'New Announcement & Notice'}
                    </h2>
                    <p className="text-xs text-[#737373]">
                      Configure broadcast type, role audience, content, and call-to-action button.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-full text-[#737373] hover:text-[#111111] hover:bg-[#EAEAEA]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 flex-1">
                {/* 1. Announcement Type */}
                <div>
                  <label className="text-xs font-black uppercase text-[#737373] tracking-wider block mb-1.5">
                    Announcement Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setFormType('dashboard');
                        if (formRoles.includes('all')) setFormRoles(['student']);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        formType === 'dashboard'
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                          : 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <LayoutDashboard size={15} className="text-[#F4C430]" />
                        <span>Portal Dashboard Notice</span>
                      </div>
                      <p className="text-[11px] opacity-80">
                        Shown to logged-in students or teachers upon landing, with "Don't show again" tracking.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormType('public');
                        setFormRoles(['all']);
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        formType === 'public'
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                          : 'bg-[#FAFAFA] text-[#525252] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs mb-1">
                        <Globe size={15} className="text-[#F4C430]" />
                        <span>Public Visitor Banner</span>
                      </div>
                      <p className="text-[11px] opacity-80">
                        Pre-login admissions popup shown to prospective students visiting the website.
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. Target Roles (for dashboard) */}
                {formType === 'dashboard' && (
                  <div>
                    <label className="text-xs font-black uppercase text-[#737373] tracking-wider block mb-1.5">
                      Target Audience (Role-Scoped)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setFormRoles(['student'])}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                          formRoles.length === 1 && formRoles[0] === 'student'
                            ? 'bg-[#F4C430] text-[#111111] border-[#F4C430] shadow-2xs'
                            : 'bg-white text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <GraduationCap size={14} />
                        <span>Students Only</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormRoles(['teacher'])}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                          formRoles.length === 1 && formRoles[0] === 'teacher'
                            ? 'bg-[#F4C430] text-[#111111] border-[#F4C430] shadow-2xs'
                            : 'bg-white text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <Users size={14} />
                        <span>Teachers Only</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormRoles(['all'])}
                        className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                          formRoles.includes('all')
                            ? 'bg-[#111111] text-white border-[#111111] shadow-2xs'
                            : 'bg-white text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                        }`}
                      >
                        <span>Both (All Portal Users)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Title & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-bold text-[#525252] block mb-1">
                      Headline Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Admissions Open for Session 2026–2027"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      className="input text-sm w-full font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#525252] block mb-1">
                      Badge Pill
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Admissions Open, New Feature"
                      value={formBadge}
                      onChange={(e) => setFormBadge(e.target.value)}
                      className="input text-sm w-full"
                    />
                  </div>
                </div>

                {/* 4. Body with Markdown Write / Preview Tabs */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-[#525252]">
                      Announcement Content (Markdown Supported) *
                    </label>
                    <div className="flex items-center gap-1 bg-[#F5F5F5] p-0.5 rounded-lg border border-[#E5E5E5]">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('write')}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                          previewTab === 'write' ? 'bg-white text-[#111111] shadow-2xs' : 'text-[#737373]'
                        }`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('preview')}
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                          previewTab === 'preview' ? 'bg-white text-[#111111] shadow-2xs' : 'text-[#737373]'
                        }`}
                      >
                        Live Preview
                      </button>
                    </div>
                  </div>

                  {previewTab === 'write' ? (
                    <textarea
                      required
                      rows={7}
                      placeholder={`### Overview\n\nExplain the notice details here. Supports **bold text**, lists, bullet points, and links.`}
                      value={formBody}
                      onChange={(e) => setFormBody(e.target.value)}
                      className="input text-sm w-full font-mono py-2.5 leading-relaxed resize-y min-h-[140px]"
                    />
                  ) : (
                    <div className="p-4 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA] min-h-[140px] max-h-[220px] overflow-y-auto prose prose-sm max-w-none text-xs">
                      {formBody.trim() ? (
                        <Markdown remarkPlugins={[remarkGfm]}>{formBody}</Markdown>
                      ) : (
                        <span className="text-[#A3A3A3] italic">No content typed yet.</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Action CTA Button (Optional) */}
                <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E5E5E5] space-y-3">
                  <div className="flex items-center gap-2">
                    <ArrowRight size={14} className="text-[#F4C430]" />
                    <span className="text-xs font-bold text-[#111111]">Call to Action Button (Optional)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-[#737373] block mb-1">
                        Button Label
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Enroll Now, Explore Schedule"
                        value={formActionLabel}
                        onChange={(e) => setFormActionLabel(e.target.value)}
                        className="input text-xs w-full bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#737373] block mb-1">
                        Destination URL / Path
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /register, /student/schedule, or https://..."
                        value={formActionUrl}
                        onChange={(e) => setFormActionUrl(e.target.value)}
                        className="input text-xs w-full bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Scheduling / Active Toggle */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#525252] block mb-1">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formStartsAt}
                      onChange={(e) => setFormStartsAt(e.target.value)}
                      className="input text-xs w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#525252] block mb-1">
                      End Time (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formEndsAt}
                      onChange={(e) => setFormEndsAt(e.target.value)}
                      className="input text-xs w-full"
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-bold text-[#111111]">
                      <input
                        type="checkbox"
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        className="w-4 h-4 text-[#F4C430] rounded cursor-pointer"
                      />
                      <span>Active & Published</span>
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-[#E5E5E5] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#D4D4D4] text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl bg-[#111111] hover:bg-[#222222] text-white text-xs font-black shadow-sm flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Check size={14} className="text-[#22c55e]" />
                    )}
                    <span>{editingId ? 'Save Changes' : 'Publish Announcement'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ─── Live Preview Popup Modal ─── */}
        {previewAnnouncement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-[#E5E5E5] overflow-hidden flex flex-col max-h-[90vh]">
              {/* Badge Preview Bar */}
              <div className="bg-[#111111] p-5 text-white flex items-center justify-between border-b border-[#222222]">
                <div className="flex items-center gap-2">
                  <span className="badge bg-[#F4C430] text-[#111111] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    {previewAnnouncement.announcement_type === 'public' ? 'Public Modal Preview' : 'Dashboard Modal Preview'}
                  </span>
                  <span className="text-xs text-[#A3A3A3]">
                    {previewAnnouncement.badge_label || 'Notice'}
                  </span>
                </div>
                <button
                  onClick={() => setPreviewAnnouncement(null)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#D4D4D4] hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Title & Body Preview */}
              <div className="p-6 overflow-y-auto space-y-4">
                <h3 className="text-xl font-black text-[#111111] leading-snug">
                  {previewAnnouncement.title}
                </h3>
                <div className="prose prose-sm max-w-none text-[#404040]">
                  <Markdown remarkPlugins={[remarkGfm]}>
                    {previewAnnouncement.body}
                  </Markdown>
                </div>
              </div>

              {/* Footer Preview */}
              <div className="p-4 bg-[#FAFAFA] border-t border-[#E5E5E5] flex items-center justify-between gap-3">
                <span className="text-[11px] text-[#737373] italic">
                  {previewAnnouncement.announcement_type === 'public'
                    ? 'Dismissed per browser session'
                    : 'Dismissed per user account ("Don\'t show again")'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewAnnouncement(null)}
                    className="px-4 py-2 rounded-xl border border-[#D4D4D4] text-xs font-bold text-[#525252]"
                  >
                    Close Preview
                  </button>
                  {previewAnnouncement.action_label && (
                    <button
                      onClick={() => setPreviewAnnouncement(null)}
                      className="px-5 py-2 rounded-xl bg-[#F4C430] text-[#111111] text-xs font-black flex items-center gap-1.5"
                    >
                      <span>{previewAnnouncement.action_label}</span>
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Announcement"
          description="Are you sure you want to permanently delete this announcement? It will be removed immediately from all visitor and dashboard views."
          confirmLabel="Yes, delete it"
          danger
        />
      </div>
    </AdminShell>
  );
};

export default AdminAnnouncementsPage;
