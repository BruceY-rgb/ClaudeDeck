import { useState } from "react";
import { Terminal, Trash2, CheckSquare, Square } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";

export interface AgentInfo {
  id: number;
  sessionId: string;
  projectDir: string;
  isActive: boolean;
  lastModified?: string;
}

interface AgentListProps {
  agents: AgentInfo[];
  selectedAgentId?: number;
  onSelectAgent: (agent: AgentInfo) => void;
  onJoinTerminal: (projectDir: string, sessionId?: string) => void;
  onDeleteAgent: (projectDir: string, sessionId: string) => void;
  onBatchDelete?: (projectDir: string, sessionIds: string[]) => void;
  title?: string;
}

export function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
  onJoinTerminal,
  onDeleteAgent,
  onBatchDelete,
  title,
}: AgentListProps): JSX.Element {
  const { t } = useTranslation();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  if (agents.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        {t("office.noSessionsInProject")}
      </div>
    );
  }

  // 按活跃状态排序，活跃的排在前面
  const sortedAgents = [...agents].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return 0;
  });

  const handleToggleSelect = (sessionId: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const handleSelectAll = (): void => {
    if (selectedIds.size === sortedAgents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedAgents.map((a) => a.sessionId)));
    }
  };

  const handleBatchDelete = (): void => {
    if (!onBatchDelete || selectedIds.size === 0) return;
    const projectDir = sortedAgents[0]?.projectDir;
    if (!projectDir) return;

    if (confirm(t("office.batchDeleteConfirm", { count: selectedIds.size }))) {
      onBatchDelete(projectDir, Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsBatchMode(false);
    }
  };

  const getCardClassName = (agent: AgentInfo): string => {
    const isSelected = selectedAgentId === agent.id;
    const isChecked = selectedIds.has(agent.sessionId);

    // 选中状态优先显示
    if (isSelected && isBatchMode) {
      return "bg-primary/20 border-2 border-primary";
    }
    if (isSelected) {
      return "bg-primary/20 border-2 border-primary";
    }
    if (agent.isActive) {
      return "bg-green-500/5 border border-green-500/30 hover:border-green-500/50";
    }
    return "bg-card border border-border hover:border-primary/30";
  };

  return (
    <div className="space-y-3">
      {/* 标题和Batch操作工具栏 */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          {title && <h2 className="font-semibold">{title}</h2>}
          {onBatchDelete && (
            <button
              className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
                isBatchMode ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => {
                setIsBatchMode(!isBatchMode);
                if (!isBatchMode) setSelectedIds(new Set());
              }}
            >
              {isBatchMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {t("office.batchSelect")}
            </button>
          )}
        </div>
        {onBatchDelete && isBatchMode && selectedIds.size > 0 && (
          <button
            className="flex items-center gap-1 text-sm px-2 py-1 text-red-500 hover:bg-red-500/10 rounded"
            onClick={handleBatchDelete}
          >
            <Trash2 className="w-4 h-4" />
            {t("office.deleteSelected", { count: selectedIds.size })}
          </button>
        )}
      </div>

      {/* 全选按钮 */}
      {isBatchMode && (
        <button
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
          onClick={handleSelectAll}
        >
          {selectedIds.size === sortedAgents.length ? (
            <CheckSquare className="w-4 h-4" />
          ) : (
            <Square className="w-4 h-4" />
          )}
          {t("office.selectAll")}
        </button>
      )}

      <div className="space-y-2">
        {sortedAgents.map((agent) => {
          const isSelected = selectedAgentId === agent.id;
          const isChecked = selectedIds.has(agent.sessionId);

          return (
            <div
              key={agent.sessionId}
              className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${getCardClassName(agent)}`}
              onClick={() => onSelectAgent(agent)}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* 批量选择复选框 */}
                {isBatchMode && (
                  <button
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(agent.sessionId);
                    }}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        agent.isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground/50"
                      }`}
                    />
                    <span className="font-medium truncate">
                      {agent.sessionId.slice(0, 8)}...
                    </span>
                    {agent.isActive && (
                      <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-500 rounded flex-shrink-0">
                        {t("office.active")}
                      </span>
                    )}
                    {isSelected && !isBatchMode && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded flex-shrink-0">
                        {t("office.selected")}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {agent.isActive ? t("office.running") : agent.lastModified
                      ? new Date(agent.lastModified).toLocaleString()
                      : t("office.ended")}
                  </div>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                <button
                  className="p-2 hover:bg-primary/10 rounded-md text-muted-foreground hover:text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onJoinTerminal(agent.projectDir, agent.sessionId);
                  }}
                  title={t("office.resumeSession")}
                >
                  <Terminal className="w-4 h-4" />
                </button>
                <button
                  className="p-2 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(t("office.deleteSessionConfirm"))) {
                      onDeleteAgent(agent.projectDir, agent.sessionId);
                    }
                  }}
                  title={t("office.deleteSession")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
