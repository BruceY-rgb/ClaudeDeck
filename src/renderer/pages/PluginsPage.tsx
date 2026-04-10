import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Boxes, ChevronRight, Search, Trash2 } from "lucide-react";
import { usePluginStore } from "../stores/pluginStore";
import { useSettingsStore } from "../stores/settingsStore";
import { PageHeader } from "../components/shared/PageHeader";
import { ProviderBadge } from "../components/shared/ProviderBadge";
import { EmptyState } from "../components/shared/EmptyState";

export function PluginsPage(): JSX.Element {
  const navigate = useNavigate();
  const { items, loading, fetch, toggle, uninstall } = usePluginStore();
  const { settings, fetch: fetchSettings } = useSettingsStore();
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetch();
  }, [fetch, settings?.activeProvider]);

  const filtered = items.filter((plugin) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [plugin.name, plugin.id, plugin.installPath].some((value) =>
      value.toLowerCase().includes(q),
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plugins"
        title="Runtime add-ons"
        badge={settings ? <ProviderBadge providerId={settings.activeProvider} /> : undefined}
        description="Installed plugins and add-ons are shown through the lens of the selected provider. Toggling state always affects the active runtime only."
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-subtle)]" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search plugins"
          className="w-full rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] px-10 py-3 text-sm shadow-[var(--panel-shadow)] outline-none"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center text-[var(--text-muted)]">Loading plugins…</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="No plugins found"
          description="The selected runtime does not currently expose any installed plugins, or the search filter removed every result."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((plugin) => (
            <div
              key={`${plugin.provider}-${plugin.id}`}
              className="flex items-center justify-between rounded-[26px] border border-[var(--border-soft)] bg-[var(--panel)] p-5 shadow-[var(--panel-shadow)]"
            >
              <button
                onClick={() => navigate(`/plugins/${encodeURIComponent(plugin.id)}`)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="mb-2 flex items-center gap-2">
                  <ProviderBadge providerId={plugin.provider} compact />
                  {plugin.version && (
                    <span className="rounded-full bg-[var(--panel-muted)] px-2 py-0.5 text-xs text-[var(--text-muted)]">
                      v{plugin.version}
                    </span>
                  )}
                </div>
                <p className="text-base font-semibold text-[var(--text-strong)]">{plugin.name}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{plugin.id}</p>
                <p className="mt-2 truncate text-xs text-[var(--text-subtle)]">{plugin.installPath}</p>
              </button>

              <div className="ml-4 flex items-center gap-2">
                <button
                  onClick={() => navigate(`/plugins/${encodeURIComponent(plugin.id)}`)}
                  className="rounded-xl border border-[var(--border-soft)] p-2 text-[var(--text-muted)]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                {plugin.provider === "claude" && (
                  <button
                    onClick={() => void uninstall(plugin.id).then(fetch)}
                    className="rounded-xl border border-[var(--border-soft)] p-2 text-[var(--text-muted)] hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => void toggle(plugin.id, !plugin.enabled)}
                  className={`relative h-7 w-12 rounded-full transition ${
                    plugin.enabled ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                      plugin.enabled ? "left-6" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
