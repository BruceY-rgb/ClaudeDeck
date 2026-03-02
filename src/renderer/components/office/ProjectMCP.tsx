import { useState } from "react";
import { Plus, Server, Edit2, Trash2, Terminal, Globe, X, Save } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import type { ProjectMCPServer, ProjectMCPFormData } from "@shared/types/project-config";

interface EnvEntry {
  key: string;
  value: string;
}

interface ModalState {
  open: boolean;
  mode: "add" | "edit";
  originalName: string | null;
}

const emptyForm: ProjectMCPFormData = {
  name: "",
  type: "stdio",
  command: "",
  args: [],
  url: "",
  env: {},
};

export function ProjectMCP(): JSX.Element {
  const { t } = useTranslation();
  const mcpServers = useProjectConfigStore((s) => s.mcpServers);
  const loading = useProjectConfigStore((s) => s.loading.mcp);
  const writeMCPServer = useProjectConfigStore((s) => s.writeMCPServer);
  const deleteMCPServer = useProjectConfigStore((s) => s.deleteMCPServer);

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: "add",
    originalName: null,
  });
  const [form, setForm] = useState<ProjectMCPFormData>({ ...emptyForm });
  const [envEntries, setEnvEntries] = useState<EnvEntry[]>([]);
  const [argsText, setArgsText] = useState("");
  const [saving, setSaving] = useState(false);

  const openAddModal = (): void => {
    setForm({ ...emptyForm });
    setEnvEntries([]);
    setArgsText("");
    setModal({ open: true, mode: "add", originalName: null });
  };

  const openEditModal = (server: ProjectMCPServer): void => {
    const entries: EnvEntry[] = server.env
      ? Object.entries(server.env).map(([key, value]) => ({ key, value }))
      : [];
    setForm({
      name: server.name,
      type: server.type,
      command: server.command ?? "",
      args: server.args ?? [],
      url: server.url ?? "",
      env: server.env ?? {},
    });
    setEnvEntries(entries);
    setArgsText((server.args ?? []).join(", "));
    setModal({ open: true, mode: "edit", originalName: server.name });
  };

  const closeModal = (): void => {
    setModal({ open: false, mode: "add", originalName: null });
  };

  const handleDelete = (name: string): void => {
    if (confirm(t("office.projectMCP.deleteConfirm", { name }))) {
      deleteMCPServer(name);
    }
  };

  const addEnvEntry = (): void => {
    setEnvEntries((prev) => [...prev, { key: "", value: "" }]);
  };

  const removeEnvEntry = (index: number): void => {
    setEnvEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateEnvEntry = (
    index: number,
    field: "key" | "value",
    value: string,
  ): void => {
    setEnvEntries((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, [field]: value } : entry,
      ),
    );
  };

  const handleSave = async (): Promise<void> => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const env: Record<string, string> = {};
      for (const entry of envEntries) {
        if (entry.key.trim()) {
          env[entry.key.trim()] = entry.value;
        }
      }

      const parsedArgs = argsText
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const data: ProjectMCPFormData = {
        name: form.name.trim(),
        type: form.type,
        ...(form.type === "stdio"
          ? { command: form.command, args: parsedArgs }
          : { url: form.url }),
        ...(Object.keys(env).length > 0 ? { env } : {}),
      };

      await writeMCPServer(data.name, data);
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-zinc-400">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("office.projectMCP.title")}
        </h2>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm hover:opacity-90 transition-colors"
          onClick={openAddModal}
        >
          <Plus className="w-4 h-4" />
          {t("office.projectMCP.add")}
        </button>
      </div>

      {/* Empty state */}
      {mcpServers.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <Server className="w-12 h-12 mb-3 opacity-40" />
          <p className="text-base font-medium">
            {t("office.projectMCP.empty")}
          </p>
          <p className="text-sm mt-1">{t("office.projectMCP.emptyHint")}</p>
        </div>
      )}

      {/* Server list */}
      <div className="space-y-3">
        {mcpServers.map((server) => (
          <div
            key={server.name}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 hover:-translate-y-0.5 cursor-pointer active:translate-y-0 active:shadow-md transition-all duration-200"
          >
            {/* Top row: name, type badge, actions */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {server.name}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    server.type === "stdio"
                      ? "bg-blue-500/10 text-blue-500"
                      : "bg-green-500/10 text-green-500"
                  }`}
                >
                  {server.type === "stdio" ? (
                    <Terminal className="w-3 h-3" />
                  ) : (
                    <Globe className="w-3 h-3" />
                  )}
                  {server.type}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  onClick={() => openEditModal(server)}
                  title={t("office.projectMCP.editServer")}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  className="p-1.5 hover:bg-red-500/10 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
                  onClick={() => handleDelete(server.name)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="text-sm text-zinc-500 dark:text-zinc-400 space-y-1">
              {server.type === "stdio" && server.command && (
                <p>
                  <span className="text-zinc-400 dark:text-zinc-500">command:</span>{" "}
                  {server.command}
                </p>
              )}
              {server.type === "stdio" &&
                server.args &&
                server.args.length > 0 && (
                  <p>
                    <span className="text-zinc-400 dark:text-zinc-500">args:</span>{" "}
                    {server.args.join(" ")}
                  </p>
                )}
              {server.type === "http" && server.url && (
                <p>
                  <span className="text-zinc-400 dark:text-zinc-500">url:</span> {server.url}
                </p>
              )}
              {server.env && Object.keys(server.env).length > 0 && (
                <p>
                  <span className="text-zinc-400 dark:text-zinc-500">env:</span>{" "}
                  {Object.keys(server.env)
                    .map((k) => `${k}=***`)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 max-h-[85vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {modal.mode === "edit"
                  ? t("office.projectMCP.editServer")
                  : t("office.projectMCP.addServer")}
              </h2>
              <button
                className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                onClick={closeModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Server Name */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                  {t("office.projectMCP.serverName")}
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={modal.mode === "edit"}
                  placeholder="my-server"
                />
              </div>

              {/* Server Type */}
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                  {t("office.projectMCP.serverType")}
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="server-type"
                      value="stdio"
                      checked={form.type === "stdio"}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, type: "stdio" }))
                      }
                      className="accent-blue-500"
                    />
                    <Terminal className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">stdio</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="server-type"
                      value="http"
                      checked={form.type === "http"}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, type: "http" }))
                      }
                      className="accent-green-500"
                    />
                    <Globe className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-zinc-900 dark:text-zinc-100">http</span>
                  </label>
                </div>
              </div>

              {/* Conditional fields based on type */}
              {form.type === "stdio" ? (
                <>
                  {/* Command */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                      {t("office.projectMCP.command")}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={form.command ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          command: e.target.value,
                        }))
                      }
                      placeholder="npx -y @mcp/server"
                    />
                  </div>
                  {/* Args */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                      {t("office.projectMCP.args")}
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={argsText}
                      onChange={(e) => setArgsText(e.target.value)}
                      placeholder={t("office.projectMCP.argsPlaceholder")}
                    />
                  </div>
                </>
              ) : (
                /* URL */
                <div>
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                    {t("office.projectMCP.url")}
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={form.url ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, url: e.target.value }))
                    }
                    placeholder="http://localhost:3000/mcp"
                  />
                </div>
              )}

              {/* Environment Variables */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {t("office.projectMCP.envVars")}
                  </label>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                    onClick={addEnvEntry}
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                </div>
                {envEntries.length === 0 ? (
                  <p className="text-xs text-zinc-400">
                    No environment variables
                  </p>
                ) : (
                  <div className="space-y-2">
                    {envEntries.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={entry.key}
                          onChange={(e) =>
                            updateEnvEntry(index, "key", e.target.value)
                          }
                          placeholder="KEY"
                        />
                        <input
                          type="text"
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={entry.value}
                          onChange={(e) =>
                            updateEnvEntry(index, "value", e.target.value)
                          }
                          placeholder="value"
                        />
                        <button
                          type="button"
                          className="p-1 hover:bg-red-500/10 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
                          onClick={() => removeEnvEntry(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 text-sm rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-md text-sm hover:opacity-90 transition-colors disabled:opacity-50"
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
