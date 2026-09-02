import React, { useState } from 'react';
import { Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { updateProfile } from '../../lib/db';
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

  // Default is true if undefined or null
  const isEnabled = profile?.show_online_status ?? true;

  const handleToggle = async () => {
    if (!profile?.id || updating) return;

    const nextState = !isEnabled;
    setUpdating(true);

    try {
      await updateProfile(profile.id, {
        show_online_status: nextState,
      });
      await refreshProfile();
      toast.success(
        nextState
          ? 'Online status and last seen are now visible to your contacts.'
          : 'Online status and last seen are now hidden (mutual privacy enabled).'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to update privacy settings.');
    } finally {
      setUpdating(false);
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center justify-between gap-4 p-3.5 bg-[#F9F9F9] border border-[#E5E5E5] rounded-xl ${className}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white border border-[#E5E5E5] flex items-center justify-center text-[#111111] shrink-0">
            {isEnabled ? <Eye size={16} className="text-emerald-600" /> : <EyeOff size={16} className="text-[#737373]" />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-[#111111] truncate">Show Online & Last Seen</h4>
            <p className="text-[10px] text-[#737373] truncate">
              {isEnabled ? 'Visible to contacts' : 'Hidden from everyone (mutual)'}
            </p>
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          disabled={updating}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
            isEnabled ? 'bg-[#111111]' : 'bg-[#E5E5E5]'
          }`}
          title="Toggle online presence visibility"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {updating && <Loader2 size={10} className="animate-spin text-[#111111]" />}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-[#E5E5E5] rounded-2xl p-5 shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F5F5] border border-[#E5E5E5] flex items-center justify-center text-[#111111] shrink-0 mt-0.5">
            {isEnabled ? (
              <Eye size={20} className="text-emerald-600" />
            ) : (
              <EyeOff size={20} className="text-[#737373]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#111111]">
                Online Status & Last Seen
              </h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isEnabled
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {isEnabled ? 'Active' : 'Private'}
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
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 mt-1 interactive ${
            isEnabled ? 'bg-[#111111]' : 'bg-[#D4D4D4]'
          }`}
          title={isEnabled ? 'Disable online presence' : 'Enable online presence'}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
              isEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          >
            {updating ? (
              <Loader2 size={10} className="animate-spin text-[#111111]" />
            ) : isEnabled ? (
              <Check size={11} className="text-[#111111]" />
            ) : null}
          </span>
        </button>
      </div>
    </div>
  );
};

export default ChatPrivacySettingCard;
