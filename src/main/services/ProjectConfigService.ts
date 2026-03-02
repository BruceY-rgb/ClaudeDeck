import { join } from 'path'
import { rm } from 'fs/promises'
import { fsService } from './FileSystemService'
import { parserService } from './ParserService'
import { AGENTS_DIR, SKILLS_DIR } from '../../shared/constants'
import type {
  ProjectAgent,
  ProjectSkill,
  ProjectMCPServer,
  ProjectCommand,
  ProjectHook,
  ProjectPlan,
  ProjectSummary,
  ProjectAgentFormData,
  ProjectSkillFormData,
  ProjectMCPFormData,
  ProjectCommandFormData,
  ProjectHookFormData,
} from '../../shared/types/project-config'

/**
 * Service for managing project-level Claude Code configuration files.
 *
 * Directory layout:
 *   {projectDir}/.claude/agents/*.md
 *   {projectDir}/.claude/skills/{name}/SKILL.md
 *   {projectDir}/.claude/commands/*.md
 *   {projectDir}/.claude/settings.json          (hooks live here)
 *   {projectDir}/.claude/plans/*.md
 *   {projectDir}/.mcp.json
 */
export class ProjectConfigService {
  // ─── helpers ──────────────────────────────────────────────

  private agentsDir(projectDir: string): string {
    return join(projectDir, '.claude', 'agents')
  }

  private skillsDir(projectDir: string): string {
    return join(projectDir, '.claude', 'skills')
  }

  private commandsDir(projectDir: string): string {
    return join(projectDir, '.claude', 'commands')
  }

  private plansDir(projectDir: string): string {
    return join(projectDir, '.claude', 'plans')
  }

  private settingsFile(projectDir: string): string {
    return join(projectDir, '.claude', 'settings.json')
  }

  private mcpFile(projectDir: string): string {
    return join(projectDir, '.mcp.json')
  }

  // ─── Agents ───────────────────────────────────────────────

  async listAgents(projectDir: string): Promise<ProjectAgent[]> {
    const dir = this.agentsDir(projectDir)
    const files = await fsService.listFiles(dir, '.md')
    const agents: ProjectAgent[] = []
    for (const file of files) {
      try {
        const filePath = join(dir, file)
        const content = await fsService.readFile(filePath)
        const base = parserService.parseAgent(content, filePath, 'personal')
        agents.push({ ...base, projectDir })
      } catch {
        // skip malformed
      }
    }
    return agents
  }

  async readAgent(projectDir: string, name: string): Promise<ProjectAgent | null> {
    const filePath = join(this.agentsDir(projectDir), `${name}.md`)
    if (!(await fsService.exists(filePath))) return null
    try {
      const content = await fsService.readFile(filePath)
      const base = parserService.parseAgent(content, filePath, 'personal')
      return { ...base, projectDir }
    } catch {
      return null
    }
  }

  async writeAgent(projectDir: string, name: string, data: ProjectAgentFormData): Promise<void> {
    const dir = this.agentsDir(projectDir)
    await fsService.ensureDir(dir)
    const filePath = join(dir, `${name}.md`)
    const content = parserService.serializeAgent(data)
    await fsService.writeFileAtomic(filePath, content)
  }

  async deleteAgent(projectDir: string, name: string): Promise<void> {
    const filePath = join(this.agentsDir(projectDir), `${name}.md`)
    await fsService.deleteFile(filePath)
  }

  async copyGlobalAgent(projectDir: string, agentName: string): Promise<void> {
    const srcPath = join(AGENTS_DIR, `${agentName}.md`)
    if (!(await fsService.exists(srcPath))) {
      throw new Error(`Global agent "${agentName}" not found`)
    }
    const content = await fsService.readFile(srcPath)
    const dir = this.agentsDir(projectDir)
    await fsService.ensureDir(dir)
    await fsService.writeFileAtomic(join(dir, `${agentName}.md`), content)
  }

  // ─── Skills ───────────────────────────────────────────────

  async listSkills(projectDir: string): Promise<ProjectSkill[]> {
    const dir = this.skillsDir(projectDir)
    const dirs = await fsService.listDirs(dir)
    const skills: ProjectSkill[] = []
    for (const d of dirs) {
      const skillFile = join(dir, d, 'SKILL.md')
      if (!(await fsService.exists(skillFile))) continue
      try {
        const content = await fsService.readFile(skillFile)
        const hasRef = await fsService.exists(join(dir, d, 'reference'))
        const hasTpl = await fsService.exists(join(dir, d, 'templates'))
        const base = parserService.parseSkill(content, skillFile, 'personal', undefined, hasRef, hasTpl)
        skills.push({ ...base, projectDir })
      } catch {
        // skip
      }
    }
    return skills
  }

