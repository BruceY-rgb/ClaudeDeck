import { ipcMain, BrowserWindow } from "electron";
import { watch } from "chokidar";
import { IPC } from "../../shared/ipc-channels";
import { AGENTS_DIR, SKILLS_DIR, PLUGINS_DIR } from "../../shared/constants";
import { agentService } from "../services/AgentService";
import { skillService } from "../services/SkillService";
import { pluginService } from "../services/PluginService";
import { commandService } from "../services/CommandService";
import { settingsService } from "../services/SettingsService";
import { hookService } from "../services/HookService";
import { mcpService } from "../services/MCPService";
import { marketplaceService } from "../services/MarketplaceService";
import { cliService } from "../services/CLIService";
import { projectDiscoveryService } from "../services/ProjectDiscoveryService";
import { pixelOfficeService } from "../services/PixelOfficeService";
import { planService } from "../services/PlanService";

let watcher: ReturnType<typeof watch> | null = null;
let mainWindowRef: BrowserWindow | null = null;

export function registerHandlers(mainWindow: BrowserWindow): void {
  mainWindowRef = mainWindow;
  // --- Agents ---
  ipcMain.handle(IPC.AGENTS_LIST, async () => {
    return agentService.list();
  });

  ipcMain.handle(IPC.AGENTS_READ, async (_e, name: string) => {
    return agentService.read(name);
  });

  ipcMain.handle(
    IPC.AGENTS_WRITE,
    async (
      _e,
      name: string,
      data: Parameters<typeof agentService.write>[1],
    ) => {
      return agentService.write(name, data);
    },
  );

  ipcMain.handle(IPC.AGENTS_DELETE, async (_e, name: string) => {
    return agentService.delete(name);
  });

  // --- Skills ---
  ipcMain.handle(IPC.SKILLS_LIST, async () => {
    return skillService.list();
  });

  ipcMain.handle(IPC.SKILLS_READ, async (_e, source: string, name: string) => {
    return skillService.read(source, name);
  });

  ipcMain.handle(
    IPC.SKILLS_WRITE,
    async (
      _e,
      name: string,
      body: string,
      metadata: Record<string, unknown>,
    ) => {
      return skillService.write(name, body, metadata);
    },
  );

  ipcMain.handle(IPC.SKILLS_DELETE, async (_e, name: string) => {
    return skillService.delete(name);
  });

  ipcMain.handle(IPC.SKILLS_DIRECTORY_TREE, async () => {
    return skillService.getDirectoryTree();
  });

  ipcMain.handle(IPC.SKILLS_READ_FILE, async (_e, filePath: string) => {
    return skillService.readFileContent(filePath);
  });

  ipcMain.handle(
    IPC.SKILLS_WRITE_FILE,
    async (_e, filePath: string, content: string) => {
      return skillService.writeFileContent(filePath, content);
    },
  );

  // --- Plugins ---
  ipcMain.handle(IPC.PLUGINS_LIST, async () => {
    return pluginService.list();
  });

  ipcMain.handle(IPC.PLUGINS_ENABLE, async (_e, pluginId: string) => {
    return settingsService.enablePlugin(pluginId);
  });

  ipcMain.handle(IPC.PLUGINS_DISABLE, async (_e, pluginId: string) => {
    return settingsService.disablePlugin(pluginId);
  });

  ipcMain.handle(IPC.PLUGINS_DETAIL, async (_e, pluginId: string) => {
    return pluginService.getDetail(pluginId);
  });

  ipcMain.handle(IPC.PLUGINS_UNINSTALL, async (_e, pluginId: string) => {
    return pluginService.uninstall(pluginId);
  });

  // --- Commands ---
  ipcMain.handle(IPC.COMMANDS_LIST, async () => {
    return commandService.list();
  });

  ipcMain.handle(
    IPC.COMMANDS_READ,
    async (_e, pluginId: string, name: string) => {
      return commandService.read(pluginId, name);
    },
  );

  // --- Settings ---
  ipcMain.handle(IPC.SETTINGS_READ, async () => {
    return settingsService.read();
  });

  ipcMain.handle(
    IPC.SETTINGS_WRITE,
    async (_e, settings: Parameters<typeof settingsService.write>[0]) => {
      return settingsService.write(settings);
    },
  );

  // --- Marketplace ---
  ipcMain.handle(IPC.MARKETPLACE_LIST, async () => {
    return marketplaceService.listMarketplaces();
  });

  ipcMain.handle(IPC.MARKETPLACE_ADD, async (_e, repoUrl: string) => {
    return marketplaceService.addMarketplace(repoUrl);
  });

  ipcMain.handle(IPC.MARKETPLACE_REMOVE, async (_e, id: string) => {
    return marketplaceService.removeMarketplace(id);
  });

  ipcMain.handle(IPC.MARKETPLACE_BROWSE, async (_e, marketplaceId: string) => {
    return marketplaceService.browsePlugins(marketplaceId);
  });

  ipcMain.handle(
    IPC.MARKETPLACE_PLUGIN_DETAIL,
    async (_e, marketplaceId: string, pluginName: string) => {
      return marketplaceService.getPluginDetails(marketplaceId, pluginName);
    },
  );

  ipcMain.handle(IPC.MARKETPLACE_REFRESH, async (_e, id: string) => {
    return marketplaceService.refreshMarketplace(id);
  });

  ipcMain.handle(
    IPC.MARKETPLACE_INSTALL,
    async (_e, marketplaceId: string, pluginName: string) => {
      return marketplaceService.installPlugin(marketplaceId, pluginName);
    },
  );

  ipcMain.handle(IPC.MARKETPLACE_GET_INSTALLED, async () => {
    return marketplaceService.getInstalledPlugins();
  });

  // --- Hooks ---
  ipcMain.handle(IPC.HOOKS_LIST, async () => {
    return hookService.list();
  });

  // --- MCP ---
  ipcMain.handle(IPC.MCP_LIST, async () => {
    return mcpService.list();
  });

  ipcMain.handle(IPC.MCP_TEMPLATES, async () => {
    return mcpService.listTemplates();
  });

  ipcMain.handle(
    IPC.MCP_ACTIVATE,
    async (_e, template: unknown, env: Record<string, string>) => {
      return mcpService.activate(
        template as Parameters<typeof mcpService.activate>[0],
        env,
      );
    },
  );

  ipcMain.handle(IPC.MCP_DEACTIVATE, async (_e, name: string) => {
    return mcpService.deactivate(name);
  });

  ipcMain.handle(IPC.MCP_UPDATE, async (_e, name: string, config: unknown) => {
    return mcpService.update(
      name,
      config as Parameters<typeof mcpService.update>[1],
    );
  });

  // --- CLI ---
  ipcMain.handle(IPC.CLI_RUN, async (_e, command: string[]) => {
    return cliService.run(command);
  });

  ipcMain.handle(
    IPC.CLI_RUN_AGENT,
    async (_e, agentName: string, prompt: string) => {
      if (!mainWindowRef) return { error: "No window available" };
      await cliService.runAgent(agentName, prompt, mainWindowRef);
      return { success: true };
    },
  );

  ipcMain.handle(
    IPC.CLI_TEST_SKILL,
    async (_e, skillName: string, prompt: string) => {
      if (!mainWindowRef) return { error: "No window available" };
      await cliService.testSkill(skillName, prompt, mainWindowRef);
      return { success: true };
    },
  );

  ipcMain.handle(IPC.CLI_KILL, async () => {
    await cliService.kill();
    return { success: true };
  });

  // --- Office / Projects ---
  ipcMain.handle(IPC.OFFICE_GET_PROJECTS, async () => {
    return projectDiscoveryService.getProjects();
  });

  ipcMain.handle(IPC.OFFICE_GET_PROJECT_AGENTS, async (_e, projectDir: string) => {
    return pixelOfficeService.getAgentsByProject(projectDir);
  });

  ipcMain.handle(IPC.OFFICE_GET_AGENT_CONTEXT, async (_e, projectDir: string, sessionId: string) => {
    return pixelOfficeService.getAgentContext(projectDir, sessionId);
  });

  ipcMain.handle(IPC.OFFICE_JOIN_TERMINAL, async (_e, projectDir: string, sessionId?: string) => {
    await pixelOfficeService.joinTerminal(projectDir, sessionId);
    return { success: true };
  });

  ipcMain.handle(IPC.OFFICE_DELETE_AGENT, async (_e, projectDir: string, sessionId: string) => {
    return pixelOfficeService.deleteAgent(projectDir, sessionId);
  });

  ipcMain.handle(IPC.OFFICE_DELETE_AGENTS, async (_e, projectDir: string, sessionIds: string[]) => {
    return pixelOfficeService.deleteAgents(projectDir, sessionIds);
  });

  ipcMain.handle(IPC.OFFICE_DELETE_PROJECT, async (_e, projectDir: string) => {
    return pixelOfficeService.deleteProject(projectDir);
  });

  // --- Plans ---
  ipcMain.handle(IPC.PLANS_LIST, async () => {
    return planService.listPlans();
  });

  ipcMain.handle(IPC.PLANS_READ, async (_e, fileName: string) => {
    return planService.readPlan(fileName);
  });

  ipcMain.handle(IPC.PLANS_WRITE, async (_e, fileName: string, content: string) => {
    return planService.writePlan(fileName, content);
  });

  ipcMain.handle(IPC.PLANS_DELETE, async (_e, fileName: string) => {
    return planService.deletePlan(fileName);
  });

  ipcMain.handle(IPC.PLANS_BATCH_DELETE, async (_e, fileNames: string[]) => {
    return planService.batchDeletePlans(fileNames);
  });

  // --- File Watcher ---
  setupFileWatcher(mainWindow);
}

function setupFileWatcher(mainWindow: BrowserWindow): void {
  if (watcher) return;

  const watchPaths = [AGENTS_DIR, SKILLS_DIR, PLUGINS_DIR];

  watcher = watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 300 },
    ignored: ["**/node_modules/**", "**/.git/**", "**/.git"],
    depth: 5,
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const notify = (type: string, path: string): void => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (!mainWindow.isDestroyed()) {
        mainWindow.webContents.send(IPC.FS_CHANGED, { type, path });
      }
    }, 300);
  };

  watcher.on("add", (path) => notify("add", path));
  watcher.on("change", (path) => notify("change", path));
  watcher.on("unlink", (path) => notify("unlink", path));
}

export function cleanupHandlers(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}
