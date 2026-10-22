import React, { useState, useRef, useEffect } from 'react';
import { FileText, Image as ImageIcon, Eye, Download, MoreVertical, Trash2, Loader2, Check } from 'lucide-react';
import type { Note } from '../../../types';
import { downloadNoteBlob } from '../../../lib/db';
import { MathText } from '../../common/MathText';

interface AdminNoteCardProps {
  note: Note;
  onView: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  deleting?: boolean;
}

export const AdminNoteCard: React.FC<AdminNoteCardProps> = ({
  note,
  onView,
  onDelete,
  deleting = false,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const subject =
    (typeof note.offering?.subject === 'string'
      ? note.offering.subject
      : note.offering?.subject?.name) ||
    note.offering?.subject_name ||
    'General';
  const fileType = note.file_type || 'pdf';
  const isImage = ['image', 'png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileType.toLowerCase());
  const isPdf = fileType === 'pdf';
  const teacherName = note.offering?.teacher?.full_name || 'Academic Staff';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;
    try {
      setDownloading(true);
      setProgress(0);
      await downloadNoteBlob(note, (p) => setProgress(p));
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download note file.');
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getSubjectColor = (sub: string) => {
    switch (sub.toLowerCase()) {
      case 'mathematics': return '#F4C430';
      case 'physics': return '#3b82f6';
      case 'chemistry': return '#10b981';
      case 'biology': return '#ec4899';
      case 'computer science': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const subjectColor = getSubjectColor(subject);

  return (
    <div
      className={`relative bg-white dark:bg-[#18181B] border border-[#E5E5E5] dark:border-[#27272A] rounded-xl p-4 flex flex-col justify-between transition-all duration-300 ${
        deleting
          ? 'opacity-40 scale-95 pointer-events-none'
          : 'hover:border-[#D4D4D4] dark:hover:border-[#3F3F46] hover:shadow-md'
      }`}
      style={{ borderLeft: `4px solid ${subjectColor}` }}
    >
      <div>
        {/* Badges & Format */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <span
            className="text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider"
            style={{ backgroundColor: `${subjectColor}18`, color: subjectColor }}
          >
            {subject}
          </span>
          <span
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isImage
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50'
                : isPdf
                ? 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
            }`}
          >
            {isImage ? <ImageIcon size={11} /> : <FileText size={11} />}
            <span>{(note.file_type || 'pdf').toUpperCase()}</span>
          </span>
        </div>

        {/* Content */}
        <h3 className="text-sm font-bold text-[#111111] dark:text-[#FAFAFA] line-clamp-1">
          <MathText text={note.chapter_name || '—'} />
        </h3>
        <p className="text-xs text-[#737373] dark:text-[#A1A1AA] mt-1 font-medium line-clamp-2">
          <MathText text={note.title || '—'} />
        </p>
        <p className="text-[10px] text-[#A3A3A3] dark:text-[#71717A] font-medium mt-2 truncate">
          Uploaded by: <span className="font-semibold text-[#525252] dark:text-[#D4D4D8]">{teacherName}</span>
        </p>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#F5F5F5] dark:border-[#27272A]">
        <span className="text-[10px] text-[#A3A3A3] dark:text-[#71717A] font-medium">{formatDate(note.created_at)}</span>

        <div className="flex items-center gap-1">
          {/* Preview action */}
          <button
            type="button"
            onClick={() => onView(note)}
            className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#27272A] text-[#525252] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C430]"
            title="Preview note"
            aria-label="Preview note"
          >
            <Eye size={16} />
          </button>

          {/* Download action */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || deleting}
            className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#27272A] text-[#525252] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] disabled:opacity-50 transition-colors cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#F4C430]"
            title="Download document"
            aria-label="Download document"
          >
            {downloading ? (
              <div className="flex items-center gap-1">
                <Loader2 size={15} className="animate-spin text-[#F4C430]" />
                {progress > 0 && <span className="text-[9px] font-bold">{progress}%</span>}
              </div>
            ) : downloadSuccess ? (
              <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Download size={16} />
            )}
          </button>

          {/* More menu with safe delete behind (...) */}
          {onDelete && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="min-h-[44px] min-w-[44px] sm:min-h-[36px] sm:min-w-[36px] p-2 rounded-lg hover:bg-[#F5F5F5] dark:hover:bg-[#27272A] text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-[#FAFAFA] transition-colors flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#F4C430]"
                title="More actions"
                aria-label="More actions"
                aria-expanded={menuOpen}
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 bottom-full mb-1 w-44 bg-white dark:bg-[#1E1E22] border border-[#E5E5E5] dark:border-[#2E2E33] rounded-xl shadow-xl py-1 z-20 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onView(note);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A30] transition-colors cursor-pointer"
                  >
                    <Eye size={14} className="text-[#6B7280] dark:text-[#9CA3AF]" />
                    <span>View Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      setMenuOpen(false);
                      handleDownload(e);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[#374151] dark:text-[#D1D5DB] hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A30] transition-colors cursor-pointer"
                  >
                    <Download size={14} className="text-[#6B7280] dark:text-[#9CA3AF]" />
                    <span>Download File</span>
                  </button>
                  <div className="my-1 border-t border-[#E5E5E5] dark:border-[#2E2E33]" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(note.id);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                    <span>Delete Note...</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNoteCard;
