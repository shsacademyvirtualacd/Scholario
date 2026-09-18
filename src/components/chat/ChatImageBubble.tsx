import React, { useState, useEffect } from 'react';
import { CheckCheck, Loader2, Image as ImageIcon, AlertCircle, RefreshCw } from 'lucide-react';
import { ImageViewerModal } from './ImageViewerModal';
import { ChatBubbleTail } from './ChatBubbleTail';
import { getAttachmentUrl } from '../../lib/chatService';
import { supabase } from '../../lib/supabase';
import { ChatTheme } from '../../types/chatTheme';
import { chatThumbnailCache, loadedImageUrls } from '../../lib/imageCompression';

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
  senderName?: string;
  onReply?: (text: string) => void | Promise<void>;
  theme?: ChatTheme;
  authToken?: string;
  onSelectImage?: (img: {
    imageUrl: string;
    downloadUrl: string;
    filename: string;
    fileSize?: number | null;
    senderName?: string;
    timestamp?: string;
    caption?: string;
  }) => void;
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
  senderName,
  onReply,
  theme,
  authToken,
  onSelectImage,
}) => {
  const [token, setToken] = useState<string>(authToken || '');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadCounter, setReloadCounter] = useState(0);

  // Keep token synced if prop changes
  useEffect(() => {
    if (authToken) {
      setToken(authToken);
    } else if (!token) {
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.access_token) {
          setToken(data.session.access_token);
        }
      });
    }
  }, [authToken]);

  const filename = attachmentName || 'Photo';
  const imageUrl = getAttachmentUrl(attachmentKey, token);
  const downloadUrl = getAttachmentUrl(attachmentKey, token, true);

  // Check if this image was already loaded in this session to prevent spinner flicker
  const isAlreadyLoaded = loadedImageUrls.has(imageUrl);
  const [isLoading, setIsLoading] = useState(!isAlreadyLoaded);

  // Check for an instant thumbnail placeholder from cache
  const cachedThumb = chatThumbnailCache.get(attachmentKey);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const hasCaption = content && content !== filename && content !== 'Photo' && content.trim().length > 0;

  const bubbleBg = theme ? (isMe ? theme.sentBubbleBg : theme.receivedBubbleBg) : (isMe ? '#D9FDD3' : '#FFFFFF');
  const bubbleTextColor = theme ? (isMe ? theme.sentBubbleText : theme.receivedBubbleText) : '#111B21';
  const metaTextColor = theme ? (isMe ? theme.sentMetaText : theme.receivedMetaText) : '#667781';

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadError(false);
    setIsLoading(true);
    setReloadCounter((prev) => prev + 1);
  };

  return (
    <>
      <div
        id={`chat-image-${messageId}`}
        className={`group relative max-w-[260px] sm:max-w-[280px] rounded-[8px] overflow-visible ${
          hasTail ? (isMe ? 'rounded-br-[0px]' : 'rounded-bl-[0px]') : ''
        }`}
        style={{
          backgroundColor: bubbleBg,
          color: bubbleTextColor,
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
            onClick={(e) => {
              e.stopPropagation();
              if (loadError) return;
              if (onSelectImage) {
                onSelectImage({
                  imageUrl,
                  downloadUrl,
                  filename,
                  fileSize: attachmentSize,
                  senderName: senderName || (isMe ? 'You' : 'Photo'),
                  timestamp: createdAt,
                  caption: hasCaption ? content : undefined,
                });
              } else {
                setIsViewerOpen(true);
              }
            }}
            onMouseDown={(e) => {
              // Prevent bubble's long-press timer from firing when clicking photo to view
              e.stopPropagation();
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
            }}
            onContextMenu={(e) => {
              e.stopPropagation();
            }}
            className="relative w-full aspect-auto max-h-[300px] overflow-hidden bg-neutral-100 cursor-pointer select-none"
          >
            {/* Instant Blurred Thumbnail Placeholder */}
            {isLoading && cachedThumb && !loadError && (
              <div className="absolute inset-0 overflow-hidden">
                <img
                  src={cachedThumb}
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-cover filter blur-md scale-110 opacity-70 transition-opacity"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[1px]">
                  <Loader2 size={20} className="animate-spin text-white drop-shadow" />
                </div>
              </div>
            )}

            {/* Shimmer Skeleton if no thumbnail is available yet */}
            {isLoading && !cachedThumb && !loadError && (
              <div className="w-full h-44 flex flex-col items-center justify-center bg-neutral-200/80 dark:bg-zinc-800/80 animate-pulse text-neutral-400 dark:text-zinc-500">
                <ImageIcon size={28} className="opacity-40 mb-2" />
                <div className="flex items-center gap-1.5">
                  <Loader2 size={13} className="animate-spin text-[#F4C430]" />
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-zinc-400">Loading image...</span>
                </div>
              </div>
            )}

            {loadError ? (
              <div className="w-full h-36 flex flex-col items-center justify-center p-3 text-center bg-neutral-50 dark:bg-zinc-900/90 text-neutral-400 dark:text-zinc-400">
                <AlertCircle size={22} className="text-rose-500 mb-1" />
                <span className="text-xs font-semibold text-neutral-800 dark:text-zinc-100">Unable to load image</span>
                <span className="text-[10px] text-neutral-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{filename}</span>
                <button
                  type="button"
                  onClick={handleRetry}
                  className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 rounded-md border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 transition-colors"
                >
                  <RefreshCw size={11} />
                  <span>Retry</span>
                </button>
              </div>
            ) : (
              <img
                key={`img-${attachmentKey}-${reloadCounter}`}
                src={imageUrl}
                alt={filename}
                decoding="async"
                onLoad={() => {
                  setIsLoading(false);
                  loadedImageUrls.add(imageUrl);
                }}
                onError={() => {
                  setIsLoading(false);
                  setLoadError(true);
                }}
                className={`w-full max-h-[280px] object-cover transition-all duration-300 group-hover:scale-101 ${
                  isLoading ? 'opacity-0' : 'opacity-100'
                }`}
              />
            )}

            {/* Semi-transparent gradient for contrast timestamp */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

            {/* Top-left Image Type Badge */}
            <div className="absolute top-2 left-2 pointer-events-none bg-black/60 backdrop-blur-xs text-white px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-semibold shadow-2xs">
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
                className="flex items-center justify-end gap-1 text-[10px]"
                style={{ color: metaTextColor }}
              >
                <span>{formatTime(createdAt)}</span>
                {isMe && (
                  <span title={readAt ? 'Read' : 'Delivered'}>
                    {readAt ? (
                      <CheckCheck size={14} className="text-[#53BDEB] stroke-[2.2]" />
                    ) : (
                      <CheckCheck size={14} className="stroke-[1.8]" style={{ color: metaTextColor }} />
                    )}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bubble Tail */}
        {hasTail && <ChatBubbleTail isMe={isMe} fillColor={bubbleBg} />}
      </div>

      {/* Fullscreen Pinch-to-zoom Viewer Modal (fallback when no centralized onSelectImage) */}
      {!onSelectImage && (
        <ImageViewerModal
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          imageUrl={imageUrl}
          downloadUrl={downloadUrl}
          filename={filename}
          fileSize={attachmentSize}
          senderName={senderName || (isMe ? 'You' : 'Photo')}
          timestamp={createdAt}
          caption={hasCaption ? content : undefined}
          onReply={onReply}
        />
      )}
    </>
  );
};
