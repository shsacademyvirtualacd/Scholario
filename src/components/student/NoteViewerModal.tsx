import React from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import type { Note } from '../../types';

interface NoteViewerModalProps {
  note: Note | null;
  onClose: () => void;
}

export const NoteViewerModal: React.FC<NoteViewerModalProps> = ({ note, onClose }) => {
  if (!note) return null;

  const isPdf = note.file_type.toLowerCase() === 'pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl border border-[#E5E5E5] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="h-14 border-b border-[#E5E5E5] px-4 md:px-6 flex items-center justify-between bg-[#FAFAFA] shrink-0">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm font-bold text-[#111111] truncate">{note.chapter_name}</h3>
            <p className="text-xs text-[#737373] truncate font-medium mt-0.5">{note.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={note.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-white text-[#525252] hover:text-[#111111] transition-colors flex items-center gap-1 text-[11px] font-bold"
            >
              <ExternalLink size={12} />
              Open Tab
            </a>
            <a
              href={note.file_url}
              download
              className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-white text-[#525252] hover:text-[#111111] transition-colors flex items-center gap-1 text-[11px] font-bold"
            >
              <Download size={12} />
              Download
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#E5E5E5] flex items-center justify-center text-[#525252] hover:text-[#111111] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#F5F5F5] flex items-center justify-center">
          {isPdf ? (
            <div className="w-full h-full rounded-xl overflow-hidden border border-[#E5E5E5] bg-white flex flex-col">
              <iframe
                src={`${note.file_url}#toolbar=0`}
                title={note.title}
                className="w-full h-full flex-1"
                frameBorder="0"
              />
              <div className="p-3 border-t border-[#E5E5E5] bg-white flex justify-center text-[11px] text-[#737373] font-semibold">
                If the PDF does not load, please click the "Open Tab" button above to view it.
              </div>
            </div>
          ) : (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={note.file_url}
                alt={note.title}
                className="max-w-full max-h-[70vh] rounded-xl shadow-md border border-[#E5E5E5] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteViewerModal;
