export type ChatThemeType = 'doodle' | 'solid' | 'gradient';

export interface ChatTheme {
  id: string;
  name: string;
  description: string;
  type: ChatThemeType;
  category: 'light' | 'dark' | 'accent';
  background: string;
  textColor: string;
  hasDoodlePattern?: boolean;
  doodleColor?: string;
  doodleOpacity?: number;
  sentBubbleBg: string;
  sentBubbleText: string;
  sentMetaText: string;
  receivedBubbleBg: string;
  receivedBubbleText: string;
  receivedMetaText: string;
  accentColor: string;
  isDarkTheme?: boolean;
}
