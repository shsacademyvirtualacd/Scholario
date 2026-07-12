import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Eye, Download, Loader2 } from 'lucide-react';
import type { Note } from '../../types';
import { downloadNoteBlob } from '../../lib/db';

interface NoteCardProps {
  note: Note;
  onView: (note: Note) => void;
}

export const NoteCard: React.FC<NoteCardProps> = ({ note, onView }) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const subject = note.offering?.subject || 'General';
  const fileType = note.file_type || 'pdf';
  const isPdf = fileType.toLowerCase() === 'pdf';

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
      alert('Failed to download note file.');
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  // Format date nicely
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Color mappings
  const getSubjectColor = (sub: string) => {
    switch (sub.toLowerCase()) {
      case 'mathematics': return '#F4C430'; // Gold
      case 'physics': return '#3b82f6'; // Blue
      case 'chemistry': return '#10b981'; // Green
      default: return '#8b5cf6'; // Purple
    }
  };

  const subjectColor = getSubjectColor(subject);

  return (
    <div
      className="bg-white border border-[#E5E5E5] rounded-xl p-4 flex flex-col justify-between hover:border-[#D4D4D4] hover:shadow-md transition-all duration-200"
      style={{ borderLeft: `4px solid ${subjectColor}` }}
    >
      <div>
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
            {fileType.toUpperCase()}
          </span>
        </div>
        
        <h3 className="text-sm font-bold text-[#111111] line-clamp-1">{note.chapter_name}</h3>
        <p className="text-xs text-[#737373] mt-1 font-medium line-clamp-2">{note.title}</p>
      </div>

      <div className="flex items-center justify-between pt-3 mt-4 border-t border-[#F5F5F5]">
        <span className="text-[10px] text-[#A3A3A3] font-semibold">{formatDate(note.created_at)}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onView(note)}
            className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#525252] hover:text-[#111111] transition-colors"
            title="View inline"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="p-1.5 rounded-lg hover:bg-[#F5F5F5] text-[#525252] hover:text-[#111111] disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1 interactive"
            title="Download file"
          >
            {downloading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {progress > 0 && <span className="text-[10px] font-bold">{progress}%</span>}
              </>
            ) : (
              <Download size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
