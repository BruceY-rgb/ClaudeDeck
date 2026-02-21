import { SETTINGS_FILE } from '../../shared/constants'
import { fsService } from './FileSystemService'
import type { Settings } from '../../shared/types/settings'

export class SettingsService {
  async read(): Promise<Settings> {
    if (!(await fsService.exists(SETTINGS_FILE))) {
      return { enabledPlugins: {}, env: {} }
    }
    return fsService.readJSON<Settings>(SETTINGS_FILE)
  }

  async write(settings: Settings): Promise<void> {
    await fsService.writeJSON(SETTINGS_FILE, settings)
  }

  async enablePlugin(pluginId: string): Promise<void> {
    const settings = await this.read()
    settings.enabledPlugins[pluginId] = true
    await this.write(settings)
  }

  async disablePlugin(pluginId: string): Promise<void> {
    const settings = await this.read()
    delete settings.enabledPlugins[pluginId]
    await this.write(settings)
  }
}

export const settingsService = new SettingsService()
