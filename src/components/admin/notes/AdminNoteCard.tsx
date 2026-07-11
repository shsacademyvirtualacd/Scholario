import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Eye, Download, Trash2, Loader2 } from 'lucide-react';
import type { Note } from '../../../types';
import { downloadNoteBlob } from '../../../lib/db';

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
  const subject =
    (typeof note.offering?.subject === 'string'
      ? note.offering.subject
      : note.offering?.subject?.name) ||
    note.offering?.subject_name ||
    'General';
  const isPdf = (note.file_type || 'pdf').toLowerCase() === 'pdf';
  const teacherName = note.offering?.teacher?.full_name || 'Staff';

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (downloading) return;
    try {
      setDownloading(true);
      await downloadNoteBlob(note);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download note file.');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
      className={`bg-white border border-[#E5E5E5] rounded-xl p-4 flex flex-col justify-between transition-all duration-300 ${
        deleting
          ? 'opacity-40 scale-95 pointer-events-none'
          : 'hover:border-[#D4D4D4] hover:shadow-md'
      }`}
      style={{ borderLeft: `4px solid ${subjectColor}` }}
    >
      <div>
        {/* Badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase"
            style={{ backgroundColor: `${subjectColor}15`, color: subjectColor }}
          >
            {subject}
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
            isPdf ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            {isPdf ? <FileText size={10} /> : <ImageIcon size={10} />}
            {(note.file_type || 'pdf').toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-sm font-bold text-[#111111] line-clamp-1">{note.chapter_name || '—'}</h3>
        <p className="text-xs text-[#737373] mt-1 font-semibold line-clamp-1">{note.title || '—'}</p>
        <p className="text-[10px] text-[#A3A3A3] font-bold mt-2 truncate">Uploaded by: {teacherName}</p>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#F5F5F5]">
        <span className="text-[10px] text-[#A3A3A3] font-semibold">{formatDate(note.created_at)}</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(note)}
            className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#525252] hover:text-[#111111] transition-colors"
            title="Preview note"
          >
            <Eye size={13} />
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading || deleting}
            className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#525252] hover:text-[#111111] disabled:opacity-50 transition-colors cursor-pointer"
            title="Download document"
          >
            {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          </button>
          {onDelete && (
            <button
              onClick={() => onDelete(note.id)}
              disabled={deleting}
              className="p-1.5 rounded-lg hover:bg-red-50 text-[#737373] hover:text-red-500 disabled:opacity-50 transition-colors"
              title="Delete note"
            >
              {deleting ? <Loader2 size={13} className="animate-spin text-red-400" /> : <Trash2 size={13} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminNoteCard;
