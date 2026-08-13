import type { Theme } from './types';

export const BOARD_PALETTE = [
  '#FFD166',
  '#9BE8A8',
  '#8ECDFB',
  '#F8A5B8',
  '#FFB77C',
  '#C9A8F5',
];

export const lightTheme: Theme = {
  dark: false,
  colors: {
    background: '#F5F6F8',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F4',
    primary: '#5A67D8',
    onPrimary: '#FFFFFF',
    text: '#1A1D26',
    textMuted: '#8A919F',
    border: '#E3E6EB',
    danger: '#E0454B',
    success: '#2FA36B',
    card: '#FFFFFF',
    tabBar: '#FFFFFF',
  },
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    background: '#12141B',
    surface: '#1B1E27',
    surfaceAlt: '#232833',
    primary: '#8490F0',
    onPrimary: '#12141B',
    text: '#F1F2F5',
    textMuted: '#8B92A1',
    border: '#2A2E3A',
    danger: '#F26264',
    success: '#42BC84',
    card: '#1B1E27',
    tabBar: '#1B1E27',
  },
};