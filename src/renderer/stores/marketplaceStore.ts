import { create } from "zustand";
import type {
  MarketplaceSource,
  MarketplacePlugin,
  MarketplacePluginDetail,
  InstalledPluginRecord,
} from "@shared/types/marketplace";

interface CategoryEntry {
  name: string;
  path: string;
}

interface MarketplaceStore {
  sources: MarketplaceSource[];
  currentSource: MarketplaceSource | null;
  plugins: MarketplacePlugin[];
  currentPlugin: MarketplacePluginDetail | null;
  loading: boolean;
  installing: boolean;
  installedPlugins: InstalledPluginRecord[];
  categoryStack: CategoryEntry[];

  fetchSources: () => Promise<void>;
  addSource: (repoUrl: string) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
  setCurrentSource: (source: MarketplaceSource | null) => void;
  setCurrentPlugin: (plugin: MarketplacePluginDetail | null) => void;
  browsePlugins: (marketplaceId: string) => Promise<void>;
  browseCategory: (
    marketplaceId: string,
    categoryPath: string,
    categoryName: string,
  ) => Promise<void>;
  popCategory: () => Promise<void>;
  getPluginDetail: (marketplaceId: string, pluginName: string) => Promise<void>;
  refreshMarketplace: (id: string) => Promise<void>;
  installPlugin: (
    marketplaceId: string,
    pluginName: string,
  ) => Promise<InstalledPluginRecord>;
  uninstallPlugin: (pluginId: string) => Promise<void>;
  fetchInstalledPlugins: () => Promise<void>;
}

export const useMarketplaceStore = create<MarketplaceStore>((set, get) => ({
  sources: [],
  currentSource: null,
  plugins: [],
  currentPlugin: null,
  loading: false,
  installing: false,
  installedPlugins: [],
  categoryStack: [],

  async fetchSources() {
    if (!window.electronAPI) return;
    set({ loading: true });
    try {
      const sources = await window.electronAPI.marketplace.list();
      set({ sources });
    } finally {
      set({ loading: false });
    }
  },

  async addSource(repoUrl: string) {
    set({ loading: true });
    try {
      const source = await window.electronAPI.marketplace.add(repoUrl);
      set((state) => ({ sources: [...state.sources, source] }));
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  async removeSource(id: string) {
    await window.electronAPI.marketplace.remove(id);
    set((state) => ({
      sources: state.sources.filter((s) => s.id !== id),
      currentSource:
        state.currentSource?.id === id ? null : state.currentSource,
    }));
  },

  setCurrentSource(source: MarketplaceSource | null) {
    set({
      currentSource: source,
      plugins: [],
      currentPlugin: null,
      categoryStack: [],
    });
  },

  setCurrentPlugin(plugin: MarketplacePluginDetail | null) {
    set({ currentPlugin: plugin });
  },

  async browsePlugins(marketplaceId: string) {
    set({ loading: true, categoryStack: [] });
    try {
      const plugins =
        await window.electronAPI.marketplace.browse(marketplaceId);
      set({ plugins });
    } finally {
      set({ loading: false });
    }
  },

  async browseCategory(
    marketplaceId: string,
    categoryPath: string,
    categoryName: string,
  ) {
    set({ loading: true });
    try {
      const plugins = await window.electronAPI.marketplace.browseCategory(
        marketplaceId,
        categoryPath,
      );
      set((state) => ({
        plugins,
        categoryStack: [
          ...state.categoryStack,
          { name: categoryName, path: categoryPath },
        ],
      }));
    } finally {
      set({ loading: false });
    }
  },

  async popCategory() {
    const { categoryStack, currentSource } = get();
    if (!currentSource) return;

    set({ loading: true });
    try {
      if (categoryStack.length <= 1) {
        // Go back to top-level plugins
        const plugins = await window.electronAPI.marketplace.browse(
          currentSource.id,
        );
        set({ plugins, categoryStack: [] });
      } else {
        // Go back to previous category
        const newStack = categoryStack.slice(0, -1);
        const parent = newStack[newStack.length - 1];
        const plugins = await window.electronAPI.marketplace.browseCategory(
          currentSource.id,
          parent.path,
        );
        set({ plugins, categoryStack: newStack });
      }
    } finally {
      set({ loading: false });
    }
  },

  async getPluginDetail(marketplaceId: string, pluginName: string) {
    set({ loading: true });
    try {
      const plugin = await window.electronAPI.marketplace.pluginDetail(
        marketplaceId,
        pluginName,
      );
      set({ currentPlugin: plugin });
    } finally {
      set({ loading: false });
    }
  },

  async refreshMarketplace(id: string) {
    set({ loading: true });
    try {
      await window.electronAPI.marketplace.refresh(id);
      const sources = await window.electronAPI.marketplace.list();
      set({ sources });
    } finally {
      set({ loading: false });
    }
  },

  async installPlugin(marketplaceId: string, pluginName: string) {
    set({ installing: true });
    try {
      const result = await window.electronAPI.marketplace.install(
        marketplaceId,
        pluginName,
      );
      // Refresh installed plugins after install
      const installedPlugins =
        await window.electronAPI.marketplace.getInstalled();
      set({ installedPlugins });
      return result;
    } finally {
      set({ installing: false });
    }
  },

  async uninstallPlugin(pluginId: string) {
    set({ installing: true });
    try {
      await window.electronAPI.plugins.uninstall(pluginId);
      // Refresh installed plugins after uninstall
      const installedPlugins =
        await window.electronAPI.marketplace.getInstalled();
      set({ installedPlugins });
    } finally {
      set({ installing: false });
    }
  },

  async fetchInstalledPlugins() {
    if (!window.electronAPI) return;
    try {
      const installedPlugins =
        await window.electronAPI.marketplace.getInstalled();
      set({ installedPlugins });
    } catch (error) {
      console.error("Failed to fetch installed plugins:", error);
    }
  },
}));
