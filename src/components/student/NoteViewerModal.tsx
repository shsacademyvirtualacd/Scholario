import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Download, Loader2 } from 'lucide-react';
import type { Note } from '../../types';
import { downloadNoteBlob } from '../../lib/db';
import { supabase } from '../../lib/supabase';
import PdfViewer from '../ui/PdfViewer';

interface NoteViewerModalProps {
  note: Note | null;
  onClose: () => void;
}

export const NoteViewerModal: React.FC<NoteViewerModalProps> = ({ note, onClose }) => {
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [authToken, setAuthToken] = useState<string>('');
  const [loadingUrl, setLoadingUrl] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    const fetchUrl = async () => {
      if (!note) {
        setActiveUrl('');
        setAuthToken('');
        return;
      }
      setLoadingUrl(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      if (mounted) {
        setAuthToken(token);
        const viewUrl = `/api/notes/view/${note.id}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
        setActiveUrl(viewUrl);
        setLoadingUrl(false);
      }
    };
    fetchUrl();
    return () => {
      mounted = false;
    };
  }, [note]);


  if (!note) return null;

  const isPdf = note.file_type.toLowerCase() === 'pdf';

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (downloading) return;
    try {
      setDownloading(true);
      await downloadNoteBlob({ ...note, file_url: activeUrl });
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download note file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

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
            {activeUrl ? (
              <a
                href={activeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-white text-[#525252] hover:text-[#111111] transition-colors flex items-center gap-1 text-[11px] font-bold"
              >
                <ExternalLink size={12} />
                Open Tab
              </a>
            ) : (
              <span className="p-1.5 rounded-lg border border-[#E5E5E5] text-[#A3A3A3] text-[11px] font-bold flex items-center gap-1 opacity-50">
                <ExternalLink size={12} />
                Open Tab
              </span>
            )}

            <button
              onClick={handleDownload}
              disabled={downloading || (!activeUrl && !note.file_path)}
              className="p-1.5 rounded-lg border border-[#E5E5E5] hover:bg-white text-[#525252] hover:text-[#111111] disabled:opacity-50 transition-colors flex items-center gap-1 text-[11px] font-bold cursor-pointer"
            >
              {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              {downloading ? 'Downloading...' : 'Download'}
            </button>

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
          {loadingUrl ? (
            <div className="flex flex-col items-center justify-center text-center p-6">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
              <p className="text-xs font-semibold text-[#525252]">Preparing document view...</p>
            </div>
          ) : isPdf ? (
            <div className="w-full h-full">
              <PdfViewer fileUrl={activeUrl} authHeaders={authToken ? { Authorization: `Bearer ${authToken}` } : undefined} />
            </div>
          ) : (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={activeUrl || note.file_url}
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
