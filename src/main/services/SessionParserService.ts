import * as path from "path"
import * as fs from "fs"
import * as os from "os"
import { createReadStream } from "fs"
import { createInterface } from "readline"
import { CODEX_SESSIONS_DIR } from "../../shared/constants"
import type {
  ParsedSession,
  ParsedMessage,
  ParsedContentBlock,
  SessionStats,
} from "../../shared/types/session-detail"
import { settingsService } from "./SettingsService"

// ─── LRU Cache ──────────────────────────────────────────────────────────────

class LRUCache<V> {
  private max: number
  private cache = new Map<string, V>()

  constructor(max: number) {
    this.max = max
  }

  get(key: string): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key)
      this.cache.set(key, value)
    }
    return value
  }

  set(key: string, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.max) {
      // Evict oldest (first key)
      const firstKey = this.cache.keys().next().value
      if (firstKey !== undefined) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }
}

// ─── Pricing (per 1M tokens) ───────────────────────────────────────────────

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

// Max line size: 10 MB
const MAX_LINE_BYTES = 10 * 1024 * 1024

// ─── Content block parser ───────────────────────────────────────────────────

function parseContentBlocks(
  content: unknown,
  toolUseResult?: unknown,
): ParsedContentBlock[] {
  const blocks: ParsedContentBlock[] = []

  if (typeof content === "string") {
    blocks.push({ type: "text", text: content })
    return blocks
  }

  if (!Array.isArray(content)) return blocks

  for (const block of content) {
    if (!block || typeof block !== "object") continue

    const blockType = (block as Record<string, unknown>).type as string | undefined

    switch (blockType) {
      case "text": {
        blocks.push({
          type: "text",
          text: (block as Record<string, unknown>).text as string || "",
        })
        break
      }
      case "tool_use": {
        blocks.push({
          type: "tool_use",
          toolUseId: (block as Record<string, unknown>).id as string || "",
          toolName: (block as Record<string, unknown>).name as string || "",
          input: (block as Record<string, unknown>).input as Record<string, unknown> || {},
        })
        break
      }
      case "tool_result": {
        const toolResultBlock = block as Record<string, unknown>
        let output = ""
        let filePath: string | undefined
        let fileContent: string | undefined
        const isError = toolResultBlock.is_error === true

        const innerContent = toolResultBlock.content
        if (typeof innerContent === "string") {
          output = innerContent
        } else if (Array.isArray(innerContent)) {
          const textParts: string[] = []
          for (const inner of innerContent) {
            if (inner && typeof inner === "object" && (inner as Record<string, unknown>).type === "text") {
              textParts.push((inner as Record<string, unknown>).text as string || "")
            }
          }
          output = textParts.join("\n")
        }

        if (toolUseResult && typeof toolUseResult === "object") {
          const tur = toolUseResult as Record<string, unknown>
          if (tur.file && typeof tur.file === "object") {
            const fileObj = tur.file as Record<string, unknown>
            filePath = (fileObj.filePath as string) || undefined
            fileContent = (fileObj.content as string) || undefined
          }
          if (!filePath && tur.filePath) {
            filePath = tur.filePath as string
          }
          if (!fileContent && tur.content && typeof tur.content === "string") {
            fileContent = tur.content as string
          }
        }

        blocks.push({
          type: "tool_result",
          toolUseId: toolResultBlock.tool_use_id as string || "",
          output,
          filePath,
          fileContent,
          isError,
        })
        break
      }
      case "thinking": {
        blocks.push({
          type: "thinking",
          text: (block as Record<string, unknown>).thinking as string || "",
        })
        break
      }
      case "redacted_thinking": {
        blocks.push({
          type: "redacted_thinking",
          text: "[redacted]",
        })
        break
      }
      default:
        break
    }
  }

  return blocks
}

// ─── JSONL parser ───────────────────────────────────────────────────────────

