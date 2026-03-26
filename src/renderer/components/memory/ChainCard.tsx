import type { MemoryChain } from "../../../shared/types/memory";

interface Props {
  chain: MemoryChain;
  onClick: (id: string) => void;
}

export function ChainCard({ chain, onClick }: Props) {
  return (
    <div
      className="bg-[#1e1e2e] rounded-xl p-4 border border-white/5 hover:border-purple-500/30 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5"
      onClick={() => onClick(chain.id)}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">🔗</span>
        <h3 className="text-sm font-semibold text-white/90 line-clamp-1">
          {chain.title}
        </h3>
      </div>

      <p className="text-xs text-white/50 line-clamp-2 mb-3">
        {chain.description}
      </p>

      <div className="flex items-center justify-between text-[10px] text-white/40">
        <span>{chain.memoryIds.length} memories</span>
        <span>
          {new Date(chain.updatedAt).toLocaleDateString()}
        </span>
      </div>

      {chain.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {chain.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
