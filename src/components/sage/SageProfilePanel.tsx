import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Pencil,
  Check,
  RotateCcw,
  Volume2,
  UserCheck,
  AlertCircle,
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
      : 'bg-emerald-400';

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
  const selectedVoiceObj = voices.find((v) => v.voiceURI === voicePref.voiceURI) || resolvedDefaultVoice;
  const fullVoiceTooltip = selectedVoiceObj
    ? `${selectedVoiceObj.name} (${selectedVoiceObj.lang})`
    : 'System Default Voice';

  const rateMin = 0.6;
  const rateMax = 1.5;
  const ratePct = Math.max(0, Math.min(100, ((voicePref.rate - rateMin) / (rateMax - rateMin)) * 100));

  const pitchMin = 0.7;
  const pitchMax = 1.35;
  const pitchPct = Math.max(0, Math.min(100, ((voicePref.pitch - pitchMin) / (pitchMax - pitchMin)) * 100));

  const isRateModified = Math.abs(voicePref.rate - activeChar.voiceProfile.defaultRate) > 0.01;
  const isPitchModified = Math.abs(voicePref.pitch - activeChar.voiceProfile.defaultPitch) > 0.01;

  return (
    <div
      data-testid="sage-profile-panel-backdrop"
      className="sage-profile-backdrop fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <style>{`
        .sage-profile-drawer .sage-voice-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 9999px;
          outline: none;
        }
        .sage-profile-drawer .sage-voice-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #F4C430;
          border: 2px solid #111115;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .sage-profile-drawer .sage-voice-slider::-webkit-slider-thumb:hover {
          transform: scale(1.12);
        }
        .sage-profile-drawer .sage-voice-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          background: #F4C430;
          border: 2px solid #111115;
          box-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
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
        className="sage-profile-drawer relative w-full sm:w-[400px] max-h-[90dvh] sm:max-h-none sm:h-full bg-[#111115] text-zinc-100 border-t sm:border-t-0 sm:border-l border-zinc-800/90 rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-200"
      >
        {/* Sticky Top Bar */}
        <div className="sticky top-0 z-20 bg-[#111115]/95 backdrop-blur-md pt-3 sm:pt-4 px-5 pb-3.5 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto absolute top-2 left-1/2 -translate-x-1/2 sm:hidden" />
          <h3 className="text-sm font-extrabold tracking-tight text-white">
            Profile and Voice
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 flex items-center justify-center transition-colors cursor-pointer"
            title="Close drawer"
            aria-label="Close Profile and Voice drawer"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable Content with Bottom Padding */}
        <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8 space-y-5">
          {/* 1. Live 3D Avatar Portrait with Soft Radial Glow & Uncropped Framing */}
          <div className="flex flex-col items-center text-center bg-transparent border-0 shadow-none">
            <div className="relative flex items-center justify-center w-[184px] h-[184px] bg-transparent border-0 shadow-none">
              <div
                aria-hidden="true"
                style={{
                  background: `radial-gradient(circle, ${activeChar.accentColor}2E 0%, ${activeChar.accentColor}0D 46%, transparent 72%)`,
                }}
                className="absolute inset-0 rounded-full pointer-events-none"
              />
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
            <div className="mt-1.5 w-full max-w-xs">
              {!isEditingName ? (
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center gap-2">
                    <h2
                      data-testid="sage-profile-display-name"
                      className="text-xl font-black text-white tracking-tight"
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
                      className="p-1.5 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 text-[#F4C430] transition-colors cursor-pointer"
                      title="Rename companion"
                      aria-label="Rename companion"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>

                  {customName && customName !== activeChar.name && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-zinc-400">
                        Default: <strong className="text-zinc-300">{activeChar.name}</strong>
                      </span>
                      <button
                        type="button"
                        data-testid="sage-reset-name-btn"
                        onClick={handleResetToDefaultName}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        <RotateCcw size={10} />
                        Reset name
                      </button>
                    </div>
                  )}

                  {nameSavedFlash && (
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">
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
                      maxLength={20}
                      placeholder={activeChar.name}
                      autoFocus
                      className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm font-bold text-white focus:outline-none focus:border-[#F4C430]"
                    />
                    <button
                      type="submit"
                      data-testid="sage-rename-save-btn"
                      className="px-3 py-1.5 rounded-xl bg-[#F4C430] hover:bg-[#e5b625] text-black font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={14} />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingName(false);
                        setNameError(null);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400 px-1">
                    <span>1–20 characters</span>
                    <span>{nameInput.trim().length}/20</span>
                  </div>
                  {nameError && (
                    <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/50 rounded-lg px-2.5 py-1.5">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>{nameError}</span>
                    </div>
                  )}
                </form>
              )}
            </div>

            {/* Role Chip & Status Line */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5">
              <span
                style={{
                  color: activeChar.accentColor,
                  borderColor: `${activeChar.accentColor}45`,
                  backgroundColor: `${activeChar.accentColor}14`,
                }}
                className="px-2.5 py-0.5 rounded-full border text-[11px] font-bold tracking-wide"
              >
                {activeChar.role}
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-medium text-zinc-300">
                <span className="relative flex h-2 w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotColor}`} />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <span>{liveStatusLabel}</span>
              </span>
            </div>

            <p className="text-xs text-zinc-400 mt-2 max-w-[300px] leading-relaxed">
              {activeChar.description}
            </p>

            {/* Full-Width "Change companion" Button */}
            <button
              type="button"
              data-testid="sage-profile-change-avatar-btn"
              onClick={() => {
                onClose();
                onOpenCharacterPicker();
              }}
              className="w-full mt-4 py-2.5 px-4 rounded-xl bg-[#F4C430]/15 hover:bg-[#F4C430]/25 border border-[#F4C430]/40 text-[#F4C430] text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserCheck size={15} />
              <span>Change companion</span>
            </button>
          </div>

          {/* 2. Clean Voice Card */}
          <div className="rounded-2xl bg-[#16161C] border border-zinc-800/90 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Volume2 size={15} className="text-[#F4C430]" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-200">
                  Voice Settings
                </h4>
              </div>
              <button
                type="button"
                data-testid="sage-profile-preview-voice-btn"
                onClick={handlePreviewVoice}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F4C430] hover:bg-[#e5b625] text-black text-xs font-extrabold transition-colors cursor-pointer shrink-0"
              >
                <Volume2 size={13} />
                <span>{isPreviewingVoice ? 'Speaking...' : 'Preview voice'}</span>
              </button>
            </div>

            {/* Voice Dropdown Grouped by Language (Urdu First) */}
            <div className="space-y-1.5">
              <label
                htmlFor="sage-profile-voice-select"
                className="block text-[11px] font-semibold text-zinc-400"
              >
                Assigned voice for {displayName}
              </label>
              <select
                id="sage-profile-voice-select"
                data-testid="sage-profile-voice-select"
                value={voicePref.voiceURI || ''}
                onChange={(e) => handleVoiceChange(e.target.value)}
                title={fullVoiceTooltip}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 truncate focus:outline-none focus:border-[#F4C430]"
              >
                <option
                  value=""
                  title={
                    resolvedDefaultVoice
                      ? `Default: ${resolvedDefaultVoice.name} (${resolvedDefaultVoice.lang})`
                      : 'Auto System Default'
                  }
                >
                  Auto ({resolvedDefaultVoice ? formatShortVoiceLabel(resolvedDefaultVoice) : 'System Default'})
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
            </div>

            {/* Speed & Pitch Sliders with Gold Filled Track, Value Pill & Individual Reset Button */}
            <div className="space-y-3.5 pt-1">
              {/* Speed Slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-semibold text-zinc-300">Speed</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 font-mono text-[11px] font-bold text-[#F4C430]">
                      {voicePref.rate.toFixed(2)}x
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRateChange(activeChar.voiceProfile.defaultRate)}
                      disabled={!isRateModified}
                      title={`Reset speed to ${activeChar.voiceProfile.defaultRate.toFixed(2)}x`}
                      aria-label="Reset speed"
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
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
                  style={{
                    background: `linear-gradient(to right, #F4C430 0%, #F4C430 ${ratePct}%, #27272A ${ratePct}%, #27272A 100%)`,
                  }}
                  className="sage-voice-slider w-full cursor-pointer"
                />
              </div>

              {/* Pitch Slider */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <span className="font-semibold text-zinc-300">Pitch</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 font-mono text-[11px] font-bold text-[#F4C430]">
                      {voicePref.pitch.toFixed(2)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handlePitchChange(activeChar.voiceProfile.defaultPitch)}
                      disabled={!isPitchModified}
                      title={`Reset pitch to ${activeChar.voiceProfile.defaultPitch.toFixed(2)}`}
                      aria-label="Reset pitch"
                      className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
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
                  style={{
                    background: `linear-gradient(to right, #F4C430 0%, #F4C430 ${pitchPct}%, #27272A ${pitchPct}%, #27272A 100%)`,
                  }}
                  className="sage-voice-slider w-full cursor-pointer"
                />
              </div>
            </div>

            {/* Quiet Reset Actions & Saved Note */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleResetVoicePref}
                  className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Reset voice defaults
                </button>
                <button
                  type="button"
                  data-testid="sage-reset-companion-btn"
                  onClick={handleResetToDefaultCompanion}
                  className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  Reset to default companion
                </button>
              </div>
              <p className="text-[10px] text-zinc-500">
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
