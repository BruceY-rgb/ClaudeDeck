import { ChevronDown } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";

interface ScrollToBottomProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToBottom({
  visible,
  onClick,
}: ScrollToBottomProps): JSX.Element | null {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <button
      className="absolute bottom-4 right-4 bg-white dark:bg-zinc-800 shadow-lg rounded-full p-2 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors z-10"
      onClick={onClick}
      title={t("sessionDetail.scrollToBottom")}
    >
      <ChevronDown className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
    </button>
  );
}