async function parseJSONL(
  filePath: string,
  sessionId: string,
  projectPath: string,
  gitBranch?: string,
): Promise<ParsedSession> {
  const entriesByRequestId = new Map<string, { entry: Record<string, unknown>; lineIndex: number }>()
  const entriesByUuid = new Map<string, { entry: Record<string, unknown>; lineIndex: number }>()
  const orderedEntries: Array<{ entry: Record<string, unknown>; lineIndex: number }> = []

  let lineIndex = 0

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    lineIndex++

    if (!line.trim()) continue
    if (Buffer.byteLength(line, "utf-8") > MAX_LINE_BYTES) continue

    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }

    if (!entry || typeof entry !== "object") continue

    const entryType = entry.type as string | undefined
    if (entryType && SKIP_TYPES.has(entryType)) continue
    if (entryType !== "user" && entryType !== "assistant") continue

    const requestId = entry.requestId as string | undefined
    const uuid = entry.uuid as string | undefined

    if (requestId) {
      entriesByRequestId.set(requestId, { entry, lineIndex })
    }
    if (uuid) {
      entriesByUuid.set(uuid, { entry, lineIndex })
    }
    orderedEntries.push({ entry, lineIndex })
  }

  // Deduplicate: keep last occurrence per uuid/requestId
  const seenUuids = new Set<string>()
  const seenRequestIds = new Set<string>()
  const finalEntries: Array<{ entry: Record<string, unknown>; lineIndex: number }> = []

  for (let i = orderedEntries.length - 1; i >= 0; i--) {
    const item = orderedEntries[i]
    const uuid = item.entry.uuid as string | undefined
    const requestId = item.entry.requestId as string | undefined

    if (uuid) {
      if (seenUuids.has(uuid)) continue
      seenUuids.add(uuid)
    }

    if (requestId && !uuid) {
      if (seenRequestIds.has(requestId)) continue
      seenRequestIds.add(requestId)
    }

    finalEntries.push(item)
  }

  finalEntries.reverse()

  // Build messages and stats
  const messages: ParsedMessage[] = []
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

  for (const { entry } of finalEntries) {
    const entryType = entry.type as string
    const message = entry.message as Record<string, unknown> | undefined
    const timestamp = entry.timestamp as string || ""
    const uuid = entry.uuid as string || `line-${Math.random().toString(36).slice(2)}`
    const requestId = entry.requestId as string | undefined

    if (timestamp) {
      if (!firstTimestamp) firstTimestamp = timestamp
      lastTimestamp = timestamp
    }

    if (!message) continue

    const model = message.model as string | undefined
    const content = message.content
    const toolUseResult = entry.toolUseResult as unknown

    const contentBlocks = parseContentBlocks(content, toolUseResult)
    // Use the isMeta field from the JSONL entry, or fallback to contentBlocks check for backward compatibility
    const isMeta = (entry.isMeta as boolean | undefined) ?? (contentBlocks.length === 0)
    const isSidechain = !!(entry.isSidechain)

    const parsed: ParsedMessage = {
      id: uuid,
      role: entryType as "user" | "assistant",
      timestamp,
      model,
      content: contentBlocks,
      isMeta,
      isSidechain,
    }

    messages.push(parsed)

    if (requestId) {
      const finalForRequest = entriesByRequestId.get(requestId)
      if (finalForRequest && finalForRequest.entry === entry) {
        const usage = message.usage as Record<string, unknown> | undefined
        if (usage) {
          const inputTokens = (usage.input_tokens as number) || 0
          const outputTokens = (usage.output_tokens as number) || 0
          const cacheReadTokens = (usage.cache_read_input_tokens as number) || 0
          const cacheCreationTokens = (usage.cache_creation_input_tokens as number) || 0

          stats.totalInputTokens += inputTokens
          stats.totalOutputTokens += outputTokens
          stats.totalCacheReadTokens += cacheReadTokens
          stats.totalCacheCreationTokens += cacheCreationTokens

          const pricing = getPricing(model)
          stats.estimatedCostUsd += computeCost(
            pricing,
            inputTokens,
            outputTokens,
            cacheReadTokens,
            cacheCreationTokens,
          )
        }
      }
    }
  }

  if (firstTimestamp && lastTimestamp) {
    const start = new Date(firstTimestamp).getTime()
    const end = new Date(lastTimestamp).getTime()
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      stats.durationSeconds = Math.round((end - start) / 1000)
    }
  }

  return {
    sessionId,
    provider: "claude",
    projectPath,
    gitBranch,
    messages,
    stats,
  }
}

