import { useMemo } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { EChart } from "../shared/EChart";
import type { EChartsCoreOption } from "echarts/core";

interface SessionActivityChartProps {
  data: Array<{ date: string; count: number }>;
  loading: boolean;
}

export function SessionActivityChart({ data, loading }: SessionActivityChartProps): JSX.Element {
  const { t } = useTranslation();

  const option = useMemo<EChartsCoreOption>(() => {
    const dates = data.map((d) => d.date);
    const counts = data.map((d) => d.count);

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] : params;
          const item = p as { name: string; value: number };
          return `<strong>${item.name}</strong><br/>Sessions: ${item.value}`;
        },
      },
      grid: { left: 40, right: 16, top: 16, bottom: 24 },
      xAxis: {
        type: "category",
        data: dates,
        boundaryGap: false,
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
      },
      series: [
        {
          type: "line",
          data: counts,
          smooth: true,
          symbol: "circle",
          symbolSize: 6,
          lineStyle: { width: 2, color: "#3b82f6" },
          itemStyle: { color: "#3b82f6" },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(59, 130, 246, 0.25)" },
                { offset: 1, color: "rgba(59, 130, 246, 0.02)" },
              ],
            },
          },
        },
      ],
    };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-semibold mb-3">{t("analytics.sessionActivity")}</h3>
        <div className="h-56 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isEmpty = data.length === 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-semibold mb-3">{t("analytics.sessionActivity")}</h3>
      {isEmpty ? (
        <div className="h-56 flex items-center justify-center text-sm text-zinc-400">
          {t("analytics.noData")}
        </div>
      ) : (
        <EChart option={option} className="h-56 w-full" />
      )}
    </div>
  );
}
