export type ThemeMode = 'light' | 'dark' | 'system';
export type AppLanguage = 'en' | 'es';
export type AiProvider = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'openrouter';

export const AI_PROVIDER_ORDER: AiProvider[] = [
  'openai',
  'anthropic',
  'gemini',
  'groq',
  'openrouter',
];

export interface Task {
  id: string;
  title: string;
  notes: string;
  completed: boolean;
  dueAt?: number;
  notificationId?: string;
  categoryId?: string;
  subcategoryId?: string;
  createdAt: number;
}

// Categoría personalizable para agrupar tareas (con su propio color).
export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// Subcategoría vinculada siempre a una categoría padre.
export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  createdAt: number;
}

export interface BoardNote {
  id: string;
  text: string;
  x: number;
  y: number;
  size: NoteSize;
  color: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
}

// Una conversación con historial propio. El chat ya no es de un solo uso:
// cada sesión guarda sus mensajes y puede reanudarse desde la lista.
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// Alarma programada con notificación local (mensaje + fecha/hora específicas).
export interface Alarm {
  id: string;
  message: string;
  date: number; // timestamp (ms)
  notificationId?: string;
  createdAt: number;
}

export interface NoteStyle {
  width: number;
  height: number;
  fontSize: number;
}

export type NoteSize = 'small' | 'medium' | 'large';

export const NOTE_SIZE_ORDER: NoteSize[] = ['small', 'medium', 'large'];

export const BOARD_NOTE_SIZES: Record<NoteSize, NoteStyle> = {
  small: { width: 140, height: 140, fontSize: 14 },
  medium: { width: 170, height: 170, fontSize: 15 },
  large: { width: 210, height: 210, fontSize: 16 },
};