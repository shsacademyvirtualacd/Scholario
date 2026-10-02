// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getChatTheme,
  getSavedChatTheme,
  saveChatTheme,
  CHAT_THEMES,
  DEFAULT_CHAT_THEME_ID,
} from '../chatThemes';

describe('chatThemes', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getChatTheme', () => {
    it('returns the theme object matching the given valid themeId', () => {
      const theme = getChatTheme('midnight-academic');
      expect(theme.id).toBe('midnight-academic');
      expect(theme.name).toBe('Midnight Academic');
    });

    it('returns the default first theme when themeId is undefined or unknown', () => {
      expect(getChatTheme(undefined).id).toBe(CHAT_THEMES[0].id);
      expect(getChatTheme('non-existent-theme').id).toBe(CHAT_THEMES[0].id);
    });
  });

  describe('getSavedChatTheme', () => {
    it('returns per-thread saved theme when valid threadId and valid theme exist in localStorage', () => {
      localStorage.setItem('scholario_chat_theme_thread_123', 'royal-indigo');
      const themeId = getSavedChatTheme('thread_123');
      expect(themeId).toBe('royal-indigo');
    });

    it('falls back to global default theme if per-thread theme is invalid or not set', () => {
      localStorage.setItem('scholario_chat_theme_thread_123', 'invalid-theme-id');
      localStorage.setItem('scholario_chat_theme_default', 'nordic-dawn');

      const themeId = getSavedChatTheme('thread_123');
      expect(themeId).toBe('nordic-dawn');
    });

    it('returns global default saved theme when no threadId is passed', () => {
      localStorage.setItem('scholario_chat_theme_default', 'botanical-sage');
      const themeId = getSavedChatTheme();
      expect(themeId).toBe('botanical-sage');
    });

    it('falls back to midnight-academic when dark mode is enabled and no saved theme exists', () => {
      document.documentElement.classList.add('dark');
      const themeId = getSavedChatTheme();
      expect(themeId).toBe('midnight-academic');
    });

    it('returns DEFAULT_CHAT_THEME_ID when no saved theme exists and document is not dark mode', () => {
      const themeId = getSavedChatTheme();
      expect(themeId).toBe(DEFAULT_CHAT_THEME_ID);
    });

    it('catches localStorage access errors (e.g. restricted privacy mode) and safely returns DEFAULT_CHAT_THEME_ID', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new DOMException('Permission denied to access localStorage', 'SecurityError');
      });

      const themeId = getSavedChatTheme('thread_999');
      expect(themeId).toBe(DEFAULT_CHAT_THEME_ID);
    });
  });

  describe('saveChatTheme', () => {
    it('saves both thread-specific and default theme when threadId is provided', () => {
      saveChatTheme('rose-quartz', 'thread_456');

      expect(localStorage.getItem('scholario_chat_theme_thread_456')).toBe('rose-quartz');
      expect(localStorage.getItem('scholario_chat_theme_default')).toBe('rose-quartz');
    });

    it('saves default theme when threadId is omitted', () => {
      saveChatTheme('emerald-night');

      expect(localStorage.getItem('scholario_chat_theme_default')).toBe('emerald-night');
    });

    it('handles localStorage errors gracefully when setItem throws', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => saveChatTheme('sunset-glow', 'thread_123')).not.toThrow();
    });
  });
});
