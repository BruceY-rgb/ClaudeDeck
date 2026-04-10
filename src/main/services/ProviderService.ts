import { execFile } from 'child_process'
import { promisify } from 'util'
import {
  CLAUDE_DIR,
  CLAUDE_JSON_FILE,
  CODEX_CONFIG_FILE,
  CODEX_DIR,
  GEMINI_DIR,
} from '../../shared/constants'
import type {
  ProviderCapability,
  ProviderDescriptor,
  ProviderId,
} from '../../shared/types/provider'
import { fsService } from './FileSystemService'
import { settingsService } from './SettingsService'

const execFileAsync = promisify(execFile)

const PROVIDER_CONFIG: Record<
  ProviderId,
  Omit<ProviderDescriptor, 'available'>
> = {
  claude: {
    id: 'claude',
    label: 'Claude Code',
    command: process.platform === 'win32' ? 'claude.cmd' : 'claude',
    homeDir: CLAUDE_DIR,
    configPath: CLAUDE_JSON_FILE,
    configFormat: 'json',
    capabilities: [
      'agents',
      'skills',
      'plugins',
      'commands',
      'hooks',
      'mcp',
      'sessions',
      'analytics',
      'projectConfig',
      'marketplace',
    ],
  },
  codex: {
    id: 'codex',
    label: 'Codex',
    command: process.platform === 'win32' ? 'codex.cmd' : 'codex',
    homeDir: CODEX_DIR,
    configPath: CODEX_CONFIG_FILE,
    configFormat: 'toml',
    capabilities: ['skills', 'plugins', 'mcp', 'sessions', 'analytics'],
  },
  gemini: {
    id: 'gemini',
    label: 'Gemini CLI',
    command: process.platform === 'win32' ? 'gemini.cmd' : 'gemini',
    homeDir: GEMINI_DIR,
    configPath: `${GEMINI_DIR}/settings.json`,
    configFormat: 'mixed',
    capabilities: ['skills', 'hooks', 'mcp', 'sessions'],
  },
}

export class ProviderService {
  async list(): Promise<ProviderDescriptor[]> {
    const descriptors = await Promise.all(
      (Object.keys(PROVIDER_CONFIG) as ProviderId[]).map(async (id) => ({
        ...PROVIDER_CONFIG[id],
        available: await this.isCommandAvailable(PROVIDER_CONFIG[id].command),
      })),
    )

    return descriptors
  }

  async get(id: ProviderId): Promise<ProviderDescriptor> {
    return {
      ...PROVIDER_CONFIG[id],
      available: await this.isCommandAvailable(PROVIDER_CONFIG[id].command),
    }
  }

  async getActiveProvider(): Promise<ProviderId> {
    const settings = await settingsService.read()
    return settings.activeProvider
  }

  async getCapabilities(id?: ProviderId): Promise<ProviderCapability[]> {
    const providerId = id ?? (await this.getActiveProvider())
    return PROVIDER_CONFIG[providerId].capabilities
  }

  supports(capability: ProviderCapability, providerId: ProviderId): boolean {
    return PROVIDER_CONFIG[providerId].capabilities.includes(capability)
  }

  private async isCommandAvailable(command: string): Promise<boolean> {
    try {
      await execFileAsync(command, ['--help'], { timeout: 4000 })
      return true
    } catch (error) {
      return false
    }
  }
}

export const providerService = new ProviderService()
