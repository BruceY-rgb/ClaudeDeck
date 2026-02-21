import { create } from 'zustand'
import type { InstalledPlugin } from '@shared/types/plugin'

// Types for plugin detail
interface PluginDetail {
  manifest: { name: string; version: string; description: string } | null
  agents: unknown[]
  skills: unknown[]
  commands: unknown[]
  hooks: unknown[]
}

interface PluginStore {
  items: InstalledPlugin[]
  loading: boolean
  fetch: () => Promise<void>
  toggle: (id: string, enabled: boolean) => Promise<void>
  getDetail: (id: string) => Promise<PluginDetail | null>
  uninstall: (id: string) => Promise<void>
}

export const usePluginStore = create<PluginStore>((set) => ({
  items: [],
  loading: false,
  async fetch() {
    if (!window.electronAPI) return
    set({ loading: true })
    try {
      const plugins = await window.electronAPI.plugins.list()
      set({ items: plugins })
    } finally {
      set({ loading: false })
    }
  },
  async toggle(id: string, enabled: boolean) {
    if (enabled) {
      await window.electronAPI.plugins.enable(id)
    } else {
      await window.electronAPI.plugins.disable(id)
    }
    set(state => ({
      items: state.items.map(p => p.id === id ? { ...p, enabled } : p)
    }))
  },
  async getDetail(id: string) {
    return await window.electronAPI.plugins.detail(id)
  },
  async uninstall(id: string) {
    await window.electronAPI.plugins.uninstall(id)
  }
}))
