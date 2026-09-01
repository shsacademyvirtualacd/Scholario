import React, { useRef, useState } from 'react';
import { Camera, Loader2, Trash2 } from 'lucide-react';
import { uploadProfilePicture, deleteProfilePicture } from '../../lib/avatarService';
import { useAuth } from '../../features/auth/AuthContext';
import { toast } from 'sonner';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  name?: string;
  role?: 'student' | 'teacher' | 'admin' | string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  editable?: boolean;
  onAvatarChange?: (newUrl: string | null) => void;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs rounded-lg',
  md: 'w-9 h-9 text-sm rounded-lg',
  lg: 'w-12 h-12 text-base rounded-xl',
  xl: 'w-16 h-16 text-xl rounded-2xl',
  '2xl': 'w-24 h-24 text-3xl rounded-2xl',
};

const BG_ACCENTS: Record<string, string> = {
  student: 'bg-[#F4C430] text-[#111111]',
  teacher: 'bg-[#F4C430] text-[#111111]',
  admin: 'bg-[#F4C430] text-[#111111]',
  default: 'bg-[#111111] text-white',
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  name = 'User',
  role = 'default',
  size = 'md',
  editable = false,
  onAvatarChange,
  className = '',
}) => {
  const { refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const initial = (name?.[0] || 'U').toUpperCase();
  const bgClass = BG_ACCENTS[role] || BG_ACCENTS.default;
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset file input so re-selecting same file triggers change
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!file) return;

    // Client-side validation: File Type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const validExts = ['jpg', 'jpeg', 'png', 'webp'];
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    
    if (!validMimes.includes(file.type.toLowerCase()) && !validExts.includes(ext)) {
      toast.error('Invalid file type. Only JPG, PNG, and WebP images are allowed.');
      return;
    }

    // Client-side validation: Max 2 MB size
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      toast.error(`Image is too large (${sizeMB} MB). Maximum allowed size is 2 MB.`);
      return;
    }

    setIsUploading(true);
    setImageError(false);

    try {
      const newUrl = await uploadProfilePicture(file);
      await refreshProfile();
      if (onAvatarChange) onAvatarChange(newUrl);
      toast.success('Profile picture updated successfully!');
    } catch (err: any) {
      console.error('[ProfileAvatar] Upload failed:', err);
      toast.error(err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!avatarUrl || isRemoving || isUploading) return;

    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setIsRemoving(true);
    try {
      await deleteProfilePicture();
      await refreshProfile();
      if (onAvatarChange) onAvatarChange(null);
      toast.success('Profile picture removed.');
    } catch (err: any) {
      console.error('[ProfileAvatar] Removal failed:', err);
      toast.error(err.message || 'Failed to remove profile picture.');
    } finally {
      setIsRemoving(false);
    }
  };

  const hasValidImage = !!avatarUrl && !imageError;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative group overflow-hidden select-none shrink-0 ${sizeClass} ${className} ${
          editable ? 'cursor-pointer hover:ring-2 hover:ring-[#F4C430] hover:ring-offset-2 transition-all' : ''
        }`}
        onClick={() => {
          if (editable && !isUploading && !isRemoving) {
            fileInputRef.current?.click();
          }
        }}
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
        title={editable ? 'Click to change profile picture' : name}
      >
        {/* Actual Image or Fallback */}
        {hasValidImage ? (
          <img
            src={avatarUrl!}
            alt={name}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className={`w-full h-full flex items-center justify-center font-black ${bgClass}`}>
            {initial}
          </div>
        )}

        {/* Uploading Overlay */}
        {(isUploading || isRemoving) && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white z-10 backdrop-blur-xs">
            <Loader2 size={size === '2xl' ? 24 : 16} className="animate-spin text-[#F4C430]" />
            {size === '2xl' && (
              <span className="text-[10px] font-bold mt-1 text-white/90">
                {isUploading ? 'Uploading...' : 'Removing...'}
              </span>
            )}
          </div>
        )}

        {/* Hover / Camera Overlay for Editable Mode */}
        {editable && !isUploading && !isRemoving && (
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex flex-col items-center justify-center text-white z-10">
            <Camera size={size === '2xl' ? 22 : 16} />
            {size === '2xl' && (
              <span className="text-[10px] font-bold mt-1 tracking-wide">Change</span>
            )}
          </div>
        )}

        {/* Hidden File Input */}
        {editable && (
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
            aria-label="Upload profile picture"
          />
        )}
      </div>

      {/* Action buttons for 2xl / Profile Page view */}
      {editable && size === '2xl' && (
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            disabled={isUploading || isRemoving}
            onClick={() => fileInputRef.current?.click()}
            className="text-[11px] font-bold text-[#111111] hover:text-black bg-[#F5F5F5] hover:bg-[#EBEBEB] border border-[#E5E5E5] px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1 interactive disabled:opacity-50"
          >
            <Camera size={12} />
            <span>{avatarUrl ? 'Change Photo' : 'Upload Photo'}</span>
          </button>

          {avatarUrl && (
            <button
              type="button"
              disabled={isUploading || isRemoving}
              onClick={handleRemove}
              title="Remove profile picture"
              className="text-[11px] font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg transition-colors inline-flex items-center gap-1 interactive disabled:opacity-50"
            >
              <Trash2 size={12} />
              <span>Remove</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileAvatar;
