import { parserService } from './ParserService'
import { pluginService } from './PluginService'
import type { Command } from '../../shared/types/command'
import { readFile } from 'fs/promises'
import { join } from 'path'

export class CommandService {
  async list(): Promise<Command[]> {
    const plugins = await pluginService.list()
    const enabledPlugins = plugins.filter(p => p.enabled)

    const allCommands: Command[] = []
    for (const plugin of enabledPlugins) {
      const detail = await pluginService.getDetail(plugin.id)
      if (detail) {
        allCommands.push(...detail.commands)
      }
    }
    return allCommands
  }

  async read(pluginId: string, commandName: string): Promise<Command | null> {
    const plugins = await pluginService.list()
    const plugin = plugins.find(p => p.id === pluginId)
    if (!plugin) return null

    const detail = await pluginService.getDetail(pluginId)
    if (!detail) return null

    return detail.commands.find(c => c.name === commandName) || null
  }
}

export const commandService = new CommandService()
