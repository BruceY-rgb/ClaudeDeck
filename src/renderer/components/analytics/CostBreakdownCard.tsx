import { useTranslation } from "../../i18n/LanguageContext";
import type { AnalyticsData } from "@shared/types/session-detail";

interface CostBreakdownCardProps {
  data: AnalyticsData | null;
  loading: boolean;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export function CostBreakdownCard({ data, loading }: CostBreakdownCardProps): JSX.Element {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-semibold mb-3">{t("analytics.costBreakdown")}</h3>
        <div className="h-28 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const totalCost = data?.totalCostUsd ?? 0;
  const avgCost = data?.averageCostPerSession ?? 0;
  const avgDuration = data?.averageDurationSeconds ?? 0;
  const totalSessions = data?.totalSessions ?? 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-semibold mb-3">{t("analytics.costBreakdown")}</h3>

      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          ${totalCost.toFixed(2)}
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("analytics.totalCost")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
            {t("analytics.avgCostPerSession")}
          </p>
          <p className="text-sm font-semibold">${avgCost.toFixed(3)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-0.5">
            {t("analytics.avgDuration")}
          </p>
          <p className="text-sm font-semibold">{formatDuration(avgDuration)}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-xs text-zinc-400">
          {totalSessions} sessions
        </p>
      </div>
    </div>
  );
}
