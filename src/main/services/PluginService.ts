import {
  INSTALLED_PLUGINS_FILE,
  SETTINGS_FILE,
  PLUGINS_DIR,
  CC_INSTALLED_PLUGINS_FILE,
} from "../../shared/constants";
import { fsService } from "./FileSystemService";
import { parserService } from "./ParserService";
import type {
  InstalledPlugin,
  PluginManifest,
} from "../../shared/types/plugin";
import type { InstalledPluginRecord } from "../../shared/types/marketplace";
import type { Agent } from "../../shared/types/agent";
import type { Skill } from "../../shared/types/skill";
import type { Command } from "../../shared/types/command";
import type { HookEntry } from "../../shared/types/hook";
import { readdir, stat, readFile, unlink, writeFile, mkdir } from "fs/promises";
import { join, basename } from "path";

export interface PluginDetail {
  manifest: PluginManifest | null;
  agents: Agent[];
  skills: Skill[];
  commands: Command[];
  hooks: HookEntry[];
}

export class PluginService {
  async list(): Promise<InstalledPlugin[]> {
    // Read CSAM plugins (primary source)
    let csamPluginsData: Record<string, unknown> = {};
    try {
      if (await fsService.exists(INSTALLED_PLUGINS_FILE)) {
        const rawData = await fsService.readJSON<unknown>(
          INSTALLED_PLUGINS_FILE,
        );
        if (Array.isArray(rawData)) {
          for (const plugin of rawData) {
            const p = plugin as Record<string, unknown>;
            const id = p.id as string;
            if (id) {
              csamPluginsData[id] = p;
            }
          }
        } else if (rawData && typeof rawData === "object") {
          csamPluginsData =
            (rawData as { plugins?: Record<string, unknown> }).plugins || {};
        }
      }
    } catch {
      /* ignore */
    }

    // Read CC plugins (as supplementary source)
    let ccPluginsData: Record<string, unknown> = {};
    try {
      if (await fsService.exists(CC_INSTALLED_PLUGINS_FILE)) {
        const ccData = await fsService.readJSON<{
          plugins?: Record<string, unknown>;
        }>(CC_INSTALLED_PLUGINS_FILE);
        ccPluginsData = ccData?.plugins || {};
      }
    } catch {
      /* ignore */
    }

    // Merge both sources (CSAM takes precedence)
    const allPluginIds = new Set([
      ...Object.keys(csamPluginsData),
      ...Object.keys(ccPluginsData),
    ]);

    let enabledPlugins: Record<string, boolean> = {};
    if (await fsService.exists(SETTINGS_FILE)) {
      const settings = await fsService.readJSON<{
        enabledPlugins?: Record<string, boolean>;
      }>(SETTINGS_FILE);
      enabledPlugins = settings.enabledPlugins || {};
    }

    const plugins: InstalledPlugin[] = [];
    for (const id of allPluginIds) {
      // Prefer CSAM data, fallback to CC data
      const info = csamPluginsData[id] || ccPluginsData[id];
      if (!info) continue;

      const p = info as Record<string, unknown>;
      const [name, marketplace] = id.split("@");
      plugins.push({
        id,
        name,
        marketplace,
        version: (p.version as string) || "",
        installedAt: (p.installedAt as string) || "",
        lastUpdated: (p.lastUpdated as string) || "",
        installPath: (p.installPath as string) || "",
        gitCommitSha: (p.gitCommitSha as string) || "",
        isLocal: (p.isLocal as boolean) ?? true,
        enabled: !!enabledPlugins[id],
      });
    }
    return plugins;
  }

  async getDetail(pluginId: string): Promise<PluginDetail | null> {
    const plugins = await this.list();
    const plugin = plugins.find((p) => p.id === pluginId);
    if (!plugin) return null;

    const installPath = plugin.installPath;

    const [manifest, agents, skills, commands, hooks] = await Promise.all([
      this.loadManifest(installPath),
      this.loadAgents(installPath, pluginId, plugin.name),
      this.loadSkills(installPath, pluginId, plugin.name),
      this.loadCommands(installPath, pluginId, plugin.name),
      this.loadHooks(installPath, pluginId),
    ]);

    return { manifest, agents, skills, commands, hooks };
  }

  private async loadManifest(
    installPath: string,
  ): Promise<PluginManifest | null> {
    const manifestPath = join(installPath, "manifest.json");
    if (!(await fsService.exists(manifestPath))) return null;
    try {
      return await fsService.readJSON<PluginManifest>(manifestPath);
    } catch {
      return null;
    }
  }

  private async loadAgents(
    installPath: string,
    pluginId: string,
    pluginName: string,
  ): Promise<Agent[]> {
    const agentsDir = join(installPath, "agents");
    if (!(await fsService.exists(agentsDir))) return [];

    const agents: Agent[] = [];
    try {
      const files = await readdir(agentsDir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const filePath = join(agentsDir, file);
        const content = await readFile(filePath, "utf-8");
        agents.push(
          parserService.parseAgent(content, filePath, "plugin", pluginId),
        );
      }
    } catch {
      // Ignore errors
    }
    return agents;
  }

