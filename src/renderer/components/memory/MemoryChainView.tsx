import { useTranslation } from "../../i18n/LanguageContext";
import type { Memory, MemoryChain } from "../../../shared/types/memory";

interface Props {
  chain: MemoryChain;
  memories: Memory[];
  onBack: () => void;
  onMemoryClick: (id: string) => void;
}

export function MemoryChainView({ chain, memories, onBack, onMemoryClick }: Props) {
  const { t } = useTranslation();

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

      {/* Chain Info */}
      <div className="bg-[#1e1e2e] rounded-xl p-6 border border-white/5">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">🔗</span>
          <h2 className="text-xl font-bold text-white">{chain.title}</h2>
        </div>
        <p className="text-sm text-white/60 mb-3">{chain.description}</p>
        <div className="flex items-center gap-3 text-xs text-white/40">
          <span>
            {memories.length} {t("memory.memoriesInChain")}
          </span>
          <span>{new Date(chain.createdAt).toLocaleDateString()} — {new Date(chain.updatedAt).toLocaleDateString()}</span>
        </div>
        {chain.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {chain.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/50"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500/50 via-blue-500/50 to-green-500/50" />

        {memories.map((memory, index) => (
          <div
            key={memory.id}
            className="relative pl-14 pb-6 cursor-pointer group"
            onClick={() => onMemoryClick(memory.id)}
          >
            {/* Timeline dot */}
            <div className="absolute left-4 top-2 w-5 h-5 rounded-full bg-[#1e1e2e] border-2 border-purple-500/50 group-hover:border-purple-400 transition-colors flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-purple-400 group-hover:bg-purple-300" />
            </div>

            {/* Card */}
            <div className="bg-[#1e1e2e] rounded-xl p-4 border border-white/5 group-hover:border-purple-500/30 transition-all">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30 font-mono">
                  #{index + 1}
                </span>
                <span className="text-[10px] text-white/30">
                  {new Date(memory.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white/90 mb-1">
                {memory.title}
              </h3>
              <p className="text-xs text-white/50 line-clamp-2">
                {memory.content}
              </p>
              <div className="flex items-center gap-2 mt-2 text-[10px] text-white/40">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-[7px] text-white font-bold">
                  {memory.contributor.name.charAt(0)}
                </div>
                <span>{memory.contributor.name}</span>
                {memory.project && (
                  <>
                    <span>·</span>
                    <span>{memory.project.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
