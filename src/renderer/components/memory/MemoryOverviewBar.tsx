import { useTranslation } from "../../i18n/LanguageContext";
import type { MemoryOverview } from "../../../shared/types/memory";

interface Props {
  overview: MemoryOverview;
}

export function MemoryOverviewBar({ overview }: Props) {
  const { t } = useTranslation();

  const stats = [
    { label: t("memory.totalMemories"), value: overview.totalMemories, color: "text-purple-400" },
    { label: t("memory.totalChains"), value: overview.totalChains, color: "text-blue-400" },
    { label: t("memory.localMemories"), value: overview.sourceCounts.local || 0, color: "text-green-400" },
    { label: t("memory.sharedMemories"), value: overview.sourceCounts.shared || 0, color: "text-yellow-400" },
    { label: t("memory.communityMemories"), value: overview.sourceCounts.community || 0, color: "text-pink-400" },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#1e1e2e] rounded-xl p-4 border border-white/5"
        >
          <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="text-xs text-white/50 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
