import { create } from "zustand";
import type { Memory, MemoryChain, MemoryOverview } from "../../shared/types/memory";

interface MemoryState {
  // Data
  overview: MemoryOverview | null;
  memories: Memory[];
  chains: MemoryChain[];
  selectedMemory: Memory | null;
  selectedChain: MemoryChain | null;
  chainMemories: Memory[];
  searchResults: Memory[];

  // Filters
  categoryFilter: string;
  sourceFilter: string;
  searchQuery: string;

  // UI state
  loading: boolean;
  error: string | null;
  view: "overview" | "list" | "chains" | "detail" | "chain-detail";

  // Actions
  fetchOverview: () => Promise<void>;
  fetchMemories: (category?: string, source?: string) => Promise<void>;
  fetchChains: () => Promise<void>;
  selectMemory: (id: string) => Promise<void>;
  selectChain: (id: string) => Promise<void>;
  search: (query: string) => Promise<void>;
  setCategoryFilter: (category: string) => void;
  setSourceFilter: (source: string) => void;
  setView: (view: MemoryState["view"]) => void;
  clearSelection: () => void;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
  // Data
  overview: null,
  memories: [],
  chains: [],
  selectedMemory: null,
  selectedChain: null,
  chainMemories: [],
  searchResults: [],

  // Filters
  categoryFilter: "all",
  sourceFilter: "all",
  searchQuery: "",

  // UI state
  loading: false,
  error: null,
  view: "overview",

  // Actions
  fetchOverview: async () => {
    set({ loading: true, error: null });
    try {
      const overview = await window.electronAPI.memory.getOverview();
      set({ overview, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchMemories: async (category?: string, source?: string) => {
    set({ loading: true, error: null });
    try {
      const cat = category ?? get().categoryFilter;
      const src = source ?? get().sourceFilter;
      const memories = await window.electronAPI.memory.list(cat, src);
      set({ memories, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  fetchChains: async () => {
    set({ loading: true, error: null });
    try {
      const chains = await window.electronAPI.memory.listChains();
      set({ chains, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectMemory: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const memory = await window.electronAPI.memory.get(id);
      set({ selectedMemory: memory, view: "detail", loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  selectChain: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const [chain, chainMemories] = await Promise.all([
        window.electronAPI.memory.getChain(id),
        window.electronAPI.memory.getChainMemories(id),
      ]);
      set({
        selectedChain: chain,
        chainMemories,
        view: "chain-detail",
        loading: false,
      });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  search: async (query: string) => {
    set({ searchQuery: query, loading: true, error: null });
    try {
      if (!query.trim()) {
        set({ searchResults: [], loading: false });
        return;
      }
      const results = await window.electronAPI.memory.search(query);
      set({ searchResults: results, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  setCategoryFilter: (category: string) => {
    set({ categoryFilter: category });
    get().fetchMemories(category, get().sourceFilter);
  },

  setSourceFilter: (source: string) => {
    set({ sourceFilter: source });
    get().fetchMemories(get().categoryFilter, source);
  },

  setView: (view) => set({ view }),

  clearSelection: () =>
    set({ selectedMemory: null, selectedChain: null, chainMemories: [] }),
}));
