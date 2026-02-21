import fs from "fs/promises";
import path from "path";
import {
  KNOWN_MARKETPLACES_FILE,
  MARKETPLACES_DIR,
  INSTALLED_PLUGINS_FILE,
  CC_KNOWN_MARKETPLACES_FILE,
  CC_INSTALLED_PLUGINS_FILE,
} from "../../shared/constants";
import {
  MarketplaceSource,
  MarketplacePlugin,
  MarketplacePluginDetail,
  InstalledPluginRecord,
} from "../../shared/types/marketplace";
import { gitService } from "./GitService";
import { FileSystemService } from "./FileSystemService";

interface MarketplaceManifestPlugin {
  name: string;
  description?: string;
  source: string | { source: string; url: string };
  version?: string;
  author?: string | { name: string; email?: string };
  category?: string;
  skills?: string[];
}

interface MarketplaceManifest {
  name?: string;
  plugins?: MarketplaceManifestPlugin[];
}

export class MarketplaceService {
  private fsService = new FileSystemService();

  private readonly DEFAULT_MARKETPLACE_REPO =
    "https://github.com/anthropic/claude-code-plugins";

  async initializeDefaultMarketplace(): Promise<void> {
    try {
      const marketplaces = await this.listMarketplaces();
      if (!Array.isArray(marketplaces)) {
        console.log("Invalid marketplaces data, resetting");
        return;
      }

      // Check if claude-code-plugins already exists
      if (marketplaces.some((m) => m.id === "claude-code-plugins")) {
        return;
      }

      // Add default marketplace
      await this.addMarketplace(this.DEFAULT_MARKETPLACE_REPO);
    } catch (error) {
      console.log("Failed to initialize default marketplace:", error);
    }
  }

  async listMarketplaces(): Promise<MarketplaceSource[]> {
    try {
      const data = await fs.readFile(KNOWN_MARKETPLACES_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed as MarketplaceSource[];
    } catch {
      return [];
    }
  }

  async addMarketplace(repoUrl: string): Promise<MarketplaceSource> {
    // Extract marketplace ID from URL
    const id = this.extractMarketplaceId(repoUrl);
    const installLocation = path.join(MARKETPLACES_DIR, id);

    // Clone the repository
    await gitService.clone(repoUrl, installLocation);

    // Get the latest commit SHA
    const gitCommitSha = await gitService.getLastCommitSha(installLocation);

    const marketplace: MarketplaceSource = {
      id,
      source: { source: "github", repo: repoUrl },
      installLocation,
      lastUpdated: new Date().toISOString(),
    };

    // Save to known_marketplaces.json
    const marketplaces = await this.listMarketplaces();
    const existing = marketplaces.findIndex((m) => m.id === id);
    if (existing >= 0) {
      marketplaces[existing] = marketplace;
    } else {
      marketplaces.push(marketplace);
    }
    await this.saveMarketplaces(marketplaces);

    return marketplace;
  }

  async removeMarketplace(id: string): Promise<void> {
    const marketplaces = await this.listMarketplaces();
    const filtered = marketplaces.filter((m) => m.id !== id);
    await this.saveMarketplaces(filtered);
  }

  async refreshMarketplace(id: string): Promise<void> {
    const marketplaces = await this.listMarketplaces();
    const marketplace = marketplaces.find((m) => m.id === id);
    if (!marketplace) {
      throw new Error(`Marketplace ${id} not found`);
    }

    await gitService.pull(marketplace.installLocation);
    marketplace.lastUpdated = new Date().toISOString();

    const index = marketplaces.findIndex((m) => m.id === id);
    marketplaces[index] = marketplace;
    await this.saveMarketplaces(marketplaces);
  }

  private async saveMarketplaces(
    marketplaces: MarketplaceSource[],
  ): Promise<void> {
    // Save our own format (array)
    await fs.writeFile(
      KNOWN_MARKETPLACES_FILE,
      JSON.stringify(marketplaces, null, 2),
    );
    // Sync to Claude Code's format (Record<id, {source, installLocation, lastUpdated}>)
    const ccFormat: Record<string, unknown> = {};
    for (const m of marketplaces) {
      ccFormat[m.id] = {
        source: this.convertSourceForCC(m.source.repo || ""),
        installLocation: m.installLocation,
        lastUpdated: m.lastUpdated,
      };
    }
    await fs.writeFile(
      CC_KNOWN_MARKETPLACES_FILE,
      JSON.stringify(ccFormat, null, 2),
    );
  }

  private convertSourceForCC(repoUrl: string): {
    source: string;
    repo?: string;
    url?: string;
  } {
    if (repoUrl.endsWith(".git")) {
      return { source: "git", url: repoUrl };
    }
    // Convert full GitHub URL to owner/repo format
    const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?$/);
    if (match) {
      return { source: "github", repo: match[1] };
    }
    return {
      source: "git",
      url: repoUrl.endsWith(".git") ? repoUrl : repoUrl + ".git",
    };
  }

