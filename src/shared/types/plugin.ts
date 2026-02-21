export interface InstalledPlugin {
  id: string
  name: string
  marketplace: string
  version: string
  installedAt: string
  lastUpdated: string
  installPath: string
  gitCommitSha: string
  isLocal: boolean
  enabled: boolean
}

export interface PluginManifest {
  name: string
  version: string
  description: string
  author?: { name: string; url?: string; email?: string }
  license?: string
  keywords?: string[]
  skills?: string[]
  agents?: string[]
}