  private async loadSkills(
    installPath: string,
    pluginId: string,
    pluginName: string,
  ): Promise<Skill[]> {
    const skills: Skill[] = [];

    // Check for SKILL.md at plugin root (single-skill plugins)
    const rootSkill = join(installPath, "SKILL.md");
    if (await fsService.exists(rootSkill)) {
      try {
        const content = await readFile(rootSkill, "utf-8");
        const hasRef = await fsService.exists(join(installPath, "reference"));
        const hasTpl = await fsService.exists(join(installPath, "templates"));
        skills.push(
          parserService.parseSkill(
            content,
            rootSkill,
            "plugin",
            pluginId,
            hasRef,
            hasTpl,
          ),
        );
      } catch {
        /* ignore */
      }
    }

    // Check skills/ subdirectory
    const skillsDir = join(installPath, "skills");
    if (await fsService.exists(skillsDir)) {
      try {
        const skillDirs = await readdir(skillsDir);
        for (const skillDir of skillDirs) {
          const skillPath = join(skillsDir, skillDir, "SKILL.md");
          if (!(await fsService.exists(skillPath))) continue;
          const hasReference = await fsService.exists(
            join(skillsDir, skillDir, "reference"),
          );
          const hasTemplates = await fsService.exists(
            join(skillsDir, skillDir, "templates"),
          );
          const content = await readFile(skillPath, "utf-8");
          skills.push(
            parserService.parseSkill(
              content,
              skillPath,
              "plugin",
              pluginId,
              hasReference,
              hasTemplates,
            ),
          );
        }
      } catch {
        /* ignore */
      }
    }

    return skills;
  }

  private async loadCommands(
    installPath: string,
    pluginId: string,
    pluginName: string,
  ): Promise<Command[]> {
    const commandsDir = join(installPath, "commands");
    if (!(await fsService.exists(commandsDir))) return [];

    const commands: Command[] = [];
    try {
      const files = await readdir(commandsDir);
      for (const file of files) {
        if (!file.endsWith(".md")) continue;
        const filePath = join(commandsDir, file);
        const content = await readFile(filePath, "utf-8");
        commands.push(
          parserService.parseCommand(content, filePath, pluginId, pluginName),
        );
      }
    } catch {
      // Ignore errors
    }
    return commands;
  }

  private async loadHooks(
    installPath: string,
    pluginId: string,
  ): Promise<HookEntry[]> {
    const hooksFile = join(installPath, "hooks", "hooks.json");
    if (!(await fsService.exists(hooksFile))) return [];

    try {
      const data = await fsService.readJSON<{
        hooks?: Record<string, unknown>;
      }>(hooksFile);
      if (!data.hooks) return [];

      const hooks: HookEntry[] = [];
      for (const [event, configs] of Object.entries(data.hooks)) {
        const configArray = Array.isArray(configs) ? configs : [configs];
        for (const config of configArray) {
          hooks.push({
            pluginId,
            event: event as HookEntry["event"],
            matcher:
              ((config as Record<string, unknown>).matcher as string) || "",
            hooks:
              ((config as Record<string, unknown>)
                .hooks as HookEntry["hooks"]) || [],
          });
        }
      }
      return hooks;
    } catch {
      return [];
    }
  }

  // Helper method to get plugins in object format for other services
  async getPluginsObject(): Promise<Record<string, InstalledPluginRecord>> {
    const rawData = await fsService.readJSON<unknown>(INSTALLED_PLUGINS_FILE);
    const result: Record<string, InstalledPluginRecord> = {};

    if (Array.isArray(rawData)) {
      for (const plugin of rawData) {
        const p = plugin as InstalledPluginRecord;
        if (p.id) {
          result[p.id] = p;
        }
      }
    } else if (rawData && typeof rawData === "object") {
      const plugins =
        (rawData as { plugins?: Record<string, InstalledPluginRecord> })
          .plugins || {};
      return plugins;
    }

    return result;
  }

  async uninstall(pluginId: string): Promise<void> {
    // Read and convert to object format
    const rawData = await fsService.readJSON<unknown>(INSTALLED_PLUGINS_FILE);
    let pluginsData: Record<string, unknown> = {};

    if (Array.isArray(rawData)) {
      for (const plugin of rawData) {
        const p = plugin as Record<string, unknown>;
        const id = p.id as string;
        if (id) {
          pluginsData[id] = p;
        }
      }
    } else if (rawData && typeof rawData === "object") {
      pluginsData =
        (rawData as { plugins?: Record<string, unknown> }).plugins || {};
    }

    // Remove the plugin
    delete pluginsData[pluginId];

    // Convert back to array and save
    const pluginsArray = Object.values(pluginsData);
    await fsService.writeJSON(INSTALLED_PLUGINS_FILE, pluginsArray);

    // Sync removal to Claude Code's installed_plugins.json
    try {
      const ccData = await fsService.readJSON<{
        version?: number;
        plugins?: Record<string, unknown>;
      }>(CC_INSTALLED_PLUGINS_FILE);
      if (ccData?.plugins?.[pluginId]) {
        delete ccData.plugins[pluginId];
        await fsService.writeJSON(CC_INSTALLED_PLUGINS_FILE, ccData);
      }
    } catch {
      /* ignore if CC file doesn't exist */
    }

    // Remove from enabledPlugins in settings.json
    if (await fsService.exists(SETTINGS_FILE)) {
      const settings = await fsService.readJSON<{
        enabledPlugins?: Record<string, boolean>;
      }>(SETTINGS_FILE);
      if (settings.enabledPlugins && settings.enabledPlugins[pluginId]) {
        delete settings.enabledPlugins[pluginId];
        await fsService.writeJSON(SETTINGS_FILE, settings);
      }
    }
  }
}

export const pluginService = new PluginService();
