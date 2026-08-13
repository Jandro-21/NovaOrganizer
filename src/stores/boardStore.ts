import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { BoardNote, NoteSize } from '../types';
import { uid } from '../utils/id';

export const BOARD_SIZE = { width: 1200, height: 2200 };

export interface BoardState {
  notes: BoardNote[];
  addNote: (input: { x: number; y: number; text: string; color: string; size?: NoteSize }) => void;
  moveNote: (id: string, x: number, y: number) => void;
  updateNote: (id: string, patch: Partial<Pick<BoardNote, 'text' | 'color' | 'size'>>) => void;
  removeNote: (id: string) => void;
  clearBoard: () => void;
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: ({ x, y, text, color, size = 'medium' }) => {
        const note: BoardNote = {
          id: uid(),
          text: text.trim() || 'New idea',
          x,
          y,
          size,
          color,
          createdAt: Date.now(),
        };
        set({ notes: [...get().notes, note] });
      },

      moveNote: (id, x, y) =>
        set({
          notes: get().notes.map((n) =>
            n.id === id ? { ...n, x: Math.round(x), y: Math.round(y) } : n,
          ),
        }),

      updateNote: (id, patch) =>
        set({
          notes: get().notes.map((n) =>
            n.id === id
              ? {
                  ...n,
                  ...patch,
                  text: patch.text && !patch.text.trim() ? n.text : patch.text?.trim() ?? n.text,
                }
              : n,
          ),
        }),

      removeNote: (id) =>
        set({ notes: get().notes.filter((n) => n.id !== id) }),

      clearBoard: () => set({ notes: [] }),
    }),
    {
      name: 'nova-board',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);