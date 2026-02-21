import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/shared/PageHeader";
import { TerminalPanel } from "../components/shared/TerminalPanel";
import { AVAILABLE_TOOLS, AVAILABLE_MODELS } from "@shared/types/agent";
import { Terminal } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export function AgentDetailPage(): JSX.Element {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const isNew = name === "new";
  const { t } = useTranslation();

  const [formName, setFormName] = useState("");
  const [description, setDescription] = useState("");
  const [tools, setTools] = useState<string[]>([
    "Read",
    "Write",
    "Edit",
    "Bash",
    "Glob",
    "Grep",
  ]);
  const [model, setModel] = useState("sonnet");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [isPlugin, setIsPlugin] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isNew && name) {
      window.electronAPI.agents.read(name).then((agent) => {
        if (agent) {
          setFormName(agent.name);
          setDescription(agent.description);
          setTools(agent.tools);
          setModel(agent.model);
          setBody(agent.body);
          setIsPlugin(agent.source === "plugin");
        }
        setLoading(false);
      });
    }
  }, [name, isNew]);

  const handleSave = async (): Promise<void> => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const fileName = isNew
        ? formName.trim().toLowerCase().replace(/\s+/g, "-")
        : name!;
      await window.electronAPI.agents.write(fileName, {
        name: formName.trim(),
        description,
        tools,
        model,
        body,
      });
      navigate("/agents");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!name || isNew) return;
    if (!confirm(t("agents.deleteConfirm", { name: name || "" }))) return;
    await window.electronAPI.agents.delete(name);
    navigate("/agents");
  };

  const toggleTool = (tool: string): void => {
    setTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool],
    );
  };

  const handleRunAgent = async (prompt: string): Promise<void> => {
    if (!name) return;
    setIsRunning(true);
    try {
      await window.electronAPI.cli.runAgent(name, prompt);
    } catch (err) {
      console.error("Failed to run agent:", err);
    }
  };

  const handleKillAgent = async (): Promise<void> => {
    await window.electronAPI.cli.kill();
    setIsRunning(false);
  };

  // Listen for CLI close event
  useEffect(() => {
    const unsubscribe = window.electronAPI.cli.onOutput((data) => {
      if (data.type === "close") {
        setIsRunning(false);
      }
    });
    return unsubscribe;
  }, []);

  if (loading)
    return (
      <div className="text-center py-12 text-zinc-400">
        {t("common.loading")}
      </div>
    );

  return (
    <div>
      <PageHeader
        title={
          isNew
            ? t("agents.new")
            : t("agents.agentPrefix", { name: name || "" })
        }
        backTo={{ label: t("agents.backToAgents"), path: "/agents" }}
        actions={
          <div className="flex items-center gap-2">
            {!isNew && !isPlugin && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {t("common.delete")}
              </button>
            )}
            {!isPlugin && (
              <button
                onClick={handleSave}
                disabled={saving || !formName.trim()}
                className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {saving ? t("common.saving") : t("common.save")}
              </button>
            )}
            {!isNew && !isPlugin && (
              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  showTerminal
                    ? "bg-blue-600 text-white"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <Terminal className="w-4 h-4" />
                {t("common.run")}
              </button>
            )}
          </div>
        }
      />

      {isPlugin && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
          {t("agents.pluginReadOnly")}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metadata panel */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("agents.fields.name")}
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                disabled={isPlugin || !isNew}
                placeholder={t("agents.placeholders.name")}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("agents.fields.description")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPlugin}
                rows={3}
                placeholder={t("agents.placeholders.description")}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("agents.fields.model")}
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                disabled={isPlugin}
                className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("agents.fields.tools")}
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TOOLS.map((tool) => (
                  <button
                    key={tool}
                    onClick={() => !isPlugin && toggleTool(tool)}
                    disabled={isPlugin}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
                      tools.includes(tool)
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-800"
                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    } disabled:opacity-50`}
                  >
                    {tool}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Body editor */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium">
              {t("agents.fields.systemPrompt")}
            </h3>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isPlugin}
            placeholder={t("agents.placeholders.body")}
            className="w-full h-[500px] px-4 py-3 bg-transparent text-sm font-mono focus:outline-none resize-none disabled:opacity-50"
          />
        </div>
      </div>

      {/* Terminal Panel */}
      {showTerminal && (
        <div className="mt-6 h-[400px]">
          <TerminalPanel
            onRun={handleRunAgent}
            onKill={handleKillAgent}
            isRunning={isRunning}
          />
        </div>
      )}
    </div>
  );
}
