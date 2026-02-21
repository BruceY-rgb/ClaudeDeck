export interface HookEntry {
  type: 'command'
  command: string
  async?: boolean
  timeout?: number
}

export interface HookMatcher {
  matcher: string
  hooks: HookEntry[]
}

export interface HookDefinition {
  pluginId: string
  pluginName: string
  event: HookEvent
  matchers: HookMatcher[]
}

export type HookEvent =
  | 'SessionStart'
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PreCompact'
  | 'Stop'
  | 'SessionEnd'

export const HOOK_EVENTS: HookEvent[] = [
  'SessionStart',
  'PreToolUse',
  'PostToolUse',
  'PreCompact',
  'Stop',
  'SessionEnd'
]
