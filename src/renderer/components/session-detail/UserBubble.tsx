import { User } from "lucide-react";
import { MarkdownRenderer } from "../shared/MarkdownRenderer";
import { useTranslation } from "../../i18n/LanguageContext";
import type { TimelineUserItem } from "../../../shared/types/session-detail";

interface UserBubbleProps {
  item: TimelineUserItem;
}

export function UserBubble({ item }: UserBubbleProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="flex justify-end px-4 py-2">
      <div className="max-w-[78%]">
        <div className="flex items-center justify-end gap-2 mb-1">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {item.timestamp
              ? new Date(item.timestamp).toLocaleTimeString()
              : ""}
          </span>
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {t("sessionDetail.you")}
          </span>
          <div className="p-1 rounded-full bg-zinc-200 dark:bg-zinc-700">
            <User className="w-3 h-3 text-zinc-600 dark:text-zinc-300" />
          </div>
        </div>
        <div className="rounded-2xl rounded-tr-sm bg-zinc-100 dark:bg-zinc-800 px-4 py-3 max-h-[220px] overflow-auto">
          <MarkdownRenderer content={item.text} />
        </div>
      </div>
    </div>
  );
}
