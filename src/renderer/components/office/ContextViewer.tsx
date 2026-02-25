import { useEffect, useState } from "react";
import { MessageSquare, User, Bot, Cpu, Loader2 } from "lucide-react";
import type { AgentInfo } from "./AgentList";

interface ContextViewerProps {
  agent: AgentInfo | null;
}

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
  tools?: Array<{ name: string; input: Record<string, unknown> }>;
}

export function ContextViewer({ agent }: ContextViewerProps): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!agent) {
      setMessages([]);
      return;
    }
    let cancelled = false;
    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const ctx = await window.electronAPI.office.getAgentContext(
          agent.projectDir,
          agent.sessionId,
        ) as { messages: Message[] } | null;
        if (!cancelled && ctx?.messages) {
          setMessages(ctx.messages);
        }
      } catch (err) {
        console.error("Failed to load context:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [agent?.sessionId]);

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        选择一个会话来查看上下文
      </div>
    );
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "user":
        return <User className="w-4 h-4" />;
      case "assistant":
        return <Bot className="w-4 h-4" />;
      case "system":
        return <Cpu className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "user":
        return "bg-blue-500/10 text-blue-500";
      case "assistant":
        return "bg-green-500/10 text-green-500";
      case "system":
        return "bg-yellow-500/10 text-yellow-500";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <div className="mb-4">
        <h3 className="font-semibold">会话上下文</h3>
        <p className="text-sm text-muted-foreground">
          Session: {agent.sessionId}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          加载中...
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          暂无对话记录
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className="flex gap-3">
              <div className={`p-2 rounded-lg h-fit ${getRoleColor(msg.role)}`}>
                {getRoleIcon(msg.role)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium capitalize">{msg.role}</span>
                  {msg.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                {msg.tools && msg.tools.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {msg.tools.map((tool, tidx) => (
                      <span
                        key={tidx}
                        className="px-2 py-1 bg-purple-500/10 text-purple-500 text-xs rounded"
                      >
                        {tool.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
