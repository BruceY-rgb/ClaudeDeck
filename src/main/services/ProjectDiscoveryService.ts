import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import {
  CLAUDE_DIR,
  CODEX_SESSIONS_DIR,
  CODEX_SESSION_INDEX_FILE,
} from '../../shared/constants'
import { projectConfigService } from './ProjectConfigService'
import { settingsService } from './SettingsService'
import type { ProviderCapability, ProviderId } from '../../shared/types/provider'
import { parseCodexToml } from './TomlLite'
import { fsService } from './FileSystemService'

const execAsync = promisify(exec)
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects')

export interface ProjectConfigSummary {
  agents: number
  skills: number
  mcp: number
}

export interface ProjectInfo {
  provider: ProviderId
  projectDir: string
  projectName: string
  agentCount: number
  activeCount: number
  lastActivity: Date
  sessions: ProjectSession[]
  configSummary?: ProjectConfigSummary
  capabilities?: ProviderCapability[]
}

export interface ProjectSession {
  sessionId: string
  projectDir: string
  jsonlFile: string
  isActive: boolean
  lastModified: Date
}

export interface ClaudeProcess {
  pid: number
  cwd: string
}

class ProjectDiscoveryService {
  private decodeClaudeDirName(encoded: string): string {
    let decoded = encoded.replace(/-/g, '/').replace(/\/+/g, '/')
    if (fs.existsSync(decoded)) return decoded

    const parts = decoded.split('/')
    for (let i = parts.length - 2; i >= 1; i--) {
      const testDecoded = `${parts.slice(0, i).join('/')}/${parts.slice(i).join('-')}`
      if (fs.existsSync(testDecoded)) return testDecoded
    }

    return decoded
  }

  private encodeClaudeDirName(realPath: string): string {
    return realPath.replace(/\//g, '-')
  }

  async getRunningClaudeProcesses(): Promise<ClaudeProcess[]> {
    const processes: ClaudeProcess[] = []
    try {
      const { stdout } = await execAsync('ps -ax -o pid,args')
      const lines = stdout.split('\n')
      const claudePids: number[] = []

      for (const line of lines) {
        const trimmed = line.trim()
        const match = trimmed.match(/^(\d+)\s+(claude(?:\s|$))/)
        if (match) claudePids.push(parseInt(match[1], 10))
      }

      for (const pid of claudePids) {
        try {
          const { stdout: lsofOut } = await execAsync(
            `lsof -p ${pid} -Fn 2>/dev/null | grep '^n/' | head -1`,
          )
          const cwd = lsofOut.trim().replace(/^n/, '')
          if (cwd) processes.push({ pid, cwd })
        } catch {
          // process ended
        }
      }
    } catch {
      // ignore
    }
    return processes
  }

  async getProjects(providerId?: ProviderId): Promise<ProjectInfo[]> {
    const settings = await settingsService.read()
    const target = providerId || settings.activeProvider
    return target === 'codex' ? this.getCodexProjects() : this.getClaudeProjects()
  }

  private async getClaudeProjects(): Promise<ProjectInfo[]> {
    if (!fs.existsSync(PROJECTS_DIR)) return []

    const runningProcesses = await this.getRunningClaudeProcesses()
    const activeCwds = new Set(runningProcesses.map((p) => p.cwd))
    const entries = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    const projects: ProjectInfo[] = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const projectDir = this.decodeClaudeDirName(entry.name)
      const projectPath = path.join(PROJECTS_DIR, entry.name)
      const sessions = this.getClaudeSessionsForProject(projectPath, projectDir)
      if (sessions.length === 0) continue

      const isProjectActive = activeCwds.has(projectDir)
      const activeCount = isProjectActive
        ? runningProcesses.filter((p) => p.cwd === projectDir).length
        : 0

      const lastActivity = sessions.reduce(
        (latest, session) => (session.lastModified > latest ? session.lastModified : latest),
        new Date(0),
      )

      projects.push({
        provider: 'claude',
        projectDir,
        projectName: path.basename(projectDir),
        agentCount: sessions.length,
        activeCount,
        lastActivity,
        sessions,
        capabilities: ['agents', 'skills', 'plugins', 'mcp', 'sessions', 'projectConfig'],
      })
    }

    await Promise.all(
      projects.map(async (project) => {
        try {
          const summary = await projectConfigService.getSummary(project.projectDir)
          project.configSummary = {
            agents: summary.agentCount,
            skills: summary.skillCount,
            mcp: summary.mcpCount,
          }
        } catch {
          // ignore
        }
      }),
    )

    projects.sort((a, b) => {
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount
      return b.lastActivity.getTime() - a.lastActivity.getTime()
    })

    return projects
  }

