import React, { useEffect, useState } from 'react';
import { Lightbulb, Brain, CheckCircle2, BookOpen, PenTool } from 'lucide-react';
import { SageCharacterId } from './useSageAvatarState';
import { SAGE_THOUGHT_DATA } from './sageThoughtLines';

export interface SageThoughtBubbleProps {
  characterId: SageCharacterId;
  customName?: string;
  thoughtText?: string | null;
  /** Whether the bubble is currently in a brief typing/transitioning state */
  isTypingTransition?: boolean;
  /** Specific bubble mode */
  mode?: 'typing' | 'thinking' | 'streaming' | 'done' | 'idle' | null;
  /** Streaming preview snippet if streaming */
  streamingSnippet?: string;
  /** Compact mode (when conversation is underway) */
  compact?: boolean;
  className?: string;
}

export const SageThoughtBubble: React.FC<SageThoughtBubbleProps> = ({
  characterId,
  customName,
  thoughtText,
  isTypingTransition = false,
  mode = null,
  streamingSnippet,
  compact = false,
  className = '',
}) => {
  const persona = SAGE_THOUGHT_DATA[characterId] || SAGE_THOUGHT_DATA['sage-classic'];
  const headerTitle = customName?.trim()
    ? `${customName.trim()} • ${persona.role}`
    : persona.role;
  const [visible, setVisible] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [currentIcon, setCurrentIcon] = useState<'brain' | 'idea' | 'pen' | 'book' | 'check'>('idea');
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (thoughtText && thoughtText.trim().length > 0) {
      setDisplayText(thoughtText);
      setVisible(true);

      if (mode === 'thinking') {
        setCurrentIcon('brain');
      } else if (mode === 'streaming') {
        setCurrentIcon('pen');
      } else if (mode === 'done') {
        setCurrentIcon('check');
      } else if (mode === 'idle') {
        setCurrentIcon('book');
      } else {
        setCurrentIcon('idea');
      }
    } else {
      setVisible(false);
    }
  }, [thoughtText, mode]);

  if (!visible && !isTypingTransition) {
    return null;
  }

  return (
    <div
      data-testid="sage-live-thought-bubble"
      style={{
        borderColor: `${persona.accentColor}55`,
        boxShadow: `0 4px 16px -2px ${persona.accentColor}25, 0 1px 3px rgba(0,0,0,0.05)`,
      }}
      className={`sage-thought-bubble pointer-events-none select-none z-30 transition-all duration-300 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      } ${
        prefersReducedMotion ? '' : 'animate-in fade-in zoom-in-95 duration-200'
      } max-w-[210px] sm:max-w-[260px] rounded-2xl border px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white/95 dark:bg-[#18181D]/95 backdrop-blur-md text-left flex items-start gap-2 ${className}`}
    >
      {/* Icon or Avatar Tone Badge */}
      <div
        style={{
          backgroundColor: `${persona.accentColor}20`,
          color: persona.accentColor,
        }}
        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
      >
        {isTypingTransition ? (
          <div className="flex items-center gap-0.5">
            <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        ) : currentIcon === 'brain' ? (
          <Brain size={11} className={prefersReducedMotion ? '' : 'animate-spin'} style={{ animationDuration: '3s' }} />
        ) : currentIcon === 'pen' ? (
          <PenTool size={11} className={prefersReducedMotion ? '' : 'animate-pulse'} />
        ) : currentIcon === 'check' ? (
          <CheckCircle2 size={11} />
        ) : currentIcon === 'book' ? (
          <BookOpen size={11} />
        ) : (
          <Lightbulb size={11} />
        )}
      </div>

      {/* Bubble Text Content */}
      <div className="min-w-0 flex-1">
        {isTypingTransition ? (
          <div className="flex items-center gap-1 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '140ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-bounce" style={{ animationDelay: '280ms' }} />
          </div>
        ) : (
          <div>
            <p
              style={{ color: persona.accentColor }}
              className="text-[10px] font-bold uppercase tracking-wider mb-0.5 flex items-center justify-between"
            >
              <span>{headerTitle}</span>
              {mode === 'streaming' && (
                <span className="text-[9px] font-mono lowercase opacity-75">writing...</span>
              )}
            </p>
            <p className="text-[11px] sm:text-xs font-medium leading-snug text-zinc-800 dark:text-zinc-100 break-words line-clamp-3">
              {displayText}
            </p>

            {/* If streaming answer snippet is available */}
            {mode === 'streaming' && streamingSnippet && (
              <p className="mt-1 text-[10px] text-zinc-500 dark:text-zinc-400 italic truncate font-serif">
                "{streamingSnippet}"
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
