import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Terminal,
  RefreshCw,
  MessageSquare,
  Bot,
  Sparkles,
  Server,
  FileText,
  Webhook,
  TerminalSquare,
} from "lucide-react";
import { AgentList, type AgentInfo } from "../components/office/AgentList";
import { ContextViewer } from "../components/office/ContextViewer";
import { ProjectAgents } from "../components/office/ProjectAgents";
import { ProjectSkills } from "../components/office/ProjectSkills";
import { ProjectMCP } from "../components/office/ProjectMCP";
import { ProjectPlans } from "../components/office/ProjectPlans";
import { ProjectHooks } from "../components/office/ProjectHooks";
import { ProjectCommands } from "../components/office/ProjectCommands";
import { CopyFromGlobalModal } from "../components/office/CopyFromGlobalModal";
import { useProjectConfigStore } from "../stores/projectConfigStore";
import type { ProjectTab } from "@shared/types/project-config";
import { useTranslation } from "../i18n/LanguageContext";

/** Map each tab key to the store fetch action that loads its data */
const TAB_FETCH_MAP: Record<ProjectTab, string> = {
  sessions: "",
  agents: "fetchAgents",
  skills: "fetchSkills",
  mcp: "fetchMCPServers",
  plans: "fetchPlans",
  hooks: "fetchHooks",
  commands: "fetchCommands",
};

