/**
 * Configuration for Android APK Upload to Cloudflare Worker
 *
 * WORKER_UPLOAD_URL must be the full, absolute URL of the Cloudflare Worker.
 * Example: https://scholario-apk-worker.<account>.workers.dev/upload
 * or https://files.scholario.app/upload
 *
 * It must NEVER be a relative path or the site's own domain (static hosting returns 405 on uploads).
 */
export const WORKER_UPLOAD_URL: string =
  ((import.meta as any).env?.VITE_WORKER_UPLOAD_URL as string)?.trim() ||
  (typeof window !== 'undefined' && (window as any).WORKER_UPLOAD_URL)?.trim() ||
  '';

/**
 * Validates that the configured URL is a non-empty, full absolute URL
 * and is not a relative path or pointing to the site's own domain.
 */
export function validateWorkerUploadUrl(url: string): { isValid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      error: "Upload service isn't configured",
    };
  }

  const trimmed = url.trim();

  // Reject relative paths
  if (trimmed.startsWith('/') || trimmed.startsWith('.')) {
    return {
      isValid: false,
      error: "Upload service isn't configured (must be an absolute Cloudflare Worker URL, not a relative path)",
    };
  }

  // Ensure absolute HTTP/HTTPS URL
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        isValid: false,
        error: "Upload service isn't configured (URL must start with https://)",
      };
    }

    // Must never be the site's own domain
    if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
      return {
        isValid: false,
        error: "Upload service isn't configured (must be Cloudflare Worker URL, not the site's own static domain)",
      };
    }

    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: "Upload service isn't configured (invalid Worker URL)",
    };
  }
}
