/**
 * Memory Hub — types for cross-session and cross-user memory sharing.
 *
 * A "memory" is a distilled piece of knowledge or experience extracted from
 * Claude Code sessions.  Memories can form chains that track how an insight
 * evolves across multiple sessions or even across different users.
 */

export type MemoryCategory =
  | "bug-fix"
  | "architecture"
  | "best-practice"
  | "workflow"
  | "debugging"
  | "performance"
  | "security"
  | "testing"
  | "tooling"
  | "general"

export type MemorySource = "local" | "shared" | "community"

export interface Memory {
  id: string
  /** Short, descriptive title */
  title: string
  /** Detailed content / lesson learned */
  content: string
  /** Category tag */
  category: MemoryCategory
  /** Where this memory originated */
  source: MemorySource
  /** User who contributed this memory */
  contributor: {
    id: string
    name: string
    avatar?: string
  }
  /** Project context */
  project?: {
    name: string
    path: string
  }
  /** Session that produced this memory */
  sessionId?: string
  /** Related tool / technology tags */
  tags: string[]
  /** When the memory was created */
  createdAt: string
  /** When the memory was last updated */
  updatedAt: string
  /** Number of times this memory has been referenced */
  useCount: number
  /** Optional chain ID linking related memories */
  chainId?: string
  /** Relevance score (0-1) for search ranking */
  relevance?: number
}

/**
 * A MemoryChain groups related memories that track the evolution of an
 * insight across sessions, projects, or users.
 */
export interface MemoryChain {
  id: string
  /** Human-readable chain title */
  title: string
  /** Brief description of the chain theme */
  description: string
  /** Ordered list of memory IDs in this chain */
  memoryIds: string[]
  /** Tags aggregated from all memories */
  tags: string[]
  /** When the chain was first created */
  createdAt: string
  /** When the chain was last extended */
  updatedAt: string
}

/**
 * Overview statistics for the Memory Hub dashboard.
 */
export interface MemoryOverview {
  totalMemories: number
  totalChains: number
  categoryCounts: Record<MemoryCategory, number>
  sourceCounts: Record<MemorySource, number>
  recentMemories: Memory[]
  topContributors: Array<{
    id: string
    name: string
    avatar?: string
    memoryCount: number
  }>
}
