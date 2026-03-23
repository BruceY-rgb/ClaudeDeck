import { useMemo } from "react";
import { useTranslation } from "../../i18n/LanguageContext";
import { EChart } from "../shared/EChart";
import type { EChartsCoreOption } from "echarts/core";

interface TokensByModelChartProps {
  data: Record<string, number>;
  loading: boolean;
}

function getModelColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("opus")) return "#10b981";
  if (lower.includes("sonnet")) return "#3b82f6";
  if (lower.includes("haiku")) return "#f59e0b";
  return "#8b5cf6";
}

function formatAxisValue(val: number): string {
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(1) + "M";
  if (val >= 1_000) return (val / 1_000).toFixed(0) + "K";
  return String(val);
}

export function TokensByModelChart({ data, loading }: TokensByModelChartProps): JSX.Element {
  const { t } = useTranslation();

  const option = useMemo<EChartsCoreOption>(() => {
    const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const modelNames = entries.map(([k]) => k);
    const values = entries.map(([k, v]) => ({
      value: v,
      itemStyle: { color: getModelColor(k) },
    }));

    return {
      tooltip: {
        trigger: "axis",
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] : params;
          const item = p as { name: string; value: number };
          return `<strong>${item.name}</strong><br/>${formatAxisValue(item.value)} tokens`;
        },
      },
      grid: { left: 50, right: 16, top: 8, bottom: 24 },
      xAxis: { type: "category", data: modelNames },
      yAxis: {
        type: "value",
        axisLabel: {
          formatter: (val: number) => formatAxisValue(val),
        },
      },
      series: [
        {
          type: "bar",
          data: values,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 40,
        },
      ],
    };
  }, [data]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-semibold mb-3">{t("analytics.tokensByModel")}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-blue-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const isEmpty = Object.keys(data).length === 0;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-semibold mb-3">{t("analytics.tokensByModel")}</h3>
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
