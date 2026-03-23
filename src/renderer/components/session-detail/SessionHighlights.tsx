import { Wrench, ListChecks, TriangleAlert, FilePenLine } from "lucide-react";
import { StatCard } from "../shared/StatCard";
import { useTranslation } from "../../i18n/LanguageContext";
import type { SessionHighlights } from "../../../shared/types/session-detail";

interface SessionHighlightsBarProps {
  highlights: SessionHighlights;
}

export function SessionHighlightsBar({
  highlights,
}: SessionHighlightsBarProps): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
      <StatCard
        icon={Wrench}
        title={t("sessionDetail.toolCalls")}
        value={highlights.toolCalls}
        color="blue"
      />
      <StatCard
        icon={ListChecks}
        title={t("sessionDetail.toolResults")}
        value={highlights.toolResults}
        color="green"
      />
      <StatCard
        icon={TriangleAlert}
        title={t("sessionDetail.failures")}
        value={highlights.failureCount}
        color="red"
      />
      <StatCard
        icon={FilePenLine}
        title={t("sessionDetail.touchedFiles")}
        value={highlights.touchedFiles.length}
        color="violet"
      />
    </div>
  );
}
