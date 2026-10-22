import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Eye, Download, Loader2 } from 'lucide-react';
import type { Note } from '../../types';
import { downloadNoteBlob } from '../../lib/db';
import { MathText } from '../common/MathText';
import { formatStandardDate, formatProperName } from '../../utils/studentFormatting';

interface NoteCardProps {
  note: Note;
  onView: (note: Note) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onView }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const rawSubj =
    note.offering?.subject_name ||
    (typeof note.offering?.subject === 'string'
      ? note.offering.subject
      : note.offering?.subject?.name) ||
    'General';
  const subject = typeof rawSubj === 'string' ? rawSubj : 'General';
  const fileType = (note.file_type || 'pdf').toLowerCase();
  const isImage = ['image', 'png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileType);
  const isPdf = fileType === 'pdf';

  const rawTeacher =
    note.offering?.teacher?.full_name ||
    (note as any).teacher_name ||
    (note as any).author?.full_name ||
    'Faculty Teacher';
  const teacherName = formatProperName(rawTeacher);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;
    try {
      setDownloading(true);
      setProgress(0);
      await downloadNoteBlob(note, (p) => setProgress(p));
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  const getSubjectColor = (sub: string) => {
    switch (sub.toLowerCase()) {
      case 'mathematics':
        return '#F4C430';
      case 'physics':
        return '#3b82f6';
      case 'chemistry':
        return '#10b981';
      case 'biology':
        return '#06b6d4';
      default:
        return '#8b5cf6';
    }
  };

  const subjectColor = getSubjectColor(subject);

  return (
    <div
      className="bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between hover:border-amber-400/50 dark:hover:border-amber-400/40 hover:shadow-md transition-all duration-200 shadow-2xs group"
      style={{ borderLeft: `4px solid ${subjectColor}` }}
    >
      <div className="space-y-2.5">
        {/* Top Badges: Subject & Format */}
        <div className="flex items-start justify-between gap-2">
          <span
            className="text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wide"
            style={{ backgroundColor: `${subjectColor}15`, color: subjectColor }}
          >
            {subject}
          </span>
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
              isImage
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                : isPdf
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            }`}
          >
            {isImage ? <ImageIcon size={11} /> : <FileText size={11} />}
            <span>{fileType.toUpperCase()}</span>
          </span>
        </div>

        {/* Note Title & Chapter */}
        <div>
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white line-clamp-1">
            <MathText text={note.chapter_name || note.title || 'Study Material'} />
          </h3>
          {note.chapter_name && note.title && note.title !== note.chapter_name && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
              <MathText text={note.title} />
            </p>
          )}
        </div>

        {/* Teacher Info */}
        <p className="text-xs text-neutral-600 dark:text-neutral-400 font-medium truncate">
          Uploaded by: <span className="font-semibold text-neutral-800 dark:text-neutral-200">{teacherName}</span>
        </p>
      </div>

      {/* Footer: Date & Preview / Download Buttons */}
      <div className="flex items-center justify-between pt-3 mt-4 border-t border-neutral-100 dark:border-neutral-800 gap-2">
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
          {formatStandardDate(note.created_at)}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onView(note)}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1 text-xs font-semibold cursor-pointer"
            title="Preview note"
            aria-label="Preview note"
          >
            <Eye size={15} />
            <span className="hidden sm:inline">Preview</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white transition-colors flex items-center justify-center gap-1 text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Download file"
            aria-label="Download file"
          >
            {downloading ? (
              <>
                <Loader2 size={14} className="animate-spin text-amber-500" />
                <span>{progress}%</span>
              </>
            ) : (
              <>
                <Download size={14} />
                <span className="hidden sm:inline">Download</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
