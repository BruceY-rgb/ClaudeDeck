import { useEffect, useState } from "react";
import { useMCPStore } from "../../stores/mcpStore";
import { useTranslation } from "../../i18n/LanguageContext";

interface MCPTemplate {
  name: string;
  description?: string;
  type: "stdio" | "http";
  command?: string;
  args?: string[];
  url?: string;
  requiredEnvVars?: string[];
  pluginId: string;
  pluginName: string;
}

export function MCPTemplateList(): JSX.Element {
  const { t } = useTranslation();
  const { templates, loading, fetchTemplates, activate } = useMCPStore();
  const [activating, setActivating] = useState<string | null>(null);
  const [envValues, setEnvValues] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<MCPTemplate | null>(
    null,
  );

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">
        <p className="text-lg mb-2">{t("mcp.noTemplates")}</p>
        <p className="text-sm">{t("mcp.noTemplatesHint")}</p>
      </div>
    );
  }

  const handleActivate = async () => {
    if (!selectedTemplate) return;

    setActivating(selectedTemplate.name);
    try {
      await activate(selectedTemplate, envValues);
      setSelectedTemplate(null);
      setEnvValues({});
    } catch (e) {
      console.error("Failed to activate:", e);
    } finally {
      setActivating(null);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {templates.map((template) => (
          <div
            key={`${template.pluginId}-${template.name}`}
            className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {template.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-mono ${
                      template.type === "stdio"
                        ? "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        : "bg-purple-500/20 text-purple-600 dark:text-purple-400"
                    }`}
                  >
                    {template.type}
                  </span>
                  <span className="text-xs text-zinc-500">
                    via {template.pluginName}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedTemplate(template);
                  const initialEnv: Record<string, string> = {};
                  template.requiredEnvVars?.forEach((v) => {
                    initialEnv[v] = "";
                  });
                  setEnvValues(initialEnv);
                }}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
              >
                {t("common.activate")}
              </button>
            </div>

            {template.description && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {template.description}
              </p>
            )}

            <div className="mt-3 bg-zinc-50 dark:bg-zinc-950 rounded p-3">
              {template.type === "stdio" ? (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">
                    {t("mcp.command")}
                  </div>
                  <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
                    {template.command} {template.args?.join(" ")}
                  </code>
                </div>
              ) : (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">
                    {t("mcp.url")}
                  </div>
                  <code className="text-sm font-mono text-purple-600 dark:text-purple-400">
                    {template.url}
                  </code>
                </div>
              )}
            </div>

            {template.requiredEnvVars &&
              template.requiredEnvVars.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {template.requiredEnvVars.map((v) => (
                    <span
                      key={v}
                      className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Activation Dialog */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-zinc-100">
              {t("mcp.activateTitle", { name: selectedTemplate.name })}
            </h3>

            {selectedTemplate.requiredEnvVars &&
            selectedTemplate.requiredEnvVars.length > 0 ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {t("mcp.fillEnvVars")}
                </p>
                {selectedTemplate.requiredEnvVars.map((envVar) => (
                  <div key={envVar}>
                    <label className="block text-sm font-medium mb-1 text-zinc-700 dark:text-zinc-300">
                      {envVar}
                    </label>
                    <input
                      type="text"
                      value={envValues[envVar] || ""}
                      onChange={(e) =>
                        setEnvValues((prev) => ({
                          ...prev,
                          [envVar]: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-zinc-100"
                      placeholder={t("mcp.enterPlaceholder", { name: envVar })}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {t("mcp.noEnvRequired")}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setSelectedTemplate(null);
                  setEnvValues({});
                }}
                className="px-4 py-2 text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleActivate}
                disabled={activating !== null}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
              >
                {activating ? t("common.activating") : t("common.activate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
