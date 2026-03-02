import { create } from 'zustand'
import type {
  ProjectAgent,
  ProjectSkill,
  ProjectMCPServer,
  ProjectCommand,
  ProjectHook,
  ProjectPlan,
  ProjectSummary,
  ProjectTab,
  ProjectAgentFormData,
  ProjectSkillFormData,
  ProjectMCPFormData,
  ProjectCommandFormData,
  ProjectHookFormData,
} from '@shared/types/project-config'

interface ProjectConfigStore {
  // State
  projectDir: string | null
  activeTab: ProjectTab
  agents: ProjectAgent[]
  skills: ProjectSkill[]
  mcpServers: ProjectMCPServer[]
  plans: ProjectPlan[]
  hooks: ProjectHook[]
  commands: ProjectCommand[]
  summary: ProjectSummary | null
  loading: Record<ProjectTab, boolean>

  // Drawer state
  drawerOpen: boolean
  drawerMode: 'create' | 'edit'
  drawerType: 'agent' | 'skill' | 'mcp' | 'command' | null
  editingItem: unknown | null

  // Copy-from-global modal
  copyModalOpen: boolean
  copyModalType: 'agent' | 'skill' | null

  // Actions
  setProjectDir: (dir: string) => void
  setActiveTab: (tab: ProjectTab) => void
  openDrawer: (type: 'agent' | 'skill' | 'mcp' | 'command', mode: 'create' | 'edit', item?: unknown) => void
  closeDrawer: () => void
  openCopyModal: (type: 'agent' | 'skill') => void
  closeCopyModal: () => void

  // Fetch
  fetchSummary: () => Promise<void>
  fetchAgents: () => Promise<void>
  fetchSkills: () => Promise<void>
  fetchMCPServers: () => Promise<void>
  fetchPlans: () => Promise<void>
  fetchHooks: () => Promise<void>
  fetchCommands: () => Promise<void>

  // Agent CRUD
  createAgent: (name: string, data: ProjectAgentFormData) => Promise<void>
  updateAgent: (name: string, data: ProjectAgentFormData) => Promise<void>
  deleteAgent: (name: string) => Promise<void>
  copyGlobalAgent: (agentName: string) => Promise<void>

  // Skill CRUD
  createSkill: (name: string, data: ProjectSkillFormData) => Promise<void>
  updateSkill: (name: string, data: ProjectSkillFormData) => Promise<void>
  deleteSkill: (name: string) => Promise<void>
  copyGlobalSkill: (skillName: string) => Promise<void>

  // MCP CRUD
  writeMCPServer: (name: string, data: ProjectMCPFormData) => Promise<void>
  deleteMCPServer: (name: string) => Promise<void>

  // Plan CRUD
  createPlan: (name: string, content: string) => Promise<void>
  updatePlan: (name: string, content: string) => Promise<void>
  deletePlan: (name: string) => Promise<void>

  // Hooks
  writeHooks: (hooks: ProjectHookFormData[]) => Promise<void>

  // Command CRUD
  createCommand: (name: string, data: ProjectCommandFormData) => Promise<void>
  updateCommand: (name: string, data: ProjectCommandFormData) => Promise<void>
  deleteCommand: (name: string) => Promise<void>
}

const defaultLoading: Record<ProjectTab, boolean> = {
  sessions: false,
  agents: false,
  skills: false,
  mcp: false,
  plans: false,
  hooks: false,
  commands: false,
}

