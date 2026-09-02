import React, { useState, useEffect } from 'react';
import { Download, FileText, Check, CheckCheck, Loader2 } from 'lucide-react';
import { getAttachmentUrl } from '../../lib/chatService';
import { supabase } from '../../lib/supabase';

interface ChatFileBubbleProps {
  messageId: string;
  attachmentKey: string;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  mimeType?: string | null;
  content?: string;
  createdAt: string;
  readAt?: string | null;
  isMe: boolean;
}

export const ChatFileBubble: React.FC<ChatFileBubbleProps> = ({
  messageId,
  attachmentKey,
  attachmentName,
  attachmentSize,
  mimeType,
  content,
  createdAt,
  readAt,
  isMe,
}) => {
  const [token, setToken] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.access_token) {
        setToken(data.session.access_token);
      }
    });
  }, []);

  const filename = attachmentName || 'Attachment';
  const downloadUrl = getAttachmentUrl(attachmentKey, token, true);

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const ext = (filename.split('.').pop() || '').toLowerCase();
  const isPdf = ext === 'pdf' || mimeType === 'application/pdf';
  const isDoc = ext === 'doc' || ext === 'docx' || (mimeType || '').includes('word');

  const handleDownload = () => {
    setDownloading(true);
    // Trigger download in hidden anchor
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 1200);
  };

  const hasCaption = content && content !== filename && content.trim().length > 0;

  return (
    <div
      id={`chat-file-${messageId}`}
      className={`max-w-[85%] sm:max-w-[75%] md:max-w-[320px] rounded-2xl p-3 shadow-2xs transition-all ${
        isMe
          ? 'bg-[#111111] text-white rounded-br-xs'
          : 'bg-white text-[#111111] border border-[#E5E5E5] rounded-bl-xs'
      }`}
    >
      {/* File Card Header */}
      <div
        onClick={handleDownload}
        className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
          isMe
            ? 'bg-white/10 hover:bg-white/15'
            : 'bg-[#F7F7F7] hover:bg-[#EFEFEF] border border-[#E5E5E5]'
        }`}
      >
        {/* File Type Icon Badge */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs ${
            isPdf
              ? 'bg-rose-500/15 text-rose-600 border border-rose-500/20'
              : isDoc
              ? 'bg-blue-500/15 text-blue-600 border border-blue-500/20'
              : 'bg-[#F4C430]/20 text-[#B8860B] border border-[#F4C430]/30'
          }`}
        >
          <FileText size={20} />
        </div>

        {/* File Info */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate leading-tight" title={filename}>
            {filename}
          </p>
          <p
            className={`text-[10px] mt-0.5 ${
              isMe ? 'text-white/60' : 'text-[#737373]'
            }`}
          >
            {formatSize(attachmentSize) || (isPdf ? 'PDF Document' : isDoc ? 'Word Document' : 'File')}
          </p>
        </div>

        {/* Download Action Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          disabled={downloading}
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
            isMe
              ? 'bg-white/20 hover:bg-[#F4C430] hover:text-[#111111] text-white'
              : 'bg-white hover:bg-[#F4C430] text-[#111111] border border-[#E5E5E5] shadow-2xs'
          }`}
          title={`Download ${filename}`}
        >
          {downloading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Download size={15} />
          )}
        </button>
      </div>

      {/* Optional Caption */}
      {hasCaption && (
        <p className="text-xs whitespace-pre-wrap leading-relaxed break-words mt-2 px-1 select-text">
          {content}
        </p>
      )}

      {/* Timestamp & Read Status */}
      <div
        className={`flex items-center justify-end gap-1 mt-1.5 text-[9px] ${
          isMe ? 'text-white/60' : 'text-[#A3A3A3]'
        }`}
      >
        <span>{formatTime(createdAt)}</span>
        {isMe && (
          <span title={readAt ? 'Read' : 'Delivered'}>
            {readAt ? (
              <CheckCheck size={12} className="text-[#F4C430]" />
            ) : (
              <Check size={12} />
            )}
          </span>
        )}
      </div>
    </div>
  );
};