  private getClaudeSessionsForProject(projectPath: string, projectDir: string): ProjectSession[] {
    const sessions: ProjectSession[] = []
    try {
      const files = fs.readdirSync(projectPath)
      for (const file of files) {
        if (!file.endsWith('.jsonl') || file.startsWith('agent-')) continue
        const sessionId = file.replace('.jsonl', '')
        const filePath = path.join(projectPath, file)
        const stat = fs.statSync(filePath)
        sessions.push({
          sessionId,
          projectDir,
          jsonlFile: filePath,
          isActive: false,
          lastModified: stat.mtime,
        })
      }
    } catch {
      // ignore
    }

    sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())
    return sessions.slice(0, 20)
  }

  private async getCodexProjects(): Promise<ProjectInfo[]> {
    const sessions = await this.readCodexSessions()
    const grouped = new Map<string, ProjectSession[]>()

    for (const session of sessions) {
      const list = grouped.get(session.projectDir) || []
      list.push(session)
      grouped.set(session.projectDir, list)
    }

    const projects: ProjectInfo[] = []
    for (const [projectDir, projectSessions] of grouped.entries()) {
      const lastActivity = projectSessions.reduce(
        (latest, session) => (session.lastModified > latest ? session.lastModified : latest),
        new Date(0),
      )
      projects.push({
        provider: 'codex',
        projectDir,
        projectName: path.basename(projectDir),
        agentCount: projectSessions.length,
        activeCount: 0,
        lastActivity,
        sessions: projectSessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()),
        capabilities: ['skills', 'plugins', 'mcp', 'sessions', 'analytics'],
      })
    }

    projects.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
    return projects
  }

  private async readCodexSessions(): Promise<ProjectSession[]> {
    const results: ProjectSession[] = []
    if (!(await fsService.exists(CODEX_SESSION_INDEX_FILE))) return results

    try {
      const indexContent = await fsService.readFile(CODEX_SESSION_INDEX_FILE)
      const entries = indexContent
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line) as { id: string; updated_at?: string })

      const cwdBySession = new Map<string, string>()
      const files = await this.walkCodexSessionFiles(CODEX_SESSIONS_DIR)

      for (const file of files) {
        try {
          const content = await fsService.readFile(file)
          const firstLine = content.split(/\r?\n/).find(Boolean)
          if (!firstLine) continue
          const parsed = JSON.parse(firstLine) as { payload?: { id?: string; cwd?: string } }
          const sessionId = parsed.payload?.id
          const cwd = parsed.payload?.cwd
          if (sessionId && cwd) {
            cwdBySession.set(sessionId, cwd)
          }
        } catch {
          // ignore malformed file
        }
      }

      for (const entry of entries) {
        const projectDir = cwdBySession.get(entry.id)
        if (!projectDir) continue
        const file = files.find((item) => item.includes(entry.id))
        if (!file) continue
        const stat = fs.statSync(file)
        results.push({
          sessionId: entry.id,
          projectDir,
          jsonlFile: file,
          isActive: false,
          lastModified: entry.updated_at ? new Date(entry.updated_at) : stat.mtime,
        })
      }
    } catch {
      // ignore
    }

    return results
  }

  private async walkCodexSessionFiles(dir: string): Promise<string[]> {
    if (!fs.existsSync(dir)) return []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...await this.walkCodexSessionFiles(fullPath))
      } else if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        files.push(fullPath)
      }
    }

    return files
  }
}

export const projectDiscoveryService = new ProjectDiscoveryService()
