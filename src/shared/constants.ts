import { homedir } from 'os'
import { join } from 'path'

export const HOME_DIR = homedir()
export const CLAUDE_DIR = join(HOME_DIR, '.claude')
export const AGENTS_DIR = join(CLAUDE_DIR, 'agents')
export const SKILLS_DIR = join(CLAUDE_DIR, 'skills')
export const PLUGINS_DIR = join(CLAUDE_DIR, 'plugins')
// Using csam_ prefix to avoid conflict with Claude Code's own config files
export const INSTALLED_PLUGINS_FILE = join(PLUGINS_DIR, 'csam_installed_plugins.json')
export const KNOWN_MARKETPLACES_FILE = join(PLUGINS_DIR, 'csam_marketplaces.json')
export const MARKETPLACES_DIR = join(PLUGINS_DIR, 'marketplaces')
export const PLUGINS_CACHE_DIR = join(PLUGINS_DIR, 'cache')
// Claude Code's own config files (we sync to these in their expected format)
export const CC_KNOWN_MARKETPLACES_FILE = join(PLUGINS_DIR, 'known_marketplaces.json')
export const CC_INSTALLED_PLUGINS_FILE = join(PLUGINS_DIR, 'installed_plugins.json')
export const SETTINGS_FILE = join(CLAUDE_DIR, 'settings.json')
export const CLAUDE_JSON_FILE = join(HOME_DIR, '.claude.json')
