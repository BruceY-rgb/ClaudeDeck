import { useTranslation } from "../../i18n/LanguageContext";

interface TimeRangeTabsProps {
  value: string;
  onChange: (range: string) => void;
}

const ranges = ["7d", "30d", "90d", "year"] as const;

export function TimeRangeTabs({
  value,
  onChange,
}: TimeRangeTabsProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg p-1 w-fit">
      {ranges.map((range) => {
        const isActive = value === range;
        return (
          <button
            key={range}
            onClick={() => onChange(range)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
              isActive
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            {t(`dashboard.timeRange.${range}`)}
          </button>
        );
      })}
    </div>
  );
}
