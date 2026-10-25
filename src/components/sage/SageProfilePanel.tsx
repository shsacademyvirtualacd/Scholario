import React, { useEffect, useState } from 'react';
import {
  X,
  Pencil,
  Check,
  RotateCcw,
  Sparkles,
  Volume2,
  Sliders,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import {
  Sage3DAvatarState,
  SageCharacterId,
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
  onOpenCharacterPicker: () => void;
  onVoicePrefChanged?: () => void;
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

  const handleResetToDefault = () => {
    onResetName();
    setNameInput(activeChar.name);
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

  return (
    <div
      data-testid="sage-profile-panel-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-stretch sm:justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <aside
        data-testid="sage-profile-panel"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full sm:w-[410px] max-h-[88dvh] sm:max-h-none sm:h-full bg-[#111115] text-zinc-100 border-t sm:border-t-0 sm:border-l border-zinc-800/90 rounded-t-3xl sm:rounded-none shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-right duration-200"
      >
        {/* Top Drawer Handle on Mobile + Header */}
        <div className="pt-2.5 sm:pt-4 px-5 pb-3 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <div className="w-10 h-1 rounded-full bg-zinc-700 mx-auto absolute top-2 left-1/2 -translate-x-1/2 sm:hidden" />
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#F4C430]" />
            <h3 className="text-sm font-extrabold tracking-tight text-white uppercase">
              Companion Profile & Voice
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close Profile Panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 1. Large Frameless Live-Animated 3D Portrait (NO WHITE SHEET) */}
          <div className="flex flex-col items-center text-center bg-transparent border-0 shadow-none">
            <div className="relative flex items-center justify-center bg-transparent border-0 shadow-none">
              <Sage3DAvatar
                state={isPreviewingVoice ? 'speaking' : avatarState}
                characterId={characterId}
                customName={displayName}
                audioLevel={isPreviewingVoice ? previewAudioLevel : audioLevel}
                sizeClassName="w-[164px] h-[164px]"
                chromeless={true}
                onPoke={() => setPokeCount((c) => c + 1)}
                pokeCount={pokeCount}
              />
            </div>

            {/* Live Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-[11px] font-semibold text-zinc-300 mt-1">
              <span className="relative flex h-2 w-2">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusDotColor}`} />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>{liveStatusLabel}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-[#F4C430] font-bold">{activeChar.subtitle}</span>
            </div>

            {/* Name & Inline Rename Editor */}
            <div className="mt-3 w-full max-w-xs">
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
                      title="Rename your Sage companion"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>

                  {customName && customName !== activeChar.name && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-zinc-400">
                        Default character: <strong className="text-zinc-300">{activeChar.name}</strong>
                      </span>
                      <button
                        type="button"
                        data-testid="sage-reset-name-btn"
                        onClick={handleResetToDefault}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        <RotateCcw size={10} />
                        Reset name to default
                      </button>
                    </div>
                  )}

                  {nameSavedFlash && (
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                      Name updated across Scholario!
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
                    <span>1–20 characters • Shows in chat, bubbles & PDFs</span>
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

            <p className="text-xs text-zinc-400 mt-2 max-w-[290px] leading-relaxed">
              {activeChar.description}
            </p>

            {/* Change Avatar Button */}
            <div className="flex items-center gap-2 mt-3.5">
              <button
                type="button"
                data-testid="sage-profile-change-avatar-btn"
                onClick={() => {
                  onClose();
                  onOpenCharacterPicker();
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F4C430]/15 hover:bg-[#F4C430]/25 border border-[#F4C430]/40 text-[#F4C430] text-xs font-bold transition-all cursor-pointer"
              >
                <UserCheck size={14} />
                Change Avatar (9 Companions)
              </button>
            </div>
          </div>

          {/* 2. Permanent Voice & Speech Tuning Section (Task 2) */}
          <div className="rounded-2xl bg-zinc-900/75 border border-zinc-800/90 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 size={15} className="text-[#F4C430]" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-zinc-200">
                  Voice & Speech Settings
                </h4>
              </div>
              <button
                type="button"
                data-testid="sage-profile-preview-voice-btn"
                onClick={handlePreviewVoice}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F4C430] hover:bg-[#e5b625] text-black text-xs font-extrabold transition-colors cursor-pointer"
              >
                <Volume2 size={13} />
                {isPreviewingVoice ? 'Speaking...' : 'Preview Voice'}
              </button>
            </div>

            {/* Voice Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-zinc-400">
                Assigned Voice for {displayName}
              </label>
              <select
                data-testid="sage-profile-voice-select"
                value={voicePref.voiceURI || ''}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-medium text-zinc-100 focus:outline-none focus:border-[#F4C430]"
              >
                <option value="">
                  Auto Default ({resolvedDefaultVoice ? `${resolvedDefaultVoice.name} (${resolvedDefaultVoice.lang})` : 'System Default'})
                </option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-zinc-500">
                Deterministically locked to {displayName}. Urdu text automatically uses an Urdu voice when installed.
              </p>
            </div>

            {/* Speed & Pitch Sliders */}
            <div className="grid grid-cols-1 gap-3 pt-1">
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1">
                    <Sliders size={11} className="text-zinc-400" />
                    Speaking Speed
                  </span>
                  <span className="font-mono font-bold text-[#F4C430]">
                    {voicePref.rate.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  data-testid="sage-profile-rate-slider"
                  min={0.6}
                  max={1.5}
                  step={0.05}
                  value={voicePref.rate}
                  onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                  className="w-full accent-[#F4C430] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1">
                    <Sliders size={11} className="text-zinc-400" />
                    Voice Pitch
                  </span>
                  <span className="font-mono font-bold text-[#F4C430]">
                    {voicePref.pitch.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  data-testid="sage-profile-pitch-slider"
                  min={0.7}
                  max={1.35}
                  step={0.03}
                  value={voicePref.pitch}
                  onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                  className="w-full accent-[#F4C430] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-zinc-800/80">
              <span className="text-[10px] text-zinc-500">
                Saved per avatar on your account
              </span>
              <button
                type="button"
                onClick={handleResetVoicePref}
                className="text-[11px] font-semibold text-zinc-400 hover:text-white underline cursor-pointer"
              >
                Reset voice defaults
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default SageProfilePanel;
