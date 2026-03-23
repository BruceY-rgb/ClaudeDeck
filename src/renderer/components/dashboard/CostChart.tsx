import { useMemo } from "react";
import { EChart } from "../shared/EChart";
import { useTranslation } from "../../i18n/LanguageContext";

interface CostChartProps {
  data: Array<{ date: string; count: number }>;
  loading: boolean;
}

function ChartSkeleton(): JSX.Element {
  return (
    <div className="h-[200px] bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse">
      <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
      <div className="h-full flex items-end gap-1 pb-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-zinc-200 dark:bg-zinc-700 rounded-t"
            style={{ height: `${20 + Math.random() * 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function CostChart({ data, loading }: CostChartProps): JSX.Element {
  const { t } = useTranslation();

  const option = useMemo(() => {
    if (!data || data.length === 0) return null;

    const dates = data.map((d) => d.date);
    const values = data.map((d) => d.count);

    return {
      tooltip: { trigger: "axis" as const },
      grid: { left: 40, right: 16, top: 8, bottom: 24 },
      xAxis: {
        type: "category" as const,
        data: dates,
        axisLabel: { fontSize: 10 },
      },
      yAxis: {
        type: "value" as const,
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          type: "line" as const,
          data: values,
          smooth: true,
          areaStyle: { opacity: 0.15 },
          lineStyle: { width: 2 },
        },
      ],
    };
  }, [data]);

  if (loading) {
    return <ChartSkeleton />;
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
        {t("dashboard.analytics.sessionsOverTime")}
      </h3>
      {option ? (
        <EChart option={option} className="h-[200px] w-full" />
      ) : (
        <div className="h-[200px] flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-500">
          {t("dashboard.analytics.noData")}
        </div>
      )}
    </div>
  );
}
