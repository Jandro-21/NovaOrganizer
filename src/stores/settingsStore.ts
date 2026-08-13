import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AiProvider, AppLanguage, ThemeMode } from '../types';

const API_KEY_STORAGE = 'nova_api_key';

export interface SettingsState {
  themeMode: ThemeMode;
  language: AppLanguage;
  provider: AiProvider;
  apiKey: string;
  hasHydrated: boolean;
  setThemeMode: (themeMode: ThemeMode) => void;
  setLanguage: (language: AppLanguage) => void;
  setProvider: (provider: AiProvider) => void;
  loadApiKey: () => Promise<void>;
  saveApiKey: (apiKey: string) => Promise<void>;
  deleteApiKey: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      language: 'en',
      provider: 'openai',
      apiKey: '',
      hasHydrated: false,

      setThemeMode: (themeMode) => set({ themeMode }),
      setLanguage: (language) => set({ language }),

      setProvider: (provider) => set({ provider }),

      // La API Key se guarda en el SecureStore del dispositivo
      // y NO en AsyncStorage para evitar exponerla en texto plano.
      loadApiKey: async () => {
        try {
          const stored = await SecureStore.getItemAsync(API_KEY_STORAGE);
          if (stored) {
            set({ apiKey: stored });
          }
        } catch (e) {
          console.warn('No se pudo leer la API Key', e);
        }
      },

      saveApiKey: async (apiKey) => {
        await SecureStore.setItemAsync(API_KEY_STORAGE, apiKey.trim());
        set({ apiKey: apiKey.trim() });
      },

      deleteApiKey: async () => {
        await SecureStore.deleteItemAsync(API_KEY_STORAGE);
        set({ apiKey: '' });
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'nova-settings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        themeMode: s.themeMode,
        language: s.language,
        provider: s.provider,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
        }
      },
    },
  ),
);

export { API_KEY_STORAGE };