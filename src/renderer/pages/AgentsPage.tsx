import { useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAgentStore } from "../stores/agentStore";
import { useFileWatcher } from "../hooks/useFileWatcher";
import { PageHeader } from "../components/shared/PageHeader";
import { useTranslation } from "../i18n/LanguageContext";
import type { Agent } from "@shared/types/agent";

function AgentCard({ agent }: { agent: Agent }): JSX.Element {
  const { t } = useTranslation();
  return (
    <Link
      to={`/agents/${agent.name}`}
      className="block bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-sm">{agent.name}</h3>
        <div className="flex items-center gap-1.5">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              agent.source === "personal"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {agent.source === "personal"
              ? t("common.personal")
              : agent.pluginId?.split("@")[0] || t("common.plugin")}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {agent.model}
          </span>
        </div>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
        {agent.description}
      </p>
      <div className="flex flex-wrap gap-1">
        {agent.tools.slice(0, 6).map((tool) => (
          <span
            key={tool}
            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500"
          >
            {tool}
          </span>
        ))}
        {agent.tools.length > 6 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            +{agent.tools.length - 6}
          </span>
        )}
      </div>
    </Link>
  );
}

export function AgentsPage(): JSX.Element {
  const { items, loading, fetch } = useAgentStore();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<
    "all" | "personal" | "plugin"
  >("all");

  useEffect(() => {
    fetch();
  }, [fetch]);
  useFileWatcher(useCallback(() => fetch(), [fetch]));

  const filtered = items.filter((a) => {
    if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      <PageHeader
        title={t("agents.title")}
        description={t("agents.description", { count: String(items.length) })}
        actions={
          <Link
            to="/agents/new"
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t("agents.newAgent")}
          </Link>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <input
          type="text"
          placeholder={t("agents.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          {(["all", "personal", "plugin"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                sourceFilter === f
                  ? "bg-white dark:bg-zinc-700 shadow-sm font-medium"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {
                {
                  all: t("common.all"),
                  personal: t("common.personal"),
                  plugin: t("common.plugin"),
                }[f]
              }
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">
          {t("common.loading")}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          {t("agents.noAgents")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((agent) => (
            <AgentCard key={`${agent.source}-${agent.name}`} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}
