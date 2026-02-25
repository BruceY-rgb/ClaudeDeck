import { Terminal, Trash2 } from "lucide-react";

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
  onJoinTerminal: (projectDir: string) => void;
  onDeleteAgent: (projectDir: string, sessionId: string) => void;
}

export function AgentList({
  agents,
  selectedAgentId,
  onSelectAgent,
  onJoinTerminal,
  onDeleteAgent,
}: AgentListProps): JSX.Element {
  if (agents.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        该项目暂无会话
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {agents.map((agent) => (
        <div
          key={agent.sessionId}
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
            selectedAgentId === agent.id
              ? "bg-primary/10 border border-primary/50"
              : "bg-card border border-border hover:border-primary/30"
          }`}
          onClick={() => onSelectAgent(agent)}
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  agent.isActive ? "bg-green-500 animate-pulse" : "bg-muted-foreground/50"
                }`}
              />
              <span className="font-medium truncate">
                {agent.sessionId.slice(0, 8)}...
              </span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              {agent.isActive ? "运行中" : agent.lastModified
                ? new Date(agent.lastModified).toLocaleString()
                : "已结束"}
            </div>
          </div>
          <button
            className="p-2 hover:bg-primary/10 rounded-md"
            onClick={(e) => {
              e.stopPropagation();
              onJoinTerminal(agent.projectDir);
            }}
            title="打开终端"
          >
            <Terminal className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("确定要删除这个会话吗？此操作不可恢复。")) {
                onDeleteAgent(agent.projectDir, agent.sessionId);
              }
            }}
            title="删除会话"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
