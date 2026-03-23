import { useMemo } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { EChart } from "../shared/EChart";
import type { EChartsCoreOption } from "echarts/core";

interface TopProjectsChartProps {
  data: Array<{ projectPath: string; sessionCount: number; totalCost: number }>;
  loading: boolean;
}

function extractProjectName(projectPath: string): string {
  const segments = projectPath.replace(/\/+$/, "").split("/");
  return segments[segments.length - 1] || projectPath;
}

export function TopProjectsChart({ data, loading }: TopProjectsChartProps): JSX.Element {
  const { t } = useTranslation();

  const option = useMemo<EChartsCoreOption>(() => {
    const top = data.slice(0, 10).reverse();
    const names = top.map((p) => extractProjectName(p.projectPath));
    const values = top.map((p) => p.sessionCount);
    const costs = top.map((p) => p.totalCost);

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] : params;
          const item = p as { dataIndex: number; name: string; value: number };
          const cost = costs[item.dataIndex];
          return `<strong>${item.name}</strong><br/>Sessions: ${item.value}<br/>Cost: $${cost.toFixed(2)}`;
        },
      },
      grid: { left: 140, right: 24, top: 8, bottom: 24 },
      xAxis: { type: "value" },
      yAxis: {
        type: "category",
        data: names,
        axisLabel: {
          width: 130,
          overflow: "truncate",
          fontSize: 11,
        },
      },
      series: [
        {
          type: "bar",
          data: values,
          itemStyle: {
            color: "#0ea5e9",
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
        <h3 className="text-sm font-semibold mb-3">{t("analytics.topProjects")}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isEmpty = data.length === 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-semibold mb-3">{t("analytics.topProjects")}</h3>
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
