import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { CODEX_SESSION_INDEX_FILE, CODEX_SESSIONS_DIR } from '../../shared/constants'
import { settingsService } from './SettingsService'
import { projectDiscoveryService } from './ProjectDiscoveryService'

const execAsync = promisify(exec)

export interface OfficeAgentInfo {
  id: number
  sessionId: string
  projectDir: string
  jsonlFile: string
  isActive: boolean
  lastModified: Date
}

export interface AgentContext {
  sessionId: string
  projectDir: string
  messages: ConversationMessage[]
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tools?: ToolCall[]
}

export interface ToolCall {
  name: string
  input: Record<string, unknown>
}

class PixelOfficeService {
  private nextId = 1

  async getAgentsByProject(projectDir: string): Promise<OfficeAgentInfo[]> {
    const settings = await settingsService.read()
    const projects = await projectDiscoveryService.getProjects(settings.activeProvider)
    const project = projects.find((item) => item.projectDir === projectDir)
    if (!project) return []

    return project.sessions.map((session) => ({
      id: this.nextId++,
      sessionId: session.sessionId,
      projectDir: session.projectDir,
      jsonlFile: session.jsonlFile,
      isActive: session.isActive,
      lastModified: session.lastModified,
    }))
  }

  async getAgentContext(projectDir: string, sessionId: string): Promise<AgentContext | null> {
    const settings = await settingsService.read()
    return settings.activeProvider === 'codex'
      ? this.getCodexAgentContext(projectDir, sessionId)
      : this.getClaudeAgentContext(projectDir, sessionId)
  }

  async joinTerminal(projectDir: string, sessionId?: string): Promise<void> {
    const settings = await settingsService.read()
    const providerCommand = settings.activeProvider === 'codex' ? 'codex' : 'claude'
    const cdCmd =
      process.platform === 'darwin'
        ? `cd "${projectDir.replace(/"/g, '\\"')}"`
        : `cd "${projectDir}"`
    const resumeArg = sessionId ? ` resume ${sessionId}` : ''
    const fullCmd = `${cdCmd} && ${providerCommand}${resumeArg}`

    if (process.platform === 'darwin') {
      await execAsync(
        `osascript -e 'tell application "Terminal" to do script "${fullCmd.replace(/"/g, '\\"')}"'`,
      )
    } else if (process.platform === 'win32') {
      await execAsync(`start cmd /k "${fullCmd}"`)
    } else {
      await execAsync(`x-terminal-emulator -e "${fullCmd}"`)
    }
  }

  async deleteAgent(projectDir: string, sessionId: string): Promise<{ success: boolean; error?: string }> {
    const settings = await settingsService.read()
    const filePath = await this.resolveSessionFile(projectDir, sessionId, settings.activeProvider)
    if (!filePath || !fs.existsSync(filePath)) {
      return { success: false, error: '会话文件不存在' }
    }

    try {
      fs.unlinkSync(filePath)
      return { success: true }
    } catch (error) {
      return { success: false, error: `删除失败: ${error}` }
    }
  }

  async deleteAgents(projectDir: string, sessionIds: string[]): Promise<{ success: boolean; deletedCount: number; errors: string[] }> {
    const errors: string[] = []
    let deletedCount = 0

    for (const sessionId of sessionIds) {
      const result = await this.deleteAgent(projectDir, sessionId)
      if (result.success) {
        deletedCount++
      } else if (result.error) {
        errors.push(result.error)
      }
    }

    return { success: errors.length === 0, deletedCount, errors }
  }

  async deleteProject(projectDir: string): Promise<{ success: boolean; error?: string; deletedCount?: number }> {
    const agents = await this.getAgentsByProject(projectDir)
    const result = await this.deleteAgents(projectDir, agents.map((agent) => agent.sessionId))
    if (!result.success && result.deletedCount === 0) {
      return { success: false, error: result.errors.join(', ') }
    }
    return { success: true, deletedCount: result.deletedCount }
  }

  private async getClaudeAgentContext(projectDir: string, sessionId: string): Promise<AgentContext | null> {
    const filePath = await this.resolveSessionFile(projectDir, sessionId, 'claude')
    if (!filePath || !fs.existsSync(filePath)) return null

    const messages: ConversationMessage[] = []
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')

      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const entry = JSON.parse(line)
          if (entry.type !== 'user' && entry.type !== 'assistant') continue
          const msg = entry.message
          if (!msg) continue

          let text = ''
          const tools: ToolCall[] = []
          if (typeof msg.content === 'string') {
            text = msg.content
          } else if (Array.isArray(msg.content)) {
            for (const block of msg.content) {
              if (block.type === 'text') text += block.text
              else if (block.type === 'tool_use') {
                tools.push({ name: block.name, input: block.input || {} })
              }
            }
          }

          if (!text && tools.length === 0) continue
          messages.push({
            role: entry.type,
            content: text,
            timestamp: new Date(entry.timestamp),
            tools: tools.length > 0 ? tools : undefined,
          })
        } catch {
          // ignore line
        }
      }
    } catch {
      return null
    }

    return { sessionId, projectDir, messages }
  }

  private async getCodexAgentContext(projectDir: string, sessionId: string): Promise<AgentContext | null> {
    const filePath = await this.resolveSessionFile(projectDir, sessionId, 'codex')
    if (!filePath || !fs.existsSync(filePath)) return null

    const messages: ConversationMessage[] = []
    try {
      const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/)
      for (const line of lines) {
        if (!line.trim()) continue
        const entry = JSON.parse(line)
        if (entry.type !== 'response_item') continue
        const payload = entry.payload || {}
        if (payload.type !== 'message') continue
        const role = payload.role
        if (role !== 'user' && role !== 'assistant') continue

        const parts = Array.isArray(payload.content) ? payload.content : []
        const text = parts
          .map((part: Record<string, unknown>) => String(part.text || ''))
          .join('\n')
          .trim()
        if (!text) continue

        messages.push({
          role,
          content: text,
          timestamp: new Date(entry.timestamp),
        })
      }
    } catch {
      return null
    }

    return { sessionId, projectDir, messages }
  }

  private async resolveSessionFile(
    projectDir: string,
    sessionId: string,
    provider: 'claude' | 'codex' | 'gemini',
  ): Promise<string | null> {
    const projects = await projectDiscoveryService.getProjects(provider)
    const project = projects.find((item) => item.projectDir === projectDir)
    const session = project?.sessions.find((item) => item.sessionId === sessionId)
    return session?.jsonlFile || null
  }
}

export const pixelOfficeService = new PixelOfficeService()