export const useProjectConfigStore = create<ProjectConfigStore>((set, get) => ({
  projectDir: null,
  activeTab: 'sessions',
  agents: [],
  skills: [],
  mcpServers: [],
  plans: [],
  hooks: [],
  commands: [],
  summary: null,
  loading: { ...defaultLoading },

  drawerOpen: false,
  drawerMode: 'create',
  drawerType: null,
  editingItem: null,

  copyModalOpen: false,
  copyModalType: null,

  setProjectDir(dir: string) {
    set({ projectDir: dir })
  },

  setActiveTab(tab: ProjectTab) {
    set({ activeTab: tab })
  },

  openDrawer(type, mode, item) {
    set({ drawerOpen: true, drawerType: type, drawerMode: mode, editingItem: item || null })
  },

  closeDrawer() {
    set({ drawerOpen: false, drawerType: null, editingItem: null })
  },

  openCopyModal(type) {
    set({ copyModalOpen: true, copyModalType: type })
  },

  closeCopyModal() {
    set({ copyModalOpen: false, copyModalType: null })
  },

  // ─── Fetch ────────────────────────────────────────────

  async fetchSummary() {
    const { projectDir } = get()
    if (!projectDir || !window.electronAPI) return
    try {
      const summary = await window.electronAPI.projectConfig.getSummary(projectDir)
      set({ summary })
    } catch {
      // ignore
    }
  },

  async fetchAgents() {
    const { projectDir } = get()
    if (!projectDir || !window.electronAPI) return
    set(s => ({ loading: { ...s.loading, agents: true } }))
    try {
      const agents = await window.electronAPI.projectConfig.listAgents(projectDir)
      set({ agents })
    } finally {
      set(s => ({ loading: { ...s.loading, agents: false } }))
    }
  },

  async fetchSkills() {
    const { projectDir } = get()
    if (!projectDir || !window.electronAPI) return
    set(s => ({ loading: { ...s.loading, skills: true } }))
    try {
      const skills = await window.electronAPI.projectConfig.listSkills(projectDir)
      set({ skills })
    } finally {
      set(s => ({ loading: { ...s.loading, skills: false } }))
    }
  },

  async fetchMCPServers() {
    const { projectDir } = get()
    if (!projectDir || !window.electronAPI) return
    set(s => ({ loading: { ...s.loading, mcp: true } }))
    try {
      const mcpServers = await window.electronAPI.projectConfig.listMCPServers(projectDir)
      set({ mcpServers })
    } finally {
      set(s => ({ loading: { ...s.loading, mcp: false } }))
    }
  },

  async fetchPlans() {
    const { projectDir } = get()
    if (!projectDir || !window.electronAPI) return
    set(s => ({ loading: { ...s.loading, plans: true } }))
    try {
      const plans = await window.electronAPI.projectConfig.listPlans(projectDir)
      set({ plans })
    } finally {
      set(s => ({ loading: { ...s.loading, plans: false } }))
    }
  },

  async fetchHooks() {
    const { projectDir } = get()
    if (!projectDir || !window.electronAPI) return
    set(s => ({ loading: { ...s.loading, hooks: true } }))
    try {
      const hooks = await window.electronAPI.projectConfig.listHooks(projectDir)
      set({ hooks })
    } finally {
      set(s => ({ loading: { ...s.loading, hooks: false } }))
    }
  },

  async fetchCommands() {
    const { projectDir } = get()
    if (!projectDir || !window.electronAPI) return
    set(s => ({ loading: { ...s.loading, commands: true } }))
    try {
      const commands = await window.electronAPI.projectConfig.listCommands(projectDir)
      set({ commands })
    } finally {
      set(s => ({ loading: { ...s.loading, commands: false } }))
    }
  },

  // ─── Agent CRUD ───────────────────────────────────────

  async createAgent(name, data) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writeAgent(projectDir, name, data)
    await get().fetchAgents()
    await get().fetchSummary()
  },

  async updateAgent(name, data) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writeAgent(projectDir, name, data)
    await get().fetchAgents()
  },

  async deleteAgent(name) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.deleteAgent(projectDir, name)
    set(s => ({ agents: s.agents.filter(a => a.name !== name) }))
    await get().fetchSummary()
  },

  async copyGlobalAgent(agentName) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.copyGlobalAgent(projectDir, agentName)
    await get().fetchAgents()
    await get().fetchSummary()
  },

  // ─── Skill CRUD ───────────────────────────────────────

  async createSkill(name, data) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writeSkill(projectDir, name, data)
    await get().fetchSkills()
    await get().fetchSummary()
  },

  async updateSkill(name, data) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writeSkill(projectDir, name, data)
    await get().fetchSkills()
  },

  async deleteSkill(name) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.deleteSkill(projectDir, name)
    set(s => ({ skills: s.skills.filter(sk => sk.name !== name) }))
    await get().fetchSummary()
  },

  async copyGlobalSkill(skillName) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.copyGlobalSkill(projectDir, skillName)
    await get().fetchSkills()
    await get().fetchSummary()
  },

  // ─── MCP CRUD ─────────────────────────────────────────

  async writeMCPServer(name, data) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writeMCPServer(projectDir, name, data)
    await get().fetchMCPServers()
    await get().fetchSummary()
  },

  async deleteMCPServer(name) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.deleteMCPServer(projectDir, name)
    set(s => ({ mcpServers: s.mcpServers.filter(m => m.name !== name) }))
    await get().fetchSummary()
  },

  // ─── Plan CRUD ────────────────────────────────────────

  async createPlan(name, content) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writePlan(projectDir, name, content)
    await get().fetchPlans()
    await get().fetchSummary()
  },

  async updatePlan(name, content) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writePlan(projectDir, name, content)
    await get().fetchPlans()
  },

  async deletePlan(name) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.deletePlan(projectDir, name)
    set(s => ({ plans: s.plans.filter(p => p.name !== name) }))
    await get().fetchSummary()
  },

  // ─── Hooks ────────────────────────────────────────────

  async writeHooks(hooks) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writeHooks(projectDir, hooks)
    await get().fetchHooks()
    await get().fetchSummary()
  },

  // ─── Command CRUD ─────────────────────────────────────

  async createCommand(name, data) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writeCommand(projectDir, name, data)
    await get().fetchCommands()
    await get().fetchSummary()
  },

  async updateCommand(name, data) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.writeCommand(projectDir, name, data)
    await get().fetchCommands()
  },

  async deleteCommand(name) {
    const { projectDir } = get()
    if (!projectDir) return
    await window.electronAPI.projectConfig.deleteCommand(projectDir, name)
    set(s => ({ commands: s.commands.filter(c => c.name !== name) }))
    await get().fetchSummary()
  },
}))
