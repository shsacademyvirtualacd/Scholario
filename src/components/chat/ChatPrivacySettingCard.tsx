import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, Loader2, Clock } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  submitVisibilityRequest,
  turnOnVisibility,
  cancelVisibilityRequest,
  getUserVisibilityStatus,
} from '../../lib/visibilityRequestsService';
import type { VisibilityRequest } from '../../types';
import { toast } from 'sonner';

interface ChatPrivacySettingCardProps {
  className?: string;
  compact?: boolean;
}

export const ChatPrivacySettingCard: React.FC<ChatPrivacySettingCardProps> = ({
  className = '',
  compact = false,
}) => {
  const { profile, refreshProfile } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<VisibilityRequest | null>(null);

  // Default is true if undefined or null
  const isEnabled = profile?.show_online_status ?? true;
  const isAdmin = profile?.role === 'admin';

  // Load pending visibility request
  useEffect(() => {
    if (!profile?.id) return;

    let isMounted = true;
    getUserVisibilityStatus(profile.id)
      .then((res) => {
        if (isMounted) {
          setPendingRequest(res.pendingRequest);
        }
      })
      .catch((err) => {
        console.warn('[ChatPrivacySettingCard] Error fetching visibility status:', err);
      });

    // Realtime listener for request review updates
    const channel = supabase
      .channel(`user-visibility-requests-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visibility_requests',
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newReq = payload.new as VisibilityRequest;
            if (newReq.status === 'pending') {
              setPendingRequest(newReq);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as VisibilityRequest;
            if (updated.status === 'pending') {
              setPendingRequest(updated);
            } else {
              setPendingRequest(null);
              // Refresh profile so show_online_status reflects the approved change
              refreshProfile();
            }
          } else if (payload.eventType === 'DELETE') {
            setPendingRequest(null);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [profile?.id, refreshProfile]);

  const handleToggle = async () => {
    if (!profile?.id || updating) return;

    // Case 1: Currently enabled (visible) -> User wants to turn it OFF (hide status)
    if (isEnabled) {
      if (pendingRequest) {
        toast.info('Request already sent — pending admin approval.');
        return;
      }

      setUpdating(true);
      try {
        if (isAdmin) {
          // Admins can toggle directly self-serve
          await submitVisibilityRequest(profile.id);
          await refreshProfile();
          toast.success('Online status and last seen are now hidden (mutual privacy enabled).');
        } else {
          // Students & teachers require admin approval to turn off
          const res = await submitVisibilityRequest(profile.id);
          if (res.request) {
            setPendingRequest(res.request);
          }
          toast.info('Request sent — pending admin approval', {
            description: 'Your status stays visible until an administrator approves your request.',
          });
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to submit visibility request.');
      } finally {
        setUpdating(false);
      }
      return;
    }

    // Case 2: Currently disabled (hidden) -> User wants to turn it back ON (visible)
    // Turning it back ON is instant, self-serve, no admin approval needed
    setUpdating(true);
    try {
      await turnOnVisibility(profile.id);
      await refreshProfile();
      setPendingRequest(null);
      toast.success('Online status and last seen are now visible to your contacts.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to re-enable online status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!profile?.id || cancelling) return;
    setCancelling(true);
    try {
      await cancelVisibilityRequest(profile.id);
      setPendingRequest(null);
      toast.success('Visibility change request has been cancelled.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel request.');
    } finally {
      setCancelling(false);
    }
  };

  if (compact) {
    return (
      <div className={`flex flex-col gap-2 p-3.5 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center text-[#111111] shrink-0">
              {isEnabled ? <Eye size={16} className="text-emerald-600" /> : <EyeOff size={16} className="text-[#737373]" />}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#111111] truncate">Show my online status & last seen</h4>
              <p className="text-[10px] text-[#737373] truncate">
                {pendingRequest
                  ? 'Request sent — pending approval'
                  : isEnabled
                  ? 'Visible to contacts'
                  : 'Hidden from everyone (mutual)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isEnabled}
            disabled={updating}
            onClick={handleToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-75 ${
              isEnabled ? 'bg-[#111111]' : 'bg-[#E5E5E5]'
            }`}
            title={pendingRequest ? 'Request pending admin approval' : 'Toggle online presence visibility'}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                isEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            >
              {updating ? (
                <Loader2 size={10} className="animate-spin text-[#111111]" />
              ) : pendingRequest ? (
                <Clock size={10} className="text-[#F59E0B]" />
              ) : isEnabled ? (
                <Check size={10} className="text-[#111111]" />
              ) : null}
            </span>
          </button>
        </div>

        {pendingRequest && (
          <div className="flex items-center justify-between text-[11px] bg-amber-50 border border-amber-200/70 text-amber-900 px-2.5 py-1.5 rounded-lg mt-1">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock size={12} className="text-amber-600 shrink-0" />
              Request sent — pending admin approval
            </span>
            <button
              type="button"
              onClick={handleCancelRequest}
              disabled={cancelling}
              className="text-[10px] font-bold text-amber-800 underline hover:text-amber-950 ml-2 cursor-pointer"
            >
              {cancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-xs ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111] shrink-0 mt-0.5">
            {isEnabled ? (
              <Eye size={20} className="text-emerald-600" />
            ) : (
              <EyeOff size={20} className="text-[#737373]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-[#111111]">
                Show my online status & last seen
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  pendingRequest
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : isEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {pendingRequest ? 'Pending Admin Approval' : isEnabled ? 'Visible' : 'Hidden'}
              </span>
            </div>
            <p className="text-xs text-[#737373] mt-1.5 leading-relaxed max-w-lg">
              Allow teachers, classmates, and administrators to see when you are active in Scholario Chat and your last seen time.
              <span className="block mt-1 text-[#A3A3A3] text-[11px]">
                Note: Turning this off enables mutual privacy. You won&apos;t share your status, and you will not see other users&apos; online or last seen status.
              </span>
            </p>
          </div>
        </div>

        {/* Switch Button */}
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          disabled={updating}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-75 mt-1 interactive ${
            isEnabled ? 'bg-[#111111]' : 'bg-[#D4D4D4]'
          }`}
          title={
            pendingRequest
              ? 'Request sent — pending admin approval'
              : isEnabled
              ? 'Turn off online status (requires admin approval)'
              : 'Turn on online status (instant)'
          }
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {updating ? (
              <Loader2 size={10} className="animate-spin text-[#111111]" />
            ) : pendingRequest ? (
              <Clock size={11} className="text-[#F59E0B]" />
            ) : isEnabled ? (
              <Check size={11} className="text-[#111111]" />
            ) : null}
          </span>
        </button>
      </div>

      {/* Pending Admin Approval Banner */}
      {pendingRequest && (
        <div className="mt-4 pt-3.5 border-t border-[#F0F0F0]">
          <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200/80">
            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900">
                  Request sent — pending admin approval
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed font-medium">
                  Your request to hide your online presence was sent to administrators on{' '}
                  <span className="font-semibold">
                    {new Date(pendingRequest.requested_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                  . Your status will stay visible until an administrator reviews and approves this request.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelRequest}
              disabled={cancelling}
              className="px-2.5 py-1 text-xs font-bold bg-white text-amber-900 border border-amber-200 hover:bg-amber-100 rounded-lg shrink-0 transition-colors shadow-2xs interactive"
              title="Cancel your pending request"
            >
              {cancelling ? (
                <span className="flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  Cancelling...
                </span>
              ) : (
                'Cancel Request'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPrivacySettingCard;

