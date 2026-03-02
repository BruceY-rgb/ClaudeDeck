import { useState, useMemo } from "react";
import { Plus, Copy, Bot, Edit2, Trash2, Search, Cpu } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import { ProjectAgentDrawer } from "./ProjectAgentDrawer";
import type { ProjectAgent } from "@shared/types/project-config";
import { AVAILABLE_TOOLS, AVAILABLE_MODELS } from "@shared/types/agent";

/** Color mapping for model badges */
const MODEL_BADGE_COLORS: Record<string, string> = {
  sonnet: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  opus: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  haiku: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  inherit: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

function getModelBadgeClass(model: string): string {
  return MODEL_BADGE_COLORS[model] ?? "bg-gray-500/15 text-gray-400 border-gray-500/30";
}

export function ProjectAgents(): JSX.Element {
  const { t } = useTranslation();

  const agents = useProjectConfigStore((s) => s.agents);
  const loading = useProjectConfigStore((s) => s.loading.agents);
  const drawerOpen = useProjectConfigStore((s) => s.drawerOpen);
  const drawerType = useProjectConfigStore((s) => s.drawerType);
  const openDrawer = useProjectConfigStore((s) => s.openDrawer);
  const openCopyModal = useProjectConfigStore((s) => s.openCopyModal);
  const deleteAgent = useProjectConfigStore((s) => s.deleteAgent);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredAgents = useMemo(() => {
    if (!searchQuery.trim()) return agents;
    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  const handleCreate = (): void => {
    openDrawer("agent", "create");
  };

  const handleCopyFromGlobal = (): void => {
    openCopyModal("agent");
  };

  const handleEdit = (agent: ProjectAgent): void => {
    openDrawer("agent", "edit", agent);
  };

  const handleDelete = (agent: ProjectAgent): void => {
    const message = t("office.projectAgents.deleteConfirm", { name: agent.name });
    if (confirm(message)) {
      deleteAgent(agent.name);
    }
  };

  // ─── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-zinc-400">
          <Cpu className="w-5 h-5 animate-spin" />
          <span>{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* ─── Toolbar: Search + Actions ─────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("office.projectAgents.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Copy from Global */}
        <button
          onClick={handleCopyFromGlobal}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors whitespace-nowrap"
        >
          <Copy className="w-4 h-4" />
          {t("office.projectAgents.copyFromGlobal")}
        </button>

        {/* New Agent */}
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 rounded-lg hover:opacity-90 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {t("office.projectAgents.create")}
        </button>
      </div>

      {/* ─── Empty state ───────────────────────────────────── */}
      {filteredAgents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-zinc-400" />
          </div>
          <p className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-1">
            {t("office.projectAgents.empty")}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">
            {t("office.projectAgents.emptyHint")}
          </p>
        </div>
      )}

      {/* ─── Agent card grid ───────────────────────────────── */}
      {filteredAgents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.name}
              className="group flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 hover:-translate-y-0.5 cursor-pointer active:translate-y-0 active:shadow-md transition-all duration-200"
            >
              {/* Agent name */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-semibold text-sm truncate" title={agent.name}>
                  {agent.name}
                </h3>
                {agent.model && (
                  <span
                    className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${getModelBadgeClass(agent.model)}`}
                  >
                    {agent.model}
                  </span>
                )}
              </div>

              {/* Description (truncated to 2 lines) */}
              <p
                className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 min-h-[2.5rem]"
                title={agent.description}
              >
                {agent.description || "\u2014"}
              </p>

              {/* Tools chips */}
              <div className="flex flex-wrap gap-1 mb-4 min-h-[1.5rem]">
                {agent.tools.slice(0, 6).map((tool) => (
                  <span
                    key={tool}
                    className="text-[10px] px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500 rounded"
                  >
                    {tool}
                  </span>
                ))}
                {agent.tools.length > 6 && (
                  <span className="text-[10px] px-1.5 py-0.5 text-zinc-400">
                    +{agent.tools.length - 6}
                  </span>
                )}
              </div>

              {/* Spacer to push actions to bottom */}
              <div className="flex-1" />

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-1 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  onClick={() => handleEdit(agent)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="text-xs">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(agent)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-zinc-500 dark:text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="text-xs">Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Drawer ────────────────────────────────────────── */}
      {drawerOpen && drawerType === "agent" && <ProjectAgentDrawer />}
    </div>
  );
}
