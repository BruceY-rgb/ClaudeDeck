import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings } from "@shared/types/settings";

interface SettingsStore {
  settings: Settings | null;
  loading: boolean;
  sidebarCollapsed: boolean;
  fetch: () => Promise<void>;
  save: (settings: Settings) => Promise<void>;
  setSettings: (settings: Settings) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: null,
      loading: false,
      sidebarCollapsed: false,
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
      toggleSidebar() {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      setSidebarCollapsed(collapsed: boolean) {
        set({ sidebarCollapsed: collapsed });
      },
    }),
    {
      name: "settings-store",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
