import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Alarm } from '../types';
import { uid } from '../utils/id';

export interface AlarmsState {
  alarms: Alarm[];
  addAlarm: (input: { message: string; date: number; notificationId?: string }) => Alarm;
  updateAlarm: (id: string, patch: Partial<Alarm>) => void;
  removeAlarm: (id: string) => void;
  clearAlarms: () => void;
}

export const useAlarmsStore = create<AlarmsState>()(
  persist(
    (set, get) => ({
      alarms: [],

      addAlarm: ({ message, date, notificationId }) => {
        const alarm: Alarm = {
          id: uid(),
          message: message.trim(),
          date,
          notificationId,
          createdAt: Date.now(),
        };
        set({ alarms: [...get().alarms, alarm] });
        return alarm;
      },

      updateAlarm: (id, patch) =>
        set({
          alarms: get().alarms.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        }),

      removeAlarm: (id) =>
        set({ alarms: get().alarms.filter((a) => a.id !== id) }),

      clearAlarms: () => set({ alarms: [] }),
    }),
    {
      name: 'nova-alarms',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);