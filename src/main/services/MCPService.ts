import { pluginService } from './PluginService'
import { fsService } from './FileSystemService'
import type { MCPServer } from '../../shared/types/mcp'
import { CLAUDE_JSON_FILE } from '../../shared/constants'
import { readFile, writeFile } from 'fs/promises'
import { join, basename } from 'path'
import { existsSync } from 'fs'
import { homedir } from 'os'

interface ClaudeConfig {
  mcpServers?: Record<string, MCPServer>
  [key: string]: unknown
}

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

export class MCPService {
  async list(): Promise<MCPServer[]> {
    const config = await this.readClaudeConfig()
    const servers = config.mcpServers || {}

    return Object.entries(servers).map(([name, server]) => ({
      name,
      type: server.type,
      command: server.command,
      args: server.args,
      url: server.url,
      env: server.env,
      active: true
    }))
  }

  async listTemplates(): Promise<MCPTemplate[]> {
    const templates: MCPTemplate[] = []
    const plugins = await pluginService.list()
    const enabledPlugins = plugins.filter(p => p.enabled)

    for (const plugin of enabledPlugins) {
      const pluginTemplates = await this.loadPluginTemplates(plugin.id, plugin.name, plugin.installPath)
      templates.push(...pluginTemplates)
    }

    return templates
  }

  private async loadPluginTemplates(pluginId: string, pluginName: string, pluginPath: string): Promise<MCPTemplate[]> {
    const templates: MCPTemplate[] = []
    const mcpConfigsDir = join(pluginPath, 'mcp-configs')

    if (!existsSync(mcpConfigsDir)) {
      return templates
    }

    try {
      const { readdir } = await import('fs/promises')
      const files = await readdir(mcpConfigsDir)

      for (const file of files) {
        if (!file.endsWith('.json')) continue

        try {
          const filePath = join(mcpConfigsDir, file)
          const content = await readFile(filePath, 'utf-8')
          const template = JSON.parse(content) as Omit<MCPTemplate, 'pluginId' | 'pluginName'>

          templates.push({
            ...template,
            name: template.name || basename(file, '.json'),
            pluginId,
            pluginName
          })
        } catch (e) {
          console.error(`Failed to load MCP template ${file} from plugin ${pluginId}:`, e)
        }
      }
    } catch (e) {
      // Directory doesn't exist or other error
    }

    return templates
  }

  async activate(template: MCPTemplate, env: Record<string, string>): Promise<void> {
    const config = await this.readClaudeConfig()

    if (!config.mcpServers) {
      config.mcpServers = {}
    }

    const serverName = template.name

    // Merge provided env with template
    const mergedEnv = { ...template.env, ...env }

    config.mcpServers[serverName] = {
      name: serverName,
      type: template.type,
      command: template.command,
      args: template.args,
      url: template.url,
      env: mergedEnv,
      active: true,
      templateSource: template.pluginId
    }

    await this.writeClaudeConfig(config)
  }

  async deactivate(name: string): Promise<void> {
    const config = await this.readClaudeConfig()

    if (config.mcpServers && config.mcpServers[name]) {
      delete config.mcpServers[name]
      await this.writeClaudeConfig(config)
    }
  }

  async update(name: string, updates: Partial<MCPServer>): Promise<void> {
    const config = await this.readClaudeConfig()

    if (!config.mcpServers || !config.mcpServers[name]) {
      throw new Error(`MCP server "${name}" not found`)
    }

    const existing = config.mcpServers[name]

    config.mcpServers[name] = {
      ...existing,
      ...updates,
      name // Preserve original name
    }

    await this.writeClaudeConfig(config)
  }

  async setActive(name: string, active: boolean): Promise<void> {
    const config = await this.readClaudeConfig()

    if (!config.mcpServers || !config.mcpServers[name]) {
      throw new Error(`MCP server "${name}" not found`)
    }

    config.mcpServers[name].active = active
    await this.writeClaudeConfig(config)
  }

  private async readClaudeConfig(): Promise<ClaudeConfig> {
    // Try ~/.claude.json first
    if (await fsService.exists(CLAUDE_JSON_FILE)) {
      try {
        return await fsService.readJSON<ClaudeConfig>(CLAUDE_JSON_FILE)
      } catch {
        // Invalid JSON, return empty
      }
    }

    // Try project-level .mcp.json
    const projectMcpPath = join(process.cwd(), '.mcp.json')
    if (existsSync(projectMcpPath)) {
      try {
        const content = await readFile(projectMcpPath, 'utf-8')
        return JSON.parse(content)
      } catch {
        // Invalid JSON
      }
    }

    return {}
  }

  private async writeClaudeConfig(config: ClaudeConfig): Promise<void> {
    // Write to ~/.claude.json
    await fsService.writeJSON(CLAUDE_JSON_FILE, config, { spaces: 2 })
  }
}

export const mcpService = new MCPService()
