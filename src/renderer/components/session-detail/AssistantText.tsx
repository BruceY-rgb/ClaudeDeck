import { useState } from "react";
import { Bot, ChevronDown, ChevronUp } from "lucide-react";
import { MarkdownRenderer } from "../shared/MarkdownRenderer";
import { useTranslation } from "../../i18n/LanguageContext";
import type { TimelineAssistantItem } from "../../../shared/types/session-detail";

interface AssistantTextProps {
  item: TimelineAssistantItem;
}

const COLLAPSE_THRESHOLD = 1200;
const VISIBLE_CHARS = 600;

export function AssistantText({ item }: AssistantTextProps): JSX.Element {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const isLong = item.text.length > COLLAPSE_THRESHOLD;
  const displayText =
    isLong && !expanded ? item.text.slice(0, VISIBLE_CHARS) + "..." : item.text;

  return (
    <div className="border-l-2 border-blue-500/20 pl-4 mx-4 py-2">
      {/* Header: icon + model badge */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1 rounded-full bg-blue-500/10">
          <Bot className="w-3 h-3 text-blue-500" />
        </div>
        {item.model && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
            {item.model}
          </span>
        )}
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {item.timestamp
            ? new Date(item.timestamp).toLocaleTimeString()
            : ""}
        </span>
      </div>

      {/* Content */}
      <div className="text-sm text-zinc-700 dark:text-zinc-300">
        <MarkdownRenderer content={displayText} />
      </div>

      {/* Show more / less toggle */}
      {isLong && (
        <button
          className="mt-2 flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              {t("sessionDetail.showLess")}
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              {t("sessionDetail.showMore")}
            </>
          )}
        </button>
      )}
    </div>
  );
}
