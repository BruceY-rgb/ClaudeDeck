export interface MarketplaceSource {
  id: string
  source: { source: 'github' | 'git'; repo?: string; url?: string }
  installLocation: string
  lastUpdated: string
}

export interface MarketplacePlugin {
  id: string
  name: string
  description: string
  version: string
  author: string
  repository?: string
  readmePath?: string
  marketplaceId: string
}

export interface MarketplacePluginDetail extends MarketplacePlugin {
  agents: Array<{ name: string; path: string }>
  skills: Array<{ name: string; path: string }>
  commands: Array<{ name: string; path: string }>
  hooks: Array<{ name: string; path: string }>
  mcpConfigs: Array<{ name: string; path: string }>
}

export interface InstalledPluginRecord {
  id: string
  name: string
  marketplace: string
  version: string
  installedAt: string
  lastUpdated: string
  installPath: string
  gitCommitSha: string
  isLocal: boolean
}
