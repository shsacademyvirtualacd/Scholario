import { supabase } from './supabase';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

/**
 * Validates and uploads a user profile picture to Cloudflare R2 via the backend API.
 * Updates the user's Supabase profile and deletes any prior R2 profile picture.
 */
export async function uploadProfilePicture(file: File): Promise<string> {
  if (!file) {
    throw new Error('Please select an image file to upload.');
  }

  // Client-side file type validation
  const fileType = file.type.toLowerCase();
  const fileExt = (file.name.split('.').pop() || '').toLowerCase();
  const isImageMime = ALLOWED_MIME_TYPES.includes(fileType);
  const isImageExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt);

  if (!isImageMime && !isImageExt) {
    throw new Error('Invalid file format. Only JPG, PNG, and WebP images are allowed.');
  }

  // Client-side file size validation (2 MB max)
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`File is too large (${sizeInMB} MB). Maximum allowed size is 2 MB.`);
  }

  // Retrieve current active Supabase auth session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in to upload a profile picture.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/profiles/avatar/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  const result: any = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = result?.error || `Upload failed with status code ${response.status}`;
    throw new Error(errorMsg);
  }

  if (!result?.avatar_url) {
    throw new Error('Server did not return a valid avatar URL.');
  }

  return result.avatar_url;
}

/**
 * Deletes the user's profile picture from Cloudflare R2 and clears avatar_url in the database.
 */
export async function deleteProfilePicture(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('You must be signed in to remove your profile picture.');
  }

  const response = await fetch('/api/profiles/avatar/delete', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const result: any = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = result?.error || `Removal failed with status code ${response.status}`;
    throw new Error(errorMsg);
  }
}
