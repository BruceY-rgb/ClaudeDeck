import { join } from 'path'
import { SKILLS_DIR, INSTALLED_PLUGINS_FILE, SETTINGS_FILE } from '../../shared/constants'
import { fsService, type FileNode } from './FileSystemService'
import { parserService } from './ParserService'
import { pluginService } from './PluginService'
import type { Skill } from '../../shared/types/skill'

export class SkillService {
  async list(): Promise<{ personal: Skill[]; plugin: Skill[] }> {
    const personal = await this.getPersonalSkills()
    const plugin = await this.getPluginSkills()
    return { personal, plugin }
  }

  async read(source: string, name: string): Promise<Skill | null> {
    if (source === 'personal') {
      const filePath = join(SKILLS_DIR, name, 'SKILL.md')
      if (!(await fsService.exists(filePath))) return null
      const content = await fsService.readFile(filePath)
      const hasRef = await fsService.exists(join(SKILLS_DIR, name, 'reference'))
      const hasTpl = await fsService.exists(join(SKILLS_DIR, name, 'templates'))
      return parserService.parseSkill(content, filePath, 'personal', undefined, hasRef, hasTpl)
    }

    // Read plugin skill
    try {
      if (!(await fsService.exists(INSTALLED_PLUGINS_FILE))) return null
      const data = await pluginService.getPluginsObject()

      let enabledPlugins: Record<string, boolean> = {}
      if (await fsService.exists(SETTINGS_FILE)) {
        const settings = await fsService.readJSON<{ enabledPlugins?: Record<string, boolean> }>(SETTINGS_FILE)
        enabledPlugins = settings.enabledPlugins || {}
      }

      for (const [pluginId, info] of Object.entries(data)) {
        if (!enabledPlugins[pluginId]) continue

        // Check root SKILL.md (single-skill plugins)
        const rootSkill = join(info.installPath, 'SKILL.md')
        if (await fsService.exists(rootSkill)) {
          const content = await fsService.readFile(rootSkill)
          const parsed = parserService.parseSkill(content, rootSkill, 'plugin', pluginId, false, false)
          if (parsed.name === name) return parsed
        }

        // Check skills/ subdirectory
        const skillFile = join(info.installPath, 'skills', name, 'SKILL.md')
        if (await fsService.exists(skillFile)) {
          const content = await fsService.readFile(skillFile)
          const hasRef = await fsService.exists(join(info.installPath, 'skills', name, 'reference'))
          const hasTpl = await fsService.exists(join(info.installPath, 'skills', name, 'templates'))
          return parserService.parseSkill(content, skillFile, 'plugin', pluginId, hasRef, hasTpl)
        }
      }
    } catch {
      // skip
    }

    return null
  }

  async write(name: string, body: string, metadata: Record<string, unknown>): Promise<void> {
    const dir = join(SKILLS_DIR, name)
    await fsService.ensureDir(dir)
    const content = parserService.serializeFrontmatter(metadata, body)
    await fsService.writeFileAtomic(join(dir, 'SKILL.md'), content)
  }

  async delete(name: string): Promise<void> {
    const { rm } = await import('fs/promises')
    const dir = join(SKILLS_DIR, name)
    await rm(dir, { recursive: true, force: true })
  }

  private async getPersonalSkills(): Promise<Skill[]> {
    const skills: Skill[] = []
    const dirs = await fsService.listDirs(SKILLS_DIR)
    for (const dir of dirs) {
      if (dir === 'learned') continue
      const skillFile = join(SKILLS_DIR, dir, 'SKILL.md')
      if (!(await fsService.exists(skillFile))) continue
      try {
        const content = await fsService.readFile(skillFile)
        const hasRef = await fsService.exists(join(SKILLS_DIR, dir, 'reference'))
        const hasTpl = await fsService.exists(join(SKILLS_DIR, dir, 'templates'))
        skills.push(parserService.parseSkill(content, skillFile, 'personal', undefined, hasRef, hasTpl))
      } catch {
        // skip
      }
    }
    return skills
  }

