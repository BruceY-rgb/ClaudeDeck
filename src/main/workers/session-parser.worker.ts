import { parentPort } from "worker_threads"
import { createReadStream } from "fs"
import { createInterface } from "readline"
import type {
  ParsedSession,
  ParsedMessage,
  ParsedContentBlock,
  SessionStats,
} from "../../shared/types/session-detail"

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

        // Extract text from content array inside tool_result
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

        // Extract file info from top-level toolUseResult if available
        if (toolUseResult && typeof toolUseResult === "object") {
          const tur = toolUseResult as Record<string, unknown>
          // Try toolUseResult.file.filePath first, then toolUseResult.filePath
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
        // Unknown block type, skip
        break
    }
  }

  return blocks
}

// ─── Main parse logic ───────────────────────────────────────────────────────

interface ParseRequest {
  type: "parse"
  requestId: string
  filePath: string
  sessionId: string
  projectPath: string
  gitBranch?: string
}

async function parseJSONL(req: ParseRequest): Promise<ParsedSession> {
  const { filePath, sessionId, projectPath, gitBranch } = req

  // Maps for deduplication
  // requestId -> last entry (we keep last per requestId for final token counts)
  const entriesByRequestId = new Map<string, { entry: Record<string, unknown>; lineIndex: number }>()
  // uuid -> last entry
  const entriesByUuid = new Map<string, { entry: Record<string, unknown>; lineIndex: number }>()
  // All entries in order (for entries without requestId/uuid)
  const orderedEntries: Array<{ entry: Record<string, unknown>; lineIndex: number }> = []

  let lineIndex = 0

  const rl = createInterface({
    input: createReadStream(filePath, { encoding: "utf-8" }),
    crlfDelay: Infinity,
  })

  for await (const line of rl) {
    lineIndex++

    // Skip empty lines
    if (!line.trim()) continue

    // Skip lines over 10MB
    if (Buffer.byteLength(line, "utf-8") > MAX_LINE_BYTES) continue

    let entry: Record<string, unknown>
    try {
      entry = JSON.parse(line)
    } catch {
      // Skip malformed JSON lines
      continue
    }

    // Must be an object
    if (!entry || typeof entry !== "object") continue

    // Skip unwanted types
    const entryType = entry.type as string | undefined
    if (entryType && SKIP_TYPES.has(entryType)) continue

    // Only process user and assistant types
    if (entryType !== "user" && entryType !== "assistant") continue

    const requestId = entry.requestId as string | undefined
    const uuid = entry.uuid as string | undefined

    // Deduplicate by requestId (keep last)
    if (requestId) {
      entriesByRequestId.set(requestId, { entry, lineIndex })
    }

    // Deduplicate by uuid (keep last)
    if (uuid) {
      entriesByUuid.set(uuid, { entry, lineIndex })
    }

    // Store all entries for ordering
    orderedEntries.push({ entry, lineIndex })
  }

  // Build the final deduplicated ordered list.
  // For entries with a uuid, only keep the last occurrence (by uuid).
  // For entries with a requestId, we use the requestId map to get final token counts.
  const seenUuids = new Set<string>()
  const seenRequestIds = new Set<string>()
  const finalEntries: Array<{ entry: Record<string, unknown>; lineIndex: number }> = []

  // Iterate in reverse to pick the last occurrence of each uuid
  for (let i = orderedEntries.length - 1; i >= 0; i--) {
    const item = orderedEntries[i]
    const uuid = item.entry.uuid as string | undefined
    const requestId = item.entry.requestId as string | undefined

    if (uuid) {
      if (seenUuids.has(uuid)) continue
      seenUuids.add(uuid)
    }

    // For requestId dedup: if there's a requestId, only keep the last entry for that requestId
    if (requestId && !uuid) {
      if (seenRequestIds.has(requestId)) continue
      seenRequestIds.add(requestId)
    }

    finalEntries.push(item)
  }

  // Reverse back to original order
  finalEntries.reverse()

  // Now build ParsedMessages and compute stats
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

    // Track timestamps for duration
    if (timestamp) {
      if (!firstTimestamp) firstTimestamp = timestamp
      lastTimestamp = timestamp
    }

    if (!message) continue

    const model = message.model as string | undefined
    const content = message.content
    const toolUseResult = entry.toolUseResult as unknown

    // Parse content blocks
    const contentBlocks = parseContentBlocks(content, toolUseResult)

    // Determine if this is a meta/system message (no meaningful content)
    // Use the isMeta field from the JSONL entry, or fallback to contentBlocks check for backward compatibility
    const isMeta = (entry.isMeta as boolean | undefined) ?? (contentBlocks.length === 0)

    // Detect sidechain: Claude sometimes has a "parentMessageId" indicating sidechain
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

    // Extract token stats only from the final entry per requestId
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

  // Compute duration
  if (firstTimestamp && lastTimestamp) {
    const start = new Date(firstTimestamp).getTime()
    const end = new Date(lastTimestamp).getTime()
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      stats.durationSeconds = Math.round((end - start) / 1000)
    }
  }

  return {
    sessionId,
    projectPath,
    gitBranch,
    messages,
    stats,
  }
}

// ─── Worker message handler ─────────────────────────────────────────────────

if (parentPort) {
  parentPort.on("message", async (msg: unknown) => {
    const request = msg as ParseRequest
    if (!request || request.type !== "parse") return

    const { requestId } = request

    try {
      const result = await parseJSONL(request)
      parentPort!.postMessage({ type: "result", requestId, data: result })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      parentPort!.postMessage({ type: "error", requestId, message })
    }
  })
}
