import { pluginService } from './PluginService'
import type { HookDefinition, HookEvent, HookMatcher } from '../../shared/types/hook'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { CLAUDE_DIR } from '../../shared/constants'

// Actual hooks.json structure from plugins:
/*
{
  "hooks": {
    "SessionStart": [
      { "matcher": "...", "hooks": [...] },
      ...
    ],
    "PreToolUse": [...],
    ...
  }
}
*/

interface RawHookConfig {
  hooks?: Record<string, Array<{
    matcher: string
    hooks: Array<{
      type: 'command'
      command: string
      async?: boolean
      timeout?: number
    }>
    description?: string
  }>>
  // Fallback for old format
  matchers?: Array<{
    matcher: string
    hooks: Array<{
      type: 'command'
      command: string
      async?: boolean
      timeout?: number
    }>
  }>
}

const VALID_EVENTS: HookEvent[] = ['SessionStart', 'PreToolUse', 'PostToolUse', 'PreCompact', 'Stop', 'SessionEnd']

export class HookService {
  async list(): Promise<HookDefinition[]> {
    const allHooks: HookDefinition[] = []

    // 1. Read personal hooks (~/.claude/hooks/*.json)
    const personalHooks = await this.loadPersonalHooks()
    allHooks.push(...personalHooks)

    // 2. Read plugin hooks
    const plugins = await pluginService.list()
    const enabledPlugins = plugins.filter(p => p.enabled)

    for (const plugin of enabledPlugins) {
      const pluginHooks = await this.loadPluginHooks(plugin.id, plugin.name, plugin.installPath)
      allHooks.push(...pluginHooks)
    }

    return allHooks
  }

  private async loadPersonalHooks(): Promise<HookDefinition[]> {
    const hooks: HookDefinition[] = []
    const personalHooksDir = join(CLAUDE_DIR, 'hooks')

    if (!existsSync(personalHooksDir)) {
      return hooks
    }

    try {
      const { readdir } = await import('fs/promises')
      const files = await readdir(personalHooksDir)

      for (const file of files) {
        if (!file.endsWith('.json')) continue

        try {
          const filePath = join(personalHooksDir, file)
          const content = await readFile(filePath, 'utf-8')
          const config: RawHookConfig = JSON.parse(content)

          // Try to infer event from filename
          const event = this.inferEventFromFilename(file)
          if (event) {
            const matchers = this.extractMatchersFromConfig(config, event)
            if (matchers.length > 0) {
              hooks.push({
                pluginId: 'personal',
                pluginName: 'Personal',
                event,
                matchers
              })
            }
          }
        } catch (e) {
          console.error(`Failed to load personal hook ${file}:`, e)
        }
      }
    } catch (e) {
      // Directory doesn't exist or other error, ignore
    }

    return hooks
  }

  private async loadPluginHooks(pluginId: string, pluginName: string, pluginPath: string): Promise<HookDefinition[]> {
    const hooks: HookDefinition[] = []
    const hooksFile = join(pluginPath, 'hooks', 'hooks.json')

    if (!existsSync(hooksFile)) {
      return hooks
    }

    try {
      const content = await readFile(hooksFile, 'utf-8')
      const config: RawHookConfig = JSON.parse(content)

      // The actual structure has hooks by event type
      const hooksByEvent = config.hooks || {}

      for (const [eventStr, matchers] of Object.entries(hooksByEvent)) {
        // Validate that this is a valid event type
        const event = eventStr as HookEvent
        if (!VALID_EVENTS.includes(event)) {
          continue
        }

        const parsedMatchers: HookMatcher[] = (matchers || []).map(m => ({
          matcher: m.matcher,
          hooks: (m.hooks || []).map(h => ({
            type: 'command' as const,
            command: h.command,
            async: h.async,
            timeout: h.timeout
          }))
        }))

        if (parsedMatchers.length > 0) {
          hooks.push({
            pluginId,
            pluginName,
            event,
            matchers: parsedMatchers
          })
        }
      }
    } catch (e) {
      console.error(`Failed to load hooks from plugin ${pluginId}:`, e)
    }

    return hooks
  }

  private extractMatchersFromConfig(config: RawHookConfig, event: HookEvent): HookMatcher[] {
    // Try new format first (hooks by event)
    if (config.hooks && config.hooks[event]) {
      return config.hooks[event].map(m => ({
        matcher: m.matcher,
        hooks: (m.hooks || []).map(h => ({
          type: 'command' as const,
          command: h.command,
          async: h.async,
          timeout: h.timeout
        }))
      }))
    }

    // Fallback to old format (matchers array) - assume all matchers apply to this event
    if (config.matchers) {
      return config.matchers.map(m => ({
        matcher: m.matcher,
        hooks: (m.hooks || []).map(h => ({
          type: 'command' as const,
          command: h.command,
          async: h.async,
          timeout: h.timeout
        }))
      }))
    }

    return []
  }

  private inferEventFromFilename(filename: string): HookEvent | null {
    const name = filename.replace('.json', '').toLowerCase()

    for (const event of VALID_EVENTS) {
      if (name.includes(event.toLowerCase())) {
        return event
      }
    }

    return null
  }
}

export const hookService = new HookService()
