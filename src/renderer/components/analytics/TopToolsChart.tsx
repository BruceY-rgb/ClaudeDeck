import { useMemo } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { EChart } from "../shared/EChart";
import type { EChartsCoreOption } from "echarts/core";

interface TopToolsChartProps {
  data: Record<string, number>;
  loading: boolean;
}

export function TopToolsChart({ data, loading }: TopToolsChartProps): JSX.Element {
  const { t } = useTranslation();

  const option = useMemo<EChartsCoreOption>(() => {
    const entries = Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reverse();

    const toolNames = entries.map(([k]) => k);
    const values = entries.map(([, v]) => v);

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: { left: 120, right: 24, top: 8, bottom: 24 },
      xAxis: { type: "value" },
      yAxis: {
        type: "category",
        data: toolNames,
        axisLabel: {
          width: 110,
          overflow: "truncate",
          fontSize: 11,
        },
      },
      series: [
        {
          type: "bar",
          data: values,
          itemStyle: {
            color: "#6366f1",
            borderRadius: [0, 4, 4, 0],
          },
          barMaxWidth: 24,
          label: {
            show: true,
            position: "right",
            fontSize: 11,
          },
        },
      ],
    };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-semibold mb-3">{t("analytics.topTools")}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isEmpty = Object.keys(data).length === 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-semibold mb-3">{t("analytics.topTools")}</h3>
      {isEmpty ? (
        <div className="h-64 flex items-center justify-center text-sm text-zinc-400">
          {t("analytics.noData")}
        </div>
      ) : (
        <EChart option={option} className="h-64 w-full" />
      )}
    </div>
  );
}