async function parseCodexJSONL(
  filePath: string,
  sessionId: string,
  projectPath: string,
): Promise<ParsedSession> {
  const messages: ParsedMessage[] = []
  const stats: SessionStats = {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCacheReadTokens: 0,
    totalCacheCreationTokens: 0,
    estimatedCostUsd: 0,
    durationSeconds: 0,
    costUnavailable: true,
  }

  let firstTimestamp: string | undefined
  let lastTimestamp: string | undefined

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  })

  let index = 0
  for await (const line of rl) {
    if (!line.trim()) continue

    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(line)
    } catch {
      continue
    }

    const timestamp = entry.timestamp as string | undefined
    if (timestamp && !firstTimestamp) firstTimestamp = timestamp
    if (timestamp) lastTimestamp = timestamp

    if (entry.type !== "response_item") continue
    const payload = entry.payload as Record<string, unknown> | undefined
    if (!payload || payload.type !== "message") continue

    const role = payload.role as "user" | "assistant" | undefined
    if (role !== "user" && role !== "assistant") continue

    const contentBlocks = Array.isArray(payload.content) ? payload.content : []
    const content: ParsedContentBlock[] = []

    for (const block of contentBlocks) {
      if (!block || typeof block !== "object") continue
      const typedBlock = block as Record<string, unknown>
      if (typedBlock.type === "input_text" || typedBlock.type === "output_text") {
        content.push({ type: "text", text: String(typedBlock.text || "") })
      }
    }

    if (content.length === 0) continue
    messages.push({
      id: `${sessionId}-${index++}`,
      role,
      timestamp: timestamp || new Date().toISOString(),
      content,
      isMeta: false,
      isSidechain: false,
    })
  }

  if (firstTimestamp && lastTimestamp) {
    const start = new Date(firstTimestamp).getTime()
    const end = new Date(lastTimestamp).getTime()
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      stats.durationSeconds = Math.round((end - start) / 1000)
    }
  }

  return {
    sessionId,
    provider: "codex",
    projectPath,
    messages,
    stats,
  }
}

// ─── Service ────────────────────────────────────────────────────────────────

class SessionParserService {
  private cache = new LRUCache<ParsedSession>(20)

  /**
   * Encode a project directory path to the format Claude uses for its projects folder.
   * e.g. /Users/foo/bar -> -Users-foo-bar
   */
  private encodeDirName(realPath: string): string {
    return realPath.replace(/\//g, "-")
  }

  /**
   * Parse a session JSONL file and return structured data.
   */
  async parseSession(projectDir: string, sessionId: string): Promise<ParsedSession> {
    const settings = await settingsService.read()
    const filePath =
      settings.activeProvider === "codex"
        ? await this.findCodexSessionFile(sessionId)
        : path.join(
            os.homedir(),
            ".claude",
            "projects",
            this.encodeDirName(projectDir),
            `${sessionId}.jsonl`,
          )

    // Get file mtime for cache key
    let mtime: number
    try {
      if (!filePath) throw new Error("Session file not found")
      const stat = fs.statSync(filePath)
      mtime = stat.mtimeMs
    } catch {
      throw new Error(`Session file not found: ${filePath}`)
    }

    const cacheKey = `${filePath}:${mtime}`

    // Check cache
    const cached = this.cache.get(cacheKey)
    if (cached) return cached

    // Parse directly (no Worker thread)
    const result =
      settings.activeProvider === "codex"
        ? await parseCodexJSONL(filePath, sessionId, projectDir)
        : await parseJSONL(filePath, sessionId, projectDir)

    // Cache result
    this.cache.set(cacheKey, result)

    return result
  }

  private async findCodexSessionFile(sessionId: string): Promise<string | null> {
    return this.walkForSessionFile(CODEX_SESSIONS_DIR, sessionId)
  }

  private async walkForSessionFile(dir: string, sessionId: string): Promise<string | null> {
    if (!fs.existsSync(dir)) return null

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const nested = await this.walkForSessionFile(fullPath, sessionId)
        if (nested) return nested
      } else if (entry.isFile() && entry.name.includes(sessionId) && entry.name.endsWith(".jsonl")) {
        return fullPath
      }
    }

    return null
  }
}

export const sessionParserService = new SessionParserService()
