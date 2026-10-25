import React, { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import {
  MessageCircle,
  X,
  Send,
  Volume2,
  VolumeX,
  Pin,
  PinOff,
  Sparkles,
  ArrowRight,
  Minimize2,
} from 'lucide-react';
import { SageCharacterSvg } from '../sage/SageAvatar';
import { Sage3DAvatarState } from '../sage/useSageAvatarState';
import { sageSpeech } from '../../lib/sageSpeech';
import {
  PUBLIC_GUIDE_QUICK_CHIPS,
  ROAMING_CAT_SECTION_BUBBLES,
  RoamingSectionBubble,
  getPublicGuideLocalAnswer,
} from '../../data/academyKnowledge';

const LazySage3DAvatar = React.lazy(() => import('../sage/Sage3DAvatar'));

const STAY_STORAGE_KEY = 'scholario_tango_stay_here_v1';
const DISMISS_STORAGE_KEY = 'scholario_tango_minimized_v1';

export interface RoamingCatGuideProps {
  onNavigate?: (page: string) => void;
  /** Optional config flag if ever enabled outside home page */
  enabled?: boolean;
}

interface GuideChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export const RoamingCatGuide: React.FC<RoamingCatGuideProps> = ({
  onNavigate,
  enabled = true,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const chatPanelRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [isFrozen, setIsFrozen] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(STAY_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(DISMISS_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [speakerEnabled, setSpeakerEnabled] = useState(false); // OFF by default, no autoplay
  const [catState, setCatState] = useState<Sage3DAvatarState>('idle');
  const [pokeCount, setPokeCount] = useState(0);
  const [roamLeanX, setRoamLeanX] = useState(0);
  const [bubbleFlipLeft, setBubbleFlipLeft] = useState(false);
  const [activeBubble, setActiveBubble] = useState<RoamingSectionBubble | null>(
    ROAMING_CAT_SECTION_BUBBLES[0]
  );

  const [messages, setMessages] = useState<GuideChatMessage[]>([
    {
      id: 'welcome-tango',
      role: 'assistant',
      content:
        "Meow! I'm **Tango**, your SHS Virtual Academy guide 🐱🐾 Ask me anything about our boards (FBISE, Punjab, Sindh, KPK, O/A Levels, IELTS), fees, live classes, or how to join!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const posRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const velRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const waypointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -9999,
    y: -9999,
    active: false,
  });
  const lastBubbleIndexRef = useRef<number>(0);
  const lastBubbleTimeRef = useRef<number>(Date.now());
  const isFrozenRef = useRef<boolean>(isFrozen);
  const chatOpenRef = useRef<boolean>(chatOpen);

  useEffect(() => {
    isFrozenRef.current = isFrozen;
    try {
      sessionStorage.setItem(STAY_STORAGE_KEY, isFrozen ? '1' : '0');
    } catch {
      // ignore
    }
  }, [isFrozen]);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  useEffect(() => {
    try {
      sessionStorage.setItem(DISMISS_STORAGE_KEY, isMinimized ? '1' : '0');
    } catch {
      // ignore
    }
  }, [isMinimized]);

  // Compute responsive avatar pixel size matching clamp(100px, 16vw, 220px)
  const getAvatarPixelSize = useCallback(() => {
    if (typeof window === 'undefined') return 150;
    return Math.round(Math.max(100, Math.min(220, window.innerWidth * 0.16)));
  }, []);

  // Compute safe waypoint that avoids no-go zones (navbar, primary buttons, inputs, open chat panel)
  const pickSafeWaypoint = useCallback(
    (preferSectionY?: number) => {
      if (typeof window === 'undefined') return { x: 40, y: 300 };
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const size = getAvatarPixelSize();

      const topSafe = 78; // below top navbar
      const bottomSafe = Math.max(24, vh - size - 32);
      const leftMargin = 16;
      const rightMargin = Math.max(leftMargin + 20, vw - size - 18);

      // Collect bounding boxes of primary interactive elements to avoid covering them
      const noGoSelectors =
        'header, nav, [data-roam-nogo], input, textarea, select, button.bg-gold, a[href*="login"]';
      const noGoRects: DOMRect[] = [];
      try {
        document.querySelectorAll(noGoSelectors).forEach((el) => {
          const r = el.getBoundingClientRect();
          if (r.width > 20 && r.height > 20 && r.bottom > 0 && r.top < vh) {
            noGoRects.push(r);
          }
        });
      } catch {
        // ignore
      }

      // Prefer left or right edge lanes so center hero copy & CTAs stay unobstructed
      for (let attempt = 0; attempt < 12; attempt++) {
        const useRightLane = attempt % 2 === 0 ? Math.random() > 0.35 : Math.random() <= 0.35;
        const laneWidth = Math.min(140, Math.max(36, vw * 0.14));
        const candidateX = useRightLane
          ? Math.max(leftMargin, rightMargin - Math.random() * laneWidth)
          : Math.min(rightMargin, leftMargin + Math.random() * laneWidth);

        const baseY =
          typeof preferSectionY === 'number'
            ? Math.max(topSafe, Math.min(bottomSafe, preferSectionY))
            : topSafe + Math.random() * Math.max(40, bottomSafe - topSafe);

        const catRect = {
          left: candidateX + 12,
          right: candidateX + size - 12,
          top: baseY + 12,
          bottom: baseY + size - 12,
        };

        const overlaps = noGoRects.some(
          (r) =>
            catRect.left < r.right &&
            catRect.right > r.left &&
            catRect.top < r.bottom &&
            catRect.bottom > r.top
        );

        if (!overlaps) {
          return { x: candidateX, y: baseY };
        }
      }

      // Guaranteed safe bottom-right corner fallback
      return {
        x: rightMargin,
        y: Math.max(topSafe, bottomSafe - 16),
      };
    },
    [getAvatarPixelSize]
  );

  // Initialize starting position & rAF roaming loop
  useEffect(() => {
    if (!enabled || isMinimized || typeof window === 'undefined') return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const size = getAvatarPixelSize();

    const startX = Math.max(16, vw - size - 24);
    const startY = Math.max(88, vh - size - 42);

    posRef.current = { x: startX, y: startY };
    waypointRef.current = { x: startX, y: startY };

    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translate3d(${Math.round(startX)}px, ${Math.round(startY)}px, 0)`;
    }
    setBubbleFlipLeft(startX > vw * 0.48);

    // Pick new waypoints periodically when roaming is active
    const waypointInterval = window.setInterval(() => {
      if (prefersReducedMotion || isFrozenRef.current || chatOpenRef.current) return;
      waypointRef.current = pickSafeWaypoint();
    }, 6800);

    // Track cursor for playful hop-away when cursor approaches closely
    const handlePointerMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY, active: true };
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // React to scroll & rotate section-aware bubbles (at most 1 bubble every 10s, never repeating consecutively)
    const handleScroll = () => {
      const scrollRatio =
        window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);

      if (!prefersReducedMotion && !isFrozenRef.current && !chatOpenRef.current) {
        const targetY = 96 + scrollRatio * Math.max(80, window.innerHeight - getAvatarPixelSize() - 140);
        waypointRef.current = pickSafeWaypoint(targetY);
      }

      const now = Date.now();
      if (now - lastBubbleTimeRef.current >= 10000 && !chatOpenRef.current) {
        lastBubbleTimeRef.current = now;
        let sectionHint: RoamingSectionBubble['sectionHint'] = 'hero';
        if (scrollRatio > 0.84) sectionHint = 'faq';
        else if (scrollRatio > 0.68) sectionHint = 'pricing';
        else if (scrollRatio > 0.52) sectionHint = 'comparison';
        else if (scrollRatio > 0.36) sectionHint = 'how-it-works';
        else if (scrollRatio > 0.2) sectionHint = 'features';
        else if (scrollRatio > 0.08) sectionHint = 'android';

        const matching = ROAMING_CAT_SECTION_BUBBLES.filter((b) => b.sectionHint === sectionHint);
        const pool = matching.length > 0 ? matching : ROAMING_CAT_SECTION_BUBBLES;
        let nextIdx = Math.floor(Math.random() * pool.length);
        let chosen = pool[nextIdx];
        if (
          ROAMING_CAT_SECTION_BUBBLES.indexOf(chosen) === lastBubbleIndexRef.current &&
          ROAMING_CAT_SECTION_BUBBLES.length > 1
        ) {
          chosen =
            ROAMING_CAT_SECTION_BUBBLES[
              (lastBubbleIndexRef.current + 1) % ROAMING_CAT_SECTION_BUBBLES.length
            ];
        }
        lastBubbleIndexRef.current = ROAMING_CAT_SECTION_BUBBLES.indexOf(chosen);
        setActiveBubble(chosen);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    let rafId: number | null = null;
    let lastTime = performance.now();

    const step = (now: number) => {
      rafId = requestAnimationFrame(step);
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const curSize = getAvatarPixelSize();
      const curVw = window.innerWidth;
      const curVh = window.innerHeight;

      // When chat panel is open, park Tango neatly next to the panel (or above on mobile)
      if (chatOpenRef.current) {
        const parkX =
          curVw < 640
            ? Math.max(12, curVw - curSize - 14)
            : Math.max(16, curVw - 380 - curSize - 12);
        const parkY =
          curVw < 640
            ? Math.max(68, curVh - 450 - curSize * 0.75)
            : Math.max(88, curVh - curSize - 42);
        waypointRef.current = { x: parkX, y: parkY };
      } else if (!prefersReducedMotion && !isFrozenRef.current && pointerRef.current.active) {
        // Gentle playful hop away if cursor gets very close to Tango's center
        const centerX = posRef.current.x + curSize * 0.5;
        const centerY = posRef.current.y + curSize * 0.5;
        const dist = Math.hypot(pointerRef.current.x - centerX, pointerRef.current.y - centerY);
        if (dist < curSize * 0.42 && dist > 8) {
          const pushAngle = Math.atan2(centerY - pointerRef.current.y, centerX - pointerRef.current.x);
          const hopX = Math.max(
            14,
            Math.min(curVw - curSize - 14, posRef.current.x + Math.cos(pushAngle) * 72)
          );
          const hopY = Math.max(
            76,
            Math.min(curVh - curSize - 28, posRef.current.y + Math.sin(pushAngle) * 56)
          );
          waypointRef.current = { x: hopX, y: hopY };
        }
      }

      if (prefersReducedMotion || (isFrozenRef.current && !chatOpenRef.current)) {
        velRef.current.vx *= 0.8;
        velRef.current.vy *= 0.8;
        setRoamLeanX(0);
        return;
      }

      const dx = waypointRef.current.x - posRef.current.x;
      const dy = waypointRef.current.y - posRef.current.y;

      // Spring-damped smooth curved motion
      const spring = 2.4;
      const damping = 0.86;
      velRef.current.vx = (velRef.current.vx + dx * spring * dt) * damping;
      velRef.current.vy = (velRef.current.vy + dy * spring * dt) * damping;

      // Add subtle sine-wave curve perpendicular to motion when moving
      const speed = Math.hypot(velRef.current.vx, velRef.current.vy);
      const curveWave = speed > 0.3 ? Math.sin(now * 0.004) * 0.35 : 0;

      posRef.current.x += velRef.current.vx + curveWave;
      posRef.current.y += velRef.current.vy;

      // Clamp strictly within viewport safe area
      posRef.current.x = Math.max(10, Math.min(curVw - curSize - 10, posRef.current.x));
      posRef.current.y = Math.max(70, Math.min(curVh - curSize - 20, posRef.current.y));

      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translate3d(${posRef.current.x.toFixed(1)}px, ${posRef.current.y.toFixed(1)}px, 0)`;
      }

      const lean = Math.max(-1, Math.min(1, velRef.current.vx * 0.22));
      setRoamLeanX(Math.abs(lean) > 0.04 ? lean : 0);
      setBubbleFlipLeft(posRef.current.x > curVw * 0.45);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.clearInterval(waypointInterval);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [enabled, isMinimized, getAvatarPixelSize, pickSafeWaypoint]);

  // Rotate idle bubbles every 12 seconds if user hasn't scrolled
  useEffect(() => {
    if (chatOpen || isMinimized) return;
    const interval = window.setInterval(() => {
      if (Date.now() - lastBubbleTimeRef.current < 10000) return;
      lastBubbleTimeRef.current = Date.now();
      const nextIdx = (lastBubbleIndexRef.current + 1) % ROAMING_CAT_SECTION_BUBBLES.length;
      lastBubbleIndexRef.current = nextIdx;
      setActiveBubble(ROAMING_CAT_SECTION_BUBBLES[nextIdx]);
    }, 12000);
    return () => window.clearInterval(interval);
  }, [chatOpen, isMinimized]);

  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, chatOpen]);

  // Cleanup speech when closing public chat or turning speaker off
  useEffect(() => {
    if (!speakerEnabled || !chatOpen) {
      sageSpeech.stop();
      setAudioLevel(0);
    }
  }, [speakerEnabled, chatOpen]);

  const sendPublicGuideQuestion = async (questionText: string) => {
    const trimmed = questionText.trim().slice(0, 500);
    if (!trimmed || isSending) return;

    const userMsg: GuideChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsSending(true);
    setCatState('thinking');

    try {
      const res = await fetch('/api/public-guide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = (await res.json()) as { reply?: string };
      const replyText =
        data?.reply?.trim() || getPublicGuideLocalAnswer(trimmed);

      const botMsg: GuideChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: replyText,
      };
      setMessages((prev) => [...prev, botMsg]);
      setCatState('poke');
      window.setTimeout(() => setCatState('idle'), 1400);

      if (speakerEnabled) {
        setCatState('speaking');
        sageSpeech.setCallbacks({
          onStatusChange: (st) => {
            if (st === 'idle' || st === 'error') {
              setCatState('idle');
              setAudioLevel(0);
            }
          },
          onVolumeChange: (vol) => setAudioLevel(vol),
        });
        await sageSpeech.speak(botMsg.id, replyText, 'tango-cat');
      }
    } catch {
      const fallbackReply = getPublicGuideLocalAnswer(trimmed);
      const botMsg: GuideChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
      };
      setMessages((prev) => [...prev, botMsg]);
      setCatState('idle');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChatWithPrompt = (topicPrompt?: string) => {
    setChatOpen(true);
    setPokeCount((c) => c + 1);
    setCatState('poke');
    window.setTimeout(() => setCatState('idle'), 1100);
    if (topicPrompt) {
      sendPublicGuideQuestion(topicPrompt);
    }
  };

  if (!enabled) return null;

  // If visitor minimized Tango, show a small dark floating pill in bottom-right corner
  if (isMinimized) {
    return (
      <button
        type="button"
        data-testid="roaming-cat-restore-btn"
        onClick={() => setIsMinimized(false)}
        style={{ bottom: 'max(16px, env(safe-area-inset-bottom))' }}
        className="fixed right-4 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#141418]/95 hover:bg-[#1E1E24] text-white border border-[#F4C430]/50 shadow-xl transition-all cursor-pointer"
        title="Bring back Tango the Academy Guide Cat"
      >
        <div className="w-7 h-7 flex items-center justify-center bg-transparent">
          <SageCharacterSvg characterId="tango-cat" svgSize={28} uid="restore-tango" />
        </div>
        <span className="text-xs font-extrabold text-[#F4C430]">Ask Tango 🐾</span>
      </button>
    );
  }

  return (
    <>
      {/* ── Single Fixed Roaming Cat Layer (Moved via transform: translate3d, Zero White Sheet) ── */}
      <div
        ref={wrapperRef}
        data-testid="roaming-cat-guide-wrapper"
        style={{
          width: 'clamp(100px, 16vw, 220px)',
          height: 'clamp(100px, 16vw, 220px)',
          willChange: 'transform',
        }}
        className="fixed top-0 left-0 z-40 pointer-events-none select-none bg-transparent border-0 shadow-none"
      >
        {/* Dark Speech Bubble with Tail Pointing at Tango (Task 5c) */}
        {activeBubble && !chatOpen && (
          <div
            data-testid="roaming-cat-speech-bubble"
            onClick={() => handleOpenChatWithPrompt(activeBubble.topicPrompt)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleOpenChatWithPrompt(activeBubble.topicPrompt);
              }
            }}
            className={`pointer-events-auto absolute -top-3 ${
              bubbleFlipLeft
                ? 'right-[86%] mr-1.5 origin-bottom-right'
                : 'left-[86%] ml-1.5 origin-bottom-left'
            } w-[195px] sm:w-[235px] rounded-2xl bg-[#141418]/95 text-zinc-100 border border-[#F4C430]/50 px-3 py-2 shadow-xl backdrop-blur-md cursor-pointer hover:border-[#F4C430] transition-all animate-in fade-in zoom-in-95 duration-200`}
          >
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FB923C] flex items-center gap-1">
                <Sparkles size={10} className="text-[#F4C430]" />
                Tango • Academy Guide
              </span>
              <span className="text-[9px] text-zinc-400 font-semibold">Tap to ask</span>
            </div>
            <p className="text-[11px] leading-snug text-zinc-100 font-medium">
              {activeBubble.text}
            </p>
            {/* Speech Bubble Tail Pointing at Cat */}
            <div
              className={`absolute top-6 w-2.5 h-2.5 rotate-45 bg-[#141418] border-[#F4C430]/50 ${
                bubbleFlipLeft
                  ? '-right-1.5 border-t border-r'
                  : '-left-1.5 border-b border-l'
              }`}
            />
          </div>
        )}

        {/* Frameless Transparent Tango 3D Avatar (Lazy-Loaded with 2D Fallback) */}
        <div
          data-testid="roaming-cat-avatar-trigger"
          onClick={() => {
            setChatOpen((o) => !o);
            setPokeCount((c) => c + 1);
            setCatState('poke');
            window.setTimeout(() => setCatState('idle'), 1100);
          }}
          className="pointer-events-auto w-full h-full flex items-center justify-center bg-transparent border-0 shadow-none cursor-pointer"
          title="Tap Tango to ask about SHS Virtual Academy!"
        >
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center bg-transparent">
                <SageCharacterSvg
                  characterId="tango-cat"
                  avatarState={catState}
                  svgSize={130}
                  uid="roaming-fallback"
                />
              </div>
            }
          >
            <LazySage3DAvatar
              state={catState}
              characterId="tango-cat"
              customName="Tango"
              audioLevel={audioLevel}
              sizeClassName="w-full h-full"
              chromeless={true}
              roamLeanX={roamLeanX}
              pokeCount={pokeCount}
            />
          </Suspense>
        </div>

        {/* Tiny Floating Control Bar Under Tango ("Stay here" Freeze Toggle + Minimize) */}
        <div className="pointer-events-auto -mt-2 flex items-center justify-center gap-1">
          <button
            type="button"
            data-testid="roaming-cat-stay-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsFrozen((f) => !f);
            }}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#141418]/90 hover:bg-[#1F1F26] text-[10px] font-bold text-zinc-200 border border-zinc-700/80 shadow-md transition-colors cursor-pointer"
            title={isFrozen ? 'Let Tango roam freely' : 'Freeze Tango in this spot'}
          >
            {isFrozen ? (
              <>
                <PinOff size={10} className="text-[#F4C430]" />
                <span>Roam</span>
              </>
            ) : (
              <>
                <Pin size={10} className="text-[#F4C430]" />
                <span>Stay here</span>
              </>
            )}
          </button>

          <button
            type="button"
            data-testid="roaming-cat-minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              setChatOpen(false);
              setIsMinimized(true);
            }}
            className="p-1 rounded-full bg-[#141418]/90 hover:bg-[#1F1F26] text-zinc-400 hover:text-white border border-zinc-700/80 shadow-md transition-colors cursor-pointer"
            title="Minimize Tango guide"
          >
            <Minimize2 size={10} />
          </button>
        </div>
      </div>

      {/* ── Public Guide Chat Panel (Task 5d: Dark-Themed Bottom Sheet on Mobile, Floating Card on Desktop) ── */}
      {chatOpen && (
        <div
          ref={chatPanelRef}
          data-roam-nogo="true"
          data-testid="roaming-cat-chat-panel"
          style={{ bottom: 'max(12px, env(safe-area-inset-bottom))' }}
          className="fixed inset-x-3 sm:inset-x-auto sm:right-5 z-50 sm:w-[370px] max-h-[78dvh] sm:max-h-[540px] rounded-3xl bg-[#121216]/98 text-zinc-100 border border-[#2C2C35] shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 bg-[#18181E] border-b border-zinc-800 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 flex items-center justify-center bg-transparent shrink-0">
                <SageCharacterSvg characterId="tango-cat" svgSize={32} uid="chat-hdr-tango" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-extrabold text-white truncate flex items-center gap-1.5">
                  <span>Tango • Academy Guide</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
                </h3>
                <p className="text-[10px] text-zinc-400 truncate">
                  SHS Virtual Academy & Scholario Official Info
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* Speaker Toggle (OFF by default, no autoplay) */}
              <button
                type="button"
                data-testid="roaming-cat-speaker-toggle"
                onClick={() => setSpeakerEnabled((s) => !s)}
                className={`p-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  speakerEnabled
                    ? 'bg-[#F4C430]/20 border-[#F4C430]/60 text-[#F4C430]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
                title={speakerEnabled ? 'Voice replies ON (Tap to mute)' : 'Voice replies OFF (Tap to enable)'}
              >
                {speakerEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
              </button>

              <button
                type="button"
                data-testid="roaming-cat-chat-close"
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
                title="Close chat"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Quick-Reply Chips */}
          <div className="px-3.5 py-2 bg-[#15151B] border-b border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            {PUBLIC_GUIDE_QUICK_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                data-testid={`public-guide-chip-${chip.id}`}
                onClick={() => sendPublicGuideQuestion(chip.prompt)}
                disabled={isSending}
                className="shrink-0 px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-[#F4C430]/15 border border-zinc-700/90 hover:border-[#F4C430]/60 text-[11px] font-bold text-zinc-200 hover:text-[#F4C430] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-2.5 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-[#F4C430] text-black font-semibold rounded-br-xs'
                      : 'bg-zinc-900/95 text-zinc-100 border border-zinc-800 rounded-bl-xs'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-3.5 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] flex items-center gap-2">
                  <span>Tango is checking the academy guide</span>
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430] animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#F4C430] animate-bounce [animation-delay:300ms]" />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input & Get Started CTA */}
          <div className="p-3 bg-[#18181E] border-t border-zinc-800 space-y-2 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendPublicGuideQuestion(input);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                data-testid="public-guide-input"
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="Ask about boards, fees, live classes..."
                className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#F4C430]"
              />
              <button
                type="submit"
                data-testid="public-guide-send-btn"
                disabled={!input.trim() || isSending}
                className="p-2 rounded-xl bg-[#F4C430] hover:bg-[#e5b625] text-black disabled:opacity-40 transition-colors cursor-pointer"
                title="Send question"
              >
                <Send size={14} />
              </button>
            </form>

            {onNavigate && (
              <div className="flex items-center justify-between pt-0.5 text-[11px]">
                <span className="text-zinc-400">Ready to join SHS Virtual Academy?</span>
                <button
                  type="button"
                  onClick={() => {
                    setChatOpen(false);
                    onNavigate('login');
                  }}
                  className="inline-flex items-center gap-1 font-extrabold text-[#F4C430] hover:underline cursor-pointer"
                >
                  <span>Get Started / Sign In</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default RoamingCatGuide;
