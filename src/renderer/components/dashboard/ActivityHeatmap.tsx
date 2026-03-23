import { useMemo, useState } from "react";
import { useTranslation } from "../../i18n/LanguageContext";

interface ActivityHeatmapProps {
  data: Array<{ date: string; count: number }>;
  loading: boolean;
}

const CELL_SIZE = 10;
const GAP = 3;
const ROWS = 7;

function getColorLevel(count: number): string {
  if (count === 0) return "var(--heatmap-0)";
  if (count <= 2) return "var(--heatmap-1)";
  if (count <= 5) return "var(--heatmap-2)";
  if (count <= 10) return "var(--heatmap-3)";
  return "var(--heatmap-4)";
}

function getMonthLabels(
  startDate: Date,
  totalWeeks: number,
): Array<{ label: string; col: number }> {
  const labels: Array<{ label: string; col: number }> = [];
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  let lastMonth = -1;

  for (let week = 0; week < totalWeeks; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + week * 7);
    const month = weekStart.getMonth();
    if (month !== lastMonth) {
      labels.push({ label: monthNames[month], col: week });
      lastMonth = month;
    }
  }

  return labels;
}

function HeatmapSkeleton(): JSX.Element {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 animate-pulse">
      <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-700 rounded mb-4" />
      <div className="h-[100px] bg-zinc-100 dark:bg-zinc-800 rounded" />
    </div>
  );
}

export function ActivityHeatmap({
  data,
  loading,
}: ActivityHeatmapProps): JSX.Element {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    date: string;
    count: number;
  } | null>(null);

  const { grid, startDate, totalWeeks, monthLabels } = useMemo(() => {
    // Build a map of date -> count
    const countMap = new Map<string, number>();
    if (data) {
      for (const day of data) {
        countMap.set(day.date, day.count);
      }
    }

    // Generate 365 days ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - 364);

    // Align start to Sunday (start of week)
    const dayOfWeek = start.getDay(); // 0=Sun
    start.setDate(start.getDate() - dayOfWeek);

    const cells: Array<{
      date: string;
      count: number;
      col: number;
      row: number;
    }> = [];

    const totalDays = Math.ceil(
      (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    ) + 1;
    const weeks = Math.ceil(totalDays / 7);

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (d > today) break;
      const dateStr = d.toISOString().slice(0, 10);
      const col = Math.floor(i / 7);
      const row = i % 7;
      cells.push({
        date: dateStr,
        count: countMap.get(dateStr) ?? 0,
        col,
        row,
      });
    }

    return {
      grid: cells,
      startDate: start,
      totalWeeks: weeks,
      monthLabels: getMonthLabels(start, weeks),
    };
  }, [data]);

  if (loading) {
    return <HeatmapSkeleton />;
  }

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];
  const labelWidth = 28;
  const svgWidth = labelWidth + totalWeeks * (CELL_SIZE + GAP);
  const svgHeight = 16 + ROWS * (CELL_SIZE + GAP);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
        {t("dashboard.analytics.activityHeatmap")}
      </h3>
      <div className="overflow-x-auto relative">
        <svg
          width={svgWidth}
          height={svgHeight}
          className="block"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Month labels */}
          {monthLabels.map((m) => (
            <text
              key={`${m.label}-${m.col}`}
              x={labelWidth + m.col * (CELL_SIZE + GAP)}
              y={10}
              className="fill-zinc-400 dark:fill-zinc-500"
              fontSize={9}
            >
              {m.label}
            </text>
          ))}

          {/* Day of week labels */}
          {dayLabels.map((label, i) =>
            label ? (
              <text
                key={`day-${i}`}
                x={0}
                y={16 + i * (CELL_SIZE + GAP) + CELL_SIZE - 1}
                className="fill-zinc-400 dark:fill-zinc-500"
                fontSize={9}
              >
                {label}
              </text>
            ) : null,
          )}

          {/* Cells */}
          {grid.map((cell) => (
            <rect
              key={cell.date}
              x={labelWidth + cell.col * (CELL_SIZE + GAP)}
              y={16 + cell.row * (CELL_SIZE + GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={2}
              fill={getColorLevel(cell.count)}
              className="cursor-pointer"
              onMouseEnter={(e) => {
                const rect = (
                  e.target as SVGRectElement
                ).getBoundingClientRect();
                const container = (
                  e.target as SVGRectElement
                ).closest(".overflow-x-auto");
                const containerRect = container?.getBoundingClientRect();
                setTooltip({
                  x: rect.left - (containerRect?.left ?? 0) + CELL_SIZE / 2,
                  y: rect.top - (containerRect?.top ?? 0) - 8,
                  date: cell.date,
                  count: cell.count,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-10 px-2 py-1 rounded text-xs bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 whitespace-nowrap -translate-x-1/2 -translate-y-full"
            style={{ left: tooltip.x, top: tooltip.y }}
          >
            {tooltip.count === 1
              ? t("dashboard.analytics.sessions_one", {
                  count: tooltip.count,
                })
              : t("dashboard.analytics.sessions_other", {
                  count: tooltip.count,
                })}
            {" - "}
            {tooltip.date}
          </div>
        )}
      </div>
    </div>
  );
}
