import { join } from 'path'
import { AGENTS_DIR, INSTALLED_PLUGINS_FILE, SETTINGS_FILE } from '../../shared/constants'
import { fsService } from './FileSystemService'
import { parserService } from './ParserService'
import { pluginService } from './PluginService'
import type { Agent } from '../../shared/types/agent'

export class AgentService {
  async list(): Promise<Agent[]> {
    const agents: Agent[] = []

    // 1. Personal agents
    const personalFiles = await fsService.listFiles(AGENTS_DIR, '.md')
    for (const file of personalFiles) {
      try {
        const filePath = join(AGENTS_DIR, file)
        const content = await fsService.readFile(filePath)
        agents.push(parserService.parseAgent(content, filePath, 'personal'))
      } catch {
        // skip malformed files
      }
    }

    // 2. Plugin agents
    const pluginAgents = await this.getPluginAgents()
    agents.push(...pluginAgents)

    return agents
  }

  async read(name: string): Promise<Agent | null> {
    const filePath = join(AGENTS_DIR, `${name}.md`)
    if (!(await fsService.exists(filePath))) return null
    try {
      const content = await fsService.readFile(filePath)
      return parserService.parseAgent(content, filePath, 'personal')
    } catch {
      return null
    }
  }

  async write(name: string, data: { name: string; description: string; tools: string[]; model: string; body: string }): Promise<void> {
    const filePath = join(AGENTS_DIR, `${name}.md`)
    const content = parserService.serializeAgent(data)
    await fsService.writeFileAtomic(filePath, content)
  }

  async delete(name: string): Promise<void> {
    const filePath = join(AGENTS_DIR, `${name}.md`)
    await fsService.deleteFile(filePath)
  }

  private async getPluginAgents(): Promise<Agent[]> {
    const agents: Agent[] = []
    try {
      if (!(await fsService.exists(INSTALLED_PLUGINS_FILE))) return agents
      const data = await pluginService.getPluginsObject()

      // Check which plugins are enabled
      let enabledPlugins: Record<string, boolean> = {}
      if (await fsService.exists(SETTINGS_FILE)) {
        const settings = await fsService.readJSON<{ enabledPlugins?: Record<string, boolean> }>(SETTINGS_FILE)
        enabledPlugins = settings.enabledPlugins || {}
      }

      for (const [pluginId, info] of Object.entries(data)) {
        if (!enabledPlugins[pluginId]) continue
        const agentsDir = join(info.installPath, 'agents')
        if (!(await fsService.exists(agentsDir))) continue
        const files = await fsService.listFiles(agentsDir, '.md')
        for (const file of files) {
          try {
            const filePath = join(agentsDir, file)
            const content = await fsService.readFile(filePath)
            agents.push(parserService.parseAgent(content, filePath, 'plugin', pluginId))
          } catch {
            // skip
          }
        }
      }
    } catch {
      // skip
    }
    return agents
  }
}

export const agentService = new AgentService()
