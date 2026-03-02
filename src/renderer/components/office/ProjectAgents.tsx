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
        <div className="flex items-center gap-2 text-muted-foreground">
          <Cpu className="w-5 h-5 animate-spin" />
          <span>{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* ─── Toolbar: Search + Actions ─────────────────────── */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("office.projectAgents.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
        </div>

        {/* Copy from Global */}
        <button
          onClick={handleCopyFromGlobal}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg hover:border-primary/30 transition-colors whitespace-nowrap"
        >
          <Copy className="w-4 h-4" />
          {t("office.projectAgents.copyFromGlobal")}
        </button>

        {/* New Agent */}
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          {t("office.projectAgents.create")}
        </button>
      </div>

      {/* ─── Empty state ───────────────────────────────────── */}
      {filteredAgents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-card border border-border flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">
            {t("office.projectAgents.empty")}
          </p>
          <p className="text-sm text-muted-foreground max-w-sm">
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
              className="group flex flex-col bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
            >
              {/* Agent name */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-foreground truncate" title={agent.name}>
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
                className="text-sm text-muted-foreground line-clamp-2 mb-3 min-h-[2.5rem]"
                title={agent.description}
              >
                {agent.description || "\u2014"}
              </p>

              {/* Tools chips */}
              <div className="flex flex-wrap gap-1 mb-4 min-h-[1.5rem]">
                {agent.tools.slice(0, 6).map((tool) => (
                  <span
                    key={tool}
                    className="text-xs px-1.5 py-0.5 bg-background border border-border rounded text-muted-foreground"
                  >
                    {tool}
                  </span>
                ))}
                {agent.tools.length > 6 && (
                  <span className="text-xs px-1.5 py-0.5 text-muted-foreground">
                    +{agent.tools.length - 6}
                  </span>
                )}
              </div>

              {/* Spacer to push actions to bottom */}
              <div className="flex-1" />

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-1 pt-3 border-t border-border">
                <button
                  onClick={() => handleEdit(agent)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span className="text-xs">Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(agent)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
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
