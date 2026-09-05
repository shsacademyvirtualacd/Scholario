import React, { useState, useEffect } from 'react';
import { CheckCheck, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ImageViewerModal } from './ImageViewerModal';
import { ChatBubbleTail } from './ChatBubbleTail';
import { getAttachmentUrl } from '../../lib/chatService';
import { supabase } from '../../lib/supabase';

interface ChatImageBubbleProps {
  messageId: string;
  attachmentKey: string;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  content?: string;
  createdAt: string;
  readAt?: string | null;
  isMe: boolean;
  hasTail?: boolean;
}

export const ChatImageBubble: React.FC<ChatImageBubbleProps> = ({
  messageId,
  attachmentKey,
  attachmentName,
  attachmentSize,
  content,
  createdAt,
  readAt,
  isMe,
  hasTail = true,
}) => {
  const [token, setToken] = useState<string>('');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.access_token) {
        setToken(data.session.access_token);
      }
    });
  }, []);

  const filename = attachmentName || 'Photo';
  const imageUrl = getAttachmentUrl(attachmentKey, token);
  const downloadUrl = getAttachmentUrl(attachmentKey, token, true);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const hasCaption = content && content !== filename && content !== 'Photo' && content.trim().length > 0;

  return (
    <>
      <div
        id={`chat-image-${messageId}`}
        className={`group relative max-w-[260px] sm:max-w-[280px] rounded-[8px] overflow-visible ${
          isMe
            ? `bg-[#D9FDD3] text-[#111B21] ${hasTail ? 'rounded-br-[0px]' : ''}`
            : `bg-white text-[#111B21] ${hasTail ? 'rounded-bl-[0px]' : ''}`
        }`}
        style={{
          boxShadow: '0 1px 0.5px rgba(11, 20, 26, 0.13)',
        }}
      >
        {/* Inner container to clip the image to the bubble's rounded corners */}
        <div
          className={`overflow-hidden rounded-[8px] ${
            isMe
              ? `${hasTail ? 'rounded-br-[0px]' : ''}`
              : `${hasTail ? 'rounded-bl-[0px]' : ''}`
          }`}
        >
          {/* Image Thumbnail Container */}
          <div
            onClick={() => !loadError && setIsViewerOpen(true)}
            className="relative w-full aspect-auto max-h-[300px] overflow-hidden bg-neutral-100 cursor-pointer select-none"
          >
            {isLoading && !loadError && (
              <div className="w-full h-40 flex flex-col items-center justify-center bg-neutral-100 text-neutral-400">
                <Loader2 size={24} className="animate-spin text-[#F4C430]" />
                <span className="text-[11px] font-medium mt-2">Loading image...</span>
              </div>
            )}

            {loadError ? (
              <div className="w-full h-36 flex flex-col items-center justify-center p-3 text-center bg-neutral-50 text-neutral-400">
                <AlertCircle size={22} className="text-rose-500 mb-1" />
                <span className="text-xs font-semibold text-neutral-700">Unable to load image</span>
                <span className="text-[10px] text-neutral-400 mt-0.5 line-clamp-1">{filename}</span>
              </div>
            ) : (
              <img
                src={imageUrl}
                alt={filename}
                loading="lazy"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setLoadError(true);
                }}
                className={`w-full max-h-[280px] object-cover transition-transform duration-300 group-hover:scale-102 ${
                  isLoading ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}

            {/* Semi-transparent gradient for contrast timestamp */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

            {/* Top-left Image Type Badge */}
            <div className="absolute top-2 left-2 pointer-events-none bg-black/40 backdrop-blur-xs text-white px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-medium">
              <ImageIcon size={10} />
              <span>Photo</span>
            </div>

            {/* Time & Read Status overlaid on image if NO separate caption */}
            {!hasCaption && (
              <div className="absolute bottom-1.5 right-2 flex items-center gap-1 text-[10px] font-medium text-white drop-shadow-md">
                <span>{formatTime(createdAt)}</span>
                {isMe && (
                  <span title={readAt ? 'Read' : 'Delivered'}>
                    {readAt ? (
                      <CheckCheck size={14} className="text-[#53BDEB] stroke-[2.2]" />
                    ) : (
                      <CheckCheck size={14} className="text-white/80 stroke-[1.8]" />
                    )}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Optional Caption and Timestamp */}
          {hasCaption && (
            <div className="p-2.5 space-y-1">
              <p className="text-xs md:text-sm whitespace-pre-wrap leading-relaxed break-words [word-break:normal] select-text">
                {content}
              </p>
              <div
                className={`flex items-center justify-end gap-1 text-[10px] text-[#667781]`}
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
            </div>
          )}
        </div>

        {/* Bubble Tail */}
        {hasTail && <ChatBubbleTail isMe={isMe} fillColor={isMe ? '#D9FDD3' : '#FFFFFF'} />}
      </div>

      {/* Fullscreen Pinch-to-zoom Viewer Modal */}
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        imageUrl={imageUrl}
        downloadUrl={downloadUrl}
        filename={filename}
        fileSize={attachmentSize}
      />
    </>
  );
};