  private async readManifest(
    installLocation: string,
  ): Promise<MarketplaceManifest | null> {
    try {
      const manifestPath = path.join(
        installLocation,
        ".claude-plugin",
        "marketplace.json",
      );
      const data = await fs.readFile(manifestPath, "utf-8");
      return JSON.parse(data) as MarketplaceManifest;
    } catch {
      return null;
    }
  }

  private resolvePluginDir(
    installLocation: string,
    source: string | { source: string; url: string },
  ): string {
    if (typeof source === "string") {
      return path.resolve(installLocation, source);
    }
    return ""; // remote URL — no local path
  }

  async browsePlugins(marketplaceId: string): Promise<MarketplacePlugin[]> {
    const marketplaces = await this.listMarketplaces();
    const marketplace = marketplaces.find((m) => m.id === marketplaceId);
    if (!marketplace) {
      throw new Error(`Marketplace ${marketplaceId} not found`);
    }

    const manifest = await this.readManifest(marketplace.installLocation);
    const plugins: MarketplacePlugin[] = [];

    if (manifest?.plugins?.length) {
      for (const mp of manifest.plugins) {
        const authorName =
          typeof mp.author === "string" ? mp.author : mp.author?.name || "";

        // Remote URL source (e.g. superpowers-marketplace)
        if (typeof mp.source !== "string") {
          plugins.push({
            id: `${mp.name}@${marketplaceId}`,
            name: mp.name,
            description: mp.description || `Plugin: ${mp.name}`,
            version: mp.version || "1.0.0",
            author: authorName,
            repository: mp.source.url,
            readmePath: "",
            marketplaceId,
          });
          continue;
        }

        // Monolithic plugin (source "./") with explicit skills array
        if ((mp.source === "./" || mp.source === ".") && mp.skills?.length) {
          for (const skillPath of mp.skills) {
            const skillDir = path.resolve(
              marketplace.installLocation,
              skillPath,
            );
            const skillName = path.basename(skillDir);
            const info = await this.extractPluginInfo(skillDir, marketplaceId);
            plugins.push(
              info || {
                id: `${skillName}@${marketplaceId}`,
                name: skillName,
                description: mp.description || `Skill: ${skillName}`,
                version: mp.version || "1.0.0",
                author: authorName,
                repository: undefined,
                readmePath: path.join(skillDir, "README.md"),
                marketplaceId,
              },
            );
          }
          continue;
        }

        // Monolithic plugin (source "./") without skills — single entry
        if (mp.source === "./" || mp.source === ".") {
          plugins.push({
            id: `${mp.name}@${marketplaceId}`,
            name: mp.name,
            description: mp.description || `Plugin: ${mp.name}`,
            version: mp.version || "1.0.0",
            author: authorName,
            repository: undefined,
            readmePath: path.join(marketplace.installLocation, "README.md"),
            marketplaceId,
          });
          continue;
        }

        // Normal local path source (e.g. "./plugins/agent-sdk-dev")
        const pluginDir = this.resolvePluginDir(
          marketplace.installLocation,
          mp.source,
        );
        const info = await this.extractPluginInfo(pluginDir, marketplaceId);
        plugins.push(
          info || {
            id: `${mp.name}@${marketplaceId}`,
            name: mp.name,
            description: mp.description || `Plugin: ${mp.name}`,
            version: mp.version || "1.0.0",
            author: authorName,
            repository: undefined,
            readmePath: path.join(pluginDir, "README.md"),
            marketplaceId,
          },
        );
      }
    } else {
      // No manifest — scan known subdirectories first
      const KNOWN_DIRS = ["plugins", "agents", "categories", "skills"];
      let scanDir = "";
      for (const dir of KNOWN_DIRS) {
        const candidate = path.join(marketplace.installLocation, dir);
        try {
          const s = await fs.stat(candidate);
          if (s.isDirectory()) {
            scanDir = candidate;
            break;
          }
        } catch {
          /* not found */
        }
      }

      if (!scanDir) scanDir = marketplace.installLocation;

      const SKIP = new Set([
        ".git",
        ".github",
        ".vscode",
        ".devcontainer",
        ".claude",
        ".claude-plugin",
        "scripts",
        "docs",
        "examples",
        "tests",
        "schemas",
        "Script",
        "tools",
        "node_modules",
        "_images",
        "assets",
        "screenshots",
      ]);
      const entries = await fs.readdir(scanDir, { withFileTypes: true });
      for (const entry of entries) {
        if (
          !entry.isDirectory() ||
          entry.name.startsWith(".") ||
          SKIP.has(entry.name)
        )
          continue;
        const pluginDir = path.join(scanDir, entry.name);
        const plugin = await this.extractPluginInfo(pluginDir, marketplaceId);
        if (plugin) plugins.push(plugin);
      }
    }

    return plugins;
  }

