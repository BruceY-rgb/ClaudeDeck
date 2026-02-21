import { create } from "zustand";
import type { Settings } from "@shared/types/settings";

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  fetch: () => Promise<void>;
  save: (settings: Settings) => Promise<void>;
  setSettings: (settings: Settings) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  loading: false,
  async fetch() {
    if (!window.electronAPI) return;
    set({ loading: true });
    try {
      const settings = await window.electronAPI.settings.read();
      set({ settings });
    } finally {
      set({ loading: false });
    }
  },
  async save(settings: Settings) {
    await window.electronAPI.settings.write(settings);
    set({ settings });
  },
  setSettings(settings: Settings) {
    set({ settings });
  },
}));
