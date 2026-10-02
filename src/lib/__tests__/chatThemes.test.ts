import { describe, it, expect } from 'vitest';
import { getChatTheme, CHAT_THEMES } from '../chatThemes';

describe('getChatTheme', () => {
  it('should return the default theme (CHAT_THEMES[0]) when themeId is undefined', () => {
    const theme = getChatTheme();
    expect(theme).toEqual(CHAT_THEMES[0]);
  });

  it('should return the default theme (CHAT_THEMES[0]) when themeId is an empty string', () => {
    const theme = getChatTheme('');
    expect(theme).toEqual(CHAT_THEMES[0]);
  });

  it('should return the default theme (CHAT_THEMES[0]) when themeId does not match any existing theme', () => {
    const theme = getChatTheme('non-existent-theme-id');
    expect(theme).toEqual(CHAT_THEMES[0]);
  });

  it('should return the correct ChatTheme when a valid themeId is provided', () => {
    const validTheme = CHAT_THEMES[1]; // 'midnight-academic'
    const theme = getChatTheme(validTheme.id);
    expect(theme).toEqual(validTheme);
    expect(theme.id).toBe('midnight-academic');
  });

  it('should return classic-academic theme when "classic-academic" themeId is provided', () => {
    const theme = getChatTheme('classic-academic');
    expect(theme).toEqual(CHAT_THEMES[0]);
    expect(theme.id).toBe('classic-academic');
  });
});