  async readSkill(projectDir: string, name: string): Promise<ProjectSkill | null> {
    const filePath = join(this.skillsDir(projectDir), name, 'SKILL.md')
    if (!(await fsService.exists(filePath))) return null
    try {
      const content = await fsService.readFile(filePath)
      const hasRef = await fsService.exists(join(this.skillsDir(projectDir), name, 'reference'))
      const hasTpl = await fsService.exists(join(this.skillsDir(projectDir), name, 'templates'))
      const base = parserService.parseSkill(content, filePath, 'personal', undefined, hasRef, hasTpl)
      return { ...base, projectDir }
    } catch {
      return null
    }
  }

  async writeSkill(projectDir: string, name: string, data: ProjectSkillFormData): Promise<void> {
    const dir = join(this.skillsDir(projectDir), name)
    await fsService.ensureDir(dir)
    const metadata: Record<string, unknown> = {
      name: data.name,
      description: data.description,
    }
    if (data.userInvocable !== undefined) metadata['user-invocable'] = data.userInvocable
    if (data.disableModelInvocation !== undefined) metadata['disable-model-invocation'] = data.disableModelInvocation
    const content = parserService.serializeFrontmatter(metadata, data.body)
    await fsService.writeFileAtomic(join(dir, 'SKILL.md'), content)
  }

  async deleteSkill(projectDir: string, name: string): Promise<void> {
    const dir = join(this.skillsDir(projectDir), name)
    await rm(dir, { recursive: true, force: true })
  }

  async copyGlobalSkill(projectDir: string, skillName: string): Promise<void> {
    const srcDir = join(SKILLS_DIR, skillName)
    if (!(await fsService.exists(srcDir))) {
      throw new Error(`Global skill "${skillName}" not found`)
    }
    const destDir = join(this.skillsDir(projectDir), skillName)
    await fsService.ensureDir(destDir)
    await fsService.copyDirectory(srcDir, destDir)
  }

  // ─── MCP ──────────────────────────────────────────────────

  async listMCPServers(projectDir: string): Promise<ProjectMCPServer[]> {
    const mcpPath = this.mcpFile(projectDir)
    if (!(await fsService.exists(mcpPath))) return []
    try {
      const config = await fsService.readJSON<{ mcpServers?: Record<string, unknown> }>(mcpPath)
      const servers = config.mcpServers || {}
      return Object.entries(servers).map(([name, server]) => {
        const s = server as Record<string, unknown>
        return {
          name,
          type: (s.type as 'stdio' | 'http') || 'stdio',
          command: s.command as string | undefined,
          args: s.args as string[] | undefined,
          url: s.url as string | undefined,
          env: s.env as Record<string, string> | undefined,
          active: true,
          projectDir,
        }
      })
    } catch {
      return []
    }
  }

  async writeMCPServer(projectDir: string, name: string, data: ProjectMCPFormData): Promise<void> {
    const mcpPath = this.mcpFile(projectDir)
    let config: { mcpServers?: Record<string, unknown>; [k: string]: unknown } = {}
    if (await fsService.exists(mcpPath)) {
      try {
        config = await fsService.readJSON<typeof config>(mcpPath)
      } catch {
        // malformed, start fresh
      }
    }
    if (!config.mcpServers) config.mcpServers = {}

    const entry: Record<string, unknown> = { type: data.type }
    if (data.command) entry.command = data.command
    if (data.args && data.args.length > 0) entry.args = data.args
    if (data.url) entry.url = data.url
    if (data.env && Object.keys(data.env).length > 0) entry.env = data.env

    config.mcpServers[name] = entry
    await fsService.writeJSON(mcpPath, config)
  }

  async deleteMCPServer(projectDir: string, name: string): Promise<void> {
    const mcpPath = this.mcpFile(projectDir)
    if (!(await fsService.exists(mcpPath))) return
    try {
      const config = await fsService.readJSON<{ mcpServers?: Record<string, unknown>; [k: string]: unknown }>(mcpPath)
      if (config.mcpServers && config.mcpServers[name]) {
        delete config.mcpServers[name]
        await fsService.writeJSON(mcpPath, config)
      }
    } catch {
      // ignore
    }
  }

  // ─── Plans ────────────────────────────────────────────────

  async listPlans(projectDir: string): Promise<ProjectPlan[]> {
    const dir = this.plansDir(projectDir)
    const files = await fsService.listFiles(dir, '.md')
    const plans: ProjectPlan[] = []
    for (const file of files) {
      try {
        const filePath = join(dir, file)
        const content = await fsService.readFile(filePath)
        const mtime = await fsService.getFileMtime(filePath)
        plans.push({
          name: file.replace(/\.md$/, ''),
          content,
          filePath,
          projectDir,
          lastModified: mtime.toISOString(),
        })
      } catch {
        // skip
      }
    }
    return plans
  }

  async readPlan(projectDir: string, name: string): Promise<ProjectPlan | null> {
    const filePath = join(this.plansDir(projectDir), `${name}.md`)
    if (!(await fsService.exists(filePath))) return null
    try {
      const content = await fsService.readFile(filePath)
      const mtime = await fsService.getFileMtime(filePath)
      return {
        name,
        content,
        filePath,
        projectDir,
        lastModified: mtime.toISOString(),
      }
    } catch {
      return null
    }
  }

