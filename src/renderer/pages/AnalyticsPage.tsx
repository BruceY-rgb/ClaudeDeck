import { useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { useAnalyticsStore } from "../stores/analyticsStore";
import { PageHeader } from "../components/shared/PageHeader";
import { TimeRangeTabs } from "../components/dashboard/TimeRangeTabs";
import {
  CacheEfficiencyCard,
  CostBreakdownCard,
  SessionActivityChart,
  TokensByModelChart,
  TopToolsChart,
  TopProjectsChart,
} from "../components/analytics";

export function AnalyticsPage(): JSX.Element {
  const { t } = useTranslation();
  const data = useAnalyticsStore((s) => s.data);
  const loading = useAnalyticsStore((s) => s.loading);
  const timeRange = useAnalyticsStore((s) => s.timeRange);
  const setTimeRange = useAnalyticsStore((s) => s.setTimeRange);
  const fetchSummary = useAnalyticsStore((s) => s.fetchSummary);

  useEffect(() => {
    if (!data) {
      fetchSummary();
    }
  }, [data, fetchSummary]);

  const isEmpty = !loading && data && data.totalSessions === 0;

  return (
    <div>
      <PageHeader
        title={t("analytics.title")}
        description={t("analytics.description")}
        actions={
          <TimeRangeTabs value={timeRange} onChange={(range) => setTimeRange(range as "7d" | "30d" | "90d" | "year")} />
        }
      />

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
            <BarChart3 className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold mb-1">{t("analytics.noData")}</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t("analytics.noDataHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Top row: two cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CacheEfficiencyCard
              cacheRead={data?.totalCacheReadTokens ?? 0}
              totalInput={data?.totalInputTokens ?? 0}
              loading={loading}
            />
            <CostBreakdownCard data={data} loading={loading} />
          </div>

          {/* Session Activity - full width */}
          <SessionActivityChart
            data={data?.activityByDay ?? []}
            loading={loading}
          />

          {/* Middle row: two charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TokensByModelChart
              data={data?.modelUsage ?? {}}
              loading={loading}
            />
            <TopToolsChart
              data={data?.toolUsage ?? {}}
              loading={loading}
            />
          </div>

          {/* Top Projects - full width */}
          <TopProjectsChart
            data={data?.topProjects ?? []}
            loading={loading}
          />
        </div>
      )}
    </div>
  );
}

export default AnalyticsPage;
