import { useState } from "react";
import { useMarketplaceStore } from "../../stores/marketplaceStore";
import { PageHeader } from "../shared/PageHeader";
import { useTranslation } from "../../i18n/LanguageContext";

export function MarketplaceList(): JSX.Element {
  const { t } = useTranslation();
  const {
    sources,
    loading,
    addSource,
    removeSource,
    refreshMarketplace,
    setCurrentSource,
    browsePlugins,
  } = useMarketplaceStore();
  const [newRepoUrl, setNewRepoUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newRepoUrl.trim()) return;
    setIsAdding(true);
    try {
      await addSource(newRepoUrl.trim());
      setNewRepoUrl("");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBrowse = async (source: (typeof sources)[0]) => {
    setCurrentSource(source);
    await browsePlugins(source.id);
  };

  return (
    <div>
      <PageHeader
        title={t("marketplace.title")}
        description={t("marketplace.description")}
      />

      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t("marketplace.repoPlaceholder")}
            value={newRepoUrl}
            onChange={(e) => setNewRepoUrl(e.target.value)}
            className="flex-1 px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            disabled={isAdding || !newRepoUrl.trim()}
            className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? t("common.adding") : t("common.add")}
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8 text-zinc-400">
          {t("common.loading")}
        </div>
      )}

      {!loading && sources.length === 0 && (
        <div className="text-center py-8 text-zinc-400">
          {t("marketplace.noMarketplaces")}
        </div>
      )}

      <div className="grid gap-4">
        {sources.map((source) => (
          <div
            key={source.id}
            className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                  {source.id}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {source.source.repo || source.source.url}
                </p>
                <p className="text-xs text-zinc-500 mt-1">
                  {t("marketplace.lastUpdated", {
                    date: new Date(source.lastUpdated).toLocaleString(),
                  })}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBrowse(source)}
                  className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm rounded-lg hover:opacity-90"
                >
                  {t("common.browse")}
                </button>
                <button
                  onClick={() => refreshMarketplace(source.id)}
                  className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-white text-sm rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600"
                >
                  {t("common.refresh")}
                </button>
                <button
                  onClick={() => removeSource(source.id)}
                  className="px-3 py-1.5 bg-red-600/20 text-red-400 text-sm rounded-md hover:bg-red-600/30"
                >
                  {t("common.remove")}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
