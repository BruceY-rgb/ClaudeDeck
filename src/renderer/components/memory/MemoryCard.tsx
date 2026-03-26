import { useTranslation } from "../../i18n/LanguageContext";
import type { Memory } from "../../../shared/types/memory";

interface Props {
  memory: Memory;
  onClick: (id: string) => void;
}

const categoryColors: Record<string, string> = {
  "bug-fix": "bg-red-500/20 text-red-400",
  architecture: "bg-blue-500/20 text-blue-400",
  "best-practice": "bg-green-500/20 text-green-400",
  workflow: "bg-yellow-500/20 text-yellow-400",
  debugging: "bg-orange-500/20 text-orange-400",
  performance: "bg-purple-500/20 text-purple-400",
  security: "bg-pink-500/20 text-pink-400",
  testing: "bg-cyan-500/20 text-cyan-400",
  tooling: "bg-indigo-500/20 text-indigo-400",
  general: "bg-gray-500/20 text-gray-400",
};

const sourceIcons: Record<string, string> = {
  local: "💻",
  shared: "🔗",
  community: "🌐",
};

export function MemoryCard({ memory, onClick }: Props) {
  const { t } = useTranslation();
  const colorClass = categoryColors[memory.category] || categoryColors.general;
  const sourceIcon = sourceIcons[memory.source] || "📝";

  return (
    <div
      className="bg-[#1e1e2e] rounded-xl p-4 border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5"
      onClick={() => onClick(memory.id)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-white/90 line-clamp-1 flex-1">
          {memory.title}
        </h3>
        <span className="text-lg ml-2" title={memory.source}>
          {sourceIcon}
        </span>
      </div>

      <p className="text-xs text-white/50 line-clamp-2 mb-3">
        {memory.content}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${colorClass}`}>
          {memory.category}
        </span>
        {memory.chainId && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
            🔗 {t("memory.inChain")}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-white/40">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-[8px] text-white font-bold">
            {memory.contributor.name.charAt(0)}
          </div>
          <span>{memory.contributor.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>↗ {memory.useCount}</span>
          <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {memory.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40"
            >
              {tag}
            </span>
          ))}
          {memory.tags.length > 3 && (
            <span className="text-[9px] text-white/30">
              +{memory.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
