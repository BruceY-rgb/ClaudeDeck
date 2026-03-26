/**
 * registerHandlers.ts — DEMO / MOCK MODE
 *
 * Every IPC handler returns data directly from the mock-data JSON files.
 * No file-system access to ~/.claude/ is performed.
 */

import { ipcMain, BrowserWindow, shell } from "electron";
import { IPC } from "../../shared/ipc-channels";
import { MockData } from "../mock-data/MockDataProvider";
import { communityService } from "../services/CommunityService";
import { memoryService } from "../services/MemoryService";

// ─── In-memory mock state (allows write/delete operations to "work") ────────
let mockAgents = [...MockData.agents];
let mockSkillsPersonal = [...MockData.skills.personal];
let mockSkillsPlugin = [...MockData.skills.plugin];
let mockPlugins = [...MockData.plugins];
let mockPlans = [...MockData.plans];
let mockMCPServers = [...MockData.mcpServers];
let mockSettings = { ...MockData.settings };

// Helper: generate PlanInfo from MockPlanInfo
function toPlanInfo(p: (typeof mockPlans)[0]) {
  const now = new Date();
  return {
    fileName: p.fileName,
    filePath: `/mock/plans/${p.fileName}`,
    name: p.fileName.replace(".md", "").replace(/-/g, " "),
    createdAt: new Date(now.getTime() - Math.random() * 30 * 86400000).toISOString(),
    modifiedAt: new Date(now.getTime() - Math.random() * 7 * 86400000).toISOString(),
    size: p.content.length,
    preview: p.content.slice(0, 500).replace(/\n/g, " "),
  };
}

