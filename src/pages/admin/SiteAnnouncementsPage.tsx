import React, { useState, useEffect, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Users,
  Eye,
  Loader2,
  RefreshCw,
  X,
  Check,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import AdminShell from '../../components/admin/AdminShell';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { AnnouncementBannerItem, TYPE_STYLES } from '../../components/common/AnnouncementBanner';
import { useAuth } from '../../features/auth/AuthContext';
import {
  listAllSiteAnnouncements,
  createSiteAnnouncement,
  updateSiteAnnouncement,
  deleteSiteAnnouncement,
} from '../../lib/db';
import type { SiteAnnouncement, SiteAnnouncementType, SiteAnnouncementAudience } from '../../types';

// Helper: format datetime for datetime-local input
function toLocalDatetimeInput(isoString?: string | null): string {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

// Preset Quick Templates
const QUICK_TEMPLATES: Array<{
  name: string;
  title: string;
  message: string;
  type: SiteAnnouncementType;
  audience: SiteAnnouncementAudience[];
}> = [
  {
    name: 'Issues Resolved (Default)',
    title: 'Issues resolved!',
    message: 'Please check every part of your dashboard. If you find any issue, contact +923222314436.',
    type: 'success',
    audience: ['student', 'teacher', 'admin'],
  },
  {
    name: 'System Maintenance Notice',
    title: 'Scheduled Maintenance',
    message: 'We will be performing a brief system upgrade tonight at 11:00 PM PKT. The platform will remain accessible.',
    type: 'warning',
    audience: ['student', 'teacher', 'admin'],
  },
  {
    name: 'Class Timetable & Links Refreshed',
    title: 'Class Link Update',
    message: 'Important: Class links for today have been refreshed. Please check your schedule tab to join.',
    type: 'urgent',
    audience: ['student', 'teacher'],
  },
  {
    name: 'Monthly Fee Slip Verification',
    title: 'Fee Verification Notice',
    message: 'Fee slips for the current month are now being reviewed. For payment queries, contact support at +923222314436.',
    type: 'info',
    audience: ['student'],
  },
  {
    name: 'Testing Center Exam Schedule',
    title: 'Test Series Timetable',
    message: 'The upcoming monthly test schedule has been posted in the Testing Center. Review your syllabus now.',
    type: 'info',
    audience: ['student', 'teacher'],
  },
];

export const SiteAnnouncementsPage: React.FC = () => {
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState<SiteAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState<SiteAnnouncementType>('success');
  const [formAudience, setFormAudience] = useState<SiteAnnouncementAudience[]>([
    'student',
    'teacher',
    'admin',
  ]);
  const [formStartAt, setFormStartAt] = useState('');
  const [formEndAt, setFormEndAt] = useState('');
  const [formNoExpiry, setFormNoExpiry] = useState(true);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsDismissible, setFormIsDismissible] = useState(true);

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load announcements
  const fetchAnnouncements = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await listAllSiteAnnouncements();
      setAnnouncements(data);
    } catch (err: any) {
      toast.error('Failed to load announcements: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Compute status for an announcement
  const getAnnouncementStatus = (ann: SiteAnnouncement): {
    status: 'live' | 'scheduled' | 'expired' | 'inactive';
    label: string;
    badgeClass: string;
  } => {
    if (!ann.is_active) {
      return {
        status: 'inactive',
        label: 'Inactive',
        badgeClass: 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20',
      };
    }
    const now = Date.now();
    const start = ann.start_at ? new Date(ann.start_at).getTime() : 0;
    const end = ann.end_at ? new Date(ann.end_at).getTime() : null;

    if (start > now) {
      return {
        status: 'scheduled',
        label: 'Scheduled',
        badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
      };
    }
    if (end && end < now) {
      return {
        status: 'expired',
        label: 'Expired',
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
      };
    }
    return {
      status: 'live',
      label: 'Live',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    };
  };

  // Open Drawer for Create
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormMessage('');
    setFormType('success');
    setFormAudience(['student', 'teacher', 'admin']);
    setFormStartAt(toLocalDatetimeInput(new Date().toISOString()));
    setFormEndAt('');
    setFormNoExpiry(true);
    setFormIsActive(true);
    setFormIsDismissible(true);
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit
  const handleOpenEdit = (ann: SiteAnnouncement) => {
    setEditingId(ann.id);
    setFormTitle(ann.title || '');
    setFormMessage(ann.message);
    setFormType(ann.type);
    setFormAudience(ann.audience || ['student', 'teacher', 'admin']);
    setFormStartAt(toLocalDatetimeInput(ann.start_at));
    setFormEndAt(toLocalDatetimeInput(ann.end_at));
    setFormNoExpiry(!ann.end_at);
    setFormIsActive(ann.is_active);
    setFormIsDismissible(ann.is_dismissible);
    setIsDrawerOpen(true);
  };

  // Quick toggle active
  const handleToggleActive = async (ann: SiteAnnouncement) => {
    const updated = !ann.is_active;
    try {
      await updateSiteAnnouncement(ann.id, { is_active: updated });
      setAnnouncements((prev) =>
        prev.map((item) => (item.id === ann.id ? { ...item, is_active: updated } : item))
      );
      toast.success(updated ? 'Announcement activated' : 'Announcement deactivated');
    } catch (err: any) {
      toast.error('Failed to toggle status: ' + err.message);
    }
  };

  // Delete handler
  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);
    try {
      await deleteSiteAnnouncement(deleteTargetId);
      setAnnouncements((prev) => prev.filter((item) => item.id !== deleteTargetId));
      toast.success('Announcement deleted');
      setDeleteTargetId(null);
    } catch (err: any) {
      toast.error('Failed to delete: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Quick template selection
  const handleApplyTemplate = (templateName: string) => {
    const tpl = QUICK_TEMPLATES.find((t) => t.name === templateName);
    if (!tpl) return;
    setFormTitle(tpl.title);
    setFormMessage(tpl.message);
    setFormType(tpl.type);
    setFormAudience(tpl.audience);
    toast.info(`Applied template: ${tpl.name}`);
  };

  // Audience toggle helper
  const handleToggleAudience = (role: SiteAnnouncementAudience) => {
    setFormAudience((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  // Save announcement (create or update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formMessage.trim()) {
      toast.error('Message is required.');
      return;
    }
    if (formMessage.trim().length > 300) {
      toast.error('Message cannot exceed 300 characters.');
      return;
    }
    if (formAudience.length === 0) {
      toast.error('Select at least one audience role.');
      return;
    }

    const startIso = formStartAt ? new Date(formStartAt).toISOString() : new Date().toISOString();
    let endIso: string | null = null;
    if (!formNoExpiry && formEndAt) {
      endIso = new Date(formEndAt).toISOString();
      if (new Date(endIso).getTime() <= new Date(startIso).getTime()) {
        toast.error('End date and time must be after start date and time.');
        return;
      }
    }

    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateSiteAnnouncement(editingId, {
          title: formTitle.trim() || null,
          message: formMessage.trim(),
          type: formType,
          audience: formAudience,
          start_at: startIso,
          end_at: endIso,
          is_active: formIsActive,
          is_dismissible: formIsDismissible,
        });
        setAnnouncements((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item))
        );
        toast.success('Announcement updated successfully');
      } else {
        const created = await createSiteAnnouncement({
          title: formTitle.trim() || null,
          message: formMessage.trim(),
          type: formType,
          audience: formAudience,
          start_at: startIso,
          end_at: endIso,
          is_active: formIsActive,
          is_dismissible: formIsDismissible,
          created_by: profile?.id || null,
        });
        setAnnouncements((prev) => [created, ...prev]);
        toast.success('Announcement created successfully');
      }
      setIsDrawerOpen(false);
    } catch (err: any) {
      toast.error('Failed to save announcement: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  // Preview object for live banner drawer preview
  const livePreviewAnnouncement: SiteAnnouncement = useMemo(() => {
    return {
      id: 'live-preview-id',
      title: formTitle.trim() || null,
      message:
        formMessage.trim() ||
        'Type your announcement message below to preview how it will appear across the academy dashboard...',
      type: formType,
      audience: formAudience,
      start_at: formStartAt ? new Date(formStartAt).toISOString() : new Date().toISOString(),
      end_at: !formNoExpiry && formEndAt ? new Date(formEndAt).toISOString() : null,
      is_active: formIsActive,
      is_dismissible: formIsDismissible,
      created_by: profile?.id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }, [
    formTitle,
    formMessage,
    formType,
    formAudience,
    formStartAt,
    formEndAt,
    formNoExpiry,
    formIsActive,
    formIsDismissible,
    profile?.id,
  ]);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Navigation Tabs to keep legacy popup notices accessible */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E5E5] dark:border-[#27272A] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-[#F4C430]/10 text-[#F4C430] rounded-lg">
                <Megaphone size={20} />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-[#111111] dark:text-[#F4F4F5] tracking-tight">
                Announcement Banners
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-[#737373] mt-1">
              Publish top-of-dashboard announcement bars with real-time sync across Students, Teachers, and Admins.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchAnnouncements(true)}
              disabled={refreshing}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#E5E5E5] dark:border-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#202022] text-[#525252] dark:text-[#A1A1AA] flex items-center gap-1.5 transition-colors"
              title="Refresh announcements"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link
              to="/admin/modal-announcements"
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-[#E5E5E5] dark:border-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#202022] text-[#525252] dark:text-[#A1A1AA] flex items-center gap-1.5 transition-colors"
              title="View Legacy Popup Notices"
            >
              <FileText size={14} />
              <span>Modal Notices</span>
            </Link>

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] shadow-sm flex items-center gap-1.5 transition-colors interactive"
            >
              <Plus size={16} />
              <span>New Announcement</span>
            </button>
          </div>
        </div>

        {/* List of Announcements */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-16 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#F4C430]" />
            <p className="text-xs text-[#737373]">Loading announcement banners…</p>
          </div>
        ) : announcements.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E5E5E5] dark:border-[#27272A] p-12 text-center bg-white/50 dark:bg-[#141416]/50">
            <div className="w-12 h-12 rounded-full bg-[#F4C430]/10 text-[#F4C430] flex items-center justify-center mx-auto mb-3">
              <Megaphone size={24} />
            </div>
            <h3 className="text-base font-bold text-[#111111] dark:text-[#F4F4F5]">
              No announcement banners yet
            </h3>
            <p className="text-xs text-[#737373] max-w-sm mx-auto mt-1 mb-4">
              Create your first top-of-dashboard banner to notify students and teachers about academy updates.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#F4C430] text-[#111111] hover:bg-[#E5B520] transition-colors"
            >
              + Create Announcement
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((ann) => {
              const { status, label, badgeClass } = getAnnouncementStatus(ann);
              const typeConfig = TYPE_STYLES[ann.type] || TYPE_STYLES.info;
              const { IconComponent } = typeConfig;

              return (
                <div
                  key={ann.id}
                  className="rounded-xl border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#141416] p-4 sm:p-5 shadow-xs transition-all hover:border-[#D4D4D8] dark:hover:border-[#3F3F46]"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Type Icon + Content Preview */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2.5 rounded-lg shrink-0 ${
                          ann.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : ann.type === 'info'
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                            : ann.type === 'warning'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <IconComponent size={20} />
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Title */}
                          {ann.title && (
                            <h3 className="font-bold text-sm sm:text-base text-[#111111] dark:text-[#F4F4F5]">
                              {ann.title}
                            </h3>
                          )}

                          {/* Status Badge */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase flex items-center gap-1 ${badgeClass}`}
                          >
                            {status === 'live' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {label}
                          </span>

                          {/* Type Badge */}
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 capitalize">
                            {ann.type}
                          </span>

                          {/* Dismissible indicator */}
                          {!ann.is_dismissible && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                              Persistent (No X)
                            </span>
                          )}
                        </div>

                        {/* Message preview */}
                        <p className="text-xs sm:text-sm text-[#525252] dark:text-[#A1A1AA] break-words line-clamp-2">
                          {ann.message}
                        </p>

                        {/* Metadata row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-[#737373]">
                          {/* Audience */}
                          <div className="flex items-center gap-1">
                            <Users size={12} className="opacity-70" />
                            <span>Audience:</span>
                            <div className="flex items-center gap-1">
                              {ann.audience.map((role) => (
                                <span
                                  key={role}
                                  className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-[#1E1E22] text-[#3F3F46] dark:text-[#D4D4D8] font-medium capitalize"
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Schedule */}
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="opacity-70" />
                            <span>
                              {new Date(ann.start_at).toLocaleDateString()}{' '}
                              {new Date(ann.start_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span>→</span>
                            <span>
                              {ann.end_at
                                ? `${new Date(ann.end_at).toLocaleDateString()} ${new Date(
                                    ann.end_at
                                  ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                : 'No expiry'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="flex items-center justify-end gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#E5E5E5] dark:border-[#27272A]">
                      {/* Active Toggle */}
                      <button
                        onClick={() => handleToggleActive(ann)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                          ann.is_active
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200'
                        }`}
                        title={ann.is_active ? 'Click to deactivate' : 'Click to activate'}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            ann.is_active ? 'bg-emerald-500' : 'bg-neutral-400'
                          }`}
                        />
                        <span>{ann.is_active ? 'Active' : 'Inactive'}</span>
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(ann)}
                        className="p-2 rounded-lg border border-[#E5E5E5] dark:border-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#202022] text-[#525252] dark:text-[#A1A1AA] transition-colors"
                        title="Edit announcement"
                      >
                        <Edit2 size={15} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => setDeleteTargetId(ann.id)}
                        className="p-2 rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                        title="Delete announcement"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── CREATE / EDIT DRAWER ──────────────────────────────────────────────── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div
            className="w-full max-w-xl bg-white dark:bg-[#141416] h-full shadow-2xl flex flex-col border-l border-[#E5E5E5] dark:border-[#27272A] animate-in slide-in-from-right duration-300"
            role="dialog"
            aria-modal="true"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#E5E5E5] dark:border-[#27272A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Megaphone size={18} className="text-[#F4C430]" />
                <h2 className="text-base sm:text-lg font-bold text-[#111111] dark:text-[#F4F4F5]">
                  {editingId ? 'Edit Announcement Banner' : 'New Announcement Banner'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg text-[#737373] hover:text-[#111111] dark:hover:text-[#F4F4F5] hover:bg-neutral-100 dark:hover:bg-[#202022] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* 1. Live Banner Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#737373] flex items-center gap-1.5">
                    <Eye size={13} />
                    Live Dashboard Preview
                  </span>
                  <span className="text-[11px] text-[#737373]">Updates live as you type</span>
                </div>
                <div className="rounded-xl border border-[#E5E5E5] dark:border-[#27272A] p-2 bg-neutral-100/50 dark:bg-[#0E0E10]/50">
                  <AnnouncementBannerItem announcement={livePreviewAnnouncement} />
                </div>
              </div>

              {/* 2. Quick Template Selector */}
              <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-2">
                <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <FileText size={13} className="text-[#F4C430]" />
                  Quick Templates
                </label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) handleApplyTemplate(e.target.value);
                  }}
                  className="w-full text-xs rounded-lg border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] px-3 py-2 text-[#111111] dark:text-[#F4F4F5] focus:ring-1 focus:ring-[#F4C430]"
                >
                  <option value="" disabled>
                    Choose a pre-filled announcement template…
                  </option>
                  {QUICK_TEMPLATES.map((tpl) => (
                    <option key={tpl.name} value={tpl.name}>
                      {tpl.name} ({tpl.type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Form */}
              <form id="announcement-form" onSubmit={handleSave} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-[#525252] dark:text-[#A1A1AA] mb-1">
                    Title <span className="font-normal text-[#737373]">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Issues resolved! or Scheduled Maintenance"
                    maxLength={100}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-[#111111] dark:text-[#F4F4F5] focus:outline-none focus:ring-1 focus:ring-[#F4C430]"
                  />
                </div>

                {/* Message */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-[#525252] dark:text-[#A1A1AA]">
                      Message <span className="text-rose-500">*</span>
                    </label>
                    <span
                      className={`text-[11px] font-mono ${
                        formMessage.length > 300
                          ? 'text-rose-500 font-bold'
                          : 'text-[#737373]'
                      }`}
                    >
                      {formMessage.length}/300
                    </span>
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder="e.g. Please check every part of your dashboard. If you find any issue, contact +923222314436."
                    maxLength={300}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-[#111111] dark:text-[#F4F4F5] focus:outline-none focus:ring-1 focus:ring-[#F4C430]"
                  />
                  <p className="text-[11px] text-[#737373] mt-1">
                    Phone numbers (+92...) and links (https://...) are automatically formatted into clickable links.
                  </p>
                </div>

                {/* Type Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#525252] dark:text-[#A1A1AA] mb-1.5">
                    Banner Type & Theme
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['success', 'info', 'warning', 'urgent'] as SiteAnnouncementType[]).map((t) => {
                      const cfg = TYPE_STYLES[t];
                      const { IconComponent } = cfg;
                      const isSelected = formType === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormType(t)}
                          className={`p-2.5 rounded-lg border flex flex-col items-center gap-1.5 text-xs font-semibold transition-all ${
                            isSelected
                              ? 'border-[#F4C430] bg-[#F4C430]/10 text-[#111111] dark:text-[#F4F4F5] shadow-xs'
                              : 'border-[#E5E5E5] dark:border-[#27272A] hover:bg-neutral-50 dark:hover:bg-[#1E1E22] text-[#525252] dark:text-[#A1A1AA]'
                          }`}
                        >
                          <IconComponent size={18} className={cfg.iconColor} />
                          <span className="capitalize">{t}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-semibold text-[#525252] dark:text-[#A1A1AA] mb-1.5">
                    Target Audience <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['student', 'teacher', 'admin'] as SiteAnnouncementAudience[]).map((role) => {
                      const checked = formAudience.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleToggleAudience(role)}
                          className={`p-2 rounded-lg border flex items-center justify-center gap-2 text-xs font-semibold transition-all ${
                            checked
                              ? 'border-[#F4C430] bg-[#F4C430]/10 text-[#111111] dark:text-[#F4F4F5]'
                              : 'border-[#E5E5E5] dark:border-[#27272A] text-[#737373] hover:bg-neutral-50 dark:hover:bg-[#1E1E22]'
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                              checked
                                ? 'bg-[#F4C430] border-[#F4C430] text-[#111111]'
                                : 'border-[#A1A1AA]'
                            }`}
                          >
                            {checked && <Check size={10} strokeWidth={3} />}
                          </div>
                          <span className="capitalize">{role}s</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Schedule: Start & End */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-[#525252] dark:text-[#A1A1AA] mb-1">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formStartAt}
                      onChange={(e) => setFormStartAt(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-[#111111] dark:text-[#F4F4F5]"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#525252] dark:text-[#A1A1AA]">
                        End Date & Time
                      </label>
                      <label className="flex items-center gap-1.5 text-[11px] text-[#737373] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formNoExpiry}
                          onChange={(e) => {
                            setFormNoExpiry(e.target.checked);
                            if (e.target.checked) setFormEndAt('');
                          }}
                          className="rounded border-[#A1A1AA] text-[#F4C430] focus:ring-[#F4C430]"
                        />
                        <span>No expiry</span>
                      </label>
                    </div>
                    <input
                      type="datetime-local"
                      value={formEndAt}
                      disabled={formNoExpiry}
                      onChange={(e) => setFormEndAt(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-lg border border-[#E5E5E5] dark:border-[#27272A] bg-white dark:bg-[#1E1E22] text-[#111111] dark:text-[#F4F4F5] ${
                        formNoExpiry ? 'opacity-40 cursor-not-allowed bg-neutral-100' : ''
                      }`}
                    />
                  </div>
                </div>

                {/* Toggles: Active & Dismissible */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#1E1E22] transition-colors">
                    <input
                      type="checkbox"
                      checked={formIsDismissible}
                      onChange={(e) => setFormIsDismissible(e.target.checked)}
                      className="w-4 h-4 rounded text-[#F4C430] focus:ring-[#F4C430]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#111111] dark:text-[#F4F4F5]">
                        Dismissible (Show X)
                      </div>
                      <div className="text-[11px] text-[#737373]">
                        Users can close banner
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 rounded-xl border border-[#E5E5E5] dark:border-[#27272A] cursor-pointer hover:bg-neutral-50 dark:hover:bg-[#1E1E22] transition-colors">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-[#F4C430] focus:ring-[#F4C430]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#111111] dark:text-[#F4F4F5]">
                        Active (Published)
                      </div>
                      <div className="text-[11px] text-[#737373]">
                        Visible to live audience
                      </div>
                    </div>
                  </label>
                </div>
              </form>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-[#E5E5E5] dark:border-[#27272A] flex items-center justify-end gap-2.5 shrink-0 bg-neutral-50/50 dark:bg-[#121214]/50">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E5E5E5] dark:border-[#27272A] hover:bg-neutral-100 dark:hover:bg-[#202022] text-[#525252] dark:text-[#A1A1AA] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="announcement-form"
                disabled={saving}
                className="px-5 py-2 text-xs font-semibold rounded-lg bg-[#F4C430] hover:bg-[#E5B520] text-[#111111] shadow-xs flex items-center gap-2 transition-colors interactive"
              >
                {saving && <Loader2 size={14} className="animate-spin" />}
                <span>{editingId ? 'Save Changes' : 'Create Banner'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CONFIRM DELETE MODAL ────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteTargetId}
        title="Delete Announcement Banner"
        description="Are you sure you want to permanently delete this announcement banner? It will disappear from all user dashboards immediately."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        danger
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </AdminShell>
  );
};

export default SiteAnnouncementsPage;
