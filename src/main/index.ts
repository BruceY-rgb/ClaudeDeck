import { app, shell, BrowserWindow, nativeImage } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import { registerHandlers, cleanupHandlers } from "./ipc/registerHandlers";
import { marketplaceService } from "./services/MarketplaceService";

let mainWindow: BrowserWindow | null = null;

// Load app icon
const getIconPath = (): string => {
  if (is.dev) {
    return join(__dirname, "../../resources/icon.png");
  }
  return join(process.resourcesPath, "resources/icon.png");
};

function createWindow(): void {
  const iconPath = getIconPath();
  const icon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 15, y: 10 },
    icon: icon.isEmpty() ? undefined : icon,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  });

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  registerHandlers(mainWindow);

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId("com.claude.skills-manager");
  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  // Set dock icon on macOS
  if (process.platform === "darwin") {
    const dockIconPath = getIconPath();
    const dockIcon = nativeImage.createFromPath(dockIconPath);
    if (!dockIcon.isEmpty()) {
      app.dock.setIcon(dockIcon);
    }
  }

  // Initialize default marketplace
  await marketplaceService.initializeDefaultMarketplace();

  // Sync plugins from Claude Code on startup
  const synced = await marketplaceService.syncFromCC();
  if (synced.length > 0) {
    console.log(`[CSAM] Synced ${synced.length} plugins from Claude Code`);
  }

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  cleanupHandlers();
  if (process.platform !== "darwin") app.quit();
});
