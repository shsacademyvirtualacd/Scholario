import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Sparkles, Paintbrush, Sun, Moon, Palette } from 'lucide-react';
import { CHAT_THEMES } from '../../lib/chatThemes';
import { ChatTheme } from '../../types/chatTheme';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';

interface ChatThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

type FilterCategory = 'all' | 'light' | 'dark' | 'gradient' | 'doodle';

export const ChatThemeModal: React.FC<ChatThemeModalProps> = ({
  isOpen,
  onClose,
  currentThemeId,
  onSelectTheme,
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  useModalScrollLock(isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredThemes = CHAT_THEMES.filter((t) => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'light') return t.category === 'light';
    if (activeCategory === 'dark') return t.category === 'dark';
    if (activeCategory === 'gradient') return t.type === 'gradient';
    if (activeCategory === 'doodle') return t.type === 'doodle';
    return true;
  });

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-theme-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl max-h-[90dvh] flex flex-col rounded-3xl bg-white border border-[#E5E5E5] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E5] shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4C430]/15 text-[#D4A017] flex items-center justify-center">
              <Paintbrush size={20} />
            </div>
            <div>
              <h2 id="chat-theme-modal-title" className="text-base sm:text-lg font-bold text-[#111111] leading-tight">
                Chat Theme & Wallpaper
              </h2>
              <p className="text-xs text-[#737373] mt-0.5">
                Select a theme to instantly customize your conversation backdrop and bubble colors.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#737373] hover:text-[#111111] hover:bg-[#F5F5F5] transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Filters */}
        <div className="px-5 py-3 border-b border-[#F0F0F0] bg-[#FAFAFA] shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === 'all'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#737373] hover:text-[#111111] border border-[#E5E5E5]'
            }`}
          >
            All Themes ({CHAT_THEMES.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === 'light'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#737373] hover:text-[#111111] border border-[#E5E5E5]'
            }`}
          >
            <Sun size={13} />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === 'dark'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#737373] hover:text-[#111111] border border-[#E5E5E5]'
            }`}
          >
            <Moon size={13} />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('gradient')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === 'gradient'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#737373] hover:text-[#111111] border border-[#E5E5E5]'
            }`}
          >
            <Palette size={13} />
            <span>Gradients</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('doodle')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === 'doodle'
                ? 'bg-[#111111] text-white shadow-xs'
                : 'bg-white text-[#737373] hover:text-[#111111] border border-[#E5E5E5]'
            }`}
          >
            <Sparkles size={13} />
            <span>Doodle Patterns</span>
          </button>
        </div>

        {/* Themes Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredThemes.map((theme: ChatTheme) => {
              const isSelected = currentThemeId === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`group relative flex flex-col rounded-2xl border-2 transition-all p-3 cursor-pointer select-none text-left ${
                    isSelected
                      ? 'border-[#F4C430] bg-[#FDFBF2] shadow-md ring-2 ring-[#F4C430]/30'
                      : 'border-[#E5E5E5] bg-white hover:border-[#D4D4D4] hover:shadow-md'
                  }`}
                >
                  {/* Miniature Chat Preview Canvas */}
                  <div
                    className="relative w-full h-24 rounded-xl overflow-hidden p-2 flex flex-col justify-between shadow-inner border border-black/10 shrink-0"
                    style={{ background: theme.background }}
                  >
                    {/* Simulated SVG Doodle Pattern if applicable */}
                    {theme.hasDoodlePattern && (
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          backgroundImage: `radial-gradient(${theme.doodleColor || '#000'} 1px, transparent 1px)`,
                          backgroundSize: '12px 12px',
                          opacity: (theme.doodleOpacity || 0.05) * 2.5,
                        }}
                      />
                    )}

                    {/* Mini Received Bubble */}
                    <div className="relative z-1 max-w-[80%] self-start">
                      <div
                        className="px-2 py-1 rounded-md text-[10px] leading-tight font-medium shadow-2xs"
                        style={{
                          backgroundColor: theme.receivedBubbleBg,
                          color: theme.receivedBubbleText,
                        }}
                      >
                        Hello! Ready for class?
                      </div>
                    </div>

                    {/* Mini Sent Bubble */}
                    <div className="relative z-1 max-w-[80%] self-end">
                      <div
                        className="px-2 py-1 rounded-md text-[10px] leading-tight font-medium shadow-2xs flex items-center gap-1"
                        style={{
                          backgroundColor: theme.sentBubbleBg,
                          color: theme.sentBubbleText,
                        }}
                      >
                        <span>Yes, all prepared!</span>
                        <Check size={9} style={{ color: theme.sentMetaText }} />
                      </div>
                    </div>
                  </div>

                  {/* Theme Info & Selection Check */}
                  <div className="flex items-start justify-between gap-2 mt-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs font-bold text-[#111111] truncate">
                          {theme.name}
                        </h3>
                        {theme.type === 'doodle' && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-[#F4C430]/20 text-[#A07800] text-[9px] font-extrabold uppercase">
                            Pattern
                          </span>
                        )}
                        {theme.type === 'gradient' && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-700 text-[9px] font-extrabold uppercase">
                            Gradient
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#737373] mt-0.5 line-clamp-1 leading-snug">
                        {theme.description}
                      </p>
                    </div>

                    {/* Active Checkmark Pill */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#F4C430] text-[#111111] shadow-xs'
                          : 'border border-[#D4D4D4] bg-white group-hover:border-[#A3A3A3]'
                      }`}
                    >
                      {isSelected ? <Check size={14} className="stroke-[3]" /> : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#E5E5E5] bg-white shrink-0">
          <p className="text-xs text-[#737373]">
            Selected: <span className="font-bold text-[#111111]">{CHAT_THEMES.find((t) => t.id === currentThemeId)?.name || 'Default'}</span>
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#111111] text-white font-bold text-xs hover:bg-[#262626] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ChatThemeModal;
