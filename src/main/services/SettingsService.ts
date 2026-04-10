import { SETTINGS_FILE } from '../../shared/constants'
import { fsService } from './FileSystemService'
import type { Settings } from '../../shared/types/settings'
import type { ProviderId } from '../../shared/types/provider'

const DEFAULT_SETTINGS: Settings = {
  activeProvider: 'claude',
  enabledProviders: {
    claude: true,
    codex: true,
    gemini: true,
  },
  enabledPlugins: {
    claude: {},
    codex: {},
    gemini: {},
  },
  env: {},
}

export class SettingsService {
  async read(): Promise<Settings> {
    if (!(await fsService.exists(SETTINGS_FILE))) {
      return DEFAULT_SETTINGS
    }
    const settings = await fsService.readJSON<Partial<Settings>>(SETTINGS_FILE)
    return {
      ...DEFAULT_SETTINGS,
      ...settings,
      enabledProviders: {
        ...DEFAULT_SETTINGS.enabledProviders,
        ...(settings.enabledProviders || {}),
      },
      enabledPlugins: {
        ...DEFAULT_SETTINGS.enabledPlugins,
        ...(settings.enabledPlugins || {}),
      },
      env: {
        ...DEFAULT_SETTINGS.env,
        ...(settings.env || {}),
      },
    }
  }

  async write(settings: Settings): Promise<void> {
    await fsService.writeJSON(SETTINGS_FILE, settings)
  }

  async setActiveProvider(providerId: ProviderId): Promise<void> {
    const settings = await this.read()
    settings.activeProvider = providerId
    await this.write(settings)
  }

  async enablePlugin(pluginId: string, providerId?: ProviderId): Promise<void> {
    const settings = await this.read()
    const target = providerId || settings.activeProvider
    settings.enabledPlugins[target] = settings.enabledPlugins[target] || {}
    settings.enabledPlugins[target]![pluginId] = true
    await this.write(settings)
  }

  async disablePlugin(pluginId: string, providerId?: ProviderId): Promise<void> {
    const settings = await this.read()
    const target = providerId || settings.activeProvider
    settings.enabledPlugins[target] = settings.enabledPlugins[target] || {}
    delete settings.enabledPlugins[target]![pluginId]
    await this.write(settings)
  }
}

export const settingsService = new SettingsService()
