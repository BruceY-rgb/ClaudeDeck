import { useState, useEffect, useCallback } from "react";
import { X, Save } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import type { ProjectCommand, ProjectCommandFormData } from "@shared/types/project-config";

interface CommandFormState {
  name: string;
  description: string;
  body: string;
}

const EMPTY_FORM: CommandFormState = {
  name: "",
  description: "",
  body: "",
};

export function ProjectCommandDrawer(): JSX.Element {
  const { t } = useTranslation();

  const drawerMode = useProjectConfigStore((s) => s.drawerMode);
  const editingItem = useProjectConfigStore((s) => s.editingItem);
  const closeDrawer = useProjectConfigStore((s) => s.closeDrawer);
  const createCommand = useProjectConfigStore((s) => s.createCommand);
  const updateCommand = useProjectConfigStore((s) => s.updateCommand);

  const isEdit = drawerMode === "edit";
  const editingCommand = editingItem as ProjectCommand | null;

  const [form, setForm] = useState<CommandFormState>({ ...EMPTY_FORM });
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  // Animate in on mount
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (isEdit && editingCommand) {
      setForm({
        name: editingCommand.name,
        description: editingCommand.description ?? "",
        body: editingCommand.body,
      });
    } else {
      setForm({ ...EMPTY_FORM });
    }
  }, [isEdit, editingCommand]);

  const handleClose = useCallback((): void => {
    setVisible(false);
    setTimeout(() => {
      closeDrawer();
    }, 300);
  }, [closeDrawer]);

  const handleOverlayClick = useCallback((): void => {
    handleClose();
  }, [handleClose]);

  const handleSave = async (): Promise<void> => {
    const name = form.name.trim();
    if (!name || !form.body.trim()) return;

    const formData: ProjectCommandFormData = {
      name,
      description: form.description.trim(),
      body: form.body,
    };

    setSaving(true);
    try {
      if (isEdit && editingCommand) {
        await updateCommand(editingCommand.name, formData);
      } else {
        await createCommand(name, formData);
      }
      handleClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay backdrop */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleOverlayClick}
      />

      {/* Drawer panel */}
      <div
        className={`relative w-[600px] max-w-full h-full bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col transform transition-transform duration-300 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {isEdit
              ? t("office.projectCommands.editCommand")
              : t("office.projectCommands.addCommand")}
          </h2>
          <button
            onClick={handleClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("office.projectCommands.commandName")}
            </label>
            <div className="flex items-center gap-1">
              <span className="text-zinc-400 text-sm">/</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                disabled={isEdit}
                placeholder={t("office.projectCommands.namePlaceholder")}
                className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("office.projectCommands.commandDescription")}
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder={t("office.projectCommands.descPlaceholder")}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {t("office.projectCommands.commandBody")}
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((prev) => ({ ...prev, body: e.target.value }))}
              placeholder={t("office.projectCommands.bodyPlaceholder")}
              rows={20}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 font-mono placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-y min-h-[400px]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
          >
            {t("office.drawer.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || !form.body.trim() || saving}
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
