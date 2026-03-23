import { DollarSign, Zap, Boxes, Timer } from "lucide-react";
import { StatCard } from "../shared/StatCard";
import { useTranslation } from "../../i18n/LanguageContext";
import type { AnalyticsData } from "@shared/types/session-detail";

interface OverviewStatCardsProps {
  data: AnalyticsData | null;
  loading: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function SkeletonCard(): JSX.Element {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700" />
        <div className="space-y-2 flex-1">
          <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-5 w-12 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>
      </div>
    </div>
  );
}

export function OverviewStatCards({
  data,
  loading,
}: OverviewStatCardsProps): JSX.Element {
  const { t } = useTranslation();

  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  const totalTokens = data.totalInputTokens + data.totalOutputTokens;
  const cacheTokens = data.totalCacheReadTokens + data.totalCacheCreationTokens;
  const cachePercent =
    totalTokens > 0 ? Math.round((cacheTokens / totalTokens) * 100) : 0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayActivity = data.activityByDay.find((d) => d.date === todayStr);
  const todayCount = todayActivity?.count ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard
        icon={DollarSign}
        title={t("dashboard.analytics.totalCost")}
        value={`$${data.totalCostUsd.toFixed(2)}`}
        description={t("dashboard.analytics.avgPerSession", {
          amount: data.averageCostPerSession.toFixed(2),
        })}
        color="emerald"
      />
      <StatCard
        icon={Zap}
        title={t("dashboard.analytics.tokens")}
        value={formatTokens(totalTokens)}
        description={t("dashboard.analytics.cachePercent", {
          percent: cachePercent,
        })}
        color="blue"
      />
      <StatCard
        icon={Boxes}
        title={t("dashboard.analytics.sessions")}
        value={data.totalSessions}
        description={t("dashboard.analytics.todayCount", {
          count: todayCount,
        })}
        color="amber"
      />
      <StatCard
        icon={Timer}
        title={t("dashboard.analytics.avgDuration")}
        value={formatDuration(data.averageDurationSeconds)}
        description={t("dashboard.analytics.perSession")}
        color="violet"
      />
    </div>
  );
}
