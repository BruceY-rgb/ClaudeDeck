/**
 * MemoryService — manages cross-session and cross-user memories.
 *
 * In demo mode all data comes from mock JSON files.
 * The architecture is designed so that a real backend (REST API, database)
 * can replace the mock data source without changing the public interface.
 */

import { join } from "path"
import { readFileSync } from "fs"
import type {
  Memory,
  MemoryChain,
  MemoryOverview,
  MemoryCategory,
} from "../../shared/types/memory"

function resolveMockDir(): string {
  return join(__dirname, "..", "mock-data")
}

function loadJSON<T>(fileName: string): T {
  const filePath = join(resolveMockDir(), fileName)
  const raw = readFileSync(filePath, "utf-8")
  return JSON.parse(raw) as T
}

class MemoryService {
  private memories: Memory[] | null = null
  private chains: MemoryChain[] | null = null

  private loadMemories(): Memory[] {
    if (!this.memories) {
      this.memories = loadJSON<Memory[]>("memories.json")
    }
    return this.memories
  }

  private loadChains(): MemoryChain[] {
    if (!this.chains) {
      this.chains = loadJSON<MemoryChain[]>("memory-chains.json")
    }
    return this.chains
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  async getOverview(): Promise<MemoryOverview> {
    const memories = this.loadMemories()
    const chains = this.loadChains()

    // Category counts
    const categoryCounts = {} as Record<MemoryCategory, number>
    for (const m of memories) {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1
    }

    // Source counts
    const sourceCounts = { local: 0, shared: 0, community: 0 }
    for (const m of memories) {
      sourceCounts[m.source] = (sourceCounts[m.source] || 0) + 1
    }

    // Recent memories (last 5)
    const sorted = [...memories].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    const recentMemories = sorted.slice(0, 5)

    // Top contributors
    const contribMap = new Map<string, { id: string; name: string; avatar?: string; count: number }>()
    for (const m of memories) {
      const existing = contribMap.get(m.contributor.id)
      if (existing) {
        existing.count++
      } else {
        contribMap.set(m.contributor.id, {
          id: m.contributor.id,
          name: m.contributor.name,
          avatar: m.contributor.avatar,
          count: 1,
        })
      }
    }
    const topContributors = [...contribMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((c) => ({ id: c.id, name: c.name, avatar: c.avatar, memoryCount: c.count }))

    return {
      totalMemories: memories.length,
      totalChains: chains.length,
      categoryCounts,
      sourceCounts,
      recentMemories,
      topContributors,
    }
  }

  async list(category?: string, source?: string): Promise<Memory[]> {
    let memories = this.loadMemories()
    if (category && category !== "all") {
      memories = memories.filter((m) => m.category === category)
    }
    if (source && source !== "all") {
      memories = memories.filter((m) => m.source === source)
    }
    return memories.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  async get(id: string): Promise<Memory | null> {
    const memories = this.loadMemories()
    return memories.find((m) => m.id === id) ?? null
  }

  async search(query: string): Promise<Memory[]> {
    const memories = this.loadMemories()
    const lower = query.toLowerCase()
    return memories
      .filter(
        (m) =>
          m.title.toLowerCase().includes(lower) ||
          m.content.toLowerCase().includes(lower) ||
          m.tags.some((t) => t.toLowerCase().includes(lower)),
      )
      .map((m) => ({
        ...m,
        relevance: m.title.toLowerCase().includes(lower) ? 1.0 : 0.7,
      }))
      .sort((a, b) => (b.relevance ?? 0) - (a.relevance ?? 0))
  }

  async listChains(): Promise<MemoryChain[]> {
    return this.loadChains()
  }

  async getChain(id: string): Promise<MemoryChain | null> {
    const chains = this.loadChains()
    return chains.find((c) => c.id === id) ?? null
  }

  async getChainMemories(chainId: string): Promise<Memory[]> {
    const chain = await this.getChain(chainId)
    if (!chain) return []
    const memories = this.loadMemories()
    const idSet = new Set(chain.memoryIds)
    return chain.memoryIds
      .map((id) => memories.find((m) => m.id === id))
      .filter(Boolean) as Memory[]
  }
}

export const memoryService = new MemoryService()