  private async findPluginDir(
    installLocation: string,
    pluginName: string,
  ): Promise<string> {
    const manifest = await this.readManifest(installLocation);
    if (manifest?.plugins?.length) {
      // First, try to find a manifest entry whose name matches directly
      const mp = manifest.plugins.find((p) => p.name === pluginName);
      if (mp) {
        // Handle skills array (anthropic-agent-skills style)
        if (
          typeof mp.source === "string" &&
          (mp.source === "./" || mp.source === ".") &&
          mp.skills?.length
        ) {
          const skillMatch = mp.skills.find(
            (s) => path.basename(s) === pluginName,
          );
          if (skillMatch) return path.resolve(installLocation, skillMatch);
        }
        const resolved = this.resolvePluginDir(installLocation, mp.source);
        if (resolved) return resolved;
      }

      // If no direct name match, the pluginName may be a skill name from a
      // monolithic manifest entry (e.g., pluginName="pptx" inside
      // plugin "document-skills" with skills: ["./skills/pptx"]).
      // Search all manifest entries for a matching skill path.
      for (const entry of manifest.plugins) {
        if (
          typeof entry.source === "string" &&
          (entry.source === "./" || entry.source === ".") &&
          entry.skills?.length
        ) {
          const skillMatch = entry.skills.find(
            (s) => path.basename(s) === pluginName,
          );
          if (skillMatch) return path.resolve(installLocation, skillMatch);
        }
      }
    }
    // Fallback: check known subdirectories
    const KNOWN_DIRS = ["plugins", "agents", "categories", "skills"];
    for (const dir of KNOWN_DIRS) {
      const candidate = path.join(installLocation, dir, pluginName);
      try {
        await fs.access(candidate);
        return candidate;
      } catch {
        /* not found */
      }
    }
    return path.join(installLocation, pluginName);
  }

