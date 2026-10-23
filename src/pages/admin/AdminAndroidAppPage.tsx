import React, { useState, useEffect, useRef } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import {
  Smartphone,
  UploadCloud,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Clock,
  HardDrive,
  Download,
  ExternalLink,
  Info,
  X,
  FileText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { WORKER_UPLOAD_URL, validateWorkerUploadUrl } from '../../config/apkUploadConfig';
import { isVersionHigher, parseSemver } from '../../utils/semver';

interface ApkManifest {
  version: string;
  fileName: string;
  url: string;
  size: string;
  sizeBytes?: number;
  date: string;
  notes?: string;
}

const MAX_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB

export const AdminAndroidAppPage: React.FC = () => {
  const [currentApk, setCurrentApk] = useState<ApkManifest | null>(null);
  const [loadingCurrent, setLoadingCurrent] = useState(true);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [versionName, setVersionName] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Upload Execution State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch current live release from /apk/latest.json
  const fetchLatestRelease = async () => {
    setLoadingCurrent(true);
    try {
      const res = await fetch('/apk/latest.json', {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.version) {
          setCurrentApk(data);
        } else {
          setCurrentApk(null);
        }
      } else {
        setCurrentApk(null);
      }
    } catch {
      setCurrentApk(null);
    } finally {
      setLoadingCurrent(false);
    }
  };

  useEffect(() => {
    fetchLatestRelease();
  }, []);

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!file.name.toLowerCase().endsWith('.apk')) {
      setErrorMessage('Invalid file format. Please select an Android package file (.apk).');
      return false;
    }

    if (file.size > MAX_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(`The selected file is too large (${sizeMb} MB). Maximum allowed size is 150 MB.`);
      return false;
    }

    setSelectedFile(file);

    // Auto-suggest version if empty and filename contains version (e.g. app-release-1.0.4.apk)
    if (!versionName) {
      const match = file.name.match(/(\d+\.\d+\.\d+)/);
      if (match) {
        setVersionName(match[1]);
      } else if (currentApk?.version) {
        const curParsed = parseSemver(currentApk.version);
        if (curParsed) {
          setVersionName(`${curParsed.major}.${curParsed.minor}.${curParsed.patch + 1}`);
        }
      }
    }

    return true;
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUploadAndPublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. File presence check
    if (!selectedFile) {
      setErrorMessage('Please select a valid .apk file to upload.');
      return;
    }

    // 2. SemVer validation: Must be valid SemVer and strictly higher than current version
    const cleanVersion = versionName.trim().replace(/^v/i, '');
    const semverCheck = isVersionHigher(cleanVersion, currentApk?.version);
    if (!semverCheck.isHigher) {
      setErrorMessage(semverCheck.error || 'Version must be higher than current published version.');
      return;
    }

    // 3. Cloudflare Worker URL validation (Must be configured and absolute, never relative or site origin)
    const urlCheck = validateWorkerUploadUrl(WORKER_UPLOAD_URL);
    if (!urlCheck.isValid) {
      const configErrMsg = "Upload service isn't configured";
      setErrorMessage(configErrMsg);
      console.error('[APK Upload Config Error] WORKER_UPLOAD_URL is not configured or points to the site domain:', {
        WORKER_UPLOAD_URL,
        reason: urlCheck.error,
      });
      return;
    }

    const uploadUrl = WORKER_UPLOAD_URL.trim();
    const httpMethod = 'PUT';

    setUploading(true);
    setUploadProgress(5);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      // 4. Log URL and HTTP Method BEFORE the request
      console.log('[APK Upload Request: Starting]', {
        url: uploadUrl,
        method: httpMethod,
        version: cleanVersion,
        currentVersion: currentApk?.version || null,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        contentType: 'application/vnd.android.package-archive',
      });

      // 5. Use XMLHttpRequest with PUT and stream binary file directly
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(httpMethod, uploadUrl);

        xhr.setRequestHeader('Content-Type', 'application/vnd.android.package-archive');
        xhr.setRequestHeader('X-Version', cleanVersion);

        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        if (releaseNotes.trim()) {
          xhr.setRequestHeader('X-Release-Notes', encodeURIComponent(releaseNotes.trim()));
        }

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 90);
            setUploadProgress(Math.max(5, pct));
          }
        };

        xhr.onload = () => {
          // Log URL, method, status, and response body AFTER the request
          console.log('[APK Upload Response: Received]', {
            url: uploadUrl,
            method: httpMethod,
            status: xhr.status,
            statusText: xhr.statusText,
            body: xhr.responseText,
          });

          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            try {
              const resData = JSON.parse(xhr.responseText);
              if (resData.manifest) {
                setCurrentApk(resData.manifest);
              }
              resolve();
            } catch {
              resolve();
            }
          } else {
            let errorText = `Upload failed with HTTP ${xhr.status}`;
            try {
              const errJson = JSON.parse(xhr.responseText);
              if (errJson && errJson.error) {
                errorText = errJson.error;
              }
            } catch {
              if (xhr.status === 405) {
                errorText = 'Upload failed with HTTP 405 (Method Not Allowed). Verify the Cloudflare Worker accepts PUT requests.';
              } else if (xhr.status === 401) {
                errorText = 'Authentication failed (HTTP 401). Please sign in again as an administrator.';
              } else if (xhr.status === 403) {
                errorText = 'Access denied (HTTP 403). Only administrators can publish APK builds.';
              } else if (xhr.statusText) {
                errorText = `Upload failed: ${xhr.statusText} (HTTP ${xhr.status})`;
              }
            }

            console.error('[APK Upload Response: Error]', {
              url: uploadUrl,
              method: httpMethod,
              status: xhr.status,
              statusText: xhr.statusText,
              error: errorText,
              body: xhr.responseText,
            });

            reject(new Error(errorText));
          }
        };

        xhr.onerror = () => {
          console.error('[APK Upload Network: Error]', {
            url: uploadUrl,
            method: httpMethod,
            status: xhr.status,
            statusText: xhr.statusText,
            body: xhr.responseText,
          });

          reject(new Error('Network error during APK upload. Verify CORS settings and connectivity to the Cloudflare Worker.'));
        };

        // Send the raw binary file directly as the request body
        xhr.send(selectedFile);
      });

      setSuccessMessage(`Scholario v${cleanVersion} has been uploaded to Cloudflare R2 and published successfully!`);
      setSelectedFile(null);
      setVersionName('');
      setReleaseNotes('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Refresh Live Published Version card
      await fetchLatestRelease();
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during APK upload.');
    } finally {
      setUploading(false);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AdminShell>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        {/* Header Title & Description */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-black/[0.08] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F2C230]/15 dark:bg-[#F2C230]/20 text-[#8A6A00] dark:text-[#F2C230] flex items-center justify-center shrink-0">
              <Smartphone size={26} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">
                Android App Release Management
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                Manage Android APK builds stored securely on Cloudflare R2 and served via high-speed global CDN.
              </p>
            </div>
          </div>
        </div>

        {/* ── CARD 1: Live Version Card ── */}
        <div className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#141416] border border-black/[0.08] dark:border-white/[0.08] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Live Published Version
              </h2>
            </div>
            <button
              type="button"
              onClick={fetchLatestRelease}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Refresh Status
            </button>
          </div>

          {loadingCurrent ? (
            <div className="py-8 flex items-center justify-center gap-3 text-neutral-500 text-xs">
              <div className="w-4 h-4 rounded-full border-2 border-neutral-300 border-t-[#F2C230] animate-spin" />
              <span>Fetching latest release metadata...</span>
            </div>
          ) : currentApk ? (
            <div className="pt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Version</p>
                  <p className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mt-1">
                    v{currentApk.version}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Package Size</p>
                  <div className="flex items-center gap-2 mt-1">
                    <HardDrive size={18} className="text-[#8A6A00] dark:text-[#F2C230]" />
                    <p className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                      {currentApk.size || formatBytes(currentApk.sizeBytes) || '24 MB'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Release Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock size={18} className="text-neutral-400" />
                    <p className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white">
                      {currentApk.date || 'Recent'}
                    </p>
                  </div>
                </div>
              </div>

              {currentApk.notes && (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04] text-xs">
                  <div className="flex items-center gap-2 font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                    <FileText size={14} className="text-[#8A6A00] dark:text-[#F2C230]" />
                    <span>What's New in this release:</span>
                  </div>
                  <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-wrap">
                    {currentApk.notes}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <span className="text-xs text-neutral-500 font-mono truncate max-w-md">
                  {currentApk.fileName || `scholario-${currentApk.version}.apk`}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={currentApk.url}
                    download={currentApk.fileName || `scholario-${currentApk.version}.apk`}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#F2C230] text-neutral-950 hover:bg-[#e0b024] transition-colors shadow-xs"
                  >
                    <Download size={14} />
                    <span>Download APK ({currentApk.size || 'Direct'})</span>
                  </a>
                  <a
                    href={currentApk.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Open direct URL"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <Smartphone size={32} className="mx-auto text-neutral-400 opacity-60" />
              <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                No Android APK published yet
              </p>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Upload your first APK build below to publish the download buttons on the student portal and landing page.
              </p>
            </div>
          )}
        </div>

        {/* ── CARD 2: Upload Box & Publishing Form ── */}
        <form
          onSubmit={handleUploadAndPublish}
          className="rounded-2xl p-5 sm:p-6 bg-white dark:bg-[#141416] border border-black/[0.08] dark:border-white/[0.08] shadow-sm space-y-6"
        >
          <div>
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">
              Publish New APK Build
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Select an .apk build to upload to Cloudflare R2. Once uploaded, <code className="px-1 py-0.5 rounded bg-neutral-100 dark:bg-white/[0.06] text-[#8A6A00] dark:text-[#F2C230]">apk/latest.json</code> will update automatically.
            </p>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-start gap-3 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Dashed Drag & Drop Upload Box */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Package File (.apk) <span className="text-rose-500">*</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".apk,application/vnd.android.package-archive"
              className="hidden"
              disabled={uploading}
            />

            {!selectedFile ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#F2C230] bg-[#F2C230]/5 scale-[0.99]'
                    : 'border-neutral-300 dark:border-neutral-700 hover:border-[#F2C230] dark:hover:border-[#F2C230] bg-neutral-50/50 dark:bg-white/[0.02]'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-neutral-100 dark:bg-white/[0.06] flex items-center justify-center text-neutral-500 dark:text-neutral-400 mb-3 group-hover:text-[#F2C230] transition-colors">
                  <UploadCloud size={28} />
                </div>
                <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                  Click to browse or drag and drop your .apk file
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Only Android APK binaries accepted · Maximum file size 150 MB
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-white/[0.04] border border-[#F2C230]/40 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#F2C230]/20 text-[#8A6A00] dark:text-[#F2C230] flex items-center justify-center shrink-0">
                    <FileCheck2 size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                {!uploading && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title="Remove file"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Form Fields: Version Name & What's New */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                Version Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder="e.g. 1.0.4"
                disabled={uploading}
                className="w-full h-11 px-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.05] border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-900 dark:text-white focus:outline-hidden focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/20 transition-all"
              />
              <p className="text-[11px] text-neutral-500 mt-1">
                Semver format recommended (e.g. 1.0.4)
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
                What's New / Release Notes
              </label>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                placeholder="Describe bug fixes, new features, or performance improvements in this build..."
                rows={3}
                disabled={uploading}
                className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.05] border border-neutral-300 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-[#F2C230] focus:ring-2 focus:ring-[#F2C230]/20 transition-all resize-y"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-neutral-700 dark:text-neutral-300">
                  Uploading to Cloudflare R2...
                </span>
                <span className="text-[#8A6A00] dark:text-[#F2C230]">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#F2C230] to-[#E5A700] rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={uploading || !selectedFile || !versionName.trim()}
              className="min-h-[46px] px-6 rounded-xl font-bold text-xs bg-[#F2C230] hover:bg-[#e0b024] text-neutral-950 transition-all shadow-md active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-neutral-900 border-t-transparent animate-spin" />
                  <span>Uploading and publishing ({uploadProgress}%)...</span>
                </>
              ) : (
                <>
                  <UploadCloud size={16} />
                  <span>Upload and publish</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* ── CARD 3: Technical Architecture & Worker Note ── */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#F2C230]/5 dark:bg-[#F2C230]/10 border border-[#F2C230]/20 flex items-start gap-3.5 text-xs">
          <Info size={18} className="text-[#8A6A00] dark:text-[#F2C230] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-neutral-900 dark:text-white">
              Cloudflare R2 Storage Architecture
            </p>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Files are saved under <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">apk/scholario-&lt;version&gt;.apk</code> and linked in <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">apk/latest.json</code>.
              Downloads are served with <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">Content-Type: application/vnd.android.package-archive</code> and <code className="px-1 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">Content-Disposition: attachment</code>.
              R2 secret keys are never exposed in frontend code.
            </p>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminAndroidAppPage;
