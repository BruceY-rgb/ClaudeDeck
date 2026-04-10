import {
  CC_INSTALLED_PLUGINS_FILE,
  CODEX_CONFIG_FILE,
  CODEX_DIR,
  INSTALLED_PLUGINS_FILE,
  SETTINGS_FILE,
} from '../../shared/constants'
import { fsService } from './FileSystemService'
import { parserService } from './ParserService'
import type {
  InstalledPlugin,
  PluginManifest,
} from '../../shared/types/plugin'
import type { InstalledPluginRecord } from '../../shared/types/marketplace'
import type { Agent } from '../../shared/types/agent'
import type { Skill } from '../../shared/types/skill'
import type { Command } from '../../shared/types/command'
import type { HookDefinition } from '../../shared/types/hook'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { settingsService } from './SettingsService'
import { parseCodexToml, upsertCodexPluginEnabled } from './TomlLite'

export interface PluginDetail {
  manifest: PluginManifest | null
  agents: Agent[]
  skills: Skill[]
  commands: Command[]
  hooks: HookDefinition[]
}

export class PluginService {
  async list(): Promise<InstalledPlugin[]> {
    const settings = await settingsService.read()
    return settings.activeProvider === 'codex'
      ? this.listCodexPlugins()
      : this.listClaudePlugins()
  }

  async setEnabled(pluginId: string, enabled: boolean): Promise<void> {
    const settings = await settingsService.read()
    if (settings.activeProvider === 'codex') {
      await this.setCodexPluginEnabled(pluginId, enabled)
      return
    }

    if (enabled) {
      await settingsService.enablePlugin(pluginId, 'claude')
    } else {
      await settingsService.disablePlugin(pluginId, 'claude')
    }
  }

  async getDetail(pluginId: string): Promise<PluginDetail | null> {
    const settings = await settingsService.read()
    if (settings.activeProvider === 'codex') {
      const plugins = await this.listCodexPlugins()
      const plugin = plugins.find((item) => item.id === pluginId)
      if (!plugin) return null
      return { manifest: null, agents: [], skills: [], commands: [], hooks: [] }
    }

    const plugins = await this.listClaudePlugins()
    const plugin = plugins.find((p) => p.id === pluginId)
    if (!plugin) return null

    const installPath = plugin.installPath
    const [manifest, agents, skills, commands, hooks] = await Promise.all([
      this.loadManifest(installPath),
      this.loadAgents(installPath, pluginId),
      this.loadSkills(installPath, pluginId),
      this.loadCommands(installPath, pluginId, plugin.name),
      this.loadHooks(installPath, pluginId),
    ])

    return { manifest, agents, skills, commands, hooks }
  }

  async getPluginsObject(): Promise<Record<string, InstalledPluginRecord>> {
    const rawData = await fsService.readJSON<unknown>(INSTALLED_PLUGINS_FILE)
    const result: Record<string, InstalledPluginRecord> = {}

    if (Array.isArray(rawData)) {
      for (const plugin of rawData) {
        const p = plugin as InstalledPluginRecord
        if (p.id) result[p.id] = p
      }
      return result
    }

    return (rawData as { plugins?: Record<string, InstalledPluginRecord> })?.plugins || {}
  }

  async uninstall(pluginId: string): Promise<void> {
    const settings = await settingsService.read()
    if (settings.activeProvider === 'codex') {
      await this.setCodexPluginEnabled(pluginId, false)
      return
    }

    const rawData = await fsService.readJSON<unknown>(INSTALLED_PLUGINS_FILE)
    let pluginsData: Record<string, unknown> = {}

    if (Array.isArray(rawData)) {
      for (const plugin of rawData) {
        const p = plugin as Record<string, unknown>
        const id = p.id as string
        if (id) pluginsData[id] = p
      }
    } else if (rawData && typeof rawData === 'object') {
      pluginsData = (rawData as { plugins?: Record<string, unknown> }).plugins || {}
    }

    delete pluginsData[pluginId]
    await fsService.writeJSON(INSTALLED_PLUGINS_FILE, Object.values(pluginsData))

    try {
      const ccData = await fsService.readJSON<{
        version?: number
        plugins?: Record<string, unknown>
      }>(CC_INSTALLED_PLUGINS_FILE)
      if (ccData?.plugins?.[pluginId]) {
        delete ccData.plugins[pluginId]
        await fsService.writeJSON(CC_INSTALLED_PLUGINS_FILE, ccData)
      }
    } catch {
      // ignore
    }

    await settingsService.disablePlugin(pluginId, 'claude')
  }

