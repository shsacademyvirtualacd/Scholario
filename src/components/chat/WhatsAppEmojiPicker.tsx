import React, { useState, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Clock,
  GraduationCap,
  Smile,
  Leaf,
  Coffee,
  Trophy,
  Car,
  Lightbulb,
  Hash,
  Flag,
  Delete,
} from 'lucide-react';
import { EMOJI_CATEGORIES, EmojiItem } from './emojiData';

const RECENT_STORAGE_KEY = 'scholario_recent_emojis';
const DEFAULT_RECENTS = ['📚', '🎓', '✏️', '📝', '💡', '✅', '👍', '😊', '👏', '🔬', '🙋', '❤️', '🔥', '🎉', '📌', '⏰'];

interface WhatsAppEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onClose?: () => void;
  onBackspace?: () => void;
  className?: string;
}

export const WhatsAppEmojiPicker: React.FC<WhatsAppEmojiPickerProps> = ({
  onSelectEmoji,
  onClose,
  onBackspace,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('recent');
  const [recentEmojis, setRecentEmojis] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return DEFAULT_RECENTS;
  });

  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = (emoji: string) => {
    onSelectEmoji(emoji);

    // Update Recents list
    setRecentEmojis((prev) => {
      const filtered = prev.filter((e) => e !== emoji);
      const next = [emoji, ...filtered].slice(0, 32);
      try {
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Filter emojis based on search query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matched: EmojiItem[] = [];
    const seen = new Set<string>();

    for (const cat of EMOJI_CATEGORIES) {
      for (const item of cat.emojis) {
        if (seen.has(item.emoji)) continue;
        if (
          item.name.toLowerCase().includes(q) ||
          item.keywords.some((k) => k.toLowerCase().includes(q))
        ) {
          seen.add(item.emoji);
          matched.push(item);
        }
      }
    }

    return matched;
  }, [searchQuery]);

  const scrollToCategory = (catId: string) => {
    setActiveCategory(catId);
    const target = categoryRefs.current[catId];
    if (target && scrollContainerRef.current) {
      const topPos = target.offsetTop - scrollContainerRef.current.offsetTop;
      scrollContainerRef.current.scrollTo({
        top: Math.max(0, topPos - 4),
        behavior: 'smooth',
      });
    }
  };

  const getCategoryIcon = (id: string, active: boolean) => {
    const iconProps = {
      size: 19,
      className: `transition-colors ${active ? 'text-[#00A884]' : 'text-[#8696A0] hover:text-[#54656F]'}`,
    };

    switch (id) {
      case 'recent':
        return <Clock {...iconProps} />;
      case 'education':
        return <GraduationCap {...iconProps} />;
      case 'smileys':
        return <Smile {...iconProps} />;
      case 'animals':
        return <Leaf {...iconProps} />;
      case 'food':
        return <Coffee {...iconProps} />;
      case 'activities':
        return <Trophy {...iconProps} />;
      case 'travel':
        return <Car {...iconProps} />;
      case 'objects':
        return <Lightbulb {...iconProps} />;
      case 'symbols':
        return <Hash {...iconProps} />;
      case 'flags':
        return <Flag {...iconProps} />;
      default:
        return <Smile {...iconProps} />;
    }
  };

  return (
    <div
      id="whatsapp-emoji-picker"
      className={`w-full bg-[#FFFFFF] border-t border-[#E9EDEF] flex flex-col h-[320px] select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Header Bar */}
      <div className="px-3 pt-2.5 pb-2 flex items-center gap-2 border-b border-[#F0F2F5] bg-white shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-[#F0F2F5] rounded-lg px-3 py-1.5 focus-within:bg-[#E9EDEF] transition-colors">
          <Search size={16} className="text-[#54656F] shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji"
            className="w-full text-xs sm:text-[13px] text-[#111B21] placeholder:text-[#667781] bg-transparent outline-none border-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#54656F] hover:text-[#111B21] p-0.5"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#54656F] hover:text-[#111B21] rounded-lg transition-colors shrink-0"
            title="Close emoji keyboard"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Emoji Scroll View */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-4 overscroll-contain"
        style={{ scrollbarWidth: 'thin' }}
      >
        {searchResults !== null ? (
          /* Search Results Display */
          <div>
            <div className="text-[12px] font-medium text-[#667781] mb-2 px-1">
              {searchResults.length > 0 ? `Results (${searchResults.length})` : 'No emojis found'}
            </div>
            {searchResults.length > 0 && (
              <div className="grid grid-cols-7 sm:grid-cols-8 md:grid-cols-9 gap-y-1 justify-items-center">
                {searchResults.map((item) => (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={() => handleSelect(item.emoji)}
                    title={item.name}
                    className="w-10 h-10 flex items-center justify-center text-[25px] sm:text-[27px] leading-none cursor-pointer bg-transparent border-none p-0 outline-none select-none hover:scale-110 active:scale-100 transition-transform"
                  >
                    {item.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Standard Categorized View */
          <>
            {/* Recents Section */}
            {recentEmojis.length > 0 && (
              <div
                ref={(el) => {
                  categoryRefs.current['recent'] = el;
                }}
              >
                <div className="text-[12px] font-medium text-[#667781] mb-2 px-1">
                  Recently Used
                </div>
                <div className="grid grid-cols-7 sm:grid-cols-8 md:grid-cols-9 gap-y-1 justify-items-center">
                  {recentEmojis.map((emoji, idx) => (
                    <button
                      key={`recent-${emoji}-${idx}`}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      className="w-10 h-10 flex items-center justify-center text-[25px] sm:text-[27px] leading-none cursor-pointer bg-transparent border-none p-0 outline-none select-none hover:scale-110 active:scale-100 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Categories */}
            {EMOJI_CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                ref={(el) => {
                  categoryRefs.current[cat.id] = el;
                }}
              >
                <div className="text-[12px] font-medium text-[#667781] mb-2 px-1 flex items-center justify-between">
                  <span>{cat.name}</span>
                  {cat.id === 'education' && (
                    <span className="text-[10px] text-[#00A884] font-semibold bg-[#E7FCE8] px-1.5 py-0.5 rounded-sm">
                      Academic Focus
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-7 sm:grid-cols-8 md:grid-cols-9 gap-y-1 justify-items-center">
                  {cat.emojis.map((item) => (
                    <button
                      key={`${cat.id}-${item.emoji}`}
                      type="button"
                      onClick={() => handleSelect(item.emoji)}
                      title={item.name}
                      className="w-10 h-10 flex items-center justify-center text-[25px] sm:text-[27px] leading-none cursor-pointer bg-transparent border-none p-0 outline-none select-none hover:scale-110 active:scale-100 transition-transform"
                    >
                      {item.emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* WhatsApp Bottom Category Navigation Bar */}
      <div className="px-2 py-1.5 border-t border-[#F0F2F5] bg-[#FFFFFF] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          {recentEmojis.length > 0 && (
            <button
              type="button"
              onClick={() => scrollToCategory('recent')}
              className={`p-1.5 rounded-none border-b-2 transition-all cursor-pointer ${
                activeCategory === 'recent' ? 'border-[#00A884]' : 'border-transparent'
              }`}
              title="Recently used"
            >
              {getCategoryIcon('recent', activeCategory === 'recent')}
            </button>
          )}

          {EMOJI_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => scrollToCategory(cat.id)}
                className={`p-1.5 rounded-none border-b-2 transition-all cursor-pointer ${
                  isActive ? 'border-[#00A884]' : 'border-transparent'
                }`}
                title={cat.name}
              >
                {getCategoryIcon(cat.id, isActive)}
              </button>
            );
          })}
        </div>

        {/* Backspace Button on far right */}
        {onBackspace && (
          <button
            type="button"
            onClick={onBackspace}
            className="p-1.5 text-[#54656F] hover:text-[#111B21] transition-colors ml-1 cursor-pointer shrink-0"
            title="Backspace"
            aria-label="Delete last character"
          >
            <Delete size={20} />
          </button>
        )}
      </div>
    </div>
  );
};
