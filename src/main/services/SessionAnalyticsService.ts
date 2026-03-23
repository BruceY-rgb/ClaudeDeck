import * as fs from "fs"
import * as path from "path"
import * as os from "os"
import { createReadStream } from "fs"
import { createInterface } from "readline"
import type {
  AnalyticsData,
  AnalyticsIndex,
  ActivityDay,
  SessionStats,
  WrappedData,
} from "../../shared/types/session-detail"

// ─── Pricing (per 1M tokens) — mirrors session-parser.worker.ts ─────────────

interface ModelPricing {
  input: number
  output: number
  cacheRead: number
  cacheCreation: number
}

const PRICING: Record<string, ModelPricing> = {
  opus: { input: 15, output: 75, cacheRead: 1.875, cacheCreation: 18.75 },
  sonnet: { input: 3, output: 15, cacheRead: 0.30, cacheCreation: 3.75 },
  haiku: { input: 0.80, output: 4, cacheRead: 0.08, cacheCreation: 1.00 },
}

function getPricing(model?: string): ModelPricing {
  if (!model) return PRICING.sonnet
  const lower = model.toLowerCase()
  if (lower.includes("opus")) return PRICING.opus
  if (lower.includes("haiku")) return PRICING.haiku
  return PRICING.sonnet
}

function computeCost(
  pricing: ModelPricing,
  input: number,
  output: number,
  cacheRead: number,
  cacheCreation: number,
): number {
  return (
    (input / 1_000_000) * pricing.input +
    (output / 1_000_000) * pricing.output +
    (cacheRead / 1_000_000) * pricing.cacheRead +
    (cacheCreation / 1_000_000) * pricing.cacheCreation
  )
}

// ─── JSONL entry types to skip ──────────────────────────────────────────────

const SKIP_TYPES = new Set(["file-history-snapshot", "summary", "queue-operation"])

// ─── Constants ──────────────────────────────────────────────────────────────

const CLAUDE_DIR = path.join(os.homedir(), ".claude")
const PROJECTS_DIR = path.join(CLAUDE_DIR, "projects")
const CACHE_DIR = path.join(CLAUDE_DIR, ".deck-cache")
const INDEX_FILE = path.join(CACHE_DIR, "analytics-index.json")

const INDEX_VERSION = 1

// ─── Extracted stats shape ──────────────────────────────────────────────────

interface ExtractedStats {
  stats: SessionStats
  model: string
  timestamp: string
  toolCounts: Record<string, number>
  errorCount: number
}

// ─── Scanned file info ──────────────────────────────────────────────────────

interface ScannedFile {
  filePath: string
  projectPath: string
  sessionId: string
  mtime: number
}

// ─── Service ────────────────────────────────────────────────────────────────

class SessionAnalyticsService {
  private index: AnalyticsIndex | null = null

  // ── Index persistence ─────────────────────────────────────────────────

  private async loadIndex(): Promise<AnalyticsIndex> {
    if (this.index) return this.index

    try {
      const raw = fs.readFileSync(INDEX_FILE, "utf-8")
      const parsed = JSON.parse(raw) as AnalyticsIndex

      // Validate version; if mismatched, start fresh
      if (parsed && typeof parsed === "object" && parsed.version === INDEX_VERSION && parsed.sessions) {
        this.index = parsed
        return this.index
      }
    } catch {
      // File missing, corrupt, or wrong version — start fresh
    }

    this.index = {
      version: INDEX_VERSION,
      lastUpdated: new Date().toISOString(),
      sessions: {},
    }
    return this.index
  }

