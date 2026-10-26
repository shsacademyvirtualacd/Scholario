import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Pencil,
  Check,
  RotateCcw,
  Volume2,
  UserCheck,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  Sage3DAvatarState,
  SageCharacterId,
  DEFAULT_SAGE_CHARACTER_ID,
  getSageCharacterById,
} from './useSageAvatarState';
import { Sage3DAvatar } from './Sage3DAvatar';
import { sageSpeech, AvatarVoicePreference } from '../../lib/sageSpeech';

export interface SageProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  characterId: SageCharacterId;
  customName: string;
  displayName: string;
  avatarState: Sage3DAvatarState;
  audioLevel?: number;
  onRename: (rawName: string) => { valid: boolean; sanitized: string; error?: string };
  onResetName: () => void;
  onResetCompanion?: () => void;
  onOpenCharacterPicker: () => void;
  onVoicePrefChanged?: () => void;
}

function getReadableLangLabel(lang: string): string {
  const normalized = (lang || '').toLowerCase();
  if (normalized.startsWith('ur')) return 'Urdu';
  if (normalized === 'en-gb') return 'English UK';
  if (normalized === 'en-us') return 'English US';
  if (normalized === 'en-pk') return 'English PK';
  if (normalized === 'en-in') return 'English IN';
  if (normalized === 'en-au') return 'English AU';
  if (normalized.startsWith('en')) return 'English';
  return (lang || 'System').toUpperCase();
}

