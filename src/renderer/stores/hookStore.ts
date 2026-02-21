import { create } from 'zustand'
import type { HookDefinition } from '@shared/types/hook'

interface HookStore {
  items: HookDefinition[]
  loading: boolean
  error: string | null
  fetch: () => Promise<void>
}

export const useHookStore = create<HookStore>((set) => ({
  items: [],
  loading: false,
  error: null,
  async fetch() {
    if (!window.electronAPI) return
    set({ loading: true, error: null })
    try {
      const hooks = await window.electronAPI.hooks.list()
      set({ items: hooks, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch hooks', loading: false })
    }
  }
}))
