export interface Agent {
  name: string
  description: string
  tools: string[]
  model: 'sonnet' | 'opus' | 'haiku' | 'inherit' | string
  body: string
  source: 'personal' | 'plugin'
  pluginId?: string
  filePath: string
}

export interface AgentFormData {
  name: string
  description: string
  tools: string[]
  model: string
  body: string
}

export const AVAILABLE_TOOLS = [
  'Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
  'WebFetch', 'WebSearch', 'Task', 'TodoWrite', 'NotebookEdit'
]

export const AVAILABLE_MODELS = ['sonnet', 'opus', 'haiku', 'inherit']
