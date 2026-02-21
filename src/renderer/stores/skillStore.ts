import { create } from 'zustand'
import type { Skill } from '@shared/types/skill'

interface SkillFormData {
  name: string
  description: string
  userInvocable?: boolean
  disableModelInvocation?: boolean
  body: string
}

interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
}

interface SkillStore {
  personal: Skill[]
  plugin: Skill[]
  loading: boolean
  directoryTree: { personal: FileNode[]; plugin: FileNode[] }
  fetch: () => Promise<void>
  createSkill: (name: string, data: SkillFormData) => Promise<void>
  updateSkill: (name: string, data: SkillFormData) => Promise<void>
  deleteSkill: (name: string) => Promise<void>
  getShadowedSkills: () => Skill[]
  fetchDirectoryTree: () => Promise<void>
  readFileContent: (filePath: string) => Promise<string | null>
  writeFileContent: (filePath: string, content: string) => Promise<void>
}

export const useSkillStore = create<SkillStore>((set, get) => ({
  personal: [],
  plugin: [],
  loading: false,
  directoryTree: { personal: [], plugin: [] },
  async fetch() {
    if (!window.electronAPI) return
    set({ loading: true })
    try {
      const data = await window.electronAPI.skills.list()
      set({ personal: data.personal, plugin: data.plugin })
    } finally {
      set({ loading: false })
    }
  },
  async createSkill(name: string, data: SkillFormData) {
    const metadata = {
      name: data.name,
      description: data.description,
      ...(data.userInvocable !== undefined && { userInvocable: data.userInvocable }),
      ...(data.disableModelInvocation !== undefined && { disableModelInvocation: data.disableModelInvocation })
    }
    await window.electronAPI.skills.write(name, data.body, metadata)
    await get().fetch()
  },
  async updateSkill(name: string, data: SkillFormData) {
    const metadata = {
      name: data.name,
      description: data.description,
      ...(data.userInvocable !== undefined && { userInvocable: data.userInvocable }),
      ...(data.disableModelInvocation !== undefined && { disableModelInvocation: data.disableModelInvocation })
    }
    await window.electronAPI.skills.write(name, data.body, metadata)
    await get().fetch()
  },
  async deleteSkill(name: string) {
    await window.electronAPI.skills.delete(name)
    await get().fetch()
  },
  getShadowedSkills() {
    const { personal, plugin } = get()
    const personalNames = new Set(personal.map(s => s.name))
    return plugin.filter(s => personalNames.has(s.name))
  },
  async fetchDirectoryTree() {
    const tree = await window.electronAPI.skills.getDirectoryTree()
    set({ directoryTree: tree })
  },
  async readFileContent(filePath: string) {
    return window.electronAPI.skills.readFile(filePath)
  },
  async writeFileContent(filePath: string, content: string) {
    await window.electronAPI.skills.writeFile(filePath, content)
  }
}))
