import type { AiProvider } from '../types';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiResponse {
  content: string;
  error?: string;
}

export const DEFAULT_SYSTEM_PROMPT =
  'You are Nova, a helpful, concise assistant embedded in a productivity app. Respond clearly and briefly.';

// Configuración por proveedor de IA. Cada proveedor usa su propio
// endpoint y su propio formato de cuerpo de petición.
interface ProviderConfig {
  label: string;
  model: string;
  endpoint: string;
  buildHeaders: (apiKey: string) => Record<string, string>;
  buildBody: (turns: ChatTurn[], systemPrompt: string) => unknown;
  extractText: (json: any) => string | undefined;
}

const openaiConfig: ProviderConfig = {
  label: 'OpenAI',
  model: 'gpt-4o-mini',
  endpoint: 'https://api.openai.com/v1/chat/completions',
  buildHeaders: (apiKey) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }),
  buildBody: (turns, systemPrompt) => ({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...turns.map((c) => ({ role: c.role, content: c.content })),
    ],
  }),
  extractText: (json) => json?.choices?.[0]?.message?.content,
};

const anthropicConfig: ProviderConfig = {
  label: 'Anthropic',
  model: 'claude-3-5-haiku-latest',
  endpoint: 'https://api.anthropic.com/v1/messages',
  buildHeaders: (apiKey) => ({
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  }),
  buildBody: (turns, systemPrompt) => ({
    model: 'claude-3-5-haiku-latest',
    max_tokens: 2048,
    system: systemPrompt,
    // Anthropic no admite la parte del rol 'assistant' en system; se envían tal cual.
    messages: turns.map((c) => ({ role: c.role, content: c.content })),
  }),
  extractText: (json) => {
    if (Array.isArray(json?.content)) {
      return json.content
        .filter((b: any) => b.type === 'text')
        .map((b: any) => b.text)
        .join('\n');
    }
    return undefined;
  },
};

const geminiConfig: ProviderConfig = {
  label: 'Gemini',
  model: 'gemini-1.5-flash',
  endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
  buildHeaders: () => ({
    'Content-Type': 'application/json',
  }),
  // Gemini usa la API Key como parámetro de query, no en los headers.
  buildBody: (turns, systemPrompt) => ({
    contents: turns.map((c) => ({
      role: c.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: c.content }],
    })),
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
  }),
  extractText: (json) => {
    const parts = json?.candidates?.[0]?.content?.parts;
    if (Array.isArray(parts)) {
      return parts.map((p: any) => p.text ?? '').join('\n');
    }
    return undefined;
  },
};

// Groq usa la API compatible con OpenAI (chat completions) y añade
// también transcripción (Whisper) que se aprovecha para el dictado por voz.
const groqConfig: ProviderConfig = {
  label: 'Groq',
  model: 'llama-3.3-70b-versatile',
  endpoint: 'https://api.groq.com/openai/v1/chat/completions',
  buildHeaders: (apiKey) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }),
  buildBody: (turns, systemPrompt) => ({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      ...turns.map((c) => ({ role: c.role, content: c.content })),
    ],
  }),
  extractText: (json) => json?.choices?.[0]?.message?.content,
};

// OpenRouter agrega modelos de muchos proveedores con una sola API key.
const openrouterConfig: ProviderConfig = {
  label: 'OpenRouter',
  model: 'openrouter/auto',
  endpoint: 'https://openrouter.ai/api/v1/chat/completions',
  buildHeaders: (apiKey) => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }),
  buildBody: (turns, systemPrompt) => ({
    model: 'openrouter/auto',
    messages: [
      { role: 'system', content: systemPrompt },
      ...turns.map((c) => ({ role: c.role, content: c.content })),
    ],
  }),
  extractText: (json) => json?.choices?.[0]?.message?.content,
};

const providers: Record<AiProvider, ProviderConfig> = {
  openai: openaiConfig,
  anthropic: anthropicConfig,
  gemini: geminiConfig,
  groq: groqConfig,
  openrouter: openrouterConfig,
};

export function getProviderLabel(provider: AiProvider): string {
  return providers[provider].label;
}

// Realiza la llamada HTTP al proveedor seleccionado para obtener una respuesta.
export async function askAi(options: {
  provider: AiProvider;
  apiKey: string;
  turns: ChatTurn[];
  systemPrompt?: string;
}): Promise<AiResponse> {
  const config = providers[options.provider];
  let url = config.endpoint;
  if (options.provider === 'gemini') {
    url = `${config.endpoint}?key=${encodeURIComponent(options.apiKey)}`;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: config.buildHeaders(options.apiKey),
      body: JSON.stringify(config.buildBody(options.turns, options.systemPrompt ?? DEFAULT_SYSTEM_PROMPT)),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        content: '',
        error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json = await res.json();
    const content = config.extractText(json);

    if (!content || !content.trim()) {
      return { content: '', error: 'Empty response from provider' };
    }

    return { content: content.trim() };
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return { content: '', error: 'Request timed out' };
    }
    return { content: '', error: e?.message ?? 'Network error' };
  } finally {
    clearTimeout(timeout);
  }
}

// ---- Dictado por voz / Speech-to-Text ----

interface TranscriptionTarget {
  label: string;
  model: string;
  endpoint: string;
  // El archivo de audio de OpenAI/Groq se envía como multipart/form-data.
  formFieldName: 'file' | 'model';
  extractText: (json: any) => string;
}

const transcriptionTargets: Partial<Record<AiProvider, TranscriptionTarget>> = {
  openai: {
    label: 'OpenAI',
    model: 'whisper-1',
    endpoint: 'https://api.openai.com/v1/audio/transcriptions',
    formFieldName: 'file',
    extractText: (json) => json?.text ?? '',
  },
  groq: {
    label: 'Groq',
    model: 'whisper-large-v3',
    endpoint: 'https://api.groq.com/openai/v1/audio/transcriptions',
    formFieldName: 'file',
    extractText: (json) => json?.text ?? '',
  },
};

export function supportsTranscription(provider: AiProvider): boolean {
  return transcriptionTargets[provider] !== undefined;
}

// Envía un clip de audio grabado (uri local) al endpoint de transcripción
// del proveedor activo y devuelve el texto dictado.
export async function transcribeAudio(options: {
  provider: AiProvider;
  apiKey: string;
  uri: string;
}): Promise<AiResponse> {
  const target = transcriptionTargets[options.provider];
  if (!target) {
    return {
      content: '',
      error: `Provider ${getProviderLabel(options.provider)} does not support audio transcription`,
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const form = new FormData();
    // Los campos se declaran estrictamente porque FormData de RN es tipado.
    form.append('file', { uri: options.uri, name: 'recording.m4a', type: 'audio/m4a' } as any);
    form.append('model', target.model);

    const res = await fetch(target.endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
      },
      body: form,
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        content: '',
        error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json = await res.json();
    const text = target.extractText(json);
    if (!text || !text.trim()) {
      return { content: '', error: 'Empty transcription from provider' };
    }
    return { content: text.trim() };
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return { content: '', error: 'Transcription timed out' };
    }
    return { content: '', error: e?.message ?? 'Network error' };
  } finally {
    clearTimeout(timeout);
  }
}