  private async listClaudePlugins(): Promise<InstalledPlugin[]> {
    let csamPluginsData: Record<string, unknown> = {}
    try {
      if (await fsService.exists(INSTALLED_PLUGINS_FILE)) {
        const rawData = await fsService.readJSON<unknown>(INSTALLED_PLUGINS_FILE)
        if (Array.isArray(rawData)) {
          for (const plugin of rawData) {
            const p = plugin as Record<string, unknown>
            const id = p.id as string
            if (id) csamPluginsData[id] = p
          }
        } else if (rawData && typeof rawData === 'object') {
          csamPluginsData = (rawData as { plugins?: Record<string, unknown> }).plugins || {}
        }
      }
    } catch {
      // ignore
    }

    let ccPluginsData: Record<string, unknown> = {}
    try {
      if (await fsService.exists(CC_INSTALLED_PLUGINS_FILE)) {
        const ccData = await fsService.readJSON<{ plugins?: Record<string, unknown> }>(CC_INSTALLED_PLUGINS_FILE)
        ccPluginsData = ccData?.plugins || {}
      }
    } catch {
      // ignore
    }

    const allPluginIds = new Set([...Object.keys(csamPluginsData), ...Object.keys(ccPluginsData)])
    const settings = await settingsService.read()
    const enabledPlugins = settings.enabledPlugins.claude || {}

    const plugins: InstalledPlugin[] = []
    for (const id of allPluginIds) {
      const info = csamPluginsData[id] || ccPluginsData[id]
      if (!info) continue
      const p = info as Record<string, unknown>
      const [name, marketplace] = id.split('@')
      plugins.push({
        id,
        name,
        provider: 'claude',
        marketplace,
        version: (p.version as string) || '',
        installedAt: (p.installedAt as string) || '',
        lastUpdated: (p.lastUpdated as string) || '',
        installPath: (p.installPath as string) || '',
        gitCommitSha: (p.gitCommitSha as string) || '',
        isLocal: (p.isLocal as boolean) ?? true,
        enabled: !!enabledPlugins[id],
      })
    }

    return plugins
  }

  private async listCodexPlugins(): Promise<InstalledPlugin[]> {
    if (!(await fsService.exists(CODEX_CONFIG_FILE))) return []
    const raw = await fsService.readFile(CODEX_CONFIG_FILE)
    const parsed = parseCodexToml(raw)

    return Object.entries(parsed.plugins).map(([id, info]) => {
      const [name, marketplace = 'codex'] = id.split('@')
      return {
        id,
        name,
        provider: 'codex',
        marketplace,
        version: '',
        installedAt: '',
        lastUpdated: '',
        installPath: join(CODEX_DIR, 'plugins', id),
        gitCommitSha: '',
        isLocal: false,
        enabled: info.enabled !== false,
      }
    })
  }

  private async setCodexPluginEnabled(pluginId: string, enabled: boolean): Promise<void> {
    const current = (await fsService.exists(CODEX_CONFIG_FILE))
      ? await fsService.readFile(CODEX_CONFIG_FILE)
      : ''
    const next = upsertCodexPluginEnabled(current, pluginId, enabled)
    await fsService.writeFileAtomic(CODEX_CONFIG_FILE, next)
  }