  async getPluginDetails(
    marketplaceId: string,
    pluginName: string,
  ): Promise<MarketplacePluginDetail | null> {
    const marketplaces = await this.listMarketplaces();
    const marketplace = marketplaces.find((m) => m.id === marketplaceId);
    if (!marketplace) {
      throw new Error(`Marketplace ${marketplaceId} not found`);
    }

    const pluginDir = await this.findPluginDir(
      marketplace.installLocation,
      pluginName,
    );
    const basicInfo = await this.extractPluginInfo(pluginDir, marketplaceId);
    if (!basicInfo) return null;

    const detail: MarketplacePluginDetail = {
      ...basicInfo,
      agents: [],
      skills: [],
      commands: [],
      hooks: [],
      mcpConfigs: [],
    };

    // Scan for agents
    const agentsDir = path.join(pluginDir, "agents");
    try {
      const agentFiles = await fs.readdir(agentsDir);
      detail.agents = agentFiles
        .filter((f) => f.endsWith(".md"))
        .map((f) => ({
          name: f.replace(".md", ""),
          path: path.join(agentsDir, f),
        }));
    } catch {
      /* not found */
    }

    // Scan for skills
    const skillsDir = path.join(pluginDir, "skills");
    try {
      const skillDirs = await fs.readdir(skillsDir, { withFileTypes: true });
      detail.skills = skillDirs
        .filter((d) => d.isDirectory())
        .map((d) => ({ name: d.name, path: path.join(skillsDir, d.name) }));
    } catch {
      /* not found */
    }

    // Scan for commands
    const commandsDir = path.join(pluginDir, "commands");
    try {
      const commandFiles = await fs.readdir(commandsDir);
      detail.commands = commandFiles
        .filter((f) => f.endsWith(".md"))
        .map((f) => ({
          name: f.replace(".md", ""),
          path: path.join(commandsDir, f),
        }));
    } catch {
      /* not found */
    }

    // Scan for hooks
    const hooksDir = path.join(pluginDir, "hooks");
    try {
      const hooksFile = path.join(hooksDir, "hooks.json");
      await fs.access(hooksFile);
      detail.hooks = [{ name: "hooks.json", path: hooksFile }];
    } catch {
      /* not found */
    }

    // Scan for MCP configs
    const mcpDir = path.join(pluginDir, "mcp-configs");
    try {
      const mcpFiles = await fs.readdir(mcpDir);
      detail.mcpConfigs = mcpFiles
        .filter((f) => f.endsWith(".json"))
        .map((f) => ({
          name: f.replace(".json", ""),
          path: path.join(mcpDir, f),
        }));
    } catch {
      /* not found */
    }

    return detail;
  }

