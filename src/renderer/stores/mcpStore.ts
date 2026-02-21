import { create } from 'zustand'
import type { MCPServer } from '@shared/types/mcp'

interface MCPTemplate {
  name: string
  description?: string
  type: 'stdio' | 'http'
  command?: string
  args?: string[]
  url?: string
  requiredEnvVars?: string[]
  pluginId: string
  pluginName: string
}

interface MCPStore {
  servers: MCPServer[]
  templates: MCPTemplate[]
  loading: boolean
  error: string | null
  fetchServers: () => Promise<void>
  fetchTemplates: () => Promise<void>
  activate: (template: MCPTemplate, env: Record<string, string>) => Promise<void>
  deactivate: (name: string) => Promise<void>
  update: (name: string, config: Partial<MCPServer>) => Promise<void>
}

export const useMCPStore = create<MCPStore>((set, get) => ({
  servers: [],
  templates: [],
  loading: false,
  error: null,
  async fetchServers() {
    if (!window.electronAPI) return
    set({ loading: true, error: null })
    try {
      const servers = await window.electronAPI.mcp.list()
      set({ servers, loading: false })
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to fetch MCP servers', loading: false })
    }
  },
  async fetchTemplates() {
    try {
      const templates = await window.electronAPI.mcp.templates() as MCPTemplate[]
      set({ templates })
    } catch (e) {
      console.error('Failed to fetch MCP templates:', e)
    }
  },
  async activate(template: MCPTemplate, env: Record<string, string>) {
    try {
      await window.electronAPI.mcp.activate(template, env)
      await get().fetchServers()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to activate MCP server' })
      throw e
    }
  },
  async deactivate(name: string) {
    try {
      await window.electronAPI.mcp.deactivate(name)
      await get().fetchServers()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to deactivate MCP server' })
      throw e
    }
  },
  async update(name: string, config: Partial<MCPServer>) {
    try {
      await window.electronAPI.mcp.update(name, config)
      await get().fetchServers()
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Failed to update MCP server' })
      throw e
    }
  }
}))
