import { useTranslation } from "../../i18n/LanguageContext";
import type { Memory } from "../../../shared/types/memory";

interface Props {
  memory: Memory;
  onBack: () => void;
  onChainClick?: (chainId: string) => void;
}

const categoryColors: Record<string, string> = {
  "bug-fix": "bg-red-500/20 text-red-400 border-red-500/30",
  architecture: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "best-practice": "bg-green-500/20 text-green-400 border-green-500/30",
  workflow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  debugging: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  performance: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  security: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  testing: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  tooling: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  general: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export function MemoryDetailPanel({ memory, onBack, onChainClick }: Props) {
  const { t } = useTranslation();
  const colorClass = categoryColors[memory.category] || categoryColors.general;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="text-white/50 hover:text-white transition-colors"
        >
          ← {t("memory.back")}
        </button>
      </div>

      {/* Title & Meta */}
      <div className="bg-[#1e1e2e] rounded-xl p-6 border border-white/5">
        <h2 className="text-xl font-bold text-white mb-3">{memory.title}</h2>

        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs px-3 py-1 rounded-full border ${colorClass}`}>
            {memory.category}
          </span>
          <span className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10">
            {memory.source === "local" ? "💻 Local" : memory.source === "shared" ? "🔗 Shared" : "🌐 Community"}
          </span>
          {memory.chainId && (
            <button
              onClick={() => onChainClick?.(memory.chainId!)}
              className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
            >
              🔗 {t("memory.viewChain")}
            </button>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-[10px] text-white font-bold">
              {memory.contributor.name.charAt(0)}
            </div>
            <span>{memory.contributor.name}</span>
          </div>
          <span>↗ {t("memory.usedTimes", { count: memory.useCount })}</span>
          <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#1e1e2e] rounded-xl p-6 border border-white/5">
        <h3 className="text-sm font-semibold text-white/70 mb-3">
          {t("memory.content")}
        </h3>
        <div className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
          {memory.content}
        </div>
      </div>

      {/* Context */}
      {memory.project && (
        <div className="bg-[#1e1e2e] rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-semibold text-white/70 mb-3">
            {t("memory.context")}
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-white/40">{t("memory.project")}:</span>
              <span className="text-white/80">{memory.project.name}</span>
            </div>
            {memory.sessionId && (
              <div className="flex items-center gap-2">
                <span className="text-white/40">{t("memory.session")}:</span>
                <span className="text-white/60 font-mono text-xs">
                  {memory.sessionId}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="bg-[#1e1e2e] rounded-xl p-6 border border-white/5">
          <h3 className="text-sm font-semibold text-white/70 mb-3">
            {t("memory.tags")}
          </h3>
          <div className="flex flex-wrap gap-2">
            {memory.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 rounded-full bg-white/5 text-white/60 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
