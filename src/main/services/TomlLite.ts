export interface ParsedCodexToml {
  plugins: Record<string, { enabled?: boolean }>
  projects: Record<string, { trust_level?: string }>
}

export function parseCodexToml(input: string): ParsedCodexToml {
  const result: ParsedCodexToml = { plugins: {}, projects: {} }
  let section: { kind: 'plugin' | 'project'; name: string } | null = null

  for (const rawLine of input.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const pluginMatch = line.match(/^\[plugins\."(.+)"\]$/)
    if (pluginMatch) {
      section = { kind: 'plugin', name: pluginMatch[1] }
      result.plugins[pluginMatch[1]] = result.plugins[pluginMatch[1]] || {}
      continue
    }

    const projectMatch = line.match(/^\[projects\."(.+)"\]$/)
    if (projectMatch) {
      section = { kind: 'project', name: projectMatch[1] }
      result.projects[projectMatch[1]] = result.projects[projectMatch[1]] || {}
      continue
    }

    const kvMatch = line.match(/^([A-Za-z0-9_]+)\s*=\s*(.+)$/)
    if (!kvMatch || !section) continue

    const [, key, valueRaw] = kvMatch
    const value = parseTomlScalar(valueRaw)
    if (section.kind === 'plugin') {
      result.plugins[section.name] = {
        ...result.plugins[section.name],
        [key]: value,
      }
    } else {
      result.projects[section.name] = {
        ...result.projects[section.name],
        [key]: value,
      }
    }
  }

  return result
}

function parseTomlScalar(input: string): string | boolean {
  const trimmed = input.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

export function upsertCodexPluginEnabled(
  input: string,
  pluginId: string,
  enabled: boolean,
): string {
  const lines = input.split(/\r?\n/)
  const sectionHeader = `[plugins."${pluginId}"]`
  const sectionIndex = lines.findIndex((line) => line.trim() === sectionHeader)

  if (sectionIndex === -1) {
    const suffix = input.trim().length > 0 ? '\n\n' : ''
    return `${input}${suffix}${sectionHeader}\nenabled = ${enabled}\n`
  }

  const nextSectionIndex = lines.findIndex(
    (line, index) => index > sectionIndex && line.trim().startsWith('['),
  )
  const endIndex = nextSectionIndex === -1 ? lines.length : nextSectionIndex
  const enabledIndex = lines.findIndex(
    (line, index) => index > sectionIndex && index < endIndex && line.trim().startsWith('enabled'),
  )

  if (enabledIndex !== -1) {
    lines[enabledIndex] = `enabled = ${enabled}`
  } else {
    lines.splice(sectionIndex + 1, 0, `enabled = ${enabled}`)
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`
}
