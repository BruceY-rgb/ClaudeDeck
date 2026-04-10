import type { ProviderId } from './provider'

// ─── Content & Message Types ────────────────────────────────────────────────

export interface ParsedContentBlock {
  type: "text" | "tool_use" | "tool_result" | "thinking" | "redacted_thinking"
  text?: string
  toolUseId?: string
  toolName?: string
  input?: Record<string, unknown>
  output?: string
  filePath?: string
  fileContent?: string
  isError?: boolean
}

export interface ParsedMessage {
  id: string
  role: "user" | "assistant"
  timestamp: string
  model?: string
  content: ParsedContentBlock[]
  isMeta: boolean
  isSidechain: boolean
}

// ─── Stats ──────────────────────────────────────────────────────────────────

export interface SessionStats {
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  estimatedCostUsd: number
  durationSeconds: number
  costUnavailable?: boolean
}

// ─── Session ────────────────────────────────────────────────────────────────

export interface ParsedSession {
  sessionId: string
  provider: ProviderId
  projectPath: string
  gitBranch?: string
  messages: ParsedMessage[]
  stats: SessionStats
}

// ─── Timeline Items ─────────────────────────────────────────────────────────

export interface TimelineUserItem {
  id: string
  kind: "user"
  text: string
  timestamp: string
}

export interface TimelineAssistantItem {
  id: string
  kind: "assistant"
  text: string
  timestamp: string
  model?: string
}

export interface TimelineToolItem {
  id: string
  kind: "tool"
  toolName: string
  toolUseId: string
  input?: Record<string, unknown>
  output?: string
  filePath?: string
  fileContent?: string
  isError?: boolean
  timestamp: string
}

export interface TimelineThinkingItem {
  id: string
  kind: "thinking"
  text: string
  isRedacted: boolean
  timestamp: string
}

export type TimelineItem =
  | TimelineUserItem
  | TimelineAssistantItem
  | TimelineToolItem
  | TimelineThinkingItem

// ─── Highlights ─────────────────────────────────────────────────────────────

export interface SessionHighlights {
  toolCalls: number
  toolResults: number
  failureCount: number
  touchedFiles: string[]
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export interface ActivityDay {
  date: string
  count: number
}

export interface AnalyticsData {
  totalSessions: number
  totalCostUsd: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  totalDurationSeconds: number
  averageCostPerSession: number
  averageDurationSeconds: number
  activityByDay: ActivityDay[]
  modelUsage: Record<string, number>
  topProjects: Array<{ projectPath: string; sessionCount: number; totalCost: number }>
  toolUsage: Record<string, number>
}

export interface WrappedData {
  totalSessions: number
  totalCostUsd: number
  totalTokens: number
  totalDurationSeconds: number
  longestSession: { sessionId: string; durationSeconds: number } | null
  mostExpensiveSession: { sessionId: string; costUsd: number } | null
  favoriteModel: string | null
  topTools: Array<{ name: string; count: number }>
  activityByDay: ActivityDay[]
  peakHour: number | null
  streak: number
}

export interface AnalyticsIndex {
  version: number
  lastUpdated: string
  sessions: Record<string, {
    sessionId: string
    projectPath: string
    filePath: string
    mtime: number
    stats: SessionStats
    model?: string
    timestamp: string
    toolCounts: Record<string, number>
    errorCount: number
  }>
}
