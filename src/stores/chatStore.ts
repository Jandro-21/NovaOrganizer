import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ChatMessage, ChatSession } from '../types';
import { uid } from '../utils/id';

// Contexto enviado al modelo: se conserva TODO el historial en la sesión,
// pero para la llamada HTTP se limita a los últimos N mensajes.
const MAX_CONTEXT = 20;

function createSession(messages: ChatMessage[] = []): ChatSession {
  const now = Date.now();
  return {
    id: uid(),
    title: 'New conversation',
    messages,
    createdAt: now,
    updatedAt: now,
  };
}

// Título automático a partir del primer mensaje del usuario.
function titleFor(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user');
  const text = first?.content.trim() ?? '';
  if (!text) return 'New conversation';
  return text.length > 36 ? `${text.slice(0, 36)}…` : text;
}

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;
  isPending: boolean;
  error: string | null;
  startNewSession: () => string;
  setActiveSession: (id: string) => void;
  deleteSession: (id: string) => void;
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  setPending: (value: boolean) => void;
  setError: (message: string | null) => void;
  clearActiveSession: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      isPending: false,
      error: null,

      startNewSession: () => {
        const session = createSession();
        set({
          sessions: [session, ...get().sessions],
          activeSessionId: session.id,
          error: null,
        });
        return session.id;
      },

      setActiveSession: (id) =>
        set({ activeSessionId: id, error: null }),

      deleteSession: (id) => {
        const current = get();
        const sessions = current.sessions.filter((s) => s.id !== id);
        let activeSessionId = current.activeSessionId;
        if (activeSessionId === id) {
          activeSessionId = sessions[0]?.id ?? null;
        }
        set({ sessions, activeSessionId, error: null });
      },

      addUserMessage: (content) => {
        const input = content.trim();
        if (!input) return;
        const current = get();
        if (!current.activeSessionId) {
          current.startNewSession();
        }
        const msg: ChatMessage = {
          id: uid(),
          role: 'user',
          content: input,
          createdAt: Date.now(),
        };
        const sessions = current.sessions.map((s) => {
          if (s.id !== current.activeSessionId) return s;
          const messages = [...s.messages, msg];
          return {
            ...s,
            messages,
            // El título se autogenera con el primer mensaje del usuario.
            title: titleFor(messages),
            updatedAt: Date.now(),
          };
        });
        // Mueve la sesión activa al principio de la lista (más reciente).
        const active = sessions.find((s) => s.id === current.activeSessionId);
        const rest = sessions.filter((s) => s.id !== current.activeSessionId);
        set({ sessions: active ? [active, ...rest] : sessions, error: null });
      },

      addAssistantMessage: (content) => {
        const current = get();
        const msg: ChatMessage = {
          id: uid(),
          role: 'assistant',
          content,
          createdAt: Date.now(),
        };
        const sessions = current.sessions.map((s) =>
          s.id === current.activeSessionId
            ? { ...s, messages: [...s.messages, msg], updatedAt: Date.now() }
            : s,
        );
        set({ sessions });
      },

      setPending: (value) => set({ isPending: value }),
      setError: (message) => set({ error: message }),

      clearActiveSession: () => {
        const current = get();
        if (!current.activeSessionId) return;
        set({
          sessions: current.sessions.map((s) =>
            s.id === current.activeSessionId ? { ...s, messages: [] } : s,
          ),
          error: null,
        });
      },
    }),
    {
      name: 'nova-chat',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      // Migración: antes solo existía `messages` (una única conversación).
      // Se convierte en la primera sesión para no perder el historial.
      migrate: (persisted: any) => {
        if (persisted && Array.isArray(persisted.messages) && !Array.isArray(persisted.sessions)) {
          const session = createSession(persisted.messages as ChatMessage[]);
          session.title = titleFor(persisted.messages as ChatMessage[]);
          return {
            ...persisted,
            sessions: [session],
            activeSessionId: session.id,
          };
        }
        return persisted;
      },
    },
  ),
);

// Mensajes de la sesión activa (para render + contexto del modelo).
export function selectActiveMessages(state: ChatState): ChatMessage[] {
  const session = state.sessions.find((s) => s.id === state.activeSessionId);
  return session?.messages ?? [];
}