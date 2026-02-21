// IPC Channel name constants
export const IPC = {
  // Agents
  AGENTS_LIST: "agents:list",
  AGENTS_READ: "agents:read",
  AGENTS_WRITE: "agents:write",
  AGENTS_DELETE: "agents:delete",

  // Skills
  SKILLS_LIST: "skills:list",
  SKILLS_READ: "skills:read",
  SKILLS_WRITE: "skills:write",
  SKILLS_DELETE: "skills:delete",
  SKILLS_DIRECTORY_TREE: "skills:directory-tree",
  SKILLS_READ_FILE: "skills:read-file",
  SKILLS_WRITE_FILE: "skills:write-file",

  // Plugins
  PLUGINS_LIST: "plugins:list",
  PLUGINS_ENABLE: "plugins:enable",
  PLUGINS_DISABLE: "plugins:disable",
  PLUGINS_DETAIL: "plugins:detail",
  PLUGINS_UNINSTALL: "plugins:uninstall",

  // Commands
  COMMANDS_LIST: "commands:list",
  COMMANDS_READ: "commands:read",

  // Hooks
  HOOKS_LIST: "hooks:list",

  // MCP
  MCP_LIST: "mcp:list",
  MCP_TEMPLATES: "mcp:templates",
  MCP_ACTIVATE: "mcp:activate",
  MCP_DEACTIVATE: "mcp:deactivate",
  MCP_UPDATE: "mcp:update",

  // Settings
  SETTINGS_READ: "settings:read",
  SETTINGS_WRITE: "settings:write",

  // Marketplace
  MARKETPLACE_LIST: "marketplace:list",
  MARKETPLACE_ADD: "marketplace:add",
  MARKETPLACE_REMOVE: "marketplace:remove",
  MARKETPLACE_BROWSE: "marketplace:browse",
  MARKETPLACE_PLUGIN_DETAIL: "marketplace:pluginDetail",
  MARKETPLACE_REFRESH: "marketplace:refresh",
  MARKETPLACE_INSTALL: "marketplace:install",
  MARKETPLACE_GET_INSTALLED: "marketplace:getInstalled",

  // CLI
  CLI_RUN: "cli:run",
  CLI_RUN_AGENT: "cli:run-agent",
  CLI_TEST_SKILL: "cli:test-skill",
  CLI_OUTPUT: "cli:output",
  CLI_KILL: "cli:kill",

  // File system events (main -> renderer)
  FS_CHANGED: "fs:changed",
} as const;