  async writePlan(projectDir: string, name: string, content: string): Promise<void> {
    const dir = this.plansDir(projectDir)
    await fsService.ensureDir(dir)
    await fsService.writeFileAtomic(join(dir, `${name}.md`), content)
  }

  async deletePlan(projectDir: string, name: string): Promise<void> {
    const filePath = join(this.plansDir(projectDir), `${name}.md`)
    await fsService.deleteFile(filePath)
  }

  // ─── Hooks ────────────────────────────────────────────────

  async listHooks(projectDir: string): Promise<ProjectHook[]> {
    const settingsPath = this.settingsFile(projectDir)
    if (!(await fsService.exists(settingsPath))) return []
    try {
      const settings = await fsService.readJSON<{ hooks?: Record<string, unknown[]> }>(settingsPath)
      const hooks = settings.hooks || {}
      const result: ProjectHook[] = []

      // Claude Code hooks format: { hooks: { "PreToolUse": [...], "PostToolUse": [...], ... } }
      for (const [event, entries] of Object.entries(hooks)) {
        if (!Array.isArray(entries)) continue
        for (const entry of entries) {
          const e = entry as Record<string, unknown>
          result.push({
            event,
            matcher: e.matcher as string | undefined,
            command: (e.command as string) || '',
            projectDir,
          })
        }
      }
      return result
    } catch {
      return []
    }
  }

  async writeHooks(projectDir: string, hooks: ProjectHookFormData[]): Promise<void> {
    const settingsPath = this.settingsFile(projectDir)
    let settings: Record<string, unknown> = {}
    if (await fsService.exists(settingsPath)) {
      try {
        settings = await fsService.readJSON<Record<string, unknown>>(settingsPath)
      } catch {
        // malformed, start fresh
      }
    }

    // Convert flat list to grouped format
    const grouped: Record<string, Array<{ matcher?: string; command: string }>> = {}
    for (const h of hooks) {
      if (!grouped[h.event]) grouped[h.event] = []
      const entry: { matcher?: string; command: string } = { command: h.command }
      if (h.matcher) entry.matcher = h.matcher
      grouped[h.event].push(entry)
    }

    settings.hooks = grouped
    await fsService.ensureDir(join(projectDir, '.claude'))
    await fsService.writeJSON(settingsPath, settings)
  }

  // ─── Commands ─────────────────────────────────────────────

  async listCommands(projectDir: string): Promise<ProjectCommand[]> {
    const dir = this.commandsDir(projectDir)
    const files = await fsService.listFiles(dir, '.md')
    const commands: ProjectCommand[] = []
    for (const file of files) {
      try {
        const filePath = join(dir, file)
        const content = await fsService.readFile(filePath)
        const { data, body } = parserService.parseFrontmatter(content)
        commands.push({
          name: file.replace(/\.md$/, ''),
          description: (data.description as string) || '',
          body,
          filePath,
          projectDir,
        })
      } catch {
        // skip
      }
    }
    return commands
  }

  async readCommand(projectDir: string, name: string): Promise<ProjectCommand | null> {
    const filePath = join(this.commandsDir(projectDir), `${name}.md`)
    if (!(await fsService.exists(filePath))) return null
    try {
      const content = await fsService.readFile(filePath)
      const { data, body } = parserService.parseFrontmatter(content)
      return {
        name,
        description: (data.description as string) || '',
        body,
        filePath,
        projectDir,
      }
    } catch {
      return null
    }
  }

  async writeCommand(projectDir: string, name: string, data: ProjectCommandFormData): Promise<void> {
    const dir = this.commandsDir(projectDir)
    await fsService.ensureDir(dir)
    const metadata: Record<string, unknown> = {}
    if (data.description) metadata.description = data.description
    const content = parserService.serializeFrontmatter(metadata, data.body)
    await fsService.writeFileAtomic(join(dir, `${name}.md`), content)
  }

  async deleteCommand(projectDir: string, name: string): Promise<void> {
    const filePath = join(this.commandsDir(projectDir), `${name}.md`)
    await fsService.deleteFile(filePath)
  }

  // ─── Summary ──────────────────────────────────────────────

  async getSummary(projectDir: string): Promise<ProjectSummary> {
    const [agents, skills, mcp, plans, hooks, commands] = await Promise.all([
      fsService.listFiles(this.agentsDir(projectDir), '.md').catch(() => []),
      fsService.listDirs(this.skillsDir(projectDir)).catch(() => []),
      this.listMCPServers(projectDir).catch(() => []),
      fsService.listFiles(this.plansDir(projectDir), '.md').catch(() => []),
      this.listHooks(projectDir).catch(() => []),
      fsService.listFiles(this.commandsDir(projectDir), '.md').catch(() => []),
    ])

    return {
      agentCount: agents.length,
      skillCount: skills.length,
      mcpCount: mcp.length,
      planCount: plans.length,
      hookCount: hooks.length,
      commandCount: commands.length,
    }
  }
}

export const projectConfigService = new ProjectConfigService()
