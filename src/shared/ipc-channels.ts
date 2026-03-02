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

  // Office / Projects
  OFFICE_GET_PROJECTS: "office:get-projects",
  OFFICE_GET_PROJECT_AGENTS: "office:get-project-agents",
  OFFICE_GET_AGENT_CONTEXT: "office:get-agent-context",
  OFFICE_JOIN_TERMINAL: "office:join-terminal",
  OFFICE_DELETE_AGENT: "office:delete-agent",
  OFFICE_DELETE_AGENTS: "office:delete-agents",
  OFFICE_DELETE_PROJECT: "office:delete-project",
  OFFICE_PROJECT_UPDATED: "office:project-updated",

  // Plans
  PLANS_LIST: "plans:list",
  PLANS_READ: "plans:read",
  PLANS_WRITE: "plans:write",
  PLANS_DELETE: "plans:delete",
  PLANS_BATCH_DELETE: "plans:batch-delete",

  // Project Config — project-level resource management
  // Agents
  PROJECT_CONFIG_AGENTS_LIST: "project-config:agents-list",
  PROJECT_CONFIG_AGENTS_READ: "project-config:agents-read",
  PROJECT_CONFIG_AGENTS_WRITE: "project-config:agents-write",
  PROJECT_CONFIG_AGENTS_DELETE: "project-config:agents-delete",
  // Skills
  PROJECT_CONFIG_SKILLS_LIST: "project-config:skills-list",
  PROJECT_CONFIG_SKILLS_READ: "project-config:skills-read",
  PROJECT_CONFIG_SKILLS_WRITE: "project-config:skills-write",
  PROJECT_CONFIG_SKILLS_DELETE: "project-config:skills-delete",
  // MCP
  PROJECT_CONFIG_MCP_LIST: "project-config:mcp-list",
  PROJECT_CONFIG_MCP_WRITE: "project-config:mcp-write",
  PROJECT_CONFIG_MCP_DELETE: "project-config:mcp-delete",
  // Plans
  PROJECT_CONFIG_PLANS_LIST: "project-config:plans-list",
  PROJECT_CONFIG_PLANS_READ: "project-config:plans-read",
  PROJECT_CONFIG_PLANS_WRITE: "project-config:plans-write",
  PROJECT_CONFIG_PLANS_DELETE: "project-config:plans-delete",
  // Hooks
  PROJECT_CONFIG_HOOKS_LIST: "project-config:hooks-list",
  PROJECT_CONFIG_HOOKS_WRITE: "project-config:hooks-write",
  // Commands
  PROJECT_CONFIG_COMMANDS_LIST: "project-config:commands-list",
  PROJECT_CONFIG_COMMANDS_READ: "project-config:commands-read",
  PROJECT_CONFIG_COMMANDS_WRITE: "project-config:commands-write",
  PROJECT_CONFIG_COMMANDS_DELETE: "project-config:commands-delete",
  // Summary
  PROJECT_CONFIG_SUMMARY: "project-config:summary",
  // Copy from global
  PROJECT_CONFIG_COPY_GLOBAL_AGENT: "project-config:copy-global-agent",
  PROJECT_CONFIG_COPY_GLOBAL_SKILL: "project-config:copy-global-skill",
} as const;
