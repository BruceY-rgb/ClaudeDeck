import { create } from "zustand";
import type {
  AnalyticsData,
  ActivityDay,
} from "@shared/types/session-detail";

type TimeRange = "7d" | "30d" | "90d" | "year";

interface AnalyticsStore {
  data: AnalyticsData | null;
  heatmapData: ActivityDay[] | null;
  loading: boolean;
  heatmapLoading: boolean;
  error: string | null;
  timeRange: TimeRange;
  lastFetchedAt: number | null;
  setTimeRange: (range: TimeRange) => void;
  fetchSummary: () => Promise<void>;
  fetchHeatmap: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsStore>((set, get) => ({
  data: null,
  heatmapData: null,
  loading: false,
  heatmapLoading: false,
  error: null,
  timeRange: "30d",
  lastFetchedAt: null,

  setTimeRange: (range) => {
    set({ timeRange: range });
    get().fetchSummary();
  },

  fetchSummary: async () => {
    if (!window.electronAPI) return;
    set({ loading: true, error: null });
    try {
      const data = await window.electronAPI.analytics.getSummary(
        get().timeRange,
      );
      set({ data, loading: false, lastFetchedAt: Date.now() });
    } catch (err) {
      set({
        error:
          err instanceof Error ? err.message : "Failed to fetch analytics",
        loading: false,
      });
    }
  },

  fetchHeatmap: async () => {
    if (!window.electronAPI) return;
    set({ heatmapLoading: true });
    try {
      const heatmapData = await window.electronAPI.analytics.getHeatmap();
      set({ heatmapData, heatmapLoading: false });
    } catch {
      set({ heatmapLoading: false });
    }
  },
}));