  private async saveIndex(): Promise<void> {
    if (!this.index) return

    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true })
      this.index.lastUpdated = new Date().toISOString()
      fs.writeFileSync(INDEX_FILE, JSON.stringify(this.index), "utf-8")
    } catch (err) {
      console.error("[SessionAnalyticsService] Failed to save index:", err)
    }
  }

  // ── File scanning ─────────────────────────────────────────────────────

  /**
   * Decode an encoded directory name back to the original path.
   * e.g. -Users-foo-bar -> /Users/foo/bar
   */
  private decodeDirName(encoded: string): string {
    // The encoding replaces leading `/` and all `/` with `-`.
    // e.g. `/Users/foo/bar` -> `-Users-foo-bar`
    // To reverse: if it starts with `-`, the first char was `/`,
    // then each `-` was originally `/`.
    if (encoded.startsWith("-")) {
      return encoded.replace(/-/g, "/")
    }
    return encoded
  }

  /**
   * Scan all JSONL session files under ~/.claude/projects/ recursively.
   */
  private async scanAllSessions(): Promise<ScannedFile[]> {
    const results: ScannedFile[] = []

    let projectDirs: string[]
    try {
      projectDirs = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
    } catch {
      // projects directory doesn't exist yet
      return results
    }

    for (const encodedDir of projectDirs) {
      const projectPath = this.decodeDirName(encodedDir)
      const dirFullPath = path.join(PROJECTS_DIR, encodedDir)

      let files: string[]
      try {
        files = fs.readdirSync(dirFullPath)
          .filter((f) => f.endsWith(".jsonl"))
      } catch {
        continue
      }

      for (const file of files) {
        const filePath = path.join(dirFullPath, file)
        const sessionId = file.replace(/\.jsonl$/, "")

        let mtime: number
        try {
          const stat = fs.statSync(filePath)
          mtime = Math.floor(stat.mtimeMs)
        } catch {
          // File may have been deleted between listing and stat
          continue
        }

        results.push({ filePath, projectPath, sessionId, mtime })
      }
    }

    return results
  }

  // ── Lightweight stats extraction ──────────────────────────────────────

  /**
   * Extract only stats from a JSONL file (no full message parsing).
   * Uses streaming readline. Deduplicates token counts by requestId.
   */
  private async extractStats(filePath: string): Promise<ExtractedStats> {
    const stats: SessionStats = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCacheReadTokens: 0,
      totalCacheCreationTokens: 0,
      estimatedCostUsd: 0,
      durationSeconds: 0,
    }

    let firstTimestamp: string | null = null
    let lastTimestamp: string | null = null
    let model = ""
    const toolCounts: Record<string, number> = {}
    let errorCount = 0

    // For requestId deduplication: store the last usage seen per requestId
    const usageByRequestId = new Map<string, {
      model?: string
      inputTokens: number
      outputTokens: number
      cacheReadTokens: number
      cacheCreationTokens: number
    }>()

    const rl = createInterface({
      input: createReadStream(filePath, { encoding: "utf-8" }),
      crlfDelay: Infinity,
    })

    try {
      for await (const line of rl) {
        if (!line.trim()) continue

        let entry: Record<string, unknown>
        try {
          entry = JSON.parse(line)
        } catch {
          continue
        }

        if (!entry || typeof entry !== "object") continue

        const entryType = entry.type as string | undefined
        if (entryType && SKIP_TYPES.has(entryType)) continue

        // Only care about user and assistant entries
        if (entryType !== "user" && entryType !== "assistant") continue

        const timestamp = entry.timestamp as string | undefined
        if (timestamp) {
          if (!firstTimestamp) firstTimestamp = timestamp
          lastTimestamp = timestamp
        }

        const message = entry.message as Record<string, unknown> | undefined
        if (!message) continue

        const entryModel = message.model as string | undefined
        if (entryModel) model = entryModel

        // Count tool_use blocks and tool_result errors from content
        const content = message.content
        if (Array.isArray(content)) {
          for (const block of content) {
            if (!block || typeof block !== "object") continue
            const blockRec = block as Record<string, unknown>
            const blockType = blockRec.type as string | undefined

            if (blockType === "tool_use") {
              const toolName = blockRec.name as string | undefined
              if (toolName) {
                toolCounts[toolName] = (toolCounts[toolName] || 0) + 1
              }
            }

            if (blockType === "tool_result") {
              if (blockRec.is_error === true) {
                errorCount++
              }
            }
          }
        }

        // Track usage by requestId for deduplication
        const requestId = entry.requestId as string | undefined
        const usage = message.usage as Record<string, unknown> | undefined

        if (requestId && usage) {
          usageByRequestId.set(requestId, {
            model: entryModel,
            inputTokens: (usage.input_tokens as number) || 0,
            outputTokens: (usage.output_tokens as number) || 0,
            cacheReadTokens: (usage.cache_read_input_tokens as number) || 0,
            cacheCreationTokens: (usage.cache_creation_input_tokens as number) || 0,
          })
        }
      }
    } catch (err) {
      console.error("[SessionAnalyticsService] Error reading file:", filePath, err)
    }

    // Aggregate deduplicated usage (only the last entry per requestId)
    for (const [, usage] of usageByRequestId) {
      stats.totalInputTokens += usage.inputTokens
      stats.totalOutputTokens += usage.outputTokens
      stats.totalCacheReadTokens += usage.cacheReadTokens
      stats.totalCacheCreationTokens += usage.cacheCreationTokens

      const pricing = getPricing(usage.model)
      stats.estimatedCostUsd += computeCost(
        pricing,
        usage.inputTokens,
        usage.outputTokens,
        usage.cacheReadTokens,
        usage.cacheCreationTokens,
      )
    }

    // Compute duration
    if (firstTimestamp && lastTimestamp) {
      const start = new Date(firstTimestamp).getTime()
      const end = new Date(lastTimestamp).getTime()
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        stats.durationSeconds = Math.round((end - start) / 1000)
      }
    }

    return {
      stats,
      model,
      timestamp: firstTimestamp || "",
      toolCounts,
      errorCount,
    }
  }

  // ── Incremental update ────────────────────────────────────────────────

  /**
   * Incrementally update the analytics index:
   * - Load from disk (or create fresh)
   * - Scan all session files
   * - Only re-parse changed/new files (mtime comparison)
   * - Remove stale entries
   * - Save updated index
   */
  private async refreshIndex(): Promise<AnalyticsIndex> {
    const index = await this.loadIndex()
    const scannedFiles = await this.scanAllSessions()

    // Build a set of current file paths for stale removal
    const currentPaths = new Set<string>()

    // Process each scanned file
    const parsePromises: Array<Promise<void>> = []

    for (const file of scannedFiles) {
      currentPaths.add(file.filePath)

      const existing = index.sessions[file.filePath]

      // If file exists in index and mtime matches, skip
      if (existing && existing.mtime === file.mtime) {
        continue
      }

      // New or changed file — parse it
      const parsePromise = this.extractStats(file.filePath)
        .then((extracted) => {
          index.sessions[file.filePath] = {
            sessionId: file.sessionId,
            projectPath: file.projectPath,
            filePath: file.filePath,
            mtime: file.mtime,
            stats: extracted.stats,
            model: extracted.model || undefined,
            timestamp: extracted.timestamp,
            toolCounts: extracted.toolCounts,
            errorCount: extracted.errorCount,
          }
        })
        .catch((err) => {
          console.error("[SessionAnalyticsService] Failed to parse:", file.filePath, err)
        })

      parsePromises.push(parsePromise)
    }

    // Wait for all new/changed files to be parsed
    await Promise.all(parsePromises)

    // Remove entries for files that no longer exist
    for (const filePath of Object.keys(index.sessions)) {
      if (!currentPaths.has(filePath)) {
        delete index.sessions[filePath]
      }
    }

    this.index = index
    await this.saveIndex()

    return index
  }

  // ── Time range helpers ────────────────────────────────────────────────

  private getTimeRangeStart(timeRange: "7d" | "30d" | "90d" | "year"): Date {
    const now = new Date()
    switch (timeRange) {
      case "7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case "30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case "90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      case "year":
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  private filterSessionsByTimeRange(
    index: AnalyticsIndex,
    timeRange: "7d" | "30d" | "90d" | "year",
  ): Array<AnalyticsIndex["sessions"][string]> {
    const rangeStart = this.getTimeRangeStart(timeRange)
    const sessions: Array<AnalyticsIndex["sessions"][string]> = []

    for (const session of Object.values(index.sessions)) {
      if (!session.timestamp) continue
      const sessionDate = new Date(session.timestamp)
      if (isNaN(sessionDate.getTime())) continue
      if (sessionDate >= rangeStart) {
        sessions.push(session)
      }
    }

    return sessions
  }

  // ── Date formatting helper ────────────────────────────────────────────

  private formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // ── Public API ────────────────────────────────────────────────────────

  /**
   * Get analytics summary for a time range.
   */
  async getSummary(timeRange: "7d" | "30d" | "90d" | "year"): Promise<AnalyticsData> {
    const index = await this.refreshIndex()
    const sessions = this.filterSessionsByTimeRange(index, timeRange)

    let totalCostUsd = 0
    let totalInputTokens = 0
    let totalOutputTokens = 0
    let totalCacheReadTokens = 0
    let totalCacheCreationTokens = 0
    let totalDurationSeconds = 0

    const dayCountMap: Record<string, number> = {}
    const modelUsage: Record<string, number> = {}
    const projectMap: Record<string, { sessionCount: number; totalCost: number }> = {}
    const toolUsage: Record<string, number> = {}

    for (const session of sessions) {
      const s = session.stats

      totalCostUsd += s.estimatedCostUsd
      totalInputTokens += s.totalInputTokens
      totalOutputTokens += s.totalOutputTokens
      totalCacheReadTokens += s.totalCacheReadTokens
      totalCacheCreationTokens += s.totalCacheCreationTokens
      totalDurationSeconds += s.durationSeconds

      // Activity by day
      if (session.timestamp) {
        const dateStr = session.timestamp.slice(0, 10) // YYYY-MM-DD
        dayCountMap[dateStr] = (dayCountMap[dateStr] || 0) + 1
      }

      // Model usage: aggregate total tokens per model tier
      if (session.model) {
        const totalTokensForSession =
          s.totalInputTokens + s.totalOutputTokens + s.totalCacheReadTokens + s.totalCacheCreationTokens
        const tier = this.getModelTier(session.model)
        modelUsage[tier] = (modelUsage[tier] || 0) + totalTokensForSession
      }

      // Project aggregation
      const proj = session.projectPath
      if (!projectMap[proj]) {
        projectMap[proj] = { sessionCount: 0, totalCost: 0 }
      }
      projectMap[proj].sessionCount++
      projectMap[proj].totalCost += s.estimatedCostUsd

      // Tool usage
      if (session.toolCounts) {
        for (const [tool, count] of Object.entries(session.toolCounts)) {
          toolUsage[tool] = (toolUsage[tool] || 0) + count
        }
      }
    }

    const totalSessions = sessions.length

    // Build activityByDay: sort by date
    const activityByDay: ActivityDay[] = Object.entries(dayCountMap)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Top 10 projects by session count
    const topProjects = Object.entries(projectMap)
      .map(([projectPath, data]) => ({
        projectPath,
        sessionCount: data.sessionCount,
        totalCost: data.totalCost,
      }))
      .sort((a, b) => b.sessionCount - a.sessionCount)
      .slice(0, 10)

    return {
      totalSessions,
      totalCostUsd,
      totalInputTokens,
      totalOutputTokens,
      totalCacheReadTokens,
      totalCacheCreationTokens,
      totalDurationSeconds,
      averageCostPerSession: totalSessions > 0 ? totalCostUsd / totalSessions : 0,
      averageDurationSeconds: totalSessions > 0 ? totalDurationSeconds / totalSessions : 0,
      activityByDay,
      modelUsage,
      topProjects,
      toolUsage,
    }
  }

  /**
   * Get heatmap data: daily session counts for the past 365 days.
   * Includes days with 0 count.
   */
  async getHeatmap(): Promise<ActivityDay[]> {
    const index = await this.refreshIndex()

    // Build a count map from all sessions
    const dayCountMap: Record<string, number> = {}
    for (const session of Object.values(index.sessions)) {
      if (!session.timestamp) continue
      const dateStr = session.timestamp.slice(0, 10)
      dayCountMap[dateStr] = (dayCountMap[dateStr] || 0) + 1
    }

    // Generate all 365 days
    const result: ActivityDay[] = []
    const now = new Date()
    for (let i = 364; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = this.formatDate(date)
      result.push({
        date: dateStr,
        count: dayCountMap[dateStr] || 0,
      })
    }

    return result
  }

  /**
   * Get "wrapped" data: all-time summary with highlights.
   */
  async getWrapped(): Promise<WrappedData> {
    const index = await this.refreshIndex()

    const allSessions = Object.values(index.sessions)

    let totalCostUsd = 0
    let totalTokens = 0
    let totalDurationSeconds = 0

    let longestSession: { sessionId: string; durationSeconds: number } | null = null
    let mostExpensiveSession: { sessionId: string; costUsd: number } | null = null

    const modelTokenMap: Record<string, number> = {}
    const toolUsageMap: Record<string, number> = {}
    const hourCounts: number[] = new Array(24).fill(0)
    const dayCountMap: Record<string, number> = {}

    for (const session of allSessions) {
      const s = session.stats
      const sessionTokens =
        s.totalInputTokens + s.totalOutputTokens + s.totalCacheReadTokens + s.totalCacheCreationTokens

      totalCostUsd += s.estimatedCostUsd
      totalTokens += sessionTokens
      totalDurationSeconds += s.durationSeconds

      // Longest session
      if (!longestSession || s.durationSeconds > longestSession.durationSeconds) {
        longestSession = { sessionId: session.sessionId, durationSeconds: s.durationSeconds }
      }

      // Most expensive session
      if (!mostExpensiveSession || s.estimatedCostUsd > mostExpensiveSession.costUsd) {
        mostExpensiveSession = { sessionId: session.sessionId, costUsd: s.estimatedCostUsd }
      }

      // Model token aggregation
      if (session.model) {
        const tier = this.getModelTier(session.model)
        modelTokenMap[tier] = (modelTokenMap[tier] || 0) + sessionTokens
      }

      // Tool usage
      if (session.toolCounts) {
        for (const [tool, count] of Object.entries(session.toolCounts)) {
          toolUsageMap[tool] = (toolUsageMap[tool] || 0) + count
        }
      }

      // Hour of day
      if (session.timestamp) {
        const date = new Date(session.timestamp)
        if (!isNaN(date.getTime())) {
          hourCounts[date.getHours()]++
        }

        // Day count for activity and streak
        const dateStr = session.timestamp.slice(0, 10)
        dayCountMap[dateStr] = (dayCountMap[dateStr] || 0) + 1
      }
    }

    // Favorite model: model tier with the most tokens
    let favoriteModel: string | null = null
    let maxModelTokens = 0
    for (const [tier, tokens] of Object.entries(modelTokenMap)) {
      if (tokens > maxModelTokens) {
        maxModelTokens = tokens
        favoriteModel = tier
      }
    }

    // Top 10 tools
    const topTools = Object.entries(toolUsageMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Peak hour
    let peakHour: number | null = null
    let maxHourCount = 0
    for (let h = 0; h < 24; h++) {
      if (hourCounts[h] > maxHourCount) {
        maxHourCount = hourCounts[h]
        peakHour = h
      }
    }

    // Streak: longest consecutive days with at least 1 session
    const streak = this.computeStreak(dayCountMap)

    // Activity by day for the past year (with 0-count days)
    const activityByDay: ActivityDay[] = []
    const now = new Date()
    for (let i = 364; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = this.formatDate(date)
      activityByDay.push({
        date: dateStr,
        count: dayCountMap[dateStr] || 0,
      })
    }

    return {
      totalSessions: allSessions.length,
      totalCostUsd,
      totalTokens,
      totalDurationSeconds,
      longestSession,
      mostExpensiveSession,
      favoriteModel,
      topTools,
      activityByDay,
      peakHour,
      streak,
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  private getModelTier(model: string): string {
    const lower = model.toLowerCase()
    if (lower.includes("opus")) return "opus"
    if (lower.includes("haiku")) return "haiku"
    return "sonnet"
  }

  /**
   * Compute the longest consecutive-day streak from a date -> count map.
   */
  private computeStreak(dayCountMap: Record<string, number>): number {
    const activeDates = Object.keys(dayCountMap)
      .filter((d) => dayCountMap[d] > 0)
      .sort()

    if (activeDates.length === 0) return 0

    let maxStreak = 1
    let currentStreak = 1

    for (let i = 1; i < activeDates.length; i++) {
      const prev = new Date(activeDates[i - 1])
      const curr = new Date(activeDates[i])
      const diffMs = curr.getTime() - prev.getTime()
      const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))

      if (diffDays === 1) {
        currentStreak++
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak
        }
      } else {
        currentStreak = 1
      }
    }

    return maxStreak
  }
}

export const sessionAnalyticsService = new SessionAnalyticsService()