function formatShortVoiceLabel(voice: SpeechSynthesisVoice): string {
  const rawName = (voice.name || 'Voice').trim();
  const isNatural = /natural|neural|online|premium|enhanced/i.test(rawName);
  const langLabel = getReadableLangLabel(voice.lang);

  let cleanName = rawName
    .replace(/^Microsoft\s+/i, '')
    .replace(/^Google\s+/i, '')
    .replace(/^Apple\s+/i, '')
    .replace(/\s+Online\s*\(Natural\)/i, '')
    .replace(/\s*\(Natural\)/i, '')
    .replace(/\s*-\s*.*$/, '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim();

  if (!cleanName) cleanName = rawName.slice(0, 18);
  if (cleanName.length > 22) {
    cleanName = `${cleanName.slice(0, 20).trim()}…`;
  }

  return `${cleanName} (${langLabel}${isNatural ? ', Natural' : ''})`;
}

export const SageProfilePanel: React.FC<SageProfilePanelProps> = ({
  isOpen,
  onClose,
  characterId,
  customName,
  displayName,
  avatarState,
  audioLevel = 0,
  onRename,
  onResetName,
  onResetCompanion,
  onOpenCharacterPicker,
  onVoicePrefChanged,
}) => {
  const activeChar = getSageCharacterById(characterId);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(customName || activeChar.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSavedFlash, setNameSavedFlash] = useState(false);

  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voicePref, setVoicePref] = useState<AvatarVoicePreference>(() =>
    sageSpeech.getAvatarVoicePref(characterId)
  );
  const [isPreviewingVoice, setIsPreviewingVoice] = useState(false);
  const [previewAudioLevel, setPreviewAudioLevel] = useState(0);
  const [pokeCount, setPokeCount] = useState(0);

  useEffect(() => {
    setNameInput(customName || activeChar.name);
    setNameError(null);
    setVoicePref(sageSpeech.getAvatarVoicePref(characterId));
  }, [characterId, customName, activeChar.name, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    sageSpeech.ensureVoicesLoaded().then((loaded) => {
      if (mounted) setVoices(loaded);
    });
    const unsub = sageSpeech.onVoicesReady((loaded) => {
      if (mounted) setVoices([...loaded]);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isEditingName) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isEditingName, onClose]);

  const groupedVoices = useMemo(() => {
    const urdu: SpeechSynthesisVoice[] = [];
    const english: SpeechSynthesisVoice[] = [];
    const other: SpeechSynthesisVoice[] = [];

    for (const v of voices) {
      const lang = (v.lang || '').toLowerCase();
      if (lang.startsWith('ur') || /urdu/i.test(v.name)) {
        urdu.push(v);
      } else if (lang.startsWith('en')) {
        english.push(v);
      } else {
        other.push(v);
      }
    }
    return { urdu, english, other };
  }, [voices]);

  if (!isOpen) return null;

  const liveStatusLabel =
    avatarState === 'speaking' || isPreviewingVoice
      ? 'Speaking...'
      : avatarState === 'thinking'
      ? 'Thinking...'
      : avatarState === 'listening'
      ? 'Listening...'
      : avatarState === 'typing'
      ? 'Writing response...'
      : 'Online';

  const statusDotColor =
    avatarState === 'speaking' || isPreviewingVoice
      ? 'bg-amber-400 animate-ping'
      : avatarState === 'thinking'
      ? 'bg-sky-400 animate-pulse'
      : 'bg-emerald-500';

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const res = onRename(nameInput);
    if (!res.valid) {
      setNameError(res.error || 'Invalid name.');
      return;
    }
    setNameError(null);
    setIsEditingName(false);
    setNameSavedFlash(true);
    window.setTimeout(() => setNameSavedFlash(false), 1800);
  };

  const handleResetToDefaultName = () => {
    onResetName();
    setNameInput(activeChar.name);
    setNameError(null);
    setIsEditingName(false);
  };

  const handleResetToDefaultCompanion = () => {
    onResetName();
    onResetCompanion?.();
    const defaultChar = getSageCharacterById(DEFAULT_SAGE_CHARACTER_ID);
    setNameInput(defaultChar.name);
    setNameError(null);
    setIsEditingName(false);
  };

  const handleVoiceChange = (voiceURI: string) => {
    const updated = sageSpeech.setAvatarVoicePref(characterId, {
      voiceURI: voiceURI || undefined,
    });
    setVoicePref({ ...updated });
    onVoicePrefChanged?.();
  };

  const handleRateChange = (rate: number) => {
    const updated = sageSpeech.setAvatarVoicePref(characterId, { rate });
    setVoicePref({ ...updated });
    onVoicePrefChanged?.();
  };

  const handlePitchChange = (pitch: number) => {
    const updated = sageSpeech.setAvatarVoicePref(characterId, { pitch });
    setVoicePref({ ...updated });
    onVoicePrefChanged?.();
  };

  const handleResetVoicePref = () => {
    const updated = sageSpeech.setAvatarVoicePref(characterId, {
      voiceURI: undefined,
      rate: activeChar.voiceProfile.defaultRate,
      pitch: activeChar.voiceProfile.defaultPitch,
    });
    setVoicePref({ ...updated });
    onVoicePrefChanged?.();
  };

  const handlePreviewVoice = async () => {
    if (isPreviewingVoice) {
      sageSpeech.stop();
      setIsPreviewingVoice(false);
      setPreviewAudioLevel(0);
      return;
    }
    setIsPreviewingVoice(true);
    await sageSpeech.previewVoice(characterId, displayName, {
      onBoundaryLevel: (lvl) => setPreviewAudioLevel(lvl),
      onEnd: () => {
        setIsPreviewingVoice(false);
        setPreviewAudioLevel(0);
      },
    });
  };

  const resolvedDefaultVoice = sageSpeech.resolveVoiceForAvatar(characterId, false).voice;
  const selectedVoiceObj =
    voices.find((v) => v.voiceURI === voicePref.voiceURI) || resolvedDefaultVoice;
  const fullVoiceTooltip = selectedVoiceObj
    ? `${selectedVoiceObj.name} (${selectedVoiceObj.lang})`
    : 'System Default Voice';

  const rateMin = 0.6;
  const rateMax = 1.5;
  const ratePct = Math.max(
    0,
    Math.min(100, ((voicePref.rate - rateMin) / (rateMax - rateMin)) * 100)
  );

  const pitchMin = 0.7;
  const pitchMax = 1.35;
  const pitchPct = Math.max(
    0,
    Math.min(100, ((voicePref.pitch - pitchMin) / (pitchMax - pitchMin)) * 100)
  );

  const isRateModified = Math.abs(voicePref.rate - activeChar.voiceProfile.defaultRate) > 0.01;
  const isPitchModified = Math.abs(voicePref.pitch - activeChar.voiceProfile.defaultPitch) > 0.01;

  return (
    <div
      data-testid="sage-profile-panel-backdrop"
      className="sage-profile-backdrop fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <style>{`
        .sage-profile-drawer .sage-voice-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 7px;
          border-radius: 9999px;
          outline: none;
          background: linear-gradient(
            to right,
            #F4C430 0%,
            #F4C430 var(--sage-slider-pct, 50%),
            rgba(163, 163, 163, 0.32) var(--sage-slider-pct, 50%),
            rgba(163, 163, 163, 0.32) 100%
          );
        }
        .sage-profile-drawer .sage-voice-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #F4C430;
          border: 2.5px solid #111111;
          box-shadow: 0 2px 6px rgba(17, 17, 17, 0.28);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .sage-profile-drawer .sage-voice-slider::-webkit-slider-thumb:hover {
          transform: scale(1.12);
        }
        .sage-profile-drawer .sage-voice-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 9999px;
          background: #F4C430;
          border: 2.5px solid #111111;
          box-shadow: 0 2px 6px rgba(17, 17, 17, 0.28);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .sage-profile-drawer .sage-voice-slider::-moz-range-thumb:hover {
          transform: scale(1.12);
        }
      `}</style>

      <aside
        data-testid="sage-profile-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Profile and Voice"
        onClick={(e) => e.stopPropagation()}
        className="sage-profile-drawer relative w-full sm:w-[400px] max-h-[90dvh] sm:max-h-none sm:h-full bg-[#FAFAF9] dark:bg-[#141416] text-[#111111] dark:text-[#F4F4F5] border-t sm:border-t-0 sm:border-l border-[#E5E5E5] dark:border-[#27272A] rounded-t-[28px] sm:rounded-none shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-200"
      >
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md pt-3.5 sm:pt-4 px-5 pb-3.5 border-b border-[#E5E5E5] dark:border-[#27272A] flex items-center justify-between shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#D4D4D4] dark:bg-zinc-700 mx-auto absolute top-2 left-1/2 -translate-x-1/2 sm:hidden" />
          <h3 className="text-base font-extrabold tracking-tight text-[#111111] dark:text-white">
            Profile and Voice
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#F5F5F5] dark:bg-[#27272A] hover:bg-[#E5E5E5] dark:hover:bg-[#3F3F46] text-[#525252] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close drawer"
            aria-label="Close Profile and Voice drawer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Content with 24px Bottom Padding */}
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-6 space-y-4">
          {/* 1. Companion Identity Section with 180px Live 3D Portrait Floating Directly on Drawer Surface */}
          <div
            style={{
              background: 'transparent',
              backgroundColor: 'transparent',
              boxShadow: 'none',
              border: 'none',
              filter: 'none',
              backdropFilter: 'none',
            }}
            className="bg-transparent border-0 shadow-none ring-0 p-2 flex flex-col items-center text-center"
          >
            {/* Large 180px Portrait — Transparent Surface, Never Cropped at Any Scroll Position */}
            <div
              style={{
                background: 'transparent',
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: 'none',
                filter: 'none',
                backdropFilter: 'none',
              }}
              className="sage-profile-orb relative w-[180px] h-[180px] bg-transparent border-0 shadow-none ring-0 flex items-center justify-center shrink-0"
            >
              <Sage3DAvatar
                state={isPreviewingVoice ? 'speaking' : avatarState}
                characterId={characterId}
                customName={displayName}
                audioLevel={isPreviewingVoice ? previewAudioLevel : audioLevel}
                sizeClassName="w-[180px] h-[180px]"
                chromeless={true}
                portraitFraming={true}
                onPoke={() => setPokeCount((c) => c + 1)}
                pokeCount={pokeCount}
              />
            </div>

            {/* Name & Inline Rename Editor */}
            <div className="mt-3.5 w-full max-w-xs">
              {!isEditingName ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center gap-2">
                    <h2
                      data-testid="sage-profile-display-name"
                      className="text-xl font-black text-[#111111] dark:text-white tracking-tight"
                    >
                      {displayName}
                    </h2>
                    <button
                      type="button"
                      data-testid="sage-rename-edit-btn"
                      onClick={() => {
                        setNameInput(customName || activeChar.name);
                        setNameError(null);
                        setIsEditingName(true);
                      }}
                      className="w-7 h-7 rounded-full bg-[#FDF3C8] dark:bg-[#27272A] hover:bg-[#F4C430] text-[#111111] dark:text-[#F4C430] flex items-center justify-center border border-[#F4C430]/40 transition-colors cursor-pointer"
                      title="Rename companion"
                      aria-label="Rename companion"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>

                  {customName && customName !== activeChar.name && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-[#737373] dark:text-zinc-400">
                        Default:{' '}
                        <strong className="text-[#111111] dark:text-zinc-200">
                          {activeChar.name}
                        </strong>
                      </span>
                      <button
                        type="button"
                        data-testid="sage-reset-name-btn"
                        onClick={handleResetToDefaultName}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#92700A] dark:text-[#F4C430] hover:underline cursor-pointer"
                      >
                        <RotateCcw size={10} />
                        Reset name
                      </button>
                    </div>
                  )}

                  {nameSavedFlash && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                      Name updated across Scholario
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSaveName} className="w-full space-y-2 mt-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      data-testid="sage-rename-input"
                      value={nameInput}
                      onChange={(e) => {
                        setNameInput(e.target.value);
                        if (nameError) setNameError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          e.stopPropagation();
                          setIsEditingName(false);
                          setNameError(null);
                        }
                      }}
                      maxLength={20}
                      placeholder={activeChar.name}
                      autoFocus
                      className="flex-1 px-3 py-1.5 rounded-[14px] bg-white dark:bg-[#141416] border border-[#E5E5E5] dark:border-[#3F3F46] text-sm font-bold text-[#111111] dark:text-white focus:outline-none focus:border-[#F4C430]"
                    />
                    <button
                      type="submit"
                      data-testid="sage-rename-save-btn"
                      className="px-3.5 py-1.5 rounded-full bg-[#F4C430] hover:bg-[#e6b82a] text-[#111111] font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={13} />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false);
                        setNameError(null);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#F5F5F5] dark:bg-[#27272A] hover:bg-[#E5E5E5] dark:hover:bg-[#3F3F46] text-[#525252] dark:text-zinc-300 text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#737373] dark:text-zinc-400 px-1">
                    <span>1–20 characters</span>
                    <span>{nameInput.trim().length}/20</span>
                  </div>
                  {nameError && (
                    <div className="flex items-center gap-1.5 text-xs text-red-700 dark:text-rose-300 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-800/50 rounded-xl px-2.5 py-1.5">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{nameError}</span>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Role Chip & Online Chip */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
              <span
                style={{
                  color: activeChar.accentColor,
                  borderColor: `${activeChar.accentColor}4D`,
                  backgroundColor: `${activeChar.accentColor}16`,
                }}
                className="px-3 py-0.5 rounded-full border text-[11px] font-bold tracking-wide"
              >
                {activeChar.role}
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#F5F5F5] dark:bg-[#222227] border border-[#E5E5E5] dark:border-[#2F2F37] text-[11px] font-bold text-[#525252] dark:text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotColor}`}
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>{liveStatusLabel}</span>
              </span>
            </div>

            <p className="text-xs text-[#525252] dark:text-zinc-400 mt-2 max-w-[290px] leading-relaxed">
              {activeChar.description}
            </p>

            {/* Full-Width "Change companion" Secondary Pill Button */}
            <button
              type="button"
              data-testid="sage-profile-change-avatar-btn"
              onClick={() => {
                onClose();
                onOpenCharacterPicker();
              }}
              className="w-full mt-4 py-2.5 px-4 rounded-full bg-[#111111] dark:bg-[#27272A] hover:bg-[#1f1f1f] dark:hover:bg-[#3F3F46] border border-[#111111] dark:border-[#3F3F46] text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
            >
              <UserCheck size={15} className="text-[#F4C430]" />
              <span>Change companion</span>
            </button>
          </div>

          {/* 2. Clean Voice Card */}
          <div className="rounded-[24px] bg-white dark:bg-[#18181B] border border-[#E5E5E5] dark:border-[#27272A] p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#FDF3C8] dark:bg-[#F4C430]/15 flex items-center justify-center text-[#92700A] dark:text-[#F4C430]">
                  <Volume2 size={14} />
                </div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#111111] dark:text-zinc-200">
                  Voice Settings
                </h4>
              </div>
              <button
                type="button"
                data-testid="sage-profile-preview-voice-btn"
                onClick={handlePreviewVoice}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F4C430] hover:bg-[#e6b82a] text-[#111111] text-xs font-extrabold shadow-2xs transition-all cursor-pointer shrink-0"
              >
                <Volume2 size={13} />
                <span>{isPreviewingVoice ? 'Stop' : 'Preview voice'}</span>
              </button>
            </div>

            {/* Voice Dropdown Grouped by Language (Urdu First, Rounded 14px, Chevron, Ellipsis, Full Tooltip) */}
            <div className="space-y-1.5">
              <label
                htmlFor="sage-profile-voice-select"
                className="block text-[11px] font-bold text-[#525252] dark:text-zinc-400"
              >
                Assigned voice for {displayName}
              </label>
              <div className="relative">
                <select
                  id="sage-profile-voice-select"
                  data-testid="sage-profile-voice-select"
                  value={voicePref.voiceURI || ''}
                  onChange={(e) => handleVoiceChange(e.target.value)}
                  title={fullVoiceTooltip}
                  className="w-full appearance-none pl-3.5 pr-9 py-2.5 rounded-[14px] bg-[#FAFAFA] dark:bg-[#141416] border border-[#E5E5E5] dark:border-[#2F2F37] hover:border-[#D4D4D4] text-xs font-semibold text-[#111111] dark:text-zinc-100 truncate focus:outline-none focus:border-[#F4C430]"
                >
                  <option
                    value=""
                    title={
                      resolvedDefaultVoice
                        ? `Default: ${resolvedDefaultVoice.name} (${resolvedDefaultVoice.lang})`
                        : 'Auto System Default'
                    }
                  >
                    Auto (
                    {resolvedDefaultVoice
                      ? formatShortVoiceLabel(resolvedDefaultVoice)
                      : 'System Default'}
                    )
                  </option>

                  {groupedVoices.urdu.length > 0 && (
                    <optgroup label="Urdu (اردو)">
                      {groupedVoices.urdu.map((v) => (
                        <option
                          key={v.voiceURI}
                          value={v.voiceURI}
                          title={`${v.name} (${v.lang})`}
                        >
                          {formatShortVoiceLabel(v)}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {groupedVoices.english.length > 0 && (
                    <optgroup label="English">
                      {groupedVoices.english.map((v) => (
                        <option
                          key={v.voiceURI}
                          value={v.voiceURI}
                          title={`${v.name} (${v.lang})`}
                        >
                          {formatShortVoiceLabel(v)}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {groupedVoices.other.length > 0 && (
                    <optgroup label="Other Languages">
                      {groupedVoices.other.map((v) => (
                        <option
                          key={v.voiceURI}
                          value={v.voiceURI}
                          title={`${v.name} (${v.lang})`}
                        >
                          {formatShortVoiceLabel(v)}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <ChevronDown
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#737373] dark:text-zinc-400"
                />
              </div>
            </div>

            {/* Speed & Pitch Sliders with Gold Filled Track, Large Round Thumb, Value Pill & Reset Icon */}
            <div className="space-y-4 pt-1">
              {/* Speed Slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-bold text-[#404040] dark:text-zinc-300">Speed</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FDF3C8] dark:bg-[#222229] border border-[#F4C430]/40 font-mono text-[11px] font-bold text-[#92700A] dark:text-[#F4C430]">
                      {voicePref.rate.toFixed(2)}x
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRateChange(activeChar.voiceProfile.defaultRate)}
                      disabled={!isRateModified}
                      title={`Reset speed to ${activeChar.voiceProfile.defaultRate.toFixed(2)}x`}
                      aria-label="Reset speed"
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[#737373] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  data-testid="sage-profile-rate-slider"
                  min={rateMin}
                  max={rateMax}
                  step={0.05}
                  value={voicePref.rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  style={{ '--sage-slider-pct': `${ratePct}%` } as React.CSSProperties}
                  className="sage-voice-slider w-full cursor-pointer"
                />
              </div>

              {/* Pitch Slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-bold text-[#404040] dark:text-zinc-300">Pitch</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#FDF3C8] dark:bg-[#222229] border border-[#F4C430]/40 font-mono text-[11px] font-bold text-[#92700A] dark:text-[#F4C430]">
                      {voicePref.pitch.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePitchChange(activeChar.voiceProfile.defaultPitch)}
                      disabled={!isPitchModified}
                      title={`Reset pitch to ${activeChar.voiceProfile.defaultPitch.toFixed(2)}`}
                      aria-label="Reset pitch"
                      className="w-6 h-6 rounded-full flex items-center justify-center text-[#737373] dark:text-zinc-400 hover:text-[#111111] dark:hover:text-white hover:bg-[#F5F5F5] dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  data-testid="sage-profile-pitch-slider"
                  min={pitchMin}
                  max={pitchMax}
                  step={0.03}
                  value={voicePref.pitch}
                  onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                  style={{ '--sage-slider-pct': `${pitchPct}%` } as React.CSSProperties}
                  className="sage-voice-slider w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Two Clearly Separated Quiet Buttons + Saved Per Avatar Note */}
            <div className="pt-3.5 border-t border-[#E5E5E5] dark:border-[#27272A] space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleResetVoicePref}
                  className="w-full py-2 px-3 rounded-full bg-[#F5F5F5] dark:bg-[#222228] hover:bg-[#EAEAEA] dark:hover:bg-[#2C2C34] border border-[#E5E5E5] dark:border-[#2F2F37] text-[11px] font-bold text-[#525252] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                >
                  Reset voice defaults
                </button>
                <button
                  type="button"
                  data-testid="sage-reset-companion-btn"
                  onClick={handleResetToDefaultCompanion}
                  className="w-full py-2 px-3 rounded-full bg-[#F5F5F5] dark:bg-[#222228] hover:bg-[#EAEAEA] dark:hover:bg-[#2C2C34] border border-[#E5E5E5] dark:border-[#2F2F37] text-[11px] font-bold text-[#525252] dark:text-zinc-300 hover:text-[#111111] dark:hover:text-white transition-colors cursor-pointer"
                >
                  Reset to default companion
                </button>
              </div>
              <p className="text-[10px] text-[#737373] dark:text-zinc-500 text-center">
                Saved per avatar on your account
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SageProfilePanel;
