/**
 * @vitest-environment happy-dom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CHAT_THEMES,
  DEFAULT_CHAT_THEME_ID,
  getChatTheme,
  getSavedChatTheme,
  saveChatTheme,
} from './chatThemes';

describe('chatThemes', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  describe('CHAT_THEMES & DEFAULT_CHAT_THEME_ID', () => {
    it('defines a non-empty array of CHAT_THEMES', () => {
      expect(Array.isArray(CHAT_THEMES)).toBe(true);
      expect(CHAT_THEMES.length).toBeGreaterThan(0);
    });

    it('has "classic-academic" as the DEFAULT_CHAT_THEME_ID', () => {
      expect(DEFAULT_CHAT_THEME_ID).toBe('classic-academic');
    });

    it('contains classic-academic and midnight-academic in CHAT_THEMES', () => {
      const ids = CHAT_THEMES.map((t) => t.id);
      expect(ids).toContain('classic-academic');
      expect(ids).toContain('midnight-academic');
    });
  });

  describe('getChatTheme', () => {
    it('returns the requested theme object when valid themeId is provided', () => {
      const theme = getChatTheme('midnight-academic');
      expect(theme).toBeDefined();
      expect(theme.id).toBe('midnight-academic');
      expect(theme.name).toBe('Midnight Academic');
    });

    it('returns default CHAT_THEMES[0] when themeId is undefined', () => {
      const theme = getChatTheme(undefined);
      expect(theme).toBe(CHAT_THEMES[0]);
      expect(theme.id).toBe('classic-academic');
    });

    it('returns default CHAT_THEMES[0] when themeId is invalid or not found', () => {
      const theme = getChatTheme('unknown-theme-xyz');
      expect(theme).toBe(CHAT_THEMES[0]);
      expect(theme.id).toBe('classic-academic');
    });
  });

  describe('getSavedChatTheme', () => {
    it('returns thread-specific saved theme if present and valid', () => {
      localStorage.setItem('scholario_chat_theme_thread-100', 'botanical-sage');
      const result = getSavedChatTheme('thread-100');
      expect(result).toBe('botanical-sage');
    });

    it('falls back to global theme if thread-specific theme is missing', () => {
      localStorage.setItem('scholario_chat_theme_default', 'nordic-dawn');
      const result = getSavedChatTheme('thread-200');
      expect(result).toBe('nordic-dawn');
    });

    it('falls back to global theme if thread-specific theme ID is invalid', () => {
      localStorage.setItem('scholario_chat_theme_thread-300', 'invalid-theme-id');
      localStorage.setItem('scholario_chat_theme_default', 'warm-sand');
      const result = getSavedChatTheme('thread-300');
      expect(result).toBe('warm-sand');
    });

    it('returns global default theme when no threadId is supplied', () => {
      localStorage.setItem('scholario_chat_theme_default', 'graphite-studio');
      const result = getSavedChatTheme();
      expect(result).toBe('graphite-studio');
    });

    it('falls back to midnight-academic if no saved theme and document root has "dark" class', () => {
      document.documentElement.classList.add('dark');
      const result = getSavedChatTheme();
      expect(result).toBe('midnight-academic');
    });

    it('falls back to midnight-academic for a thread if no saved themes and dark mode is active', () => {
      document.documentElement.classList.add('dark');
      const result = getSavedChatTheme('thread-400');
      expect(result).toBe('midnight-academic');
    });

    it('falls back to DEFAULT_CHAT_THEME_ID (classic-academic) when no saved themes and dark mode is inactive', () => {
      const result = getSavedChatTheme();
      expect(result).toBe('classic-academic');
    });

    it('ignores invalid global default theme ID and checks dark mode / default fallback', () => {
      localStorage.setItem('scholario_chat_theme_default', 'non-existent-theme');
      expect(getSavedChatTheme()).toBe('classic-academic');

      document.documentElement.classList.add('dark');
      expect(getSavedChatTheme()).toBe('midnight-academic');
    });

    it('handles localStorage exceptions gracefully and returns DEFAULT_CHAT_THEME_ID', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: Access is denied');
      });

      const result = getSavedChatTheme('thread-500');
      expect(result).toBe('classic-academic');
    });
  });

  describe('saveChatTheme', () => {
    it('saves global theme default when threadId is omitted', () => {
      saveChatTheme('emerald-night');
      expect(localStorage.getItem('scholario_chat_theme_default')).toBe('emerald-night');
    });

    it('saves both per-thread theme and global default theme when threadId is provided', () => {
      saveChatTheme('royal-indigo', 'thread-abc');
      expect(localStorage.getItem('scholario_chat_theme_thread-abc')).toBe('royal-indigo');
      expect(localStorage.getItem('scholario_chat_theme_default')).toBe('royal-indigo');
    });

    it('allows retrieving the saved theme via getSavedChatTheme after saving', () => {
      saveChatTheme('soft-slate', 'thread-xyz');
      expect(getSavedChatTheme('thread-xyz')).toBe('soft-slate');

      saveChatTheme('sunset-glow');
      expect(getSavedChatTheme('other-thread')).toBe('sunset-glow');
    });

    it('handles localStorage write exceptions gracefully without throwing', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => saveChatTheme('rose-quartz', 'thread-error')).not.toThrow();
    });
  });
});
