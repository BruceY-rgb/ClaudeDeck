import { useTranslation } from "../../i18n/LanguageContext";

interface CacheEfficiencyCardProps {
  cacheRead: number;
  totalInput: number;
  loading: boolean;
}

function formatTokenCount(count: number): string {
  if (count >= 1_000_000) return (count / 1_000_000).toFixed(1) + "M";
  if (count >= 1_000) return (count / 1_000).toFixed(1) + "K";
  return String(count);
}

export function CacheEfficiencyCard({ cacheRead, totalInput, loading }: CacheEfficiencyCardProps): JSX.Element {
  const { t } = useTranslation();
  const percentage = totalInput > 0 ? (cacheRead / totalInput) * 100 : 0;

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
        <h3 className="text-sm font-semibold mb-3">{t("analytics.cacheEfficiency")}</h3>
        <div className="h-28 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-zinc-300 dark:border-zinc-600 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <h3 className="text-sm font-semibold mb-3">{t("analytics.cacheEfficiency")}</h3>
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          {percentage.toFixed(1)}%
        </span>
        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {t("analytics.cacheHitRate")}
        </span>
      </div>

      {/* Visual bar */}
      <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        <p>{t("analytics.cacheReadTokens", { count: formatTokenCount(cacheRead) })}</p>
        <p>{t("analytics.totalInputTokens", { count: formatTokenCount(totalInput) })}</p>
      </div>
    </div>
  );
}
