import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Settings } from "@shared/types/settings";
import type { ProviderDescriptor, ProviderId } from "@shared/types/provider";

const FALLBACK_PROVIDERS: ProviderDescriptor[] = [
  {
    id: "claude",
    label: "Claude Code",
    command: "claude",
    homeDir: "~/.claude",
    configPath: "~/.claude/settings.json",
    configFormat: "mixed",
    capabilities: ["agents", "skills", "plugins", "commands", "hooks", "mcp", "sessions", "analytics", "projectConfig", "marketplace"],
    available: true,
  },
  {
    id: "codex",
    label: "Codex",
    command: "codex",
    homeDir: "~/.codex",
    configPath: "~/.codex/config.toml",
    configFormat: "toml",
    capabilities: ["skills", "plugins", "sessions"],
    available: true,
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    command: "gemini",
    homeDir: "~/.gemini",
    configPath: "~/.gemini/settings.json",
    configFormat: "json",
    capabilities: ["sessions"],
    available: true,
  },
];

function isMissingProviderHandler(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.message.includes("No handler registered for 'providers:list'")
  );
}

interface SettingsStore {
  settings: Settings | null;
  providers: ProviderDescriptor[];
  loading: boolean;
  sidebarCollapsed: boolean;
  fetch: () => Promise<void>;
  save: (settings: Settings) => Promise<void>;
  setSettings: (settings: Settings) => void;
  setActiveProvider: (providerId: ProviderId) => Promise<void>;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: null,
      providers: [],
      loading: false,
      sidebarCollapsed: false,
      async fetch() {
        if (!window.electronAPI) return;
        set({ loading: true });
        try {
          const settings = await window.electronAPI.settings.read();
          let providers: ProviderDescriptor[] = FALLBACK_PROVIDERS;

          try {
            providers = await window.electronAPI.providers.list();
          } catch (error) {
            if (!isMissingProviderHandler(error)) {
              throw error;
            }
            console.warn(
              "[settingsStore] providers:list unavailable in the running main process. Falling back to static provider metadata. Restart the Electron dev process to pick up new IPC handlers.",
            );
          }

          set({ settings, providers });
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
      async setActiveProvider(providerId: ProviderId) {
        try {
          await window.electronAPI.providers.setActive(providerId);
          const [settings, providers] = await Promise.all([
            window.electronAPI.settings.read(),
            window.electronAPI.providers.list(),
          ]);
          set({ settings, providers });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("No handler registered for 'providers:set-active'")
          ) {
            console.warn(
              "[settingsStore] providers:set-active unavailable in the running main process. Restart the Electron dev process before switching providers.",
            );
            const settings = await window.electronAPI.settings.read();
            set({ settings, providers: FALLBACK_PROVIDERS });
            return;
          }
          throw error;
        }
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