  async installPlugin(
    marketplaceId: string,
    pluginName: string,
  ): Promise<InstalledPluginRecord> {
    console.log(
      `[INSTALL] Starting install: marketplace=${marketplaceId}, plugin=${pluginName}`,
    );
    const marketplaces = await this.listMarketplaces();
    const marketplace = marketplaces.find((m) => m.id === marketplaceId);
    if (!marketplace) {
      console.error(`[INSTALL] Marketplace not found: ${marketplaceId}`);
      throw new Error(`Marketplace ${marketplaceId} not found`);
    }
    console.log(
      `[INSTALL] Marketplace location: ${marketplace.installLocation}`,
    );

    // Check if this is a remote-source plugin
    const manifest = await this.readManifest(marketplace.installLocation);
    const mp = manifest?.plugins?.find((p) => p.name === pluginName);
    console.log(
      `[INSTALL] Manifest found: ${!!manifest}, mp found: ${!!mp}, mp.source: ${mp ? JSON.stringify(mp.source) : "N/A"}, mp.skills: ${mp?.skills?.length ?? "N/A"}`,
    );

    // Determine the install strategy based on source type
    let installPath: string;

    if (mp && typeof mp.source !== "string") {
      // Remote source — clone from URL into a dedicated directory
      installPath = path.join(MARKETPLACES_DIR, marketplaceId, pluginName);
      console.log(
        `[INSTALL] REMOTE branch: cloning ${mp.source.url} -> ${installPath}`,
      );
      await gitService.clone(mp.source.url, installPath);
    } else if (
      mp &&
      typeof mp.source === "string" &&
      (mp.source === "./" || mp.source === ".") &&
      !mp.skills?.length
    ) {
      // Monolithic plugin (source "./" with no skills array).
      // The marketplace root IS the plugin — do not copy into itself.
      // Register the marketplace root directly as the install path.
      installPath = marketplace.installLocation;
      console.log(`[INSTALL] MONOLITHIC branch: installPath = ${installPath}`);
    } else {
      // Local source — copy specific subdirectory from marketplace
      const sourcePluginDir = await this.findPluginDir(
        marketplace.installLocation,
        pluginName,
      );
      console.log(
        `[INSTALL] LOCAL branch: sourcePluginDir = ${sourcePluginDir}`,
      );
      // Verify source directory exists, provide friendly error message
      try {
        await fs.access(sourcePluginDir);
      } catch {
        console.error(`[INSTALL] Source dir not found: ${sourcePluginDir}`);
        throw new Error(
          `Plugin "${pluginName}" not found in marketplace "${marketplaceId}"`,
        );
      }

      installPath = path.join(MARKETPLACES_DIR, marketplaceId, pluginName);

      // Guard: if source and destination resolve to the same path, skip copy
      const resolvedSource = path.resolve(sourcePluginDir);
      const resolvedDest = path.resolve(installPath);
      console.log(
        `[INSTALL] Copy: ${resolvedSource} -> ${resolvedDest} (same=${resolvedSource === resolvedDest})`,
      );
      if (resolvedSource !== resolvedDest) {
        await this.fsService.copyDirectory(sourcePluginDir, installPath);
      }
    }

    console.log(`[INSTALL] Install path resolved: ${installPath}`);

    // Get git commit SHA
    let gitCommitSha = "";
    try {
      gitCommitSha = await gitService.getLastCommitSha(
        marketplace.installLocation,
      );
    } catch {
      /* ignore */
    }

    // Extract plugin info
    const pluginInfo = await this.extractPluginInfo(installPath, marketplaceId);
    const name = pluginInfo?.name || pluginName;
    const version = pluginInfo?.version || "1.0.0";

    // Register to installed_plugins.json
    const record: InstalledPluginRecord = {
      id: `${name}@${marketplaceId}`,
      name,
      marketplace: marketplaceId,
      version,
      installedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      installPath,
      gitCommitSha,
      isLocal: false,
    };

    await this.registerInstalledPlugin(record);

    return record;
  }

