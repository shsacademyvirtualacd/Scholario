import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCheck, Loader2 } from 'lucide-react';
import { ChatBubbleTail } from './ChatBubbleTail';
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
  hasTail?: boolean;
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
  hasTail = true,
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
      className={`relative w-full max-w-[320px] rounded-[8px] p-2 sm:p-2.5 overflow-visible ${
        isMe
          ? `bg-[#D9FDD3] text-[#111B21] ${hasTail ? 'rounded-br-[0px]' : ''}`
          : `bg-white text-[#111B21] ${hasTail ? 'rounded-bl-[0px]' : ''}`
      }`}
      style={{
        boxShadow: '0 1px 0.5px rgba(11, 20, 26, 0.13)',
      }}
    >
      {/* File Card Header */}
      <div
        onClick={handleDownload}
        className={`flex items-center gap-3 p-2 rounded-[6px] cursor-pointer transition-colors ${
          isMe
            ? 'bg-black/5 hover:bg-black/10'
            : 'bg-[#F0F2F5] hover:bg-[#E9EDEF]'
        }`}
      >
        {/* File Type Icon Badge */}
        <div
          className={`w-10 h-10 rounded-[6px] flex items-center justify-center shrink-0 font-bold text-xs ${
            isPdf
              ? 'bg-rose-500/15 text-rose-600'
              : isDoc
              ? 'bg-blue-500/15 text-blue-600'
              : 'bg-[#00A884]/15 text-[#00A884]'
          }`}
        >
          <FileText size={20} />
        </div>

        {/* File Info */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold truncate leading-tight text-[#111B21]" title={filename}>
            {filename}
          </p>
          <p
            className="text-[11px] mt-0.5 text-[#667781]"
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
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
            isMe
              ? 'text-[#111B21] hover:bg-black/5'
              : 'text-[#54656F] hover:bg-black/5'
          }`}
          title={`Download ${filename}`}
        >
          {downloading ? (
            <Loader2 size={16} className="animate-spin text-[#00A884]" />
          ) : (
            <Download size={16} />
          )}
        </button>
      </div>

      {/* Optional Caption */}
      {hasCaption && (
        <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words [word-break:normal] mt-1.5 px-1 select-text text-[#111B21]">
          {content}
        </p>
      )}

      {/* Timestamp & Read Status */}
      <div
        className={`flex items-center justify-end gap-1 mt-1 text-[10px] text-[#667781]`}
      >
        <span>{formatTime(createdAt)}</span>
        {isMe && (
          <span title={readAt ? 'Read' : 'Delivered'}>
            {readAt ? (
              <CheckCheck size={14} className="text-[#53BDEB] stroke-[2.2]" />
            ) : (
              <CheckCheck size={14} className="text-[#8696A0] stroke-[1.8]" />
            )}
          </span>
        )}
      </div>

      {/* Bubble Tail */}
      {hasTail && <ChatBubbleTail isMe={isMe} fillColor={isMe ? '#D9FDD3' : '#FFFFFF'} />}
    </div>
  );
};
