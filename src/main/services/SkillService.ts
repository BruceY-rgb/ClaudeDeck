import { join } from 'path'
import {
  CODEX_SKILLS_DIR,
  INSTALLED_PLUGINS_FILE,
  SKILLS_DIR,
} from '../../shared/constants'
import { fsService, type FileNode } from './FileSystemService'
import { parserService } from './ParserService'
import { pluginService } from './PluginService'
import type { Skill } from '../../shared/types/skill'
import type { ProviderId } from '../../shared/types/provider'
import { settingsService } from './SettingsService'

function getSkillsBaseDir(providerId: ProviderId): string {
  if (providerId === 'codex') return CODEX_SKILLS_DIR
  if (providerId === 'gemini') return join(process.env.HOME || '', '.gemini', 'skills')
  return SKILLS_DIR
}

export class SkillService {
  async list(): Promise<{ personal: Skill[]; plugin: Skill[] }> {
    const settings = await settingsService.read()
    const personal = await this.getPersonalSkills(settings.activeProvider)
    const plugin = await this.getPluginSkills(settings.activeProvider)
    return { personal, plugin }
  }

  async read(source: string, name: string): Promise<Skill | null> {
    const settings = await settingsService.read()
    const providerId = settings.activeProvider

    if (source === 'personal' || providerId !== 'claude') {
      const baseDir = getSkillsBaseDir(providerId)
      const filePath = join(baseDir, name, 'SKILL.md')
      if (!(await fsService.exists(filePath))) return null
      const content = await fsService.readFile(filePath)
      const hasRef = await fsService.exists(join(baseDir, name, 'reference'))
      const hasTpl = await fsService.exists(join(baseDir, name, 'templates'))
      return parserService.parseSkill(content, filePath, 'personal', undefined, hasRef, hasTpl)
    }

    try {
      if (!(await fsService.exists(INSTALLED_PLUGINS_FILE))) return null
      const data = await pluginService.getPluginsObject()
      const enabledPlugins = settings.enabledPlugins.claude || {}

      for (const [pluginId, info] of Object.entries(data)) {
        if (!enabledPlugins[pluginId]) continue

        const rootSkill = join(info.installPath, 'SKILL.md')
        if (await fsService.exists(rootSkill)) {
          const content = await fsService.readFile(rootSkill)
          const parsed = parserService.parseSkill(content, rootSkill, 'plugin', pluginId, false, false)
          if (parsed.name === name) return parsed
        }

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
    const settings = await settingsService.read()
    const dir = join(getSkillsBaseDir(settings.activeProvider), name)
    await fsService.ensureDir(dir)
    const content = parserService.serializeFrontmatter(metadata, body)
    await fsService.writeFileAtomic(join(dir, 'SKILL.md'), content)
  }

  async delete(name: string): Promise<void> {
    const { rm } = await import('fs/promises')
    const settings = await settingsService.read()
    const dir = join(getSkillsBaseDir(settings.activeProvider), name)
    await rm(dir, { recursive: true, force: true })
  }

  async batchDelete(names: string[]): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
    const errors: string[] = []
    let deletedCount = 0
    for (const name of names) {
      try {
        await this.delete(name)
        deletedCount++
      } catch (e) {
        errors.push(`${name}: ${e}`)
      }
    }
    return { success: errors.length === 0, deletedCount, errors }
  }

  private async getPersonalSkills(providerId: ProviderId): Promise<Skill[]> {
    const skills: Skill[] = []
    const baseDir = getSkillsBaseDir(providerId)
    const dirs = await fsService.listDirs(baseDir)

    for (const dir of dirs) {
      if (dir === 'learned') continue
      const skillFile = join(baseDir, dir, 'SKILL.md')
      if (!(await fsService.exists(skillFile))) continue
      try {
        const content = await fsService.readFile(skillFile)
        const hasRef = await fsService.exists(join(baseDir, dir, 'reference'))
        const hasTpl = await fsService.exists(join(baseDir, dir, 'templates'))
        skills.push(parserService.parseSkill(content, skillFile, 'personal', undefined, hasRef, hasTpl))
      } catch {
        // skip
      }
    }

    return skills
  }

  private async getPluginSkills(providerId: ProviderId): Promise<Skill[]> {
    if (providerId !== 'claude') return []

    const skills: Skill[] = []
    try {
      if (!(await fsService.exists(INSTALLED_PLUGINS_FILE))) return skills
      const data = await pluginService.getPluginsObject()
      const settings = await settingsService.read()
      const enabledPlugins = settings.enabledPlugins.claude || {}

      for (const [pluginId, info] of Object.entries(data)) {
        if (!enabledPlugins[pluginId]) continue

        const rootSkill = join(info.installPath, 'SKILL.md')
        if (await fsService.exists(rootSkill)) {
          try {
            const content = await fsService.readFile(rootSkill)
            const hasRef = await fsService.exists(join(info.installPath, 'reference'))
            const hasTpl = await fsService.exists(join(info.installPath, 'templates'))
            skills.push(parserService.parseSkill(content, rootSkill, 'plugin', pluginId, hasRef, hasTpl))
          } catch {
            // skip
          }
        }

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
          } catch {
            // skip
          }
        }
      }
    } catch {
      // skip
    }

    return skills
  }

  async getDirectoryTree(): Promise<{ personal: FileNode[]; plugin: FileNode[] }> {
    const settings = await settingsService.read()
    const providerId = settings.activeProvider
    const personal = await fsService.readDirectoryTree(getSkillsBaseDir(providerId), 3)
    const filteredPersonal = personal.filter((node) => node.name !== 'learned')
    const plugin: FileNode[] = []

    try {
      if (providerId === 'claude' && await fsService.exists(INSTALLED_PLUGINS_FILE)) {
        const data = await pluginService.getPluginsObject()
        const enabledPlugins = settings.enabledPlugins.claude || {}

        for (const [pluginId, info] of Object.entries(data)) {
          if (!enabledPlugins[pluginId]) continue
          const children: FileNode[] = []
          const rootSkill = join(info.installPath, 'SKILL.md')
          if (await fsService.exists(rootSkill)) {
            children.push({ name: 'SKILL.md', path: rootSkill, isDirectory: false })
          }

          const skillsDir = join(info.installPath, 'skills')
          if (await fsService.exists(skillsDir)) {
            children.push(...await fsService.readDirectoryTree(skillsDir, 2))
          }

          if (children.length === 0) continue
          plugin.push({
            name: pluginId.split('@')[0],
            path: info.installPath,
            isDirectory: true,
            children,
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
      if (content.length > 100 * 1024) {
        return `${content.slice(0, 100 * 1024)}\n\n... (file truncated)`
      }
      return content
    } catch {
      return null
    }
  }
}

export const skillService = new SkillService()
