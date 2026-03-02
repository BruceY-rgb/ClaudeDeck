import { useState, useEffect, useCallback } from "react";
import { X, Save } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import { AVAILABLE_TOOLS, AVAILABLE_MODELS } from "@shared/types/agent";
import type { ProjectAgent } from "@shared/types/project-config";

interface AgentFormState {
  name: string;
  description: string;
  model: string;
  tools: string[];
  body: string;
}

const EMPTY_FORM: AgentFormState = {
  name: "",
  description: "",
  model: "sonnet",
  tools: [],
  body: "",
};

export function ProjectAgentDrawer(): JSX.Element {
  const { t } = useTranslation();

  const drawerMode = useProjectConfigStore((s) => s.drawerMode);
  const editingItem = useProjectConfigStore((s) => s.editingItem);
  const closeDrawer = useProjectConfigStore((s) => s.closeDrawer);
  const createAgent = useProjectConfigStore((s) => s.createAgent);
  const updateAgent = useProjectConfigStore((s) => s.updateAgent);

  const isEdit = drawerMode === "edit";
  const editingAgent = editingItem as ProjectAgent | null;

  const [form, setForm] = useState<AgentFormState>({ ...EMPTY_FORM });
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Animate in on mount
  useEffect(() => {
    // Defer to next frame so the initial translate-x-full is painted first
    const raf = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (isEdit && editingAgent) {
      setForm({
        name: editingAgent.name,
        description: editingAgent.description ?? "",
        model: editingAgent.model ?? "sonnet",
        tools: editingAgent.tools ?? [],
        body: editingAgent.body ?? "",
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
  }, [isEdit, editingAgent]);

  const handleClose = useCallback((): void => {
    setVisible(false);
    // Wait for slide-out animation to complete before unmounting
    setTimeout(() => {
      closeDrawer();
    }, 300);
  }, [closeDrawer]);

  const handleOverlayClick = useCallback((): void => {
    handleClose();
  }, [handleClose]);

  const handleToggleTool = (tool: string): void => {
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.includes(tool)
        ? prev.tools.filter((t) => t !== tool)
        : [...prev.tools, tool],
    }));
  };

  const handleSave = async (): Promise<void> => {
    const name = form.name.trim();
    if (!name) return;

    const formData = {
      name,
      description: form.description,
      model: form.model,
      tools: form.tools,
      body: form.body,
    };

    setSaving(true);
    try {
      if (isEdit) {
        await updateAgent(name, formData);
      } else {
        await createAgent(name, formData);
      }
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* ─── Overlay backdrop ────────────────────────────────── */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleOverlayClick}
      />

      {/* ─── Drawer panel ────────────────────────────────────── */}
      <div
        className={`relative w-[600px] max-w-full h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col transform transition-transform duration-300 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* ─── Header ──────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit ? t("office.drawer.editAgent") : t("office.drawer.createAgent")}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Form body (scrollable) ──────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("office.drawer.agentName")}
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isEdit}
              placeholder={t("office.drawer.namePlaceholder")}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("office.drawer.agentDescription")}
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("office.drawer.descriptionPlaceholder")}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("office.drawer.agentModel")}
            </label>
            <select
              value={form.model}
              onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              {AVAILABLE_MODELS.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Tools */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("office.drawer.agentTools")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TOOLS.map((tool) => {
                const isChecked = form.tools.includes(tool);
                return (
                  <label
                    key={tool}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                      isChecked
                        ? "bg-blue-500/10 border-blue-500/40 text-zinc-900 dark:text-zinc-100"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-blue-500/20"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleTool(tool)}
                      className="rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span>{tool}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* System Prompt (body) */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("office.drawer.agentBody")}
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              placeholder={t("office.drawer.bodyPlaceholder")}
              rows={20}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 font-mono min-h-[400px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* ─── Footer ──────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            {t("office.drawer.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white dark:text-zinc-900 bg-zinc-900 dark:bg-zinc-100 rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {t("office.drawer.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
