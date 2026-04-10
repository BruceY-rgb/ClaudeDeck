export type ProviderId = 'claude' | 'codex' | 'gemini'

export type ProviderCapability =
  | 'agents'
  | 'skills'
  | 'plugins'
  | 'commands'
  | 'hooks'
  | 'mcp'
  | 'sessions'
  | 'analytics'
  | 'projectConfig'
  | 'marketplace'

export interface ProviderDescriptor {
  id: ProviderId
  label: string
  command: string
  homeDir: string
  configPath?: string
  configFormat: 'json' | 'toml' | 'mixed'
  capabilities: ProviderCapability[]
  available: boolean
}
