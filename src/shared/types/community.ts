/**
 * Represents a community contributor — a Claude Code user who shares resources.
 */
export interface CommunityContributor {
  id: string
  username: string
  displayName: string
  avatar: string            // URL or initials placeholder
  bio: string
  joinedAt: string          // ISO date
  reputation: number        // 0–100
  tags: string[]            // e.g. ["security", "frontend", "devops"]
  stats: ContributorStats
}

export interface ContributorStats {
  agents: number
  skills: number
  commands: number
  hooks: number
  totalDownloads: number
  totalLikes: number
}

/**
 * A single shared resource contributed by a community member.
 */
export interface CommunityResource {
  id: string
  contributorId: string
  type: 'agent' | 'skill' | 'command' | 'hook'
  name: string
  description: string
  version: string
  createdAt: string
  updatedAt: string
  downloads: number
  likes: number
  tags: string[]
  /** The full content (markdown body for agents/skills, JSON for hooks) */
  content: string
  /** Additional metadata depending on type */
  metadata: AgentMeta | SkillMeta | CommandMeta | HookMeta
}

export interface AgentMeta {
  type: 'agent'
  model: string
  tools: string[]
}

export interface SkillMeta {
  type: 'skill'
  userInvocable: boolean
  disableModelInvocation: boolean
  hasReference: boolean
  hasTemplates: boolean
}

export interface CommandMeta {
  type: 'command'
  prefix: string
}

export interface HookMeta {
  type: 'hook'
  event: string
  matcher?: string
}

/**
 * Community overview statistics shown at the top of the Community page.
 */
export interface CommunityOverview {
  totalContributors: number
  totalResources: number
  totalDownloads: number
  trendingTags: string[]
}

/**
 * Result of installing a community resource locally.
 */
export interface InstallResult {
  success: boolean
  message: string
}