export function ProjectDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const { projectDir } = useParams<{ projectDir: string }>();
  const navigate = useNavigate();

  const decodedProjectDir = projectDir ? decodeURIComponent(projectDir) : "";

  // ─── Project config store ────────────────────────────────
  const activeTab = useProjectConfigStore((s) => s.activeTab);
  const setActiveTab = useProjectConfigStore((s) => s.setActiveTab);
  const setProjectDir = useProjectConfigStore((s) => s.setProjectDir);
  const fetchSummary = useProjectConfigStore((s) => s.fetchSummary);
  const summary = useProjectConfigStore((s) => s.summary);
  const copyModalOpen = useProjectConfigStore((s) => s.copyModalOpen);

  // Track which tabs have been loaded to avoid redundant fetches
  const loadedTabs = useRef<Set<ProjectTab>>(new Set());

  // ─── Sessions (existing) local state ─────────────────────
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  // ─── Tab configuration ───────────────────────────────────
  const tabs: Array<{
    key: ProjectTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number | undefined;
  }> = [
    {
      key: "sessions",
      label: t("office.tabs.sessions"),
      icon: MessageSquare,
      count: agents.length,
    },
    {
      key: "agents",
      label: t("office.tabs.agents"),
      icon: Bot,
      count: summary?.agentCount,
    },
    {
      key: "skills",
      label: t("office.tabs.skills"),
      icon: Sparkles,
      count: summary?.skillCount,
    },
    {
      key: "mcp",
      label: t("office.tabs.mcp"),
      icon: Server,
      count: summary?.mcpCount,
    },
    {
      key: "plans",
      label: t("office.tabs.plans"),
      icon: FileText,
      count: summary?.planCount,
    },
    {
      key: "hooks",
      label: t("office.tabs.hooks"),
      icon: Webhook,
      count: summary?.hookCount,
    },
    {
      key: "commands",
      label: t("office.tabs.commands"),
      icon: TerminalSquare,
      count: summary?.commandCount,
    },
  ];

  // ─── Sessions: load agents ───────────────────────────────
  const loadAgents = useCallback(async (): Promise<void> => {
    if (!decodedProjectDir) return;

    try {
      setSessionsLoading(true);
      const data =
        await window.electronAPI.office.getProjectAgents(decodedProjectDir);
      setAgents(data);
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0]);
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
    } finally {
      setSessionsLoading(false);
    }
  }, [decodedProjectDir, selectedAgent]);

  // ─── Init on mount ───────────────────────────────────────
  useEffect(() => {
    if (decodedProjectDir) {
      setProjectDir(decodedProjectDir);
      fetchSummary();
      loadAgents();
      loadedTabs.current.add("sessions");
    }

    // Reset active tab to sessions when entering a new project
    setActiveTab("sessions");

    return () => {
      loadedTabs.current = new Set();
    };
  }, [decodedProjectDir]);

  // ─── Lazy-load tab data on tab switch ────────────────────
  const fetchTabData = useCallback(
    (tab: ProjectTab) => {
      const fetchName = TAB_FETCH_MAP[tab];
      if (!fetchName) return; // sessions tab has no store fetch

      const store = useProjectConfigStore.getState();
      const fetchFn = store[fetchName as keyof typeof store];
      if (typeof fetchFn === "function") {
        (fetchFn as () => Promise<void>)();
      }
    },
    [],
  );

  const handleTabChange = useCallback(
    (tab: ProjectTab) => {
      setActiveTab(tab);

      // Lazy load: only fetch if this tab hasn't been loaded yet
      if (!loadedTabs.current.has(tab)) {
        loadedTabs.current.add(tab);
        if (tab === "sessions") {
          loadAgents();
        } else {
          fetchTabData(tab);
        }
      }
    },
    [setActiveTab, loadAgents, fetchTabData],
  );

  // ─── Sessions: handlers ──────────────────────────────────
  const handleJoinTerminal = async (
    dir: string,
    sessionId?: string,
  ): Promise<void> => {
    await window.electronAPI.office.joinTerminal(dir, sessionId);
  };

  const handleSelectAgent = (agent: AgentInfo): void => {
    setSelectedAgent(agent);
  };

  const handleDeleteAgent = async (
    agentProjectDir: string,
    sessionId: string,
  ): Promise<void> => {
    const result = await window.electronAPI.office.deleteAgent(
      agentProjectDir,
      sessionId,
    );
    if (result.success) {
      setAgents((prev) => prev.filter((a) => a.sessionId !== sessionId));
      if (selectedAgent?.sessionId === sessionId) {
        setSelectedAgent(null);
      }
      alert(t("office.sessionDeleted"));
    } else {
      console.error("Failed to delete agent:", result.error);
      alert(t("office.deleteFailed", { error: result.error }));
    }
  };

  const handleBatchDelete = async (
    agentProjectDir: string,
    sessionIds: string[],
  ): Promise<void> => {
    const result = await window.electronAPI.office.deleteAgents(
      agentProjectDir,
      sessionIds,
    );
    if (result.success || result.deletedCount > 0) {
      setAgents((prev) =>
        prev.filter((a) => !sessionIds.includes(a.sessionId)),
      );
      if (selectedAgent && sessionIds.includes(selectedAgent.sessionId)) {
        setSelectedAgent(null);
      }
      alert(t("office.sessionsDeleted", { count: result.deletedCount }));
    } else {
      console.error("Failed to delete agents:", result.errors);
      alert(t("office.deleteFailed", { error: result.errors.join(", ") }));
    }
  };

  // ─── Refresh: refreshes active tab + summary ─────────────
  const handleRefresh = useCallback(() => {
    fetchSummary();
    if (activeTab === "sessions") {
      loadAgents();
    } else {
      fetchTabData(activeTab);
    }
  }, [activeTab, fetchSummary, loadAgents, fetchTabData]);

  // ─── Terminal button ─────────────────────────────────────
  const handleOpenTerminal = useCallback(() => {
    handleJoinTerminal(
      decodedProjectDir,
      selectedAgent?.sessionId || agents[0]?.sessionId,
    );
  }, [decodedProjectDir, selectedAgent, agents]);

  // ─── Loading state (only block render for sessions tab initial load) ──
  if (activeTab === "sessions" && sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  // ─── Render tab content ──────────────────────────────────
  const renderTabContent = (): JSX.Element => {
    switch (activeTab) {
      case "sessions":
        return (
          <div className="flex-1 flex overflow-hidden">
            {/* Left - Agent List */}
            <div className="w-80 border-r border-border p-4 overflow-y-auto">
              <AgentList
                agents={agents}
                title={t("office.sessionList")}
                selectedAgentId={selectedAgent?.id}
                onSelectAgent={handleSelectAgent}
                onJoinTerminal={handleJoinTerminal}
                onDeleteAgent={handleDeleteAgent}
                onBatchDelete={handleBatchDelete}
              />
            </div>

            {/* Right - Context Viewer */}
            <div className="flex-1 overflow-hidden">
              <ContextViewer agent={selectedAgent} />
            </div>
          </div>
        );
      case "agents":
        return <ProjectAgents />;
      case "skills":
        return <ProjectSkills />;
      case "mcp":
        return <ProjectMCP />;
      case "plans":
        return <ProjectPlans />;
      case "hooks":
        return <ProjectHooks />;
      case "commands":
        return <ProjectCommands />;
      default:
        return <div />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <button
          className="p-2 hover:bg-card rounded-md"
          onClick={() => navigate("/office")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {decodedProjectDir.split("/").pop()}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {decodedProjectDir}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={handleOpenTerminal}
        >
          <Terminal className="w-4 h-4" />
          {t("office.openTerminal")}
        </button>
        <button
          className="p-2 hover:bg-card rounded-md"
          onClick={handleRefresh}
          title={t("common.refresh")}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap gap-1 px-4 pt-2 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors rounded-t-md ${
                isActive
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-card"
              }`}
              onClick={() => handleTabChange(tab.key)}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderTabContent()}
      </div>

      {/* Copy From Global Modal (page-level) */}
      {copyModalOpen && <CopyFromGlobalModal />}
    </div>
  );
}
