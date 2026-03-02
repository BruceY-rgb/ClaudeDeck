import type { Agent, AgentFormData } from './agent'
import type { Skill } from './skill'
import type { MCPServer } from './mcp'

// 项目级 Agent
export interface ProjectAgent extends Agent {
  projectDir: string
}

// 项目级 Skill
export interface ProjectSkill extends Skill {
  projectDir: string
}

// 项目级 MCP Server
export interface ProjectMCPServer extends MCPServer {
  projectDir: string
}

// 项目级 Command
export interface ProjectCommand {
  name: string
  description: string
  body: string
  filePath: string
  projectDir: string
}

// 项目级 Hook
export interface ProjectHook {
  event: string
  matcher?: string
  command: string
  projectDir: string
}

// 项目级 Plan
export interface ProjectPlan {
  name: string
  content: string
  filePath: string
  projectDir: string
  lastModified: string
}

// 项目 Tab 类型
export type ProjectTab = 'sessions' | 'agents' | 'skills' | 'mcp' | 'plans' | 'hooks' | 'commands'

// 项目配置概览
export interface ProjectSummary {
  agentCount: number
  skillCount: number
  mcpCount: number
  planCount: number
  hookCount: number
  commandCount: number
}

// 项目 Agent 表单数据 (复用 AgentFormData)
export type ProjectAgentFormData = AgentFormData

// 项目 Skill 表单数据
export interface ProjectSkillFormData {
  name: string
  description: string
  userInvocable?: boolean
  disableModelInvocation?: boolean
  body: string
}

// 项目 MCP 表单数据
export interface ProjectMCPFormData {
  name: string
  type: 'stdio' | 'http'
  command?: string
  args?: string[]
  url?: string
  env?: Record<string, string>
}

// 项目 Command 表单数据
export interface ProjectCommandFormData {
  name: string
  description: string
  body: string
}

// 项目 Hook 表单数据
export interface ProjectHookFormData {
  event: string
  matcher?: string
  command: string
}
