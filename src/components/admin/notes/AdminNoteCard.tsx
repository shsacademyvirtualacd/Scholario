import React from 'react';
import { FileText, Image as ImageIcon, Eye, Download, Trash2 } from 'lucide-react';
import type { Note } from '../../../types';

interface AdminNoteCardProps {
  note: Note & { offering?: { subject: string; teacher?: { full_name: string } } };
  onView: (note: Note) => void;
  onDelete: (noteId: string) => void;
}

export const AdminNoteCard: React.FC<AdminNoteCardProps> = ({
  note,
  onView,
  onDelete,
}) => {
  const subject = note.offering?.subject || 'General';
  const isPdf = note.file_type.toLowerCase() === 'pdf';
  const teacherName = note.offering?.teacher?.full_name || 'Staff';

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
      className="bg-white border border-[#E5E5E5] rounded-xl p-4 flex flex-col justify-between hover:border-[#D4D4D4] hover:shadow-md transition-all duration-200"
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
            {note.file_type.toUpperCase()}
          </span>
        </div>

        {/* Content */}
        <h3 className="text-sm font-bold text-[#111111] line-clamp-1">{note.chapter_name}</h3>
        <p className="text-xs text-[#737373] mt-1 font-semibold line-clamp-1">{note.title}</p>
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
          <a
            href={note.file_url}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#525252] hover:text-[#111111] transition-colors"
            title="Download document"
          >
            <Download size={13} />
          </a>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-[#737373] hover:text-red-500 transition-colors"
            title="Delete note"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminNoteCard;