  async registerInstalledPlugin(record: InstalledPluginRecord): Promise<void> {
    let installedPlugins: InstalledPluginRecord[] = [];
    try {
      const data = await fs.readFile(INSTALLED_PLUGINS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      installedPlugins = Array.isArray(parsed) ? parsed : [];
    } catch {
      installedPlugins = [];
    }

    const existing = installedPlugins.findIndex((p) => p.id === record.id);
    if (existing >= 0) {
      installedPlugins[existing] = record;
    } else {
      installedPlugins.push(record);
    }

    // Save our format (array)
    await fs.writeFile(
      INSTALLED_PLUGINS_FILE,
      JSON.stringify(installedPlugins, null, 2),
    );
    // Sync to Claude Code's format: { version: 1, plugins: { "id": { metadata } } }
    await this.syncInstalledPluginsToCC(installedPlugins);
  }

  private async syncInstalledPluginsToCC(
    plugins: InstalledPluginRecord[],
  ): Promise<void> {
    // Read existing CC file to preserve entries not managed by us
    let ccPlugins: Record<string, unknown> = {};
    try {
      const data = await fs.readFile(CC_INSTALLED_PLUGINS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        ccPlugins =
          (parsed as { plugins?: Record<string, unknown> }).plugins || {};
      }
    } catch {
      /* ignore */
    }

    // Merge our plugins into CC format
    for (const p of plugins) {
      ccPlugins[p.id] = {
        version: p.version,
        installedAt: p.installedAt,
        lastUpdated: p.lastUpdated,
        installPath: p.installPath,
        gitCommitSha: p.gitCommitSha || undefined,
        isLocal: p.isLocal || undefined,
      };
    }

    const ccFormat = { version: 1, plugins: ccPlugins };
    await fs.writeFile(
      CC_INSTALLED_PLUGINS_FILE,
      JSON.stringify(ccFormat, null, 2),
    );
  }

  async getInstalledPlugins(): Promise<InstalledPluginRecord[]> {
    try {
      const data = await fs.readFile(INSTALLED_PLUGINS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  async syncFromCC(): Promise<InstalledPluginRecord[]> {
    let ccPlugins: Record<string, unknown> = {};
    try {
      const data = await fs.readFile(CC_INSTALLED_PLUGINS_FILE, "utf-8");
      const parsed = JSON.parse(data);
      if (parsed?.plugins) {
        ccPlugins = parsed.plugins;
      }
    } catch {
      return []; // CC file doesn't exist
    }

    const csamPlugins = await this.getInstalledPlugins();
    const csamIds = new Set(csamPlugins.map((p) => p.id));
    const newPlugins: InstalledPluginRecord[] = [];

    for (const [id, info] of Object.entries(ccPlugins)) {
      if (!csamIds.has(id)) {
        // Parse marketplace from plugin ID (format: name@marketplace)
        const parts = id.split("@");
        const name = parts[0];
        const marketplace = parts[1] || "unknown";

        // Extract info from CC format
        const pluginInfo = info as Record<string, unknown>;
        const record: InstalledPluginRecord = {
          id,
          name,
          marketplace,
          version: (pluginInfo.version as string) || "1.0.0",
          installedAt:
            (pluginInfo.installedAt as string) || new Date().toISOString(),
          lastUpdated:
            (pluginInfo.lastUpdated as string) || new Date().toISOString(),
          installPath: (pluginInfo.installPath as string) || "",
          gitCommitSha: pluginInfo.gitCommitSha as string | undefined,
          isLocal: (pluginInfo.isLocal as boolean) ?? true,
        };
        newPlugins.push(record);
      }
    }

    // Append to CSAM file
    if (newPlugins.length > 0) {
      const allPlugins = [...csamPlugins, ...newPlugins];
      await fs.writeFile(
        INSTALLED_PLUGINS_FILE,
        JSON.stringify(allPlugins, null, 2),
      );
      // Sync to CC (ensure format consistency)
      await this.syncInstalledPluginsToCC(allPlugins);
    }

    return newPlugins;
  }

  private extractMarketplaceId(repoUrl: string): string {
    // Extract repo name from URL
    // e.g., https://github.com/anthropic/claude-code-plugins -> claude-code-plugins
    const match = repoUrl.match(/\/([^\/]+?)(?:\.git)?$/);
    return match ? match[1] : repoUrl;
  }

  private async extractPluginInfo(
    pluginDir: string,
    marketplaceId: string,
  ): Promise<MarketplacePlugin | null> {
    try {
      await fs.access(pluginDir);
    } catch {
      return null;
    }

    const name = path.basename(pluginDir);
    let description = "";
    let version = "1.0.0";
    let author = "";
    let repository: string | undefined;

    // Try to read package.json
    const packageJsonPath = path.join(pluginDir, "package.json");
    try {
      const packageJsonData = await fs.readFile(packageJsonPath, "utf-8");
      const packageJson = JSON.parse(packageJsonData);
      version = packageJson.version || version;
      author = packageJson.author?.name || packageJson.author || "";
      repository = packageJson.repository?.url || packageJson.repository;
    } catch {
      /* not found */
    }

    // Try to read README.md for description
    const readmePath = path.join(pluginDir, "README.md");
    try {
      const readmeData = await fs.readFile(readmePath, "utf-8");
      // Extract first paragraph
      const lines = readmeData.split("\n").filter((l) => l.trim());
      let descLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith("# ")) continue;
        if (line.startsWith("##")) break;
        descLines.push(line);
        if (descLines.join(" ").length > 100) break;
      }
      description = descLines.join(" ").trim();
    } catch {
      /* not found */
    }

    return {
      id: `${name}@${marketplaceId}`,
      name,
      description: description || `Plugin: ${name}`,
      version,
      author,
      repository,
      readmePath,
      marketplaceId,
    };
  }
}

export const marketplaceService = new MarketplaceService();
