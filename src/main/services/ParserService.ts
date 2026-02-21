import matter from 'gray-matter'
import type { Agent } from '../../shared/types/agent'
import type { Skill } from '../../shared/types/skill'
import type { Command } from '../../shared/types/command'

export class ParserService {
  parseFrontmatter(content: string): { data: Record<string, unknown>; body: string } {
    const { data, content: body } = matter(content)
    return { data, body: body.trim() }
  }

  serializeFrontmatter(data: Record<string, unknown>, body: string): string {
    return matter.stringify(body, data)
  }

  parseAgent(content: string, filePath: string, source: 'personal' | 'plugin', pluginId?: string): Agent {
    const { data, body } = this.parseFrontmatter(content)
    const toolsRaw = (data.tools as string) || ''
    const tools = toolsRaw.split(',').map(t => t.trim()).filter(Boolean)
    return {
      name: (data.name as string) || '',
      description: (data.description as string) || '',
      tools,
      model: (data.model as string) || 'sonnet',
      body,
      source,
      pluginId,
      filePath
    }
  }

  serializeAgent(agent: { name: string; description: string; tools: string[]; model: string; body: string }): string {
    const data: Record<string, unknown> = {
      name: agent.name,
      description: agent.description,
      tools: agent.tools.join(', '),
      model: agent.model
    }
    return this.serializeFrontmatter(data, agent.body)
  }

  parseSkill(content: string, filePath: string, source: 'personal' | 'plugin', pluginId?: string, hasReference = false, hasTemplates = false): Skill {
    const { data, body } = this.parseFrontmatter(content)
    return {
      name: (data.name as string) || '',
      description: (data.description as string) || '',
      userInvocable: data['user-invocable'] as boolean | undefined,
      disableModelInvocation: data['disable-model-invocation'] as boolean | undefined,
      body,
      source,
      pluginId,
      filePath,
      hasReference,
      hasTemplates
    }
  }

  parseCommand(content: string, filePath: string, pluginId: string, pluginName: string): Command {
    const { data, body } = this.parseFrontmatter(content)
    return {
      name: filePath.split('/').pop()?.replace('.md', '') || '',
      description: (data.description as string) || '',
      disableModelInvocation: data['disable-model-invocation'] as boolean | undefined,
      body,
      pluginId,
      pluginName,
      filePath
    }
  }
}

export const parserService = new ParserService()
