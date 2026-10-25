import { useState, useEffect } from 'react';

export interface LatestApkInfo {
  version: string;
  fileName: string;
  url: string;
  downloadUrl?: string;
  size: string;
  sizeBytes?: number;
  date: string;
  publishedDate?: string;
  notes?: string;
  releaseNotes?: string;
}

export function useLatestApk() {
  const [apkInfo, setApkInfo] = useState<LatestApkInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchLatestApk() {
      try {
        // Look up <PUBLIC_DOMAIN>/apk/latest.json with cache bypass
        const res = await fetch(`/apk/latest.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });

        if (!res.ok) {
          if (isMounted) {
            setApkInfo(null);
            setLoading(false);
          }
          return;
        }

        const data = await res.json();
        const downloadUrl = data?.url || data?.downloadUrl;
        if (data && downloadUrl && data.version) {
          if (isMounted) {
            setApkInfo({
              ...data,
              url: downloadUrl,
            });
          }
        } else {
          if (isMounted) {
            setApkInfo(null);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setApkInfo(null);
          setError(err?.message || 'Failed to load APK metadata');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchLatestApk();

    return () => {
      isMounted = false;
    };
  }, []);

  const isIos = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

  return { apkInfo, loading, error, isIos };
}

export default useLatestApk;
