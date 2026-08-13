import type { AiProvider } from '../types';

// Claves i18n para mostrar el nombre de cada proveedor de IA.
export const PROVIDER_KEYS: Record<AiProvider, string> = {
  openai: 'providerOpenAI',
  anthropic: 'providerAnthropic',
  gemini: 'providerGemini',
  groq: 'providerGroq',
  openrouter: 'providerOpenRouter',
};