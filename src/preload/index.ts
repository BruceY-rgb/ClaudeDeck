import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/ipc-channels";
import type { Agent } from "../shared/types/agent";
import type { Skill } from "../shared/types/skill";
import type { InstalledPlugin } from "../shared/types/plugin";
import type { Command } from "../shared/types/command";
import type { Settings } from "../shared/types/settings";
import type {
  MarketplaceSource,
  MarketplacePlugin,
  MarketplacePluginDetail,
  InstalledPluginRecord,
} from "../shared/types/marketplace";
import type { HookDefinition } from "../shared/types/hook";
import type { MCPServer } from "../shared/types/mcp";

// Types for plugin detail
interface PluginDetail {
  manifest: { name: string; version: string; description: string } | null;
  agents: Agent[];
  skills: Skill[];
  commands: Command[];
  hooks: Array<{
    pluginId: string;
    event: string;
    matcher: string;
    hooks: unknown[];
  }>;
}

// File tree node type
interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

const api = {
  agents: {
    list: (): Promise<Agent[]> => ipcRenderer.invoke(IPC.AGENTS_LIST),
    read: (name: string): Promise<Agent | null> =>
      ipcRenderer.invoke(IPC.AGENTS_READ, name),
    write: (
      name: string,
      data: {
        name: string;
        description: string;
        tools: string[];
        model: string;
        body: string;
      },
    ): Promise<void> => ipcRenderer.invoke(IPC.AGENTS_WRITE, name, data),
    delete: (name: string): Promise<void> =>
      ipcRenderer.invoke(IPC.AGENTS_DELETE, name),
  },
  skills: {
    list: (): Promise<{ personal: Skill[]; plugin: Skill[] }> =>
      ipcRenderer.invoke(IPC.SKILLS_LIST),
    read: (source: string, name: string): Promise<Skill | null> =>
      ipcRenderer.invoke(IPC.SKILLS_READ, source, name),
    write: (
      name: string,
      body: string,
      metadata: Record<string, unknown>,
    ): Promise<void> =>
      ipcRenderer.invoke(IPC.SKILLS_WRITE, name, body, metadata),
    delete: (name: string): Promise<void> =>
      ipcRenderer.invoke(IPC.SKILLS_DELETE, name),
    getDirectoryTree: (): Promise<{
      personal: FileNode[];
      plugin: FileNode[];
    }> => ipcRenderer.invoke(IPC.SKILLS_DIRECTORY_TREE),
    readFile: (filePath: string): Promise<string | null> =>
      ipcRenderer.invoke(IPC.SKILLS_READ_FILE, filePath),
    writeFile: (filePath: string, content: string): Promise<void> =>
      ipcRenderer.invoke(IPC.SKILLS_WRITE_FILE, filePath, content),
  },
  plugins: {
    list: (): Promise<InstalledPlugin[]> =>
      ipcRenderer.invoke(IPC.PLUGINS_LIST),
    enable: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.PLUGINS_ENABLE, id),
    disable: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.PLUGINS_DISABLE, id),
    detail: (id: string): Promise<PluginDetail | null> =>
      ipcRenderer.invoke(IPC.PLUGINS_DETAIL, id),
    uninstall: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.PLUGINS_UNINSTALL, id),
  },
  commands: {
    list: (): Promise<Command[]> => ipcRenderer.invoke(IPC.COMMANDS_LIST),
    read: (pluginId: string, name: string): Promise<Command | null> =>
      ipcRenderer.invoke(IPC.COMMANDS_READ, pluginId, name),
  },
  settings: {
    read: (): Promise<Settings> => ipcRenderer.invoke(IPC.SETTINGS_READ),
    write: (settings: Settings): Promise<void> =>
      ipcRenderer.invoke(IPC.SETTINGS_WRITE, settings),
  },
  marketplace: {
    list: (): Promise<MarketplaceSource[]> =>
      ipcRenderer.invoke(IPC.MARKETPLACE_LIST),
    add: (repoUrl: string): Promise<MarketplaceSource> =>
      ipcRenderer.invoke(IPC.MARKETPLACE_ADD, repoUrl),
    remove: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.MARKETPLACE_REMOVE, id),
    browse: (marketplaceId: string): Promise<MarketplacePlugin[]> =>
      ipcRenderer.invoke(IPC.MARKETPLACE_BROWSE, marketplaceId),
    pluginDetail: (
      marketplaceId: string,
      pluginName: string,
    ): Promise<MarketplacePluginDetail | null> =>
      ipcRenderer.invoke(
        IPC.MARKETPLACE_PLUGIN_DETAIL,
        marketplaceId,
        pluginName,
      ),
    refresh: (id: string): Promise<void> =>
      ipcRenderer.invoke(IPC.MARKETPLACE_REFRESH, id),
    install: (
      marketplaceId: string,
      pluginName: string,
    ): Promise<InstalledPluginRecord> =>
      ipcRenderer.invoke(IPC.MARKETPLACE_INSTALL, marketplaceId, pluginName),
    getInstalled: (): Promise<InstalledPluginRecord[]> =>
      ipcRenderer.invoke(IPC.MARKETPLACE_GET_INSTALLED),
  },
  hooks: {
    list: (): Promise<HookDefinition[]> => ipcRenderer.invoke(IPC.HOOKS_LIST),
  },
  mcp: {
    list: (): Promise<MCPServer[]> => ipcRenderer.invoke(IPC.MCP_LIST),
    templates: (): Promise<unknown[]> => ipcRenderer.invoke(IPC.MCP_TEMPLATES),
    activate: (template: unknown, env: Record<string, string>): Promise<void> =>
      ipcRenderer.invoke(IPC.MCP_ACTIVATE, template, env),
    deactivate: (name: string): Promise<void> =>
      ipcRenderer.invoke(IPC.MCP_DEACTIVATE, name),
    update: (name: string, config: Partial<MCPServer>): Promise<void> =>
      ipcRenderer.invoke(IPC.MCP_UPDATE, name, config),
  },
  onFileChanged: (
    callback: (event: { type: string; path: string }) => void,
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      data: { type: string; path: string },
    ): void => {
      callback(data);
    };
    ipcRenderer.on(IPC.FS_CHANGED, handler);
    return () => ipcRenderer.removeListener(IPC.FS_CHANGED, handler);
  },
  cli: {
    run: (
      command: string[],
    ): Promise<{
      success: boolean;
      stdout: string;
      stderr: string;
      exitCode: number | null;
    }> => ipcRenderer.invoke(IPC.CLI_RUN, command),
    runAgent: (
      agentName: string,
      prompt: string,
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC.CLI_RUN_AGENT, agentName, prompt),
    testSkill: (
      skillName: string,
      prompt: string,
    ): Promise<{ success: boolean; error?: string }> =>
      ipcRenderer.invoke(IPC.CLI_TEST_SKILL, skillName, prompt),
    kill: (): Promise<{ success: boolean }> => ipcRenderer.invoke(IPC.CLI_KILL),
    onOutput: (
      callback: (data: {
        type: "stdout" | "stderr" | "close";
        data?: string;
        code?: number | null;
      }) => void,
    ) => {
      const handler = (
        _event: Electron.IpcRendererEvent,
        data: {
          type: "stdout" | "stderr" | "close";
          data?: string;
          code?: number | null;
        },
      ): void => {
        callback(data);
      };
      ipcRenderer.on(IPC.CLI_OUTPUT, handler);
      return () => ipcRenderer.removeListener(IPC.CLI_OUTPUT, handler);
    },
  },
};

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld("electronAPI", api);
