import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import type { ProjectSkill } from "@shared/types/project-config";

export function ProjectSkillDrawer(): JSX.Element {
  const { t } = useTranslation();
  const drawerMode = useProjectConfigStore((s) => s.drawerMode);
  const editingItem = useProjectConfigStore((s) => s.editingItem) as ProjectSkill | null;
  const closeDrawer = useProjectConfigStore((s) => s.closeDrawer);
  const createSkill = useProjectConfigStore((s) => s.createSkill);
  const updateSkill = useProjectConfigStore((s) => s.updateSkill);

  const isEdit = drawerMode === "edit" && editingItem != null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [userInvocable, setUserInvocable] = useState(true);
  const [disableModelInvocation, setDisableModelInvocation] = useState(false);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (isEdit && editingItem) {
      setName(editingItem.name);
      setDescription(editingItem.description || "");
      setUserInvocable(editingItem.userInvocable ?? true);
      setDisableModelInvocation(editingItem.disableModelInvocation ?? false);
      setBody(editingItem.body || "");
    } else {
      setName("");
      setDescription("");
      setUserInvocable(true);
      setDisableModelInvocation(false);
      setBody("");
    }
  }, [isEdit, editingItem]);

  // Slide-in animation
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(() => closeDrawer(), 200);
  }, [closeDrawer]);

  const handleSave = async (): Promise<void> => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setSaving(true);
    try {
      const data = {
        name: trimmedName,
        description,
        userInvocable,
        disableModelInvocation,
        body,
      };

      if (isEdit) {
        await updateSkill(trimmedName, data);
      } else {
        await createSkill(trimmedName, data);
      }
      handleClose();
    } catch {
      // Error handling can be enhanced with toast notifications
    } finally {
      setSaving(false);
    }
  };

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-200 ${
          visible ? "opacity-50" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      {/* Drawer panel */}
      <div
        className={`relative w-[600px] max-w-full h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-lg font-semibold">
            {isEdit
              ? t("office.drawer.editSkill")
              : t("office.drawer.createSkill")}
          </h2>
          <button
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              {t("office.drawer.skillName")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit}
              placeholder={t("office.drawer.skillNamePlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              {t("office.drawer.skillDescription")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("office.drawer.skillDescPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={userInvocable}
                onChange={(e) => setUserInvocable(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm">{t("office.drawer.skillUserInvocable")}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={disableModelInvocation}
                onChange={(e) => setDisableModelInvocation(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-sm">{t("office.drawer.skillDisableModel")}</span>
            </label>
          </div>

          {/* Body (Skill Content) */}
          <div className="flex flex-col flex-1">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              {t("office.drawer.skillBody")}
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("office.drawer.skillBodyPlaceholder")}
              className="w-full px-3 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              style={{ minHeight: "300px" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
