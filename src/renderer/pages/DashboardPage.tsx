import { useEffect, useMemo } from "react";
import {
  Activity,
  Boxes,
  Cpu,
  FolderGit2,
  Sparkles,
  TerminalSquare,
  Wrench,
} from "lucide-react";
import type { EChartsCoreOption } from "echarts/core";
import { useAgentStore } from "../stores/agentStore";
import { useSkillStore } from "../stores/skillStore";
import { usePluginStore } from "../stores/pluginStore";
import { useMCPStore } from "../stores/mcpStore";
import { useAnalyticsStore } from "../stores/analyticsStore";
import { useSettingsStore } from "../stores/settingsStore";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHeader } from "../components/shared/PageHeader";
import { ProviderBadge } from "../components/shared/ProviderBadge";
import { SectionPanel } from "../components/shared/SectionPanel";
import { EmptyState } from "../components/shared/EmptyState";
import { IconAvatar } from "../components/shared/IconAvatar";
import { EChart } from "../components/shared/EChart";
import { ProviderGlyph, getProviderLabel } from "../utils/branding";

export function DashboardPage(): JSX.Element {
  const { t } = useTranslation();
  const { settings, fetch: fetchSettings } = useSettingsStore();
  const agents = useAgentStore((s) => s.items);
  const skills = useSkillStore((s) => s);
  const plugins = usePluginStore((s) => s.items);
  const mcpServers = useMCPStore((s) => s.servers);
  const analytics = useAnalyticsStore((s) => s.data);
  const analyticsLoading = useAnalyticsStore((s) => s.loading);
  const fetchAgents = useAgentStore((s) => s.fetch);
  const fetchSkills = useSkillStore((s) => s.fetch);
  const fetchPlugins = usePluginStore((s) => s.fetch);
  const fetchMcp = useMCPStore((s) => s.fetchServers);
  const fetchAnalytics = useAnalyticsStore((s) => s.fetchSummary);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (!settings) {
    return <div className="py-12 text-center text-[var(--text-muted)]">{t("common.loading")}</div>;
  }

  const activeProvider = settings.activeProvider;
  const totalSkills = skills.personal.length + skills.plugin.length;
  const topProjects = analytics?.topProjects ?? [];
  const activityByDay = analytics?.activityByDay ?? [];
  const toolEntries = Object.entries(analytics?.toolUsage ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const modelEntries = Object.entries(analytics?.modelUsage ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const stats = [
    { label: "Projects", value: analytics?.topProjects.length ?? 0, icon: FolderGit2 },
    { label: "Skills", value: totalSkills, icon: Sparkles },
    { label: "Plugins", value: plugins.length, icon: Boxes },
    { label: "MCP", value: mcpServers.length, icon: TerminalSquare },
  ];

  const inventoryChart = useMemo<EChartsCoreOption>(() => ({
    animationDuration: 700,
    grid: { left: 28, right: 14, top: 26, bottom: 28 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "category",
      data: stats.map((stat) => stat.label),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: stats.map((stat, index) => ({
          value: stat.value,
          itemStyle: {
            color: ["#f97316", "#8b5cf6", "#0ea5e9", "#14b8a6"][index],
            borderRadius: [10, 10, 4, 4],
          },
        })),
        barWidth: 28,
      },
    ],
  }), [stats]);

  const activityChart = useMemo<EChartsCoreOption>(() => ({
    animationDuration: 700,
    grid: { left: 18, right: 18, top: 20, bottom: 24 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: activityByDay.map((day) => day.date.slice(5)),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    series: [
      {
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 7,
        lineStyle: { color: "#f97316", width: 3 },
        areaStyle: { color: "rgba(249,115,22,0.12)" },
        itemStyle: { color: "#fb923c" },
        data: activityByDay.map((day) => day.count),
      },
    ],
  }), [activityByDay]);

  const projectsChart = useMemo<EChartsCoreOption>(() => ({
    animationDuration: 700,
    grid: { left: 120, right: 18, top: 18, bottom: 20 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    yAxis: {
      type: "category",
      data: topProjects.slice(0, 6).map((item) => item.projectPath.split("/").filter(Boolean).pop() || item.projectPath).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, overflow: "truncate", width: 104 },
    },
    series: [
      {
        type: "bar",
        data: topProjects.slice(0, 6).map((item) => item.sessionCount).reverse(),
        barWidth: 18,
        itemStyle: { color: "#0ea5e9", borderRadius: [0, 10, 10, 0] },
      },
    ],
  }), [topProjects]);

  const toolsChart = useMemo<EChartsCoreOption>(() => ({
    animationDuration: 700,
    grid: { left: 22, right: 16, top: 26, bottom: 34 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "category",
      data: toolEntries.map(([name]) => name),
      axisLabel: { color: "#94a3b8", fontSize: 10, interval: 0, rotate: 18 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        data: toolEntries.map(([, count]) => count),
        barWidth: 22,
        itemStyle: { color: "#8b5cf6", borderRadius: [10, 10, 4, 4] },
      },
    ],
  }), [toolEntries]);

  const modelsChart = useMemo<EChartsCoreOption>(() => ({
    animationDuration: 700,
    grid: { left: 22, right: 16, top: 20, bottom: 28 },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    xAxis: {
      type: "value",
      splitLine: { lineStyle: { color: "rgba(148,163,184,0.12)" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    yAxis: {
      type: "category",
      data: modelEntries.map(([name]) => name).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#94a3b8", fontSize: 11, overflow: "truncate", width: 110 },
    },
    series: [
      {
        type: "bar",
        data: modelEntries.map(([, count]) => count).reverse(),
        barWidth: 18,
        itemStyle: { color: "#14b8a6", borderRadius: [0, 10, 10, 0] },
      },
    ],
  }), [modelEntries]);

  const runtimeSummary = [
    {
      title: "Agents",
      description:
        activeProvider === "claude"
          ? `${agents.length} Claude agents ready to run`
          : "Agent editing stays Claude-only in this release",
    },
    {
      title: "Skills",
      description: `${totalSkills} skill packages visible in ${getProviderLabel(activeProvider)}`,
    },
    {
      title: "Plugins",
      description:
        plugins.length > 0
          ? `${plugins.filter((plugin) => plugin.enabled).length} enabled add-ons`
          : "No runtime add-ons detected yet",
    },
  ];

  useEffect(() => {
    if (!settings) return;
    fetchAgents();
    fetchSkills();
    fetchPlugins();
    fetchMcp();
    fetchAnalytics();
  }, [fetchAgents, fetchAnalytics, fetchMcp, fetchPlugins, fetchSkills, settings]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Runtime overview"
        title="AI CLI workbench"
        badge={<ProviderBadge providerId={activeProvider} />}
        description="Inspect the active coding runtime, jump into projects, and manage the resources that shape each session."
      />

      <section>
        <div className="rounded-[32px] border border-[var(--border-soft)] bg-[var(--panel)] p-6 shadow-[var(--panel-shadow)]">
          <div className="flex items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--text-subtle)]">
                Active runtime
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--text-strong)]">
                {getProviderLabel(activeProvider)}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-muted)]">
                This dashboard adapts to the selected provider. Capabilities that do not exist for the current runtime stay visible as guided limitations instead of failing silently.
              </p>
            </div>
            <div className="rounded-[28px] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-2 shadow-[var(--panel-shadow)]">
              <ProviderGlyph providerId={activeProvider} className="h-16 w-16" />
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-[24px] border border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.16em] text-[var(--text-subtle)]">
                    {stat.label}
                  </span>
                  <stat.icon className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <p className="text-2xl font-semibold text-[var(--text-strong)]">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <SectionPanel
          title="Inventory mix"
          description="How much configuration surface is currently visible to this runtime."
          aside={<IconAvatar icon={Boxes} tone="muted" />}
        >
          <EChart option={inventoryChart} className="h-64 w-full" />
        </SectionPanel>

        <SectionPanel
          title="Session cadence"
          description="Recent activity trend from the active provider's session history."
          aside={<IconAvatar icon={Activity} tone="muted" />}
        >
          {activityByDay.length > 0 ? (
            <EChart option={activityChart} className="h-64 w-full" />
          ) : (
            <EmptyState
              icon={Activity}
              title="No activity trend yet"
              description="Once sessions accumulate, this chart will show the pace of work over time."
            />
          )}
        </SectionPanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <SectionPanel title="Runtime summary" description="What is currently available for the selected provider.">
          <div className="space-y-3">
            {runtimeSummary.map((item) => (
              <div
                key={item.title}
                className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-4"
              >
                <p className="text-sm font-semibold text-[var(--text-strong)]">{item.title}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{item.description}</p>
              </div>
            ))}
          </div>
        </SectionPanel>

        <SectionPanel
          title="Top workspaces"
          description="Projects that dominate the current provider's recent session history."
          aside={<IconAvatar icon={FolderGit2} tone="muted" />}
        >
          {topProjects.length > 0 ? (
            <EChart option={projectsChart} className="h-72 w-full" />
          ) : (
            <EmptyState
              icon={FolderGit2}
              title="No workspace leaders yet"
              description="As soon as sessions are grouped by project, the busiest workspaces will appear here."
            />
          )}
        </SectionPanel>

        <SectionPanel
          title="Tool pressure"
          description="The most frequently used tools surfaced from parsed session transcripts."
          aside={<IconAvatar icon={Wrench} tone="muted" />}
        >
          {toolEntries.length > 0 ? (
            <EChart option={toolsChart} className="h-72 w-full" />
          ) : (
            <EmptyState
              icon={Wrench}
              title="No tool calls recorded"
              description="This provider has not produced parsed tool activity yet, so the chart will fill in later."
            />
          )}
        </SectionPanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <SectionPanel
          title="Model mix"
          description="When the runtime exposes model usage, it lands here as a quick comparison chart."
          aside={<IconAvatar icon={Cpu} tone="muted" />}
        >
          {modelEntries.length > 0 ? (
            <EChart option={modelsChart} className="h-72 w-full" />
          ) : (
            <EmptyState
              icon={Cpu}
              title="Model usage is still sparse"
              description="Claude sessions usually populate this chart first. Codex and Gemini will become more descriptive as their transcripts expose richer model metadata."
            />
          )}
        </SectionPanel>

        <SectionPanel title="Activity pulse" description="A lighter summary for providers that do not expose Claude-style token accounting.">
          {analytics && analytics.totalSessions > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-subtle)]">Sessions</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--text-strong)]">{analytics.totalSessions}</p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {analytics.topProjects[0]
                    ? `Most active project: ${analytics.topProjects[0].projectPath.split("/").pop()}`
                    : "No dominant project yet"}
                </p>
              </div>
              <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-subtle)]">Cost visibility</p>
                <p className="mt-2 text-lg font-semibold text-[var(--text-strong)]">
                  {activeProvider === "claude" ? `$${analytics.totalCostUsd.toFixed(2)}` : "Unavailable"}
                </p>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  {activeProvider === "claude"
                    ? "Claude sessions include estimated token cost."
                    : "Codex and Gemini summaries stay focused on session volume for now."}
                </p>
              </div>
              <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] px-4 py-4 sm:col-span-2">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-subtle)]">Fetcher state</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-lg font-semibold text-[var(--text-strong)]">
                    {analyticsLoading ? "Refreshing analytics..." : "Analytics ready"}
                  </p>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                    analyticsLoading
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  }`}>
                    {analyticsLoading ? "Syncing" : "Live"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No runtime activity yet"
              description="Open a project or start a session from your selected provider. Once sessions exist, the dashboard will summarize recent activity here."
            />
          )}
        </SectionPanel>
      </section>
    </div>
  );
}
