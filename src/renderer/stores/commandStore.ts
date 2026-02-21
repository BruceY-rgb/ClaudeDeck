import { create } from 'zustand'
import type { Command } from '@shared/types/command'

interface CommandStore {
  items: Command[]
  loading: boolean
  fetch: () => Promise<void>
  read: (pluginId: string, name: string) => Promise<Command | null>
}

export const useCommandStore = create<CommandStore>((set) => ({
  items: [],
  loading: false,
  async fetch() {
    if (!window.electronAPI) return
    set({ loading: true })
    try {
      const commands = await window.electronAPI.commands.list()
      set({ items: commands })
    } finally {
      set({ loading: false })
    }
  },
  async read(pluginId: string, name: string) {
    return await window.electronAPI.commands.read(pluginId, name)
  }
}))
