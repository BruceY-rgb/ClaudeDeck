import { create } from 'zustand'
import type { Agent } from '@shared/types/agent'

interface AgentStore {
  items: Agent[]
  loading: boolean
  fetch: () => Promise<void>
  deleteAgent: (name: string) => Promise<void>
}

export const useAgentStore = create<AgentStore>((set) => ({
  items: [],
  loading: false,
  async fetch() {
    if (!window.electronAPI) return
    set({ loading: true })
    try {
      const agents = await window.electronAPI.agents.list()
      set({ items: agents })
    } finally {
      set({ loading: false })
    }
  },
  async deleteAgent(name: string) {
    await window.electronAPI.agents.delete(name)
    set(state => ({ items: state.items.filter(a => a.name !== name) }))
  }
}))
