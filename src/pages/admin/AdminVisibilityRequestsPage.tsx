import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  EyeOff,
  Check,
  X,
  Loader2,
  RefreshCw,
  Phone,
  AlertCircle,
} from 'lucide-react';
import AdminShell from '../../components/admin/AdminShell';
import SectionHeader from '../../components/ui/SectionHeader';
import ProfileAvatar from '../../components/common/ProfileAvatar';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  getAdminVisibilityRequests,
  reviewVisibilityRequest,
} from '../../lib/visibilityRequestsService';
import type { VisibilityRequest } from '../../types';
import { toast } from 'sonner';

type FilterTab = 'pending' | 'all' | 'approved' | 'rejected';

export const AdminVisibilityRequestsPage: React.FC = () => {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<VisibilityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<VisibilityRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadRequests = useCallback(async (showRefreshingState = false) => {
    if (showRefreshingState) setRefreshing(true);
    try {
      const data = await getAdminVisibilityRequests();
      setRequests(data.requests);
    } catch (err: any) {
      toast.error('Failed to load visibility requests: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();

    // Subscribe to realtime updates on visibility_requests
    const channel = supabase
      .channel('admin-visibility-requests-feed')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visibility_requests',
        },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadRequests]);

  // Counts
  const counts = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pending').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const rejected = requests.filter((r) => r.status === 'rejected').length;
    const total = requests.length;
    return { pending, approved, rejected, total };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Tab filter
      if (activeTab === 'pending' && req.status !== 'pending') return false;
      if (activeTab === 'approved' && req.status !== 'approved') return false;
      if (activeTab === 'rejected' && req.status !== 'rejected') return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const userName = (req.user_name || '').toLowerCase();
        const userPhone = (req.user_phone || '').toLowerCase();
        const userRole = (req.user_role || '').toLowerCase();
        const notes = (req.notes || '').toLowerCase();
        return (
          userName.includes(q) ||
          userPhone.includes(q) ||
          userRole.includes(q) ||
          notes.includes(q)
        );
      }

      return true;
    });
  }, [requests, activeTab, searchQuery]);

  // Handlers
  const handleApprove = async (req: VisibilityRequest) => {
    if (!profile?.id) return;
    setProcessingId(req.id);
    try {
      await reviewVisibilityRequest(req.id, 'approve', profile.id);
      toast.success(`Request approved for ${req.user_name || 'user'}`, {
        description: 'Their online status and last seen has been hidden. An in-app notification was sent.',
      });
      await loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (req: VisibilityRequest) => {
    setRejectTarget(req);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!profile?.id || !rejectTarget) return;
    setProcessingId(rejectTarget.id);
    try {
      await reviewVisibilityRequest(
        rejectTarget.id,
        'reject',
        profile.id,
        rejectReason.trim() || undefined
      );
      toast.info(`Request declined for ${rejectTarget.user_name || 'user'}`, {
        description: 'Their status remains visible. An in-app notification was sent.',
      });
      setRejectModalOpen(false);
      setRejectTarget(null);
      await loadRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays}d ago`;
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <SectionHeader
            title="Visibility Requests"
            subtitle="Review student and teacher requests to turn off online presence and last seen visibility in Scholario Chat."
          />
          <button
            onClick={() => loadRequests(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#111111] bg-white border border-[#E5E5E5] hover:bg-[#F9F9F9] rounded-xl shadow-2xs transition-colors self-start sm:self-auto interactive"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div
            onClick={() => setActiveTab('pending')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/20 shadow-xs'
                : 'bg-white border-[#E5E5E5] hover:border-amber-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#737373] uppercase tracking-wide">Pending Review</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-700 flex items-center justify-center">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">{counts.pending}</span>
              <span className="text-[11px] font-semibold text-amber-600/80">requires action</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('approved')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'approved'
                ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-400/20 shadow-xs'
                : 'bg-white border-[#E5E5E5] hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#737373] uppercase tracking-wide">Approved</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-700">{counts.approved}</span>
              <span className="text-[11px] font-semibold text-[#737373]">status hidden</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('rejected')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'rejected'
                ? 'bg-red-50/70 border-red-300 ring-2 ring-red-400/20 shadow-xs'
                : 'bg-white border-[#E5E5E5] hover:border-red-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#737373] uppercase tracking-wide">Declined</span>
              <div className="w-8 h-8 rounded-xl bg-red-100/70 text-red-700 flex items-center justify-center">
                <XCircle size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-red-700">{counts.rejected}</span>
              <span className="text-[11px] font-semibold text-[#737373]">kept visible</span>
            </div>
          </div>

          <div
            onClick={() => setActiveTab('all')}
            className={`p-4 rounded-2xl border transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-zinc-100 border-zinc-400 ring-2 ring-zinc-400/20 shadow-xs'
                : 'bg-white border-[#E5E5E5] hover:border-zinc-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#737373] uppercase tracking-wide">Total Submissions</span>
              <div className="w-8 h-8 rounded-xl bg-[#F5F5F5] text-[#111111] flex items-center justify-center">
                <ShieldAlert size={16} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#111111]">{counts.total}</span>
              <span className="text-[11px] font-semibold text-[#737373]">all time</span>
            </div>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F5] rounded-xl self-start md:self-auto overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-white text-[#111111] shadow-2xs'
                  : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              <span>Pending</span>
              {counts.pending > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-black leading-tight">
                  {counts.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'approved'
                  ? 'bg-white text-[#111111] shadow-2xs'
                  : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              Approved ({counts.approved})
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'rejected'
                  ? 'bg-white text-[#111111] shadow-2xs'
                  : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              Declined ({counts.rejected})
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 ${
                activeTab === 'all'
                  ? 'bg-white text-[#111111] shadow-2xs'
                  : 'text-[#737373] hover:text-[#111111]'
              }`}
            >
              All Requests ({counts.total})
            </button>
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
            <input
              type="text"
              placeholder="Search by name, role, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl text-[#111111] placeholder:text-[#A3A3A3] focus:outline-hidden focus:border-[#111111] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#737373] hover:text-[#111111]"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-12 text-center shadow-xs">
            <Loader2 size={24} className="animate-spin text-[#111111] mx-auto mb-3" />
            <p className="text-xs font-bold text-[#737373]">Loading visibility requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center mx-auto mb-3.5 text-[#A3A3A3]">
              <EyeOff size={22} />
            </div>
            <h3 className="text-sm font-bold text-[#111111]">No visibility requests found</h3>
            <p className="text-xs text-[#737373] max-w-sm mx-auto mt-1 leading-relaxed">
              {searchQuery
                ? 'No requests matched your search query. Try clearing the filter.'
                : activeTab === 'pending'
                ? 'All visibility requests have been reviewed. There are no pending requests waiting for approval.'
                : 'No visibility requests in this category.'}
            </p>
          </div>
        ) : (
          <div className="bg-white border border-[#E5E5E5] rounded-2xl shadow-xs overflow-hidden">
            <div className="divide-y divide-[#F0F0F0]">
              {filteredRequests.map((req) => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';
                const isCancelled = req.status === 'cancelled';
                const isProcessing = processingId === req.id;

                return (
                  <div
                    key={req.id}
                    className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      isPending ? 'hover:bg-amber-50/20' : 'hover:bg-[#FAFAFA]'
                    }`}
                  >
                    {/* User info & request details */}
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <ProfileAvatar
                        avatarUrl={req.user_avatar}
                        name={req.user_name || 'User'}
                        role={(req.user_role as any) || 'student'}
                        size="md"
                        className="shrink-0 mt-0.5"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#111111] truncate">
                            {req.user_name || 'Unknown Student / Teacher'}
                          </h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                              req.user_role === 'teacher'
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}
                          >
                            {req.user_role || 'student'}
                          </span>

                          {/* Status Badge */}
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                              isPending
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : isApproved
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isRejected
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                            }`}
                          >
                            {isPending && <Clock size={10} className="animate-pulse text-amber-600" />}
                            {isApproved && <Check size={10} className="text-emerald-600" />}
                            {isRejected && <X size={10} className="text-red-600" />}
                            <span className="capitalize">{req.status}</span>
                          </span>
                        </div>

                        {/* Request Description */}
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-[#525252] flex-wrap">
                          <span className="font-semibold text-[#111111] flex items-center gap-1">
                            <EyeOff size={13} className="text-[#737373]" />
                            Requested change: <span className="underline decoration-dotted">Hide online status & last seen</span>
                          </span>
                          <span className="text-[#A3A3A3]">•</span>
                          <span className="text-[#737373] flex items-center gap-1">
                            <Clock size={12} />
                            Requested {formatRelativeTime(req.requested_at)} ({new Date(req.requested_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })})
                          </span>
                          {req.user_phone && (
                            <>
                              <span className="text-[#A3A3A3]">•</span>
                              <span className="text-[#737373] flex items-center gap-1">
                                <Phone size={12} />
                                {req.user_phone}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Audit / Review Notes if processed */}
                        {!isPending && (
                          <div className="mt-2 text-[11px] text-[#737373] bg-[#F9F9F9] border border-[#EEEEEE] px-3 py-1.5 rounded-xl inline-block">
                            {isApproved && (
                              <span>
                                Approved by <strong className="text-[#111111]">{req.reviewer_name || 'Admin'}</strong> on{' '}
                                {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : 'N/A'}
                              </span>
                            )}
                            {isRejected && (
                              <span>
                                Declined by <strong className="text-[#111111]">{req.reviewer_name || 'Admin'}</strong>
                                {req.notes ? `: "${req.notes}"` : ''} on{' '}
                                {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString() : 'N/A'}
                              </span>
                            )}
                            {isCancelled && <span>User cancelled their pending request.</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons for Pending Requests */}
                    {isPending ? (
                      <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleApprove(req)}
                          disabled={isProcessing}
                          className="px-3.5 py-2 text-xs font-bold text-white bg-[#111111] hover:bg-black rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors interactive disabled:opacity-50"
                          title="Approve request and hide online status"
                        >
                          {isProcessing ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openRejectModal(req)}
                          disabled={isProcessing}
                          className="px-3.5 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl flex items-center gap-1.5 transition-colors interactive disabled:opacity-50"
                          title="Decline request and keep status visible"
                        >
                          <X size={14} />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="shrink-0 text-right">
                        <span className="text-[11px] font-semibold text-[#A3A3A3]">
                          {isApproved ? 'Status: Hidden' : 'Status: Visible'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Policy Guidance Note */}
        <div className="bg-[#F9F9F9] border border-[#E5E5E5] rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle size={17} className="text-[#737373] shrink-0 mt-0.5" />
          <div className="text-xs text-[#525252] leading-relaxed">
            <span className="font-bold text-[#111111]">Scholario Privacy & Safety Policy:</span>{' '}
            Students and teachers are visible by default to ensure transparency and rapid academic communication. Turning off visibility requires administrative approval. When approved, mutual privacy is activated (the user cannot see others&apos; last seen or active status either). If a user chooses to re-enable their visibility, they can do so instantly without requiring approval.
          </div>
        </div>

        {/* Decline Modal */}
        {rejectModalOpen && rejectTarget && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E5E5E5] animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0F0F0] mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-100 text-red-700 flex items-center justify-center">
                    <XCircle size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-[#111111]">Decline Visibility Request</h3>
                </div>
                <button
                  onClick={() => setRejectModalOpen(false)}
                  className="p-1 rounded-lg text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-[#525252] mb-3 leading-relaxed">
                You are about to decline the privacy request for{' '}
                <strong className="text-[#111111]">{rejectTarget.user_name || 'this user'}</strong>.
                Their status will remain visible to contacts in Scholario Chat.
              </p>

              <div className="space-y-1.5 mb-4">
                <label className="block text-[11px] font-bold text-[#737373] uppercase tracking-wide">
                  Reason / Explanation (Optional — shown to user)
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g., Active status is required during examination term or core school hours."
                  className="w-full text-xs p-3 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl text-[#111111] placeholder:text-[#A3A3A3] focus:outline-hidden focus:border-[#111111] resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0F0F0]">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] rounded-xl transition-colors interactive"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={processingId === rejectTarget.id}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-2xs flex items-center gap-1.5 transition-colors interactive disabled:opacity-50"
                >
                  {processingId === rejectTarget.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <X size={13} />
                  )}
                  <span>Confirm Decline</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminVisibilityRequestsPage;