export function registerHandlers(mainWindow: BrowserWindow): void {
  // ═══════════════════════════════════════════════════════════════════════════
  // Agents
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.AGENTS_LIST, async () => {
    return mockAgents;
  });

  ipcMain.handle(IPC.AGENTS_READ, async (_e, name: string) => {
    return mockAgents.find((a) => a.name === name) ?? null;
  });

  ipcMain.handle(IPC.AGENTS_WRITE, async (_e, name: string, data: { name: string; description: string; tools: string[]; model: string; body: string }) => {
    const idx = mockAgents.findIndex((a) => a.name === name);
    const agent = {
      name: data.name,
      description: data.description,
      tools: data.tools,
      model: data.model,
      body: data.body,
      source: "personal" as const,
      filePath: `/mock/agents/${data.name}.md`,
    };
    if (idx >= 0) {
      mockAgents[idx] = agent;
    } else {
      mockAgents.push(agent);
    }
    return { success: true };
  });

  ipcMain.handle(IPC.AGENTS_DELETE, async (_e, name: string) => {
    mockAgents = mockAgents.filter((a) => a.name !== name);
    return { success: true };
  });

  ipcMain.handle(IPC.AGENTS_BATCH_DELETE, async (_e, names: string[]) => {
    const set = new Set(names);
    mockAgents = mockAgents.filter((a) => !set.has(a.name));
    return { success: true, deletedCount: names.length, errors: [] };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Skills
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.SKILLS_LIST, async () => {
    return { personal: mockSkillsPersonal, plugin: mockSkillsPlugin };
  });

  ipcMain.handle(IPC.SKILLS_READ, async (_e, _source: string, name: string) => {
    const all = [...mockSkillsPersonal, ...mockSkillsPlugin];
    return all.find((s) => s.name === name) ?? null;
  });

  ipcMain.handle(IPC.SKILLS_WRITE, async (_e, name: string, body: string, metadata: Record<string, unknown>) => {
    const skill = {
      name,
      description: (metadata.description as string) || "",
      userInvocable: (metadata.userInvocable as boolean) ?? true,
      body,
      source: "personal" as const,
      filePath: `/mock/skills/${name}/SKILL.md`,
      hasReference: false,
      hasTemplates: false,
    };
    const idx = mockSkillsPersonal.findIndex((s) => s.name === name);
    if (idx >= 0) {
      mockSkillsPersonal[idx] = skill;
    } else {
      mockSkillsPersonal.push(skill);
    }
    return { success: true };
  });

  ipcMain.handle(IPC.SKILLS_DELETE, async (_e, name: string) => {
    mockSkillsPersonal = mockSkillsPersonal.filter((s) => s.name !== name);
    return { success: true };
  });

  ipcMain.handle(IPC.SKILLS_BATCH_DELETE, async (_e, names: string[]) => {
    const set = new Set(names);
    mockSkillsPersonal = mockSkillsPersonal.filter((s) => !set.has(s.name));
    return { success: true, deletedCount: names.length, errors: [] };
  });

  ipcMain.handle(IPC.SKILLS_DIRECTORY_TREE, async () => {
    // Build a simple directory tree from mock skills
    const personal = mockSkillsPersonal.map((s) => ({
      name: s.name,
      path: `/mock/skills/${s.name}`,
      isDirectory: true,
      children: [
        { name: "SKILL.md", path: `/mock/skills/${s.name}/SKILL.md`, isDirectory: false },
      ],
    }));
    const plugin = mockSkillsPlugin.map((s) => ({
      name: s.name,
      path: `/mock/skills/${s.name}`,
      isDirectory: true,
      children: [
        { name: "SKILL.md", path: `/mock/skills/${s.name}/SKILL.md`, isDirectory: false },
      ],
    }));
    return { personal, plugin };
  });

  ipcMain.handle(IPC.SKILLS_READ_FILE, async (_e, filePath: string) => {
    // Try to find the skill by path
    const all = [...mockSkillsPersonal, ...mockSkillsPlugin];
    const skill = all.find((s) => filePath.includes(s.name));
    return skill ? skill.body : "// Mock file content";
  });

  ipcMain.handle(IPC.SKILLS_WRITE_FILE, async (_e, _filePath: string, _content: string) => {
    return { success: true };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Plugins
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.PLUGINS_LIST, async () => {
    return mockPlugins;
  });

  ipcMain.handle(IPC.PLUGINS_ENABLE, async (_e, pluginId: string) => {
    const p = mockPlugins.find((pl) => pl.id === pluginId);
    if (p) p.enabled = true;
    mockSettings.enabledPlugins[pluginId] = true;
  });

  ipcMain.handle(IPC.PLUGINS_DISABLE, async (_e, pluginId: string) => {
    const p = mockPlugins.find((pl) => pl.id === pluginId);
    if (p) p.enabled = false;
    delete mockSettings.enabledPlugins[pluginId];
  });

  ipcMain.handle(IPC.PLUGINS_DETAIL, async (_e, pluginId: string) => {
    const plugin = mockPlugins.find((p) => p.id === pluginId);
    if (!plugin) return null;
    // Build a mock PluginDetail
    const pluginAgents = mockAgents.filter((a) => a.pluginId === pluginId);
    const pluginSkills = mockSkillsPlugin.filter((s) => s.pluginId === pluginId);
    const pluginCommands = MockData.commands.filter((c) => c.pluginId === pluginId);
    return {
      manifest: {
        name: plugin.name,
        version: plugin.version,
        description: `${plugin.name} - A powerful Claude Code plugin`,
        author: { name: "HIMA Team" },
        license: "MIT",
        keywords: ["claude-code", pluginId],
      },
      agents: pluginAgents,
      skills: pluginSkills,
      commands: pluginCommands,
      hooks: [],
    };
  });

  ipcMain.handle(IPC.PLUGINS_UNINSTALL, async (_e, pluginId: string) => {
    mockPlugins = mockPlugins.filter((p) => p.id !== pluginId);
    return { success: true };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Commands
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.COMMANDS_LIST, async () => {
    return MockData.commands;
  });

  ipcMain.handle(IPC.COMMANDS_READ, async (_e, pluginId: string, name: string) => {
    return MockData.commands.find((c) => c.pluginId === pluginId && c.name === name) ?? null;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Settings
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.SETTINGS_READ, async () => {
    return mockSettings;
  });

  ipcMain.handle(IPC.SETTINGS_WRITE, async (_e, settings: typeof mockSettings) => {
    mockSettings = { ...settings };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Marketplace
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.MARKETPLACE_LIST, async () => {
    return MockData.marketplaceSources;
  });

  ipcMain.handle(IPC.MARKETPLACE_ADD, async (_e, repoUrl: string) => {
    // Simulate adding a marketplace
    const id = repoUrl.split("/").pop() || "new-marketplace";
    const newSource = {
      id,
      source: { source: "github" as const, repo: repoUrl },
      installLocation: `/mock/marketplaces/${id}`,
      lastUpdated: new Date().toISOString(),
    };
    return newSource;
  });

  ipcMain.handle(IPC.MARKETPLACE_REMOVE, async (_e, _id: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.MARKETPLACE_BROWSE, async (_e, marketplaceId: string) => {
    return MockData.marketplacePlugins[marketplaceId] ?? [];
  });

  ipcMain.handle(IPC.MARKETPLACE_BROWSE_CATEGORY, async (_e, _marketplaceId: string, _categoryPath: string) => {
    return [];
  });

  ipcMain.handle(IPC.MARKETPLACE_PLUGIN_DETAIL, async (_e, marketplaceId: string, pluginName: string) => {
    const plugins = MockData.marketplacePlugins[marketplaceId] ?? [];
    const plugin = plugins.find((p) => p.id === pluginName || p.name === pluginName);
    if (!plugin) return null;
    return {
      ...plugin,
      agents: [{ name: `${pluginName}-agent`, path: `/mock/agents/${pluginName}-agent.md` }],
      skills: [{ name: `${pluginName}-skill`, path: `/mock/skills/${pluginName}-skill/SKILL.md` }],
      commands: [{ name: `${pluginName}-cmd`, path: `/mock/commands/${pluginName}-cmd.md` }],
      hooks: [],
      mcpConfigs: [],
      readmeContent: `# ${plugin.name}\n\n${plugin.description}\n\n## Installation\n\nInstall via HIMA AIP marketplace.\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Usage\n\nRefer to the documentation for detailed usage instructions.`,
    };
  });

  ipcMain.handle(IPC.MARKETPLACE_REFRESH, async (_e, _id: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.MARKETPLACE_INSTALL, async (_e, marketplaceId: string, pluginName: string) => {
    const plugins = MockData.marketplacePlugins[marketplaceId] ?? [];
    const plugin = plugins.find((p) => p.id === pluginName || p.name === pluginName);
    return {
      id: pluginName,
      name: plugin?.name || pluginName,
      marketplace: marketplaceId,
      version: plugin?.version || "1.0.0",
      installedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      installPath: `/mock/plugins/${pluginName}`,
      gitCommitSha: "mock-sha-" + Date.now(),
      isLocal: false,
    };
  });

  ipcMain.handle(IPC.MARKETPLACE_GET_INSTALLED, async () => {
    return mockPlugins.map((p) => ({
      id: p.id,
      name: p.name,
      marketplace: p.marketplace,
      version: p.version,
      installedAt: p.installedAt,
      lastUpdated: p.lastUpdated,
      installPath: p.installPath,
      gitCommitSha: p.gitCommitSha,
      isLocal: p.isLocal,
    }));
  });

  ipcMain.handle(IPC.MARKETPLACE_READ_FILE, async (_e, _filePath: string) => {
    return "// Mock file content\n// This is a demo installation.";
  });

  ipcMain.handle(IPC.MARKETPLACE_INSTALL_AGENT, async (_e, marketplaceId: string, agentName: string, _sourcePath: string) => {
    return {
      id: agentName,
      name: agentName,
      marketplace: marketplaceId,
      version: "1.0.0",
      installedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      installPath: `/mock/agents/${agentName}`,
      gitCommitSha: "mock-sha-" + Date.now(),
      isLocal: false,
    };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Hooks
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.HOOKS_LIST, async () => {
    return MockData.hooks;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MCP
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.MCP_LIST, async () => {
    return mockMCPServers;
  });

  ipcMain.handle(IPC.MCP_TEMPLATES, async () => {
    // Return some mock templates
    return [
      { name: "filesystem", description: "Access local filesystem", type: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem"], requiredEnvVars: [], pluginId: "claude-code-power-pack", pluginName: "Claude Code Power Pack" },
      { name: "github", description: "GitHub API integration", type: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], requiredEnvVars: ["GITHUB_TOKEN"], pluginId: "devops-toolkit", pluginName: "DevOps Toolkit" },
      { name: "postgres", description: "PostgreSQL database access", type: "stdio", command: "npx", args: ["-y", "@modelcontextprotocol/server-postgres"], requiredEnvVars: ["DATABASE_URL"], pluginId: "db-tools", pluginName: "Database Tools Suite" },
    ];
  });

  ipcMain.handle(IPC.MCP_ACTIVATE, async (_e, template: { name: string }, _env: Record<string, string>) => {
    // Simulate activation
    const existing = mockMCPServers.find((s) => s.name === template.name);
    if (existing) {
      existing.active = true;
    }
  });

  ipcMain.handle(IPC.MCP_DEACTIVATE, async (_e, name: string) => {
    const server = mockMCPServers.find((s) => s.name === name);
    if (server) server.active = false;
  });

  ipcMain.handle(IPC.MCP_UPDATE, async (_e, name: string, config: Record<string, unknown>) => {
    const idx = mockMCPServers.findIndex((s) => s.name === name);
    if (idx >= 0) {
      mockMCPServers[idx] = { ...mockMCPServers[idx], ...config } as typeof mockMCPServers[0];
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CLI (mock — no real CLI execution)
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.CLI_RUN, async (_e, _command: string[]) => {
    return {
      success: true,
      stdout: "[Demo Mode] CLI command simulated successfully.\nOutput: All checks passed.",
      stderr: "",
      exitCode: 0,
    };
  });

  ipcMain.handle(IPC.CLI_RUN_AGENT, async (_e, agentName: string, _prompt: string) => {
    console.log(`[Demo] Simulating agent run: ${agentName}`);
    return { success: true };
  });

  ipcMain.handle(IPC.CLI_TEST_SKILL, async (_e, skillName: string, _prompt: string) => {
    console.log(`[Demo] Simulating skill test: ${skillName}`);
    return { success: true };
  });

  ipcMain.handle(IPC.CLI_KILL, async () => {
    return { success: true };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Office / Projects
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.OFFICE_GET_PROJECTS, async () => {
    return MockData.projects.map((p) => ({
      ...p,
      lastActivity: new Date(p.lastActivity),
      sessions: p.sessions.map((s) => ({
        ...s,
        lastModified: new Date(s.lastModified),
      })),
    }));
  });

  ipcMain.handle(IPC.OFFICE_GET_PROJECT_AGENTS, async (_e, projectDir: string) => {
    const agents = MockData.officeAgents[projectDir] ?? [];
    return agents.map((a) => ({
      ...a,
      lastModified: new Date(a.lastModified),
    }));
  });

  ipcMain.handle(IPC.OFFICE_GET_AGENT_CONTEXT, async (_e, projectDir: string, sessionId: string) => {
    // Build a mock AgentContext from session details
    const key = `${projectDir}::${sessionId}`;
    const detail = MockData.sessionDetails[key];
    if (!detail) {
      return {
        sessionId,
        projectDir,
        messages: [
          { role: "user", content: "Hello, can you help me with this project?", timestamp: new Date(), tools: [] },
          { role: "assistant", content: "Of course! I'd be happy to help. What would you like to work on?", timestamp: new Date(), tools: [] },
        ],
      };
    }
    return {
      sessionId,
      projectDir,
      messages: detail.messages.map((m) => ({
        role: m.role,
        content: m.content.filter((c) => c.type === "text").map((c) => c.text).join("\n"),
        timestamp: new Date(m.timestamp),
        tools: m.content.filter((c) => c.type === "tool_use").map((c) => ({ name: c.toolName || "", input: c.input || {} })),
      })),
    };
  });

  ipcMain.handle(IPC.OFFICE_JOIN_TERMINAL, async (_e, _projectDir: string, _sessionId?: string) => {
    console.log("[Demo] Terminal join simulated");
    return { success: true };
  });

  ipcMain.handle(IPC.OFFICE_DELETE_AGENT, async (_e, _projectDir: string, _sessionId: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.OFFICE_DELETE_AGENTS, async (_e, _projectDir: string, _sessionIds: string[]) => {
    return { success: true };
  });

  ipcMain.handle(IPC.OFFICE_DELETE_PROJECT, async (_e, _projectDir: string) => {
    return { success: true };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Plans
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.PLANS_LIST, async () => {
    return mockPlans.map(toPlanInfo);
  });

  ipcMain.handle(IPC.PLANS_READ, async (_e, fileName: string) => {
    const plan = mockPlans.find((p) => p.fileName === fileName);
    return plan ? plan.content : null;
  });

  ipcMain.handle(IPC.PLANS_WRITE, async (_e, fileName: string, content: string) => {
    const idx = mockPlans.findIndex((p) => p.fileName === fileName);
    if (idx >= 0) {
      mockPlans[idx] = { ...mockPlans[idx], content };
    } else {
      mockPlans.push({ fileName, content });
    }
    return { success: true };
  });

  ipcMain.handle(IPC.PLANS_DELETE, async (_e, fileName: string) => {
    mockPlans = mockPlans.filter((p) => p.fileName !== fileName);
    return { success: true };
  });

  ipcMain.handle(IPC.PLANS_BATCH_DELETE, async (_e, fileNames: string[]) => {
    const set = new Set(fileNames);
    mockPlans = mockPlans.filter((p) => !set.has(p.fileName));
    return { success: true, deletedCount: fileNames.length, errors: [] };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Project Config
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.PROJECT_CONFIG_AGENTS_LIST, async (_e, projectDir: string) => {
    const config = MockData.projectConfigs[projectDir];
    return config ? config.agents : [];
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_AGENTS_READ, async (_e, projectDir: string, name: string) => {
    const config = MockData.projectConfigs[projectDir];
    if (!config) return null;
    return config.agents.find((a) => a.name === name) ?? null;
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_AGENTS_WRITE, async (_e, _projectDir: string, _name: string, _data: unknown) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_AGENTS_DELETE, async (_e, _projectDir: string, _name: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_AGENTS_BATCH_DELETE, async (_e, _projectDir: string, _names: string[]) => {
    return { success: true, deletedCount: 0, errors: [] };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_SKILLS_LIST, async (_e, projectDir: string) => {
    const config = MockData.projectConfigs[projectDir];
    return config ? config.skills : [];
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_SKILLS_READ, async (_e, projectDir: string, name: string) => {
    const config = MockData.projectConfigs[projectDir];
    if (!config) return null;
    return config.skills.find((s) => s.name === name) ?? null;
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_SKILLS_WRITE, async (_e, _projectDir: string, _name: string, _data: unknown) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_SKILLS_DELETE, async (_e, _projectDir: string, _name: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_SKILLS_BATCH_DELETE, async (_e, _projectDir: string, _names: string[]) => {
    return { success: true, deletedCount: 0, errors: [] };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_MCP_LIST, async (_e, projectDir: string) => {
    const config = MockData.projectConfigs[projectDir];
    return config ? config.mcpServers : [];
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_MCP_WRITE, async (_e, _projectDir: string, _name: string, _data: unknown) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_MCP_DELETE, async (_e, _projectDir: string, _name: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_PLANS_LIST, async (_e, projectDir: string) => {
    const config = MockData.projectConfigs[projectDir];
    return config ? config.plans : [];
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_PLANS_READ, async (_e, projectDir: string, name: string) => {
    const config = MockData.projectConfigs[projectDir];
    if (!config) return null;
    const plan = config.plans.find((p) => p.name === name);
    return plan ? plan.content : null;
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_PLANS_WRITE, async (_e, _projectDir: string, _name: string, _content: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_PLANS_DELETE, async (_e, _projectDir: string, _name: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_HOOKS_LIST, async (_e, projectDir: string) => {
    const config = MockData.projectConfigs[projectDir];
    return config ? config.hooks : [];
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_HOOKS_WRITE, async (_e, _projectDir: string, _hooks: unknown[]) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_COMMANDS_LIST, async (_e, projectDir: string) => {
    const config = MockData.projectConfigs[projectDir];
    return config ? config.commands : [];
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_COMMANDS_READ, async (_e, projectDir: string, name: string) => {
    const config = MockData.projectConfigs[projectDir];
    if (!config) return null;
    const cmd = (config.commands as Array<{ name: string; body?: string }>).find((c) => c.name === name);
    return cmd ?? null;
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_COMMANDS_WRITE, async (_e, _projectDir: string, _name: string, _data: unknown) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_COMMANDS_DELETE, async (_e, _projectDir: string, _name: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_SUMMARY, async (_e, projectDir: string) => {
    const config = MockData.projectConfigs[projectDir];
    return config ? config.summary : { agentCount: 0, skillCount: 0, mcpCount: 0, planCount: 0, hookCount: 0, commandCount: 0 };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_COPY_GLOBAL_AGENT, async (_e, _projectDir: string, _agentName: string) => {
    return { success: true };
  });

  ipcMain.handle(IPC.PROJECT_CONFIG_COPY_GLOBAL_SKILL, async (_e, _projectDir: string, _skillName: string) => {
    return { success: true };
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // File System (mock — no real file operations)
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.FILE_REVEAL, async (_e, _filePath: string) => {
    console.log("[Demo] File reveal simulated");
  });

  ipcMain.handle(IPC.FILE_REVEAL_MCP_CONFIG, async () => {
    console.log("[Demo] MCP config reveal simulated");
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Session Detail
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.SESSION_GET_DETAIL, async (_e, projectDir: string, sessionId: string) => {
    const key = `${projectDir}::${sessionId}`;
    return MockData.sessionDetails[key] ?? null;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Analytics
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.ANALYTICS_GET_SUMMARY, async (_e, timeRange: string) => {
    return MockData.getAnalytics(timeRange);
  });

  ipcMain.handle(IPC.ANALYTICS_GET_HEATMAP, async () => {
    return MockData.heatmap;
  });

  ipcMain.handle(IPC.ANALYTICS_GET_WRAPPED, async () => {
    return MockData.wrapped;
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Community
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.COMMUNITY_GET_OVERVIEW, async () => {
    return communityService.getOverview();
  });

  ipcMain.handle(IPC.COMMUNITY_LIST_CONTRIBUTORS, async (_e, query?: string) => {
    return communityService.listContributors(query);
  });

  ipcMain.handle(IPC.COMMUNITY_GET_CONTRIBUTOR, async (_e, id: string) => {
    return communityService.getContributor(id);
  });

  ipcMain.handle(IPC.COMMUNITY_LIST_RESOURCES, async (_e, contributorId?: string, type?: string) => {
    return communityService.listResources(contributorId, type);
  });

  ipcMain.handle(IPC.COMMUNITY_GET_RESOURCE, async (_e, id: string) => {
    return communityService.getResource(id);
  });

  ipcMain.handle(IPC.COMMUNITY_INSTALL_RESOURCE, async (_e, resourceId: string) => {
    return communityService.installResource(resourceId);
  });

  ipcMain.handle(IPC.COMMUNITY_SEARCH, async (_e, query: string) => {
    return communityService.search(query);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Memory Hub
  // ═══════════════════════════════════════════════════════════════════════════
  ipcMain.handle(IPC.MEMORY_GET_OVERVIEW, async () => {
    return memoryService.getOverview();
  });

  ipcMain.handle(IPC.MEMORY_LIST, async (_e, category?: string, source?: string) => {
    return memoryService.list(category, source);
  });

  ipcMain.handle(IPC.MEMORY_GET, async (_e, id: string) => {
    return memoryService.get(id);
  });

  ipcMain.handle(IPC.MEMORY_SEARCH, async (_e, query: string) => {
    return memoryService.search(query);
  });

  ipcMain.handle(IPC.MEMORY_LIST_CHAINS, async () => {
    return memoryService.listChains();
  });

  ipcMain.handle(IPC.MEMORY_GET_CHAIN, async (_e, id: string) => {
    return memoryService.getChain(id);
  });

  ipcMain.handle(IPC.MEMORY_GET_CHAIN_MEMORIES, async (_e, chainId: string) => {
    return memoryService.getChainMemories(chainId);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // File Watcher — disabled in demo mode
  // ═══════════════════════════════════════════════════════════════════════════
  // No file watcher needed in demo mode
}

export function cleanupHandlers(): void {
  // No-op in demo mode
}
