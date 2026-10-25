/**
 * Configuration for Android APK Upload
 *
 * Defaults to the built-in Cloudflare Pages Function / Worker endpoint:
 * /api/admin/upload-apk
 *
 * Can optionally be overridden via VITE_WORKER_UPLOAD_URL for custom workers.
 */
export const WORKER_UPLOAD_URL: string =
  ((import.meta as any).env?.VITE_WORKER_UPLOAD_URL as string)?.trim() ||
  (typeof window !== 'undefined' && (window as any).WORKER_UPLOAD_URL)?.trim() ||
  '/api/admin/upload-apk';

/**
 * Validates that the upload URL is configured.
 * Supports relative paths like /api/admin/upload-apk and absolute URLs.
 */
export function validateWorkerUploadUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: "Upload service isn't configured",
    };
  }

  const trimmed = url.trim();

  // If it's a relative path on the same app, it's valid
  if (trimmed.startsWith('/')) {
    return { isValid: true };
  }

  // If it's an absolute URL, verify protocol
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: 'Upload service URL must start with https:// or http://',
      };
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'Upload service has an invalid URL configuration',
    };
  }
}
