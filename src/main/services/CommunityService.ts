import { join } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'
import { homedir } from 'os'
import { is } from '@electron-toolkit/utils'
import { fsService } from './FileSystemService'
import { parserService } from './ParserService'
import type {
  CommunityContributor,
  CommunityResource,
  CommunityOverview,
  InstallResult
} from '../../shared/types/community'

const CLAUDE_DIR = join(homedir(), '.claude')
const AGENTS_DIR = join(CLAUDE_DIR, 'agents')
const SKILLS_DIR = join(CLAUDE_DIR, 'skills')

/**
 * CommunityService manages the community sharing hub.
 *
 * In the current version it loads contributor and resource data from a bundled
 * JSON file (resources/demo-data/community.json). The architecture is designed
 * so that this data source can be swapped for a real API in the future without
 * changing the IPC contract or frontend code.
 */
export class CommunityService {
  private contributors: CommunityContributor[] = []
  private resources: CommunityResource[] = []
  private loaded = false

  /**
   * Lazy-load community data from the bundled JSON file.
   */
  private ensureLoaded(): void {
    if (this.loaded) return

    const dataPath = this.getDataPath()
    if (!existsSync(dataPath)) {
      console.warn('[Community] community.json not found at', dataPath)
      this.loaded = true
      return
    }

    try {
      const raw = readFileSync(dataPath, 'utf-8')
      const data = JSON.parse(raw)
      this.contributors = data.contributors || []
      this.resources = data.resources || []
      this.loaded = true
      console.log(`[Community] Loaded ${this.contributors.length} contributors, ${this.resources.length} resources`)
    } catch (err) {
      console.error('[Community] Failed to load community data:', err)
      this.loaded = true
    }
  }

  private getDataPath(): string {
    if (is.dev) {
      return join(__dirname, '../../resources/demo-data/community.json')
    }
    return join(process.resourcesPath, 'resources/demo-data/community.json')
  }

  /**
   * Get community overview statistics.
   */
  getOverview(): CommunityOverview {
    this.ensureLoaded()

    const totalDownloads = this.resources.reduce((sum, r) => sum + r.downloads, 0)

    // Compute trending tags by frequency
    const tagCounts: Record<string, number> = {}
    for (const r of this.resources) {
      for (const tag of r.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }
    const trendingTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag]) => tag)

    return {
      totalContributors: this.contributors.length,
      totalResources: this.resources.length,
      totalDownloads,
      trendingTags
    }
  }

  /**
   * List all contributors, optionally filtered by search query.
   */
  listContributors(query?: string): CommunityContributor[] {
    this.ensureLoaded()

    if (!query) return this.contributors

    const q = query.toLowerCase()
    return this.contributors.filter(c =>
      c.username.toLowerCase().includes(q) ||
      c.displayName.toLowerCase().includes(q) ||
      c.bio.toLowerCase().includes(q) ||
      c.tags.some(t => t.toLowerCase().includes(q))
    )
  }

  /**
   * Get a single contributor by ID.
   */
  getContributor(id: string): CommunityContributor | null {
    this.ensureLoaded()
    return this.contributors.find(c => c.id === id) || null
  }

  /**
   * List resources, optionally filtered by contributor ID and/or type.
   */
  listResources(contributorId?: string, type?: string): CommunityResource[] {
    this.ensureLoaded()

    let results = this.resources
    if (contributorId) {
      results = results.filter(r => r.contributorId === contributorId)
    }
    if (type && type !== 'all') {
      results = results.filter(r => r.type === type)
    }
    return results
  }

  /**
   * Get a single resource by ID.
   */
  getResource(id: string): CommunityResource | null {
    this.ensureLoaded()
    return this.resources.find(r => r.id === id) || null
  }

  /**
   * Search across all resources by query string.
   */
  search(query: string): CommunityResource[] {
    this.ensureLoaded()

    const q = query.toLowerCase()
    return this.resources.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.tags.some(t => t.toLowerCase().includes(q))
    )
  }

  /**
   * Install a community resource to the local Claude Code configuration.
   */
  async installResource(resourceId: string): Promise<InstallResult> {
    this.ensureLoaded()

    const resource = this.resources.find(r => r.id === resourceId)
    if (!resource) {
      return { success: false, message: 'Resource not found' }
    }

    try {
      switch (resource.type) {
        case 'agent':
          return await this.installAgent(resource)
        case 'skill':
          return await this.installSkill(resource)
        default:
          return { success: false, message: `Installation of ${resource.type} resources is not yet supported` }
      }
    } catch (err) {
      return { success: false, message: `Installation failed: ${err}` }
    }
  }

  private async installAgent(resource: CommunityResource): Promise<InstallResult> {
    const filePath = join(AGENTS_DIR, `${resource.name}.md`)
    if (existsSync(filePath)) {
      return { success: false, message: `Agent "${resource.name}" already exists locally` }
    }

    mkdirSync(AGENTS_DIR, { recursive: true })
    writeFileSync(filePath, resource.content, 'utf-8')
    return { success: true, message: `Agent "${resource.name}" installed successfully` }
  }

  private async installSkill(resource: CommunityResource): Promise<InstallResult> {
    const skillDir = join(SKILLS_DIR, resource.name)
    const skillFile = join(skillDir, 'SKILL.md')
    if (existsSync(skillFile)) {
      return { success: false, message: `Skill "${resource.name}" already exists locally` }
    }

    mkdirSync(skillDir, { recursive: true })
    writeFileSync(skillFile, resource.content, 'utf-8')
    return { success: true, message: `Skill "${resource.name}" installed successfully` }
  }
}

export const communityService = new CommunityService()
