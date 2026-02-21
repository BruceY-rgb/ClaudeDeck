import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePluginStore } from "../stores/pluginStore";
import { PageHeader } from "../components/shared/PageHeader";
import { Bot, FileText, Command, Webhook } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import type { Agent } from "@shared/types/agent";
import type { Skill } from "@shared/types/skill";
import type { Command as Cmd } from "@shared/types/command";

interface PluginDetailData {
  manifest: { name: string; version: string; description: string } | null;
  agents: Agent[];
  skills: Skill[];
  commands: Cmd[];
  hooks: Array<{
    pluginId: string;
    event: string;
    matcher: string;
    hooks: unknown[];
  }>;
}

type Tab = "agents" | "skills" | "commands" | "hooks";

export function PluginDetailPage(): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const pluginId = id ? decodeURIComponent(id) : "";
  const { items, getDetail } = usePluginStore();

  const [detail, setDetail] = useState<PluginDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("agents");

  const plugin = items.find((p) => p.id === pluginId);

  useEffect(() => {
    async function loadDetail() {
      if (!pluginId) return;
      setLoading(true);
      try {
        const data = await getDetail(pluginId);
        setDetail(data as PluginDetailData | null);
      } finally {
        setLoading(false);
      }
    }
    loadDetail();
  }, [pluginId, getDetail]);

  const handleBack = useCallback(() => {
    navigate("/plugins");
  }, [navigate]);

  const handleCommandClick = useCallback(
    (pluginId: string, name: string) => {
      navigate(
        `/commands/${encodeURIComponent(pluginId)}/${encodeURIComponent(name)}`,
      );
    },
    [navigate],
  );

  const tabs: { id: Tab; label: string; count: number }[] = [
    {
      id: "agents",
      label: t("sidebar.nav.agents"),
      count: detail?.agents.length || 0,
    },
    {
      id: "skills",
      label: t("sidebar.nav.skills"),
      count: detail?.skills.length || 0,
    },
    {
      id: "commands",
      label: t("sidebar.nav.commands"),
      count: detail?.commands.length || 0,
    },
    {
      id: "hooks",
      label: t("sidebar.nav.hooks"),
      count: detail?.hooks.length || 0,
    },
  ];

  return (
    <div>
      <PageHeader
        title={plugin?.name || "Plugin"}
        description={detail?.manifest?.description || plugin?.id || ""}
        backTo={{ label: t("plugins.backToPlugins"), path: "/plugins" }}
      />

      <div className="mb-6 flex items-center gap-4">
        <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
          v{detail?.manifest?.version || plugin?.version || "?"}
        </span>
        <span className="text-xs text-zinc-400">@{plugin?.marketplace}</span>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">
          {t("common.loading")}
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-zinc-200 dark:border-zinc-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? "text-zinc-900 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-zinc-400">
                  ({tab.count})
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-900 dark:bg-zinc-100" />
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-3">
            {activeTab === "agents" &&
              (detail?.agents.length ? (
                detail.agents.map((agent) => (
                  <div
                    key={agent.name}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-4 h-4 text-zinc-400" />
                      <h3 className="font-medium text-sm">{agent.name}</h3>
                      {agent.model && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                          {agent.model}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500">{agent.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  {t("plugins.noAgents")}
                </div>
              ))}

            {activeTab === "skills" &&
              (detail?.skills.length ? (
                detail.skills.map((skill) => (
                  <div
                    key={skill.name}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-zinc-400" />
                      <h3 className="font-medium text-sm">{skill.name}</h3>
                    </div>
                    <p className="text-xs text-zinc-500">{skill.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  {t("plugins.noSkills")}
                </div>
              ))}

            {activeTab === "commands" &&
              (detail?.commands.length ? (
                detail.commands.map((cmd) => (
                  <div
                    key={cmd.name}
                    onClick={() => handleCommandClick(cmd.pluginId, cmd.name)}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Command className="w-4 h-4 text-zinc-400" />
                      <h3 className="font-medium text-sm">/{cmd.name}</h3>
                    </div>
                    <p className="text-xs text-zinc-500">{cmd.description}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  {t("plugins.noCommands")}
                </div>
              ))}

            {activeTab === "hooks" &&
              (detail?.hooks.length ? (
                detail.hooks.map((hook, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Webhook className="w-4 h-4 text-zinc-400" />
                      <h3 className="font-medium text-sm">{hook.event}</h3>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {t("hooks.matcher")}: {hook.matcher || "(none)"}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-400 text-sm">
                  {t("plugins.noHooks")}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
