import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/settingsStore';
import { darkTheme, lightTheme } from './colors';
import type { Theme } from './types';

// Resuelve el tema activo combinando la preferencia guardada
// con el esquema de color del sistema (light / dark).
export function useTheme(): Theme {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const system = useColorScheme();
  if (themeMode === 'dark') return darkTheme;
  if (themeMode === 'light') return lightTheme;
  return system === 'dark' ? darkTheme : lightTheme;
}