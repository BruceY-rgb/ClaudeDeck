import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePluginStore } from "../stores/pluginStore";
import { PageHeader } from "../components/shared/PageHeader";
import { Trash2, ChevronRight, Search } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export function PluginsPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, loading, fetch, toggle, uninstall } = usePluginStore();
  const [uninstalling, setUninstalling] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch();
  }, [fetch]);

  const filterPlugins = (plugins: typeof items) =>
    plugins.filter((p) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.installPath.toLowerCase().includes(q)
      );
    });

  const handleToggle = useCallback(
    async (id: string, enabled: boolean) => {
      await toggle(id, enabled);
    },
    [toggle],
  );

  const handleUninstall = useCallback(
    async (id: string) => {
      if (confirm(t("plugins.uninstallConfirm"))) {
        setUninstalling(id);
        try {
          await uninstall(id);
          await fetch();
        } finally {
          setUninstalling(null);
        }
      }
    },
    [uninstall, fetch],
  );

  const handlePluginClick = useCallback(
    (id: string) => {
      navigate(`/plugins/${encodeURIComponent(id)}`);
    },
    [navigate],
  );

  return (
    <div>
      <PageHeader
        title={t("plugins.title")}
        description={t("plugins.description", {
          installed: String(items.length),
          enabled: String(items.filter((p) => p.enabled).length),
        })}
      />

      {/* Search */}
      <div className="relative w-full max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder={t("plugins.searchPlaceholder") || "Search plugins..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">
          {t("common.loading")}
        </div>
      ) : (
        <div className="space-y-3">
          {filterPlugins(items).length === 0 ? (
            <p className="text-sm text-zinc-400">
              {search ? t("plugins.noResults") : t("plugins.noPlugins")}
            </p>
          ) : (
            filterPlugins(items).map((plugin) => (
              <div
                key={plugin.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 flex items-center justify-between"
              >
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handlePluginClick(plugin.id)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{plugin.name}</h3>
                    <span className="text-xs text-zinc-400">
                      @{plugin.marketplace}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      v{plugin.version}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                    {plugin.installPath}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePluginClick(plugin.id)}
                    className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                    title="View details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleUninstall(plugin.id)}
                    disabled={uninstalling === plugin.id}
                    className="p-2 text-zinc-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Uninstall"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggle(plugin.id, !plugin.enabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      plugin.enabled
                        ? "bg-green-500"
                        : "bg-zinc-300 dark:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        plugin.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
