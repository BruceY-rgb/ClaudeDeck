import { ArrowLeft, Calendar, Clock, MessageSquare, Coins, Zap, Timer } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import type { SessionStats } from "../../../shared/types/session-detail";

interface SessionHeaderProps {
  projectPath: string;
  sessionId: string;
  stats: SessionStats;
  messageCount: number;
  onBack?: () => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function formatTokens(count: number): string {
  if (count < 1000) return String(count);
  if (count < 1_000_000) return `${(count / 1000).toFixed(1)}k`;
  return `${(count / 1_000_000).toFixed(2)}M`;
}

export function SessionHeader({
  projectPath,
  sessionId,
  stats,
  messageCount,
  onBack,
}: SessionHeaderProps): JSX.Element {
  const { t } = useTranslation();

  const projectName = projectPath.split("/").pop() || projectPath;
  const totalTokens = stats.totalInputTokens + stats.totalOutputTokens;

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 shrink-0">
      {/* Top row: back + project name */}
      <div className="flex items-center gap-3 mb-2">
        {onBack && (
          <button
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            onClick={onBack}
            title={t("sessionDetail.backToProject")}
          >
            <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {projectName}
          </h2>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 truncate font-mono">
            {sessionId.slice(0, 12)}...
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <MessageSquare className="w-3.5 h-3.5" />
          {t("sessionDetail.messages", { count: messageCount })}
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3.5 h-3.5" />
          {t("sessionDetail.tokens", { count: formatTokens(totalTokens) })}
        </span>
        <span className="flex items-center gap-1">
          <Coins className="w-3.5 h-3.5" />
          {t("sessionDetail.cost", { amount: stats.estimatedCostUsd.toFixed(4) })}
        </span>
        <span className="flex items-center gap-1">
          <Timer className="w-3.5 h-3.5" />
          {t("sessionDetail.duration", { duration: formatDuration(stats.durationSeconds) })}
        </span>
      </div>
    </div>
  );
}
