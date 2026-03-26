import { useEffect } from "react";
import { useTranslation } from "../i18n/LanguageContext";
import { useMemoryStore } from "../stores/memoryStore";
import { PageHeader } from "../components/shared/PageHeader";
import { MemoryOverviewBar } from "../components/memory/MemoryOverviewBar";
import { MemoryCard } from "../components/memory/MemoryCard";
import { MemoryDetailPanel } from "../components/memory/MemoryDetailPanel";
import { MemoryChainView } from "../components/memory/MemoryChainView";
import { ChainCard } from "../components/memory/ChainCard";

const CATEGORIES = [
  "all",
  "bug-fix",
  "architecture",
  "best-practice",
  "workflow",
  "debugging",
  "performance",
  "security",
  "testing",
  "tooling",
  "general",
];

const SOURCES = ["all", "local", "shared", "community"];

export default function MemoryPage() {
  const { t } = useTranslation();
  const {
    overview,
    memories,
    chains,
    selectedMemory,
    selectedChain,
    chainMemories,
    searchResults,
    categoryFilter,
    sourceFilter,
    searchQuery,
    loading,
    view,
    fetchOverview,
    fetchMemories,
    fetchChains,
    selectMemory,
    selectChain,
    search,
    setCategoryFilter,
    setSourceFilter,
    setView,
    clearSelection,
  } = useMemoryStore();

  useEffect(() => {
    fetchOverview();
    fetchMemories();
    fetchChains();
  }, []);

  // ─── Detail Views ──────────────────────────────────────────────────────
  if (view === "detail" && selectedMemory) {
    return (
      <div className="p-6 max-w-4xl">
        <MemoryDetailPanel
          memory={selectedMemory}
          onBack={() => {
            clearSelection();
            setView("list");
          }}
          onChainClick={(chainId) => selectChain(chainId)}
        />
      </div>
    );
  }

  if (view === "chain-detail" && selectedChain) {
    return (
      <div className="p-6 max-w-4xl">
        <MemoryChainView
          chain={selectedChain}
          memories={chainMemories}
          onBack={() => {
            clearSelection();
            setView("chains");
          }}
          onMemoryClick={(id) => selectMemory(id)}
        />
      </div>
    );
  }

  // ─── Main View ─────────────────────────────────────────────────────────
  const displayMemories = searchQuery.trim() ? searchResults : memories;

  return (
    <div className="p-6">
      <PageHeader
        title={t("memory.title")}
        description={t("memory.description")}
      />

      {/* Overview Stats */}
      {overview && <MemoryOverviewBar overview={overview} />}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-[#1e1e2e] rounded-lg p-1 w-fit">
        {(["overview", "list", "chains"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              view === tab
                ? "bg-purple-500/20 text-purple-400"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            {t(`memory.tab_${tab}`)}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      {(view === "list" || view === "overview") && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={t("memory.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => search(e.target.value)}
            className="w-full max-w-md bg-[#1e1e2e] border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
          />
        </div>
      )}

      {/* Filters (list view only) */}
      {view === "list" && (
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">{t("memory.category")}:</span>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                    categoryFilter === cat
                      ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                      : "bg-white/5 text-white/40 border border-transparent hover:bg-white/10"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">{t("memory.source")}:</span>
            <div className="flex gap-1">
              {SOURCES.map((src) => (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  className={`text-[10px] px-2 py-0.5 rounded-full transition-colors ${
                    sourceFilter === src
                      ? "bg-purple-500/30 text-purple-300 border border-purple-500/50"
                      : "bg-white/5 text-white/40 border border-transparent hover:bg-white/10"
                  }`}
                >
                  {src}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400" />
        </div>
      ) : view === "overview" ? (
        <div className="space-y-6">
          {/* Recent Memories */}
          <div>
            <h3 className="text-sm font-semibold text-white/70 mb-3">
              {t("memory.recentMemories")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(overview?.recentMemories ?? []).map((m) => (
                <MemoryCard key={m.id} memory={m} onClick={(id) => selectMemory(id)} />
              ))}
            </div>
          </div>

          {/* Top Contributors */}
          {overview && overview.topContributors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">
                {t("memory.topContributors")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {overview.topContributors.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[#1e1e2e] rounded-xl p-3 border border-white/5 text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-sm text-white font-bold mx-auto mb-2">
                      {c.name.charAt(0)}
                    </div>
                    <div className="text-xs text-white/80 font-medium">{c.name}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">
                      {c.memoryCount} {t("memory.memories")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memory Chains Preview */}
          {chains.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white/70">
                  {t("memory.memoryChains")}
                </h3>
                <button
                  onClick={() => setView("chains")}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  {t("memory.viewAll")} →
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chains.slice(0, 3).map((chain) => (
                  <ChainCard
                    key={chain.id}
                    chain={chain}
                    onClick={(id) => selectChain(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : view === "list" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayMemories.map((m) => (
            <MemoryCard key={m.id} memory={m} onClick={(id) => selectMemory(id)} />
          ))}
          {displayMemories.length === 0 && (
            <div className="col-span-full text-center py-12 text-white/30 text-sm">
              {searchQuery ? t("memory.noSearchResults") : t("memory.noMemories")}
            </div>
          )}
        </div>
      ) : view === "chains" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {chains.map((chain) => (
            <ChainCard
              key={chain.id}
              chain={chain}
              onClick={(id) => selectChain(id)}
            />
          ))}
          {chains.length === 0 && (
            <div className="col-span-full text-center py-12 text-white/30 text-sm">
              {t("memory.noChains")}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
