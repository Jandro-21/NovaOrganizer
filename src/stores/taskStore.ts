import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Category, Subcategory, Task } from '../types';
import { BOARD_PALETTE } from '../theme/colors';
import { uid } from '../utils/id';

export interface TasksState {
  tasks: Task[];
  categories: Category[];
  subcategories: Subcategory[];
  addTask: (input: {
    title: string;
    notes?: string;
    dueAt?: number;
    notificationId?: string;
    categoryId?: string;
    subcategoryId?: string;
  }) => Task;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  clearCompleted: () => void;
  addCategory: (input: { name: string; color?: string }) => Category;
  updateCategory: (id: string, patch: Partial<Pick<Category, 'name' | 'color'>>) => void;
  removeCategory: (id: string) => void;
  addSubcategory: (input: { categoryId: string; name: string }) => Subcategory;
  updateSubcategory: (id: string, patch: Partial<Pick<Subcategory, 'name'>>) => void;
  removeSubcategory: (id: string) => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      categories: [],
      subcategories: [],

      addTask: ({ title, notes = '', dueAt, notificationId, categoryId, subcategoryId }) => {
        const task: Task = {
          id: uid(),
          title: title.trim(),
          notes,
          completed: false,
          dueAt,
          notificationId,
          categoryId,
          subcategoryId,
          createdAt: Date.now(),
        };
        set({ tasks: [task, ...get().tasks] });
        return task;
      },

      updateTask: (id, patch) =>
        set({
          tasks: get().tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }),

      toggleTask: (id) =>
        set({
          tasks: get().tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t,
          ),
        }),

      removeTask: (id) =>
        set({ tasks: get().tasks.filter((t) => t.id !== id) }),

      clearCompleted: () =>
        set({ tasks: get().tasks.filter((t) => !t.completed) }),

      addCategory: ({ name, color }) => {
        const category: Category = {
          id: uid(),
          name: name.trim(),
          color: color ?? BOARD_PALETTE[get().categories.length % BOARD_PALETTE.length],
          createdAt: Date.now(),
        };
        set({ categories: [...get().categories, category] });
        return category;
      },

      updateCategory: (id, patch) =>
        set({
          categories: get().categories.map((c) =>
            c.id === id
              ? {
                  ...c,
                  name: patch.name && !patch.name.trim() ? c.name : patch.name?.trim() ?? c.name,
                  color: patch.color ?? c.color,
                }
              : c,
          ),
        }),

      removeCategory: (id) => {
        const current = get();
        const subIds = current.subcategories
          .filter((s) => s.categoryId === id)
          .map((s) => s.id);
        set({
          categories: current.categories.filter((c) => c.id !== id),
          subcategories: current.subcategories.filter((s) => s.categoryId !== id),
          tasks: current.tasks.map((t) =>
            t.categoryId === id
              ? { ...t, categoryId: undefined, subcategoryId: undefined }
              : t,
          ),
        });
        return subIds;
      },

      addSubcategory: ({ categoryId, name }) => {
        const subcategory: Subcategory = {
          id: uid(),
          categoryId,
          name: name.trim(),
          createdAt: Date.now(),
        };
        set({ subcategories: [...get().subcategories, subcategory] });
        return subcategory;
      },

      updateSubcategory: (id, patch) =>
        set({
          subcategories: get().subcategories.map((s) =>
            s.id === id
              ? {
                  ...s,
                  name: patch.name && !patch.name.trim() ? s.name : patch.name?.trim() ?? s.name,
                }
              : s,
          ),
        }),

      removeSubcategory: (id) => {
        const current = get();
        set({
          subcategories: current.subcategories.filter((s) => s.id !== id),
          tasks: current.tasks.map((t) =>
            t.subcategoryId === id ? { ...t, subcategoryId: undefined } : t,
          ),
        });
      },
    }),
    {
      name: 'nova-tasks',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