  private async getPluginSkills(): Promise<Skill[]> {
    const skills: Skill[] = []
    try {
      if (!(await fsService.exists(INSTALLED_PLUGINS_FILE))) return skills
      const data = await pluginService.getPluginsObject()

      let enabledPlugins: Record<string, boolean> = {}
      if (await fsService.exists(SETTINGS_FILE)) {
        const settings = await fsService.readJSON<{ enabledPlugins?: Record<string, boolean> }>(SETTINGS_FILE)
        enabledPlugins = settings.enabledPlugins || {}
      }

      for (const [pluginId, info] of Object.entries(data)) {
        if (!enabledPlugins[pluginId]) continue

        // Check for SKILL.md at plugin root (single-skill plugins)
        const rootSkill = join(info.installPath, 'SKILL.md')
        if (await fsService.exists(rootSkill)) {
          try {
            const content = await fsService.readFile(rootSkill)
            const hasRef = await fsService.exists(join(info.installPath, 'reference'))
            const hasTpl = await fsService.exists(join(info.installPath, 'templates'))
            skills.push(parserService.parseSkill(content, rootSkill, 'plugin', pluginId, hasRef, hasTpl))
          } catch { /* skip */ }
        }

        // Check skills/ subdirectory
        const skillsDir = join(info.installPath, 'skills')
        if (!(await fsService.exists(skillsDir))) continue
        const dirs = await fsService.listDirs(skillsDir)
        for (const dir of dirs) {
          const skillFile = join(skillsDir, dir, 'SKILL.md')
          if (!(await fsService.exists(skillFile))) continue
          try {
            const content = await fsService.readFile(skillFile)
            const hasRef = await fsService.exists(join(skillsDir, dir, 'reference'))
            const hasTpl = await fsService.exists(join(skillsDir, dir, 'templates'))
            skills.push(parserService.parseSkill(content, skillFile, 'plugin', pluginId, hasRef, hasTpl))
          } catch { /* skip */ }
        }
      }
    } catch {
      // skip
    }
    return skills
  }

  async getDirectoryTree(): Promise<{ personal: FileNode[]; plugin: FileNode[] }> {
    const personal = await fsService.readDirectoryTree(SKILLS_DIR, 3)

    // Filter out 'learned' directory from personal
    const filteredPersonal = personal.filter(node => node.name !== 'learned')

    // Get plugin skills directory tree
    const plugin: FileNode[] = []
    try {
      if (await fsService.exists(INSTALLED_PLUGINS_FILE)) {
        const data = await pluginService.getPluginsObject()

        let enabledPlugins: Record<string, boolean> = {}
        if (await fsService.exists(SETTINGS_FILE)) {
          const settings = await fsService.readJSON<{ enabledPlugins?: Record<string, boolean> }>(SETTINGS_FILE)
          enabledPlugins = settings.enabledPlugins || {}
        }

        for (const [pluginId, info] of Object.entries(data)) {
          if (!enabledPlugins[pluginId]) continue
          const children: FileNode[] = []

          // Check root SKILL.md
          const rootSkill = join(info.installPath, 'SKILL.md')
          if (await fsService.exists(rootSkill)) {
            children.push({ name: 'SKILL.md', path: rootSkill, isDirectory: false })
          }

          // Check skills/ subdirectory
          const skillsDir = join(info.installPath, 'skills')
          if (await fsService.exists(skillsDir)) {
            children.push(...await fsService.readDirectoryTree(skillsDir, 2))
          }

          if (children.length === 0) continue
          plugin.push({
            name: pluginId.split('@')[0],
            path: info.installPath,
            isDirectory: true,
            children
          })
        }
      }
    } catch {
      // skip
    }

    return { personal: filteredPersonal, plugin }
  }

  async writeFileContent(filePath: string, content: string): Promise<void> {
    await fsService.writeFileAtomic(filePath, content)
  }

  async readFileContent(filePath: string): Promise<string | null> {
    try {
      if (!(await fsService.exists(filePath))) return null
      const content = await fsService.readFile(filePath)
      // Limit content size for preview (100KB)
      if (content.length > 100 * 1024) {
        return content.slice(0, 100 * 1024) + '\n\n... (file truncated)'
      }
      return content
    } catch {
      return null
    }
  }
}

export const skillService = new SkillService()
