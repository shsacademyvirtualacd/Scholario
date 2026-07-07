import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Megaphone, Calendar, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ConfirmModal from '../../components/admin/ConfirmModal';
import { MOCK_ANNOUNCEMENTS } from '../../lib/mockData';
import type { Announcement } from '../../lib/mockData';

export const AdminAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([...MOCK_ANNOUNCEMENTS]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [icon, setIcon] = useState('📢');
  
  // Notification states
  const [notif, setNotif] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setAnnouncements([...MOCK_ANNOUNCEMENTS]);
    };
    window.addEventListener('scholario_announcements_updated', handleUpdate);
    return () => {
      window.removeEventListener('scholario_announcements_updated', handleUpdate);
    };
  }, []);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotif({ type, message });
    setTimeout(() => setNotif(null), 3000);
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      triggerNotification('error', 'Please fill in all fields.');
      return;
    }

    const newAnn: Announcement = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      time: 'Just now',
      date: new Date().toISOString().split('T')[0],
      icon,
      priority
    };

    // Mutate proxy array
    MOCK_ANNOUNCEMENTS.unshift(newAnn);
    
    // Reset Form
    setTitle('');
    setContent('');
    setPriority('medium');
    setIcon('📢');
    
    triggerNotification('success', 'Announcement published successfully!');
  };

  const handleDeleteTrigger = (id: string) => {
    setSelectedId(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedId) {
      const idx = MOCK_ANNOUNCEMENTS.findIndex(a => a.id === selectedId);
      if (idx !== -1) {
        MOCK_ANNOUNCEMENTS.splice(idx, 1);
        triggerNotification('success', 'Announcement deleted successfully.');
      }
      setSelectedId(null);
    }
  };

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="School Announcements"
            subtitle="Broadcast important updates, alerts, and news directly to the student portal."
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
            <div className="card card-elevated sticky top-24">
              <div className="flex items-center gap-2 mb-4 border-b border-[#F5F5F5] pb-3">
                <Sparkles size={18} className="text-[#F4C430]" />
                <h2 className="font-bold text-[#111111] text-base">New Announcement</h2>
              </div>

              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div>
                  <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1.5 block">Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Mid-term exams guidelines"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1.5 block">Broadcast Content</label>
                  <textarea
                    placeholder="Provide details about the update..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="input text-sm min-h-[100px] resize-none py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1.5 block">Icon Badge</label>
                    <select
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                      className="input text-sm"
                    >
                      <option value="📢">📢 Announcement</option>
                      <option value="📋">📋 Exam / Report</option>
                      <option value="🎉">🎉 Celebration / Holiday</option>
                      <option value="🚀">🚀 Release / Launch</option>
                      <option value="⚠️">⚠️ Alert / Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="label text-xs font-bold text-[#737373] uppercase tracking-wide mb-1.5 block">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="input text-sm"
                    >
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🔴 High</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-gold w-full mt-2">
                  <Plus size={16} />
                  Publish Update
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

              {announcements.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#A3A3A3] mb-3">
                    <Megaphone size={20} />
                  </div>
                  <h3 className="font-bold text-[#111111] text-sm">No Active Announcements</h3>
                  <p className="text-xs text-[#737373] max-w-xs mt-1">Publish an update using the form to notify the students.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => (
                    <div
                      key={ann.id}
                      className="p-4 rounded-xl border border-[#E5E5E5] hover:border-[#D4D4D4] hover:shadow-sm transition-all flex items-start gap-4 group"
                    >
                      <div className="text-2xl shrink-0 p-2.5 rounded-xl bg-[#FAFAFA] border border-[#F0F0F0]">
                        {ann.icon || '📢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-[#111111] text-sm truncate">{ann.title}</h3>
                          <span
                            className={`badge text-[9px] font-black uppercase tracking-wider py-0.5 px-2 rounded-full border ${
                              ann.priority === 'high'
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : ann.priority === 'medium'
                                ? 'bg-amber-50 text-amber-600 border-amber-200'
                                : 'bg-green-50 text-green-600 border-green-200'
                            }`}
                          >
                            {ann.priority}
                          </span>
                        </div>
                        <p className="text-xs text-[#525252] mt-1.5 leading-relaxed font-medium whitespace-pre-wrap">
                          {ann.content}
                        </p>
                        <div className="flex items-center gap-3 mt-3 text-[10px] text-[#A3A3A3] font-bold">
                          <span className="flex items-center gap-1 text-[#A3A3A3]">
                            <Calendar size={11} className="inline mr-1" />
                            {ann.date}
                          </span>
                          <span>•</span>
                          <span>{ann.time}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTrigger(ann.id)}
                        className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shrink-0"
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
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Announcement"
        message="Are you sure you want to remove this announcement? It will be deleted permanently and removed from all student dashboards."
        confirmText="Yes, delete it"
        variant="danger"
      />
    </AdminShell>
  );
};

export default AdminAnnouncementsPage;
