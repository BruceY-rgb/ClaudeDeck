import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Terminal, RefreshCw } from "lucide-react";
import { AgentList, type AgentInfo } from "../components/office/AgentList";
import { ContextViewer } from "../components/office/ContextViewer";

export function ProjectDetailPage(): JSX.Element {
  const { projectDir } = useParams<{ projectDir: string }>();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentInfo | null>(null);

  const decodedProjectDir = projectDir ? decodeURIComponent(projectDir) : "";

  useEffect(() => {
    if (decodedProjectDir) {
      loadAgents();
    }
  }, [decodedProjectDir]);

  const loadAgents = async (): Promise<void> => {
    if (!decodedProjectDir) return;

    try {
      setLoading(true);
      const data = await window.electronAPI.office.getProjectAgents(decodedProjectDir);
      setAgents(data);
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0]);
      }
    } catch (err) {
      console.error("Failed to load agents:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTerminal = async (dir: string, sessionId?: string): Promise<void> => {
    await window.electronAPI.office.joinTerminal(dir, sessionId);
  };

  const handleSelectAgent = (agent: AgentInfo): void => {
    setSelectedAgent(agent);
  };

  const handleDeleteAgent = async (projectDir: string, sessionId: string): Promise<void> => {
    const result = await window.electronAPI.office.deleteAgent(projectDir, sessionId);
    if (result.success) {
      // 移除已删除的会话
      setAgents((prev) => prev.filter((a) => a.sessionId !== sessionId));
      // 如果删除的是当前选中的会话，清空选择
      if (selectedAgent?.sessionId === sessionId) {
        setSelectedAgent(null);
      }
      alert("会话已成功删除");
    } else {
      console.error("Failed to delete agent:", result.error);
      alert(`删除失败: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-border">
        <button
          className="p-2 hover:bg-card rounded-md"
          onClick={() => navigate("/office")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">
            {decodedProjectDir.split("/").pop()}
          </h1>
          <p className="text-sm text-muted-foreground truncate">
            {decodedProjectDir}
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={() => handleJoinTerminal(decodedProjectDir, selectedAgent?.sessionId || agents[0]?.sessionId)}
        >
          <Terminal className="w-4 h-4" />
          打开终端
        </button>
        <button
          className="p-2 hover:bg-card rounded-md"
          onClick={loadAgents}
          title="刷新"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left - Agent List */}
        <div className="w-80 border-r border-border p-4 overflow-y-auto">
          <h2 className="font-semibold mb-4">会话列表</h2>
          <AgentList
            agents={agents}
            selectedAgentId={selectedAgent?.id}
            onSelectAgent={handleSelectAgent}
            onJoinTerminal={handleJoinTerminal}
            onDeleteAgent={handleDeleteAgent}
          />
        </div>

        {/* Right - Context Viewer */}
        <div className="flex-1 overflow-hidden">
          <ContextViewer agent={selectedAgent} />
        </div>
      </div>
    </div>
  );
}
