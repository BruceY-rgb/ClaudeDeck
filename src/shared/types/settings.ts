import type { ProviderId } from './provider'

export interface Settings {
  activeProvider: ProviderId
  enabledProviders: Record<ProviderId, boolean>
  alwaysThinkingEnabled?: boolean
  enabledPlugins: Partial<Record<ProviderId, Record<string, boolean>>>
  env: Record<string, string>
}
