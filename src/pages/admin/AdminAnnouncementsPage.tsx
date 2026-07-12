import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Megaphone, Calendar, AlertTriangle, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { getAnnouncements, createAnnouncement, deleteAnnouncement, getTaxonomy } from '../../lib/db';
import { useAuth } from '../../features/auth/AuthContext';
import { useMobile } from '../../hooks/useMobile';
import type { Announcement, ClassEntry, StreamEntry } from '../../types';

export const AdminAnnouncementsPage: React.FC = () => {
  const { profile } = useAuth();
  const isMobile = useMobile();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [streams, setStreams] = useState<StreamEntry[]>([]);

  // Form states
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [severity, setSeverity] = useState<'normal' | 'crucial'>('normal');
  const [scope, setScope] = useState<'system' | 'class'>('system');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStreamId, setSelectedStreamId] = useState<string | null>(null);
  
  // Notification states
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [annRes, taxRes] = await Promise.allSettled([
        getAnnouncements(),
        getTaxonomy(),
      ]);

      if (taxRes.status === 'fulfilled') {
        setClasses(taxRes.value.classes);
        setStreams(taxRes.value.streams);
        if (taxRes.value.classes.length > 0 && !selectedClassId) {
          setSelectedClassId(taxRes.value.classes[0].id);
        }
      } else {
        console.error('[AdminAnnouncements] Error fetching taxonomy:', taxRes.reason);
      }

      if (annRes.status === 'fulfilled') {
        setAnnouncements(annRes.value);
      } else {
        console.error('[AdminAnnouncements] Error fetching announcements:', annRes.reason);
        triggerNotification('error', annRes.reason?.message || 'Failed to load announcements.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // When class changes, reset selectedStreamId to null (Whole Class)
  useEffect(() => {
    setSelectedStreamId(null);
  }, [selectedClassId]);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 3500);
  };

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      triggerNotification('error', 'Please fill in both title and body.');
      return;
    }
    if (scope === 'class' && !selectedClassId) {
      triggerNotification('error', 'Please select a target class grade.');
      return;
    }

    try {
      setSubmitting(true);
      const newAnn = await createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        severity,
        scope,
        class_id: scope === 'class' ? selectedClassId : null,
        stream_id: scope === 'class' ? selectedStreamId : null,
        created_by: profile?.id || null,
      });

      // Refetch or update state
      setAnnouncements((prev) => {
        const list = [newAnn, ...prev];
        return list.sort((a, b) => {
          if (a.severity === 'crucial' && b.severity !== 'crucial') return -1;
          if (a.severity !== 'crucial' && b.severity === 'crucial') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });

      // Reset Form
      setTitle('');
      setBody('');
      setSeverity('normal');
      setScope('system');
      setSelectedStreamId(null);

      triggerNotification('success', 'Announcement published successfully!');
    } catch (err: any) {
      console.error('[AdminAnnouncements] Create failed:', err);
      triggerNotification('error', err.message || 'Failed to publish announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrigger = (id: string) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;
    try {
      await deleteAnnouncement(selectedId);
      setAnnouncements((prev) => prev.filter((a) => a.id !== selectedId));
      triggerNotification('success', 'Announcement deleted successfully.');
    } catch (err: any) {
      console.error('[AdminAnnouncements] Delete failed:', err);
      triggerNotification('error', err.message || 'Failed to delete announcement.');
    } finally {
      setSelectedId(null);
      setDeleteModalOpen(false);
    }
  };

  const availableStreams = streams.filter((s) => s.class_id === selectedClassId);

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="School Announcements"
            subtitle="Broadcast important updates, alerts, and news directly to student and teacher portals."
          />
        </div>

        {/* Status Toast */}
        {notif && (
          <div
            className={`fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg animate-in slide-in-from-bottom-5 duration-300 ${
              notif.type === 'success'
                ? 'bg-[#F0FDF4] border-[#bbf7d0] text-[#16a34a]'
                : 'bg-[#FEF2F2] border-[#fecaca] text-[#dc2626]'
            }`}
          >
            {notif.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span className="text-xs font-bold">{notif.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Announcement Form */}
          <div className="lg:col-span-1">
            <div className={`card card-elevated ${isMobile ? '' : 'sticky top-24'}`}>
              <div className="flex items-center gap-2 mb-4 border-b border-[#F5F5F5] pb-3">
                <Sparkles size={18} className="text-[#F4C430]" />
                <h2 className="font-bold text-[#111111] text-base">New Announcement</h2>
              </div>

              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                {/* 1. Scope Selector */}
                <div>
                  <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1.5 block">
                    Broadcast Scope
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setScope('system')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        scope === 'system'
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                          : 'bg-[#FAFAFA] text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      🌐 Whole System
                    </button>
                    <button
                      type="button"
                      onClick={() => setScope('class')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        scope === 'class'
                          ? 'bg-[#111111] text-white border-[#111111] shadow-xs'
                          : 'bg-[#FAFAFA] text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      🎯 Specific Class
                    </button>
                  </div>
                </div>

                {/* If Specific Class, show Grade selector & Stream pills */}
                {scope === 'class' && (
                  <div className="p-3 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="label text-[11px] font-bold text-[#525252] mb-1 block">Target Grade / Class</label>
                      <select
                        value={selectedClassId}
                        onChange={(e) => setSelectedClassId(e.target.value)}
                        className="input text-xs py-1.5 font-semibold bg-white w-full"
                      >
                        {classes.length === 0 && (
                          <option value="" disabled>Loading classes...</option>
                        )}
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            Grade {c.grade} ({c.display_name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="label text-[11px] font-bold text-[#525252] mb-1.5 block">Target Stream (Optional)</label>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedStreamId(null)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                            selectedStreamId === null
                              ? 'bg-[#F4C430] text-[#111111] border-[#F4C430] shadow-2xs'
                              : 'bg-white text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                          }`}
                        >
                          Whole Class (All Streams)
                        </button>
                        {availableStreams.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedStreamId(s.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                              selectedStreamId === s.id
                                ? 'bg-[#111111] text-white border-[#111111] shadow-2xs'
                                : 'bg-white text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                            }`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Severity Toggle */}
                <div>
                  <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1.5 block">
                    Severity Level
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSeverity('normal')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        severity === 'normal'
                          ? 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]'
                          : 'bg-[#FAFAFA] text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      🟢 Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setSeverity('crucial')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        severity === 'crucial'
                          ? 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]'
                          : 'bg-[#FAFAFA] text-[#737373] border-[#E5E5E5] hover:bg-[#F5F5F5]'
                      }`}
                    >
                      🔴 Crucial / Urgent
                    </button>
                  </div>
                </div>

                {/* 3. Title */}
                <div>
                  <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1.5 block">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Mid-Term Exam Timetable Published"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input text-sm w-full"
                    required
                  />
                </div>

                {/* 4. Body */}
                <div>
                  <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1.5 block">Message Body</label>
                  <textarea
                    placeholder="Provide details about the announcement..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="input text-sm min-h-[110px] resize-none py-2.5 w-full"
                    required
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn btn-gold w-full mt-2 font-extrabold interactive">
                  <Plus size={16} />
                  {submitting ? 'Publishing...' : 'Publish Update'}
                </button>
              </form>
            </div>
          </div>

          {/* List of active announcements */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E5E5E5] p-5">
              <div className="flex items-center justify-between mb-4 border-b border-[#F5F5F5] pb-3">
                <h2 className="font-bold text-[#111111] text-base">Active Broadcasts</h2>
                <span className="badge badge-gray text-xs">{announcements.length} updates</span>
              </div>

              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#E5E5E5] border-t-[#F4C430] rounded-full animate-spin mb-3" />
                  <span className="text-xs text-[#737373] font-bold">Loading announcements...</span>
                </div>
              ) : announcements.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#A3A3A3] mb-3">
                    <Megaphone size={20} />
                  </div>
                  <h3 className="font-bold text-[#111111] text-sm">No Active Announcements</h3>
                  <p className="text-xs text-[#737373] max-w-xs mt-1">Publish an update using the form to notify students and teachers.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className={`p-4 rounded-xl border transition-all flex items-start gap-4 group ${
                        ann.severity === 'crucial'
                          ? 'bg-[#FEF2F2]/40 border-[#FECACA] hover:border-[#F87171]'
                          : 'bg-white border-[#E5E5E5] hover:border-[#D4D4D4]'
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl border shrink-0 flex items-center justify-center ${
                          ann.severity === 'crucial'
                            ? 'bg-[#FEE2E2] border-[#FECACA] text-[#DC2626]'
                            : 'bg-[#FAFAFA] border-[#F0F0F0] text-[#111111]'
                        }`}
                      >
                        {ann.severity === 'crucial' ? <ShieldAlert size={22} /> : <Megaphone size={22} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#111111] text-sm truncate">{ann.title}</h3>
                          <span
                            className={`badge text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border ${
                              ann.severity === 'crucial'
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-green-50 text-green-600 border-green-200'
                            }`}
                          >
                            {ann.severity === 'crucial' ? '🔴 Crucial' : '🟢 Normal'}
                          </span>
                          <span className="badge bg-[#FAFAFA] text-[#525252] border border-[#E5E5E5] text-[9px] font-bold py-0.5 px-2 rounded-full">
                            {ann.scope === 'class'
                              ? `🎯 Grade ${ann.class?.grade || ''} • ${ann.stream?.name || 'All Streams'}`
                              : '🌐 Whole System'}
                          </span>
                        </div>

                        <p className="text-xs text-[#525252] mt-1.5 leading-relaxed font-medium whitespace-pre-wrap">
                          {ann.body}
                        </p>

                        <div className="flex items-center gap-3 mt-3 text-[10px] text-[#A3A3A3] font-bold">
                          <span className="flex items-center gap-1 text-[#A3A3A3]">
                            <Calendar size={11} className="inline mr-1" />
                            {new Date(ann.created_at).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{new Date(ann.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {ann.creator?.full_name && (
                            <>
                              <span>•</span>
                              <span>Posted by {ann.creator.full_name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteTrigger(ann.id)}
                        className={`p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0 ${isMobile ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        title="Remove Announcement"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Announcement"
        description="Are you sure you want to remove this announcement? It will be deleted permanently and removed from all student and teacher dashboards."
        confirmLabel="Yes, delete it"
        danger
      />
    </AdminShell>
  );
};

export default AdminAnnouncementsPage;
