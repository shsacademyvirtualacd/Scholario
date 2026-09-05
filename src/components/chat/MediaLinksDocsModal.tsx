import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Image as ImageIcon,
  FileText,
  Link2,
  Volume2,
  Download,
  ExternalLink,
  Play,
  Pause
} from 'lucide-react';
import { getAttachmentUrl } from '../../lib/chatService';
import { supabase } from '../../lib/supabase';
import { formatAudioDuration } from '../../lib/voiceRecordingService';
import type { ChatMessage } from '../../types';

interface MediaLinksDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  contactName?: string;
  onSelectImage?: (img: { imageUrl: string; downloadUrl: string; filename: string }) => void;
}

type TabType = 'media' | 'docs' | 'links' | 'voice';

export const MediaLinksDocsModal: React.FC<MediaLinksDocsModalProps> = ({
  isOpen,
  onClose,
  messages,
  contactName = 'Chat',
  onSelectImage,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('media');
  const [authToken, setAuthToken] = useState<string | undefined>(undefined);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAuthToken(data.session?.access_token);
    });
  }, []);

  // Filter messages by category
  const { mediaItems, docItems, voiceItems, linkItems } = useMemo(() => {
    const media: ChatMessage[] = [];
    const docs: ChatMessage[] = [];
    const voice: ChatMessage[] = [];
    const links: { id: string; url: string; date: string; text: string }[] = [];

    const urlRegex = /(https?:\/\/[^\s]+)/gi;

    messages.forEach((msg) => {
      const isImg =
        msg.message_type === 'image' ||
        (msg.mime_type && msg.mime_type.startsWith('image/')) ||
        (msg.attachment_name && /\.(png|jpe?g|gif|webp|svg)$/i.test(msg.attachment_name));

      const isVoice = msg.message_type === 'voice' || !!msg.audio_url;

      const isDoc =
        (msg.message_type === 'file' || !!msg.attachment_key) && !isImg && !isVoice;

      if (isImg && msg.attachment_key) {
        media.push(msg);
      } else if (isDoc && msg.attachment_key) {
        docs.push(msg);
      } else if (isVoice) {
        voice.push(msg);
      }

      // Check for URLs in text
      if (msg.content) {
        const matches = msg.content.match(urlRegex);
        if (matches) {
          matches.forEach((url) => {
            links.push({
              id: `${msg.id}-${url}`,
              url,
              date: msg.created_at,
              text: msg.content,
            });
          });
        }
      }
    });

    return {
      mediaItems: media.reverse(),
      docItems: docs.reverse(),
      voiceItems: voice.reverse(),
      linkItems: links.reverse(),
    };
  }, [messages]);

  const togglePlayAudio = (id: string, url: string) => {
    if (playingAudioId === id) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      const audio = new Audio(url);
      audioPlayerRef.current = audio;
      audio.play().catch(() => {});
      audio.onended = () => setPlayingAudioId(null);
      setPlayingAudioId(id);
    }
  };

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      });
    } catch {
      return '';
    }
  };

  const formatBytes = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[700px] border border-[#E5E5E5]"
        >
          {/* Header */}
          <div className="bg-white px-4 py-3 border-b border-[#E5E5E5] flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-base font-bold text-[#111111]">Media, links and docs</h3>
              <p className="text-xs text-[#667781] truncate max-w-[280px]">{contactName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#54656F] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors"
              aria-label="Close"
            >
              <X size={19} />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center border-b border-[#E5E5E5] px-2 bg-[#FAFafa] shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'media'
                  ? 'border-[#25D366] text-[#111111]'
                  : 'border-transparent text-[#667781] hover:text-[#111111]'
              }`}
            >
              <ImageIcon size={15} />
              <span>Media</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 font-mono">
                {mediaItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('docs')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'docs'
                  ? 'border-[#25D366] text-[#111111]'
                  : 'border-transparent text-[#667781] hover:text-[#111111]'
              }`}
            >
              <FileText size={15} />
              <span>Docs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 font-mono">
                {docItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('links')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'links'
                  ? 'border-[#25D366] text-[#111111]'
                  : 'border-transparent text-[#667781] hover:text-[#111111]'
              }`}
            >
              <Link2 size={15} />
              <span>Links</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 font-mono">
                {linkItems.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('voice')}
              className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                activeTab === 'voice'
                  ? 'border-[#25D366] text-[#111111]'
                  : 'border-transparent text-[#667781] hover:text-[#111111]'
              }`}
            >
              <Volume2 size={15} />
              <span>Voice</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/5 font-mono">
                {voiceItems.length}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-[#F0F2F5]">
            {/* 1. Media Photos Grid */}
            {activeTab === 'media' && (
              mediaItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-[#8696A0]">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-2 shadow-2xs">
                    <ImageIcon size={24} className="text-[#A3A3A3]" />
                  </div>
                  <p className="text-sm font-semibold text-[#111111]">No media shared yet</p>
                  <p className="text-xs text-[#8696A0] max-w-xs mt-0.5">
                    Photos and pictures shared in this chat will appear here.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {mediaItems.map((item) => {
                    const imgUrl = getAttachmentUrl(item.attachment_key!, authToken);
                    const downloadUrl = getAttachmentUrl(item.attachment_key!, authToken, true);

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectImage?.({
                            imageUrl: imgUrl,
                            downloadUrl,
                            filename: item.attachment_name || 'photo.jpg',
                          });
                        }}
                        className="group relative aspect-square rounded-xl overflow-hidden bg-white border border-[#E5E5E5] cursor-pointer shadow-2xs hover:shadow-md transition-all"
                      >
                        <img
                          src={imgUrl}
                          alt={item.attachment_name || 'Chat image'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                          <span className="text-[10px] text-white font-medium truncate">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* 2. Documents List */}
            {activeTab === 'docs' && (
              docItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-[#8696A0]">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-2 shadow-2xs">
                    <FileText size={24} className="text-[#A3A3A3]" />
                  </div>
                  <p className="text-sm font-semibold text-[#111111]">No documents shared</p>
                  <p className="text-xs text-[#8696A0] max-w-xs mt-0.5">
                    PDFs, spreadsheets, and assignments shared in this chat will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {docItems.map((item) => {
                    const dlUrl = getAttachmentUrl(item.attachment_key!, authToken, true);
                    const isPdf = item.attachment_name?.toLowerCase().endsWith('.pdf');

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-3 border border-[#E5E5E5] flex items-center justify-between gap-3 shadow-2xs hover:border-[#D1D5DB] transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isPdf
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            <FileText size={20} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-[#111111] truncate">
                              {item.attachment_name || 'Document'}
                            </p>
                            <p className="text-[11px] text-[#8696A0] mt-0.5">
                              {formatBytes(item.attachment_size)} • {formatDate(item.created_at)}
                            </p>
                          </div>
                        </div>

                        <a
                          href={dlUrl}
                          download={item.attachment_name || 'document'}
                          target="_blank"
                          rel="noreferrer"
                          className="w-9 h-9 rounded-full bg-[#F0F2F5] hover:bg-[#25D366]/15 hover:text-[#25D366] text-[#54656F] flex items-center justify-center shrink-0 transition-colors"
                          title="Download document"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* 3. Links List */}
            {activeTab === 'links' && (
              linkItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-[#8696A0]">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-2 shadow-2xs">
                    <Link2 size={24} className="text-[#A3A3A3]" />
                  </div>
                  <p className="text-sm font-semibold text-[#111111]">No links shared</p>
                  <p className="text-xs text-[#8696A0] max-w-xs mt-0.5">
                    Web addresses and study links shared in this conversation will be cataloged here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkItems.map((item) => (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white rounded-xl p-3 border border-[#E5E5E5] hover:border-[#D1D5DB] transition-all shadow-2xs group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                            <Link2 size={16} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-blue-600 group-hover:underline truncate">
                              {item.url}
                            </p>
                            <p className="text-[11px] text-[#8696A0] mt-0.5 line-clamp-2">
                              {item.text}
                            </p>
                            <p className="text-[10px] text-[#A3A3A3] mt-1">
                              {formatDate(item.date)}
                            </p>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-[#A3A3A3] group-hover:text-blue-600 shrink-0 mt-1" />
                      </div>
                    </a>
                  ))}
                </div>
              )
            )}

            {/* 4. Voice Recordings */}
            {activeTab === 'voice' && (
              voiceItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12 text-[#8696A0]">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-2 shadow-2xs">
                    <Volume2 size={24} className="text-[#A3A3A3]" />
                  </div>
                  <p className="text-sm font-semibold text-[#111111]">No voice messages</p>
                  <p className="text-xs text-[#8696A0] max-w-xs mt-0.5">
                    Audio clips and voice notes recorded in this chat will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {voiceItems.map((item) => {
                    const isPlaying = playingAudioId === item.id;
                    const durationStr = formatAudioDuration(item.audio_duration_seconds || 0);

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl p-3 border border-[#E5E5E5] flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => togglePlayAudio(item.id, item.audio_url!)}
                            className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shrink-0 shadow-xs transition-colors"
                          >
                            {isPlaying ? <Pause size={17} /> : <Play size={17} className="ml-0.5" />}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-semibold text-[#111111]">
                              Voice message ({durationStr})
                            </p>
                            <p className="text-[11px] text-[#8696A0] mt-0.5">
                              {formatDate(item.created_at)}
                            </p>
                          </div>
                        </div>

                        <a
                          href={item.audio_url!}
                          download="voice-message.webm"
                          target="_blank"
                          rel="noreferrer"
                          className="w-9 h-9 rounded-full bg-[#F0F2F5] hover:bg-black/10 text-[#54656F] flex items-center justify-center shrink-0 transition-colors"
                          title="Download audio"
                        >
                          <Download size={15} />
                        </a>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
