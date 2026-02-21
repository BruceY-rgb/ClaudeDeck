import { useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAgentStore } from "../stores/agentStore";
import { useSkillStore } from "../stores/skillStore";
import { usePluginStore } from "../stores/pluginStore";
import { useCommandStore } from "../stores/commandStore";
import { useHookStore } from "../stores/hookStore";
import { useMCPStore } from "../stores/mcpStore";
import { useFileWatcher } from "../hooks/useFileWatcher";
import { PageHeader } from "../components/shared/PageHeader";
import {
  Plus,
  Puzzle,
  Terminal,
  Command,
  Webhook,
  FileText,
} from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export function DashboardPage(): JSX.Element {
  const { t } = useTranslation();
  const agents = useAgentStore((s) => s.items);
  const agentsFetch = useAgentStore((s) => s.fetch);
  const skills = useSkillStore((s) => s);
  const skillsFetch = useSkillStore((s) => s.fetch);
  const plugins = usePluginStore((s) => s.items);
  const pluginsFetch = usePluginStore((s) => s.fetch);
  const commands = useCommandStore((s) => s.items);
  const commandsFetch = useCommandStore((s) => s.fetch);
  const hooks = useHookStore((s) => s.items);
  const hooksFetch = useHookStore((s) => s.fetch);
  const mcpServers = useMCPStore((s) => s.servers);
  const mcpFetch = useMCPStore((s) => s.fetchServers);

  useEffect(() => {
    agentsFetch();
    skillsFetch();
    pluginsFetch();
    commandsFetch();
    hooksFetch();
    mcpFetch();
  }, [
    agentsFetch,
    skillsFetch,
    pluginsFetch,
    commandsFetch,
    hooksFetch,
    mcpFetch,
  ]);

  const refresh = useCallback(() => {
    agentsFetch();
    skillsFetch();
    pluginsFetch();
    commandsFetch();
    hooksFetch();
    mcpFetch();
  }, [
    agentsFetch,
    skillsFetch,
    pluginsFetch,
    commandsFetch,
    hooksFetch,
    mcpFetch,
  ]);

  useFileWatcher(refresh);

  const stats = [
    {
      label: t("dashboard.stats.agents"),
      count: agents.length,
      icon: Terminal,
      color: "bg-blue-500",
      path: "/agents",
    },
    {
      label: t("dashboard.stats.skills"),
      count: skills.personal.length + skills.plugin.length,
      icon: FileText,
      color: "bg-purple-500",
      path: "/skills",
    },
    {
      label: t("dashboard.stats.plugins"),
      count: plugins.length,
      icon: Puzzle,
      color: "bg-green-500",
      path: "/plugins",
    },
    {
      label: t("dashboard.stats.commands"),
      count: commands.length,
      icon: Command,
      color: "bg-orange-500",
      path: "/commands",
    },
    {
      label: t("dashboard.stats.hooks"),
      count: hooks.length,
      icon: Webhook,
      color: "bg-pink-500",
      path: "/hooks",
    },
    {
      label: t("dashboard.stats.mcpServers"),
      count: mcpServers.length,
      icon: Terminal,
      color: "bg-cyan-500",
      path: "/mcp",
    },
  ];

  const quickActions = [
    {
      label: t("dashboard.quickActions.newAgent"),
      icon: Plus,
      path: "/agents/new",
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      label: t("dashboard.quickActions.newSkill"),
      icon: Plus,
      path: "/skills/new",
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      label: t("dashboard.quickActions.marketplace"),
      icon: Puzzle,
      path: "/marketplace",
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      label: t("dashboard.quickActions.settings"),
      icon: Terminal,
      path: "/settings",
      color: "bg-zinc-600 hover:bg-zinc-700",
    },
  ];

  const personalAgents = agents
    .filter((a) => a.source === "personal")
    .slice(0, 5);
  const personalSkills = skills.personal.slice(0, 5);

  return (
    <div>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
      />

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium ${action.color} transition-colors`}
          >
            <action.icon className="w-4 h-4" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.path}
            to={stat.path}
            className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <span
                className={`w-7 h-7 rounded-lg ${stat.color} flex items-center justify-center text-white`}
              >
                <stat.icon className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Agents */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t("dashboard.personalAgents")}
            </h2>
            <Link
              to="/agents"
              className="text-sm text-blue-500 hover:underline"
            >
              {t("dashboard.viewAll")}
            </Link>
          </div>
          {personalAgents.length === 0 ? (
            <p className="text-sm text-zinc-400">
              {t("dashboard.noPersonalAgents")}
            </p>
          ) : (
            <div className="space-y-2">
              {personalAgents.map((agent) => (
                <Link
                  key={agent.name}
                  to={`/agents/${agent.name}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-sm block truncate">
                      {agent.name}
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {agent.description}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 shrink-0 ml-2">
                    {agent.model}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Personal Skills */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {t("dashboard.personalSkills")}
            </h2>
            <Link
              to="/skills"
              className="text-sm text-blue-500 hover:underline"
            >
              {t("dashboard.viewAll")}
            </Link>
          </div>
          {personalSkills.length === 0 ? (
            <p className="text-sm text-zinc-400">
              {t("dashboard.noPersonalSkills")}
            </p>
          ) : (
            <div className="space-y-2">
              {personalSkills.map((skill) => (
                <Link
                  key={skill.name}
                  to={`/skills/personal/${skill.name}`}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="min-w-0">
                    <span className="font-medium text-sm block truncate">
                      {skill.name}
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {skill.description}
                    </p>
                  </div>
                  {skill.userInvocable && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 shrink-0 ml-2">
                      {t("common.invocable")}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-400">
          {t("dashboard.searchHint", { shortcut: "\u2318K" })}
        </p>
      </div>
    </div>
  );
}
