import { useState } from "react";
import { Brain, EyeOff, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import type { TimelineThinkingItem } from "../../../shared/types/session-detail";

interface ThinkingBlockProps {
  item: TimelineThinkingItem;
}

const COLLAPSED_CHARS = 200;

export function ThinkingBlock({ item }: ThinkingBlockProps): JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const Icon = item.isRedacted ? EyeOff : Brain;
  const label = item.isRedacted
    ? t("sessionDetail.redactedThinking")
    : t("sessionDetail.expandedThinking");

  const hasContent = item.text.trim().length > 0;
  const isLong = item.text.length > COLLAPSED_CHARS;
  const displayText =
    isLong && !expanded
      ? item.text.slice(0, COLLAPSED_CHARS) + "..."
      : item.text;

  return (
    <div className="mx-4 py-2">
      <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-3 bg-zinc-50 dark:bg-zinc-900/50">
        {/* Header */}
        <button
          className="flex items-center gap-2 w-full text-left"
          onClick={() => hasContent && setExpanded(!expanded)}
        >
          <Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
          {hasContent && (
            <span className="ml-auto">
              {expanded ? (
                <ChevronUp className="w-3 h-3 text-zinc-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              )}
            </span>
          )}
        </button>

        {/* Content */}
        {hasContent && expanded && (
          <pre className="mt-2 max-h-[400px] overflow-auto text-xs font-mono whitespace-pre-wrap text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {displayText}
          </pre>
        )}

        {/* Collapsed preview */}
        {hasContent && !expanded && (
          <p className="mt-1.5 text-xs font-mono text-zinc-400 dark:text-zinc-500 truncate">
            {item.text.slice(0, 80)}
            {item.text.length > 80 ? "..." : ""}
          </p>
        )}

        {/* No content for redacted */}
        {!hasContent && item.isRedacted && (
          <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-500 italic">
            {t("sessionDetail.redactedThinking")}
          </p>
        )}
      </div>
    </div>
  );
}