  private async loadManifest(installPath: string): Promise<PluginManifest | null> {
    const manifestPath = join(installPath, 'manifest.json')
    if (!(await fsService.exists(manifestPath))) return null
    try {
      return await fsService.readJSON<PluginManifest>(manifestPath)
    } catch {
      return null
    }
  }

  private async loadAgents(installPath: string, pluginId: string): Promise<Agent[]> {
    const agentsDir = join(installPath, 'agents')
    if (!(await fsService.exists(agentsDir))) return []

    const agents: Agent[] = []
    try {
      const files = await readdir(agentsDir)
      for (const file of files) {
        if (!file.endsWith('.md')) continue
        const filePath = join(agentsDir, file)
        const content = await readFile(filePath, 'utf-8')
        agents.push(parserService.parseAgent(content, filePath, 'plugin', pluginId))
      }
    } catch {
      // ignore
    }
    return agents
  }

  private async loadSkills(installPath: string, pluginId: string): Promise<Skill[]> {
    const skills: Skill[] = []

    const rootSkill = join(installPath, 'SKILL.md')
    if (await fsService.exists(rootSkill)) {
      try {
        const content = await readFile(rootSkill, 'utf-8')
        const hasRef = await fsService.exists(join(installPath, 'reference'))
        const hasTpl = await fsService.exists(join(installPath, 'templates'))
        skills.push(parserService.parseSkill(content, rootSkill, 'plugin', pluginId, hasRef, hasTpl))
      } catch {
        // ignore
      }
    }

    const skillsDir = join(installPath, 'skills')
    if (await fsService.exists(skillsDir)) {
      try {
        const skillDirs = await readdir(skillsDir)
        for (const skillDir of skillDirs) {
          const skillPath = join(skillsDir, skillDir, 'SKILL.md')
          if (!(await fsService.exists(skillPath))) continue
          const hasReference = await fsService.exists(join(skillsDir, skillDir, 'reference'))
          const hasTemplates = await fsService.exists(join(skillsDir, skillDir, 'templates'))
          const content = await readFile(skillPath, 'utf-8')
          skills.push(parserService.parseSkill(content, skillPath, 'plugin', pluginId, hasReference, hasTemplates))
        }
      } catch {
        // ignore
      }
    }

    return skills
  }

  private async loadCommands(
    installPath: string,
    pluginId: string,
    pluginName: string,
  ): Promise<Command[]> {
    const commandsDir = join(installPath, 'commands')
    if (!(await fsService.exists(commandsDir))) return []

    const commands: Command[] = []
    try {
      const files = await readdir(commandsDir)
      for (const file of files) {
        if (!file.endsWith('.md')) continue
        const filePath = join(commandsDir, file)
        const content = await readFile(filePath, 'utf-8')
        commands.push(parserService.parseCommand(content, filePath, pluginId, pluginName))
      }
    } catch {
      // ignore
    }
    return commands
  }

  private async loadHooks(installPath: string, pluginId: string): Promise<HookDefinition[]> {
    const hooksFile = join(installPath, 'hooks', 'hooks.json')
    if (!(await fsService.exists(hooksFile))) return []

    try {
      const data = await fsService.readJSON<{ hooks?: Record<string, unknown> }>(hooksFile)
      if (!data.hooks) return []

      const hooks: HookDefinition[] = []
      for (const [event, configs] of Object.entries(data.hooks)) {
        const configArray = Array.isArray(configs) ? configs : [configs]
        for (const config of configArray) {
          hooks.push({
            pluginId,
            pluginName: pluginId.split('@')[0],
            event: event as HookDefinition['event'],
            matchers: [
              {
                matcher: ((config as Record<string, unknown>).matcher as string) || '',
                hooks: ((config as Record<string, unknown>).hooks as HookDefinition['matchers'][number]['hooks']) || [],
              },
            ],
          })
        }
      }
      return hooks
    } catch {
      return []
    }
  }
}

export const pluginService = new PluginService()
