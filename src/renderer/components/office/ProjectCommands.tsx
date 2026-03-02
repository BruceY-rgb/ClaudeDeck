import { useState, useCallback } from "react";
import { Plus, TerminalSquare, Edit2, Trash2, X, Save } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import type {
  ProjectCommand,
  ProjectCommandFormData,
} from "@shared/types/project-config";

interface CommandFormState {
  name: string;
  description: string;
  body: string;
}

const emptyForm: CommandFormState = {
  name: "",
  description: "",
  body: "",
};

export function ProjectCommands(): JSX.Element {
  const { t } = useTranslation();
  const commands = useProjectConfigStore((s) => s.commands);
  const loading = useProjectConfigStore((s) => s.loading.commands);
  const createCommand = useProjectConfigStore((s) => s.createCommand);
  const updateCommand = useProjectConfigStore((s) => s.updateCommand);
  const deleteCommand = useProjectConfigStore((s) => s.deleteCommand);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingName, setEditingName] = useState<string | null>(null);
  const [form, setForm] = useState<CommandFormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const openCreateModal = useCallback(() => {
    setForm(emptyForm);
    setEditingName(null);
    setModalMode("create");
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((cmd: ProjectCommand) => {
    setForm({
      name: cmd.name,
      description: cmd.description,
      body: cmd.body,
    });
    setEditingName(cmd.name);
    setModalMode("edit");
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingName(null);
    setForm(emptyForm);
  }, []);

  const handleFormChange = useCallback(
    (field: keyof CommandFormState, value: string) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    if (!form.name.trim() || !form.body.trim()) return;
    setSaving(true);
    try {
      const data: ProjectCommandFormData = {
        name: form.name.trim(),
        description: form.description.trim(),
        body: form.body,
      };
      if (modalMode === "create") {
        await createCommand(form.name.trim(), data);
      } else if (editingName) {
        await updateCommand(editingName, data);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  }, [form, modalMode, editingName, createCommand, updateCommand, closeModal]);

  const handleDelete = useCallback(
    async (name: string) => {
      const confirmed = confirm(
        t("office.projectCommands.deleteConfirm", { name }),
      );
      if (!confirmed) return;
      await deleteCommand(name);
    },
    [deleteCommand, t],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t("office.projectCommands.title")}
        </h2>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4" />
          {t("office.projectCommands.create")}
        </button>
      </div>

      {/* Empty state */}
      {commands.length === 0 && !modalOpen ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <TerminalSquare className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-base font-medium">
            {t("office.projectCommands.empty")}
          </p>
          <p className="text-sm mt-1">
            {t("office.projectCommands.emptyHint")}
          </p>
        </div>
      ) : (
        /* Command cards grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {commands.map((cmd) => (
            <div
              key={cmd.name}
              className="bg-card border border-border rounded-lg p-4 flex flex-col"
            >
              {/* Command name */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-foreground truncate">
                  <span className="text-primary">/ </span>
                  {cmd.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    className="p-1 hover:bg-accent rounded-md text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => openEditModal(cmd)}
                    title={t("office.projectCommands.editCommand")}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                    onClick={() => handleDelete(cmd.name)}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {cmd.description && (
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                  {cmd.description}
                </p>
              )}

              {/* Body preview */}
              <div className="mt-auto pt-2 border-t border-border">
                <pre className="text-xs text-muted-foreground font-mono line-clamp-2 whitespace-pre-wrap break-all">
                  {cmd.body}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-background rounded-lg shadow-lg w-full max-w-lg mx-4 p-6">
            {/* Modal header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {modalMode === "create"
                  ? t("office.projectCommands.addCommand")
                  : t("office.projectCommands.editCommand")}
              </h3>
              <button
                className="p-1 hover:bg-card rounded-md text-muted-foreground hover:text-foreground transition-colors"
                onClick={closeModal}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("office.projectCommands.commandName")}
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground text-sm">/</span>
                  <input
                    type="text"
                    className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                    placeholder={t(
                      "office.projectCommands.namePlaceholder",
                    )}
                    value={form.name}
                    onChange={(e) => handleFormChange("name", e.target.value)}
                    disabled={modalMode === "edit"}
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("office.projectCommands.commandDescription")}
                </label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                  placeholder={t(
                    "office.projectCommands.descPlaceholder",
                  )}
                  value={form.description}
                  onChange={(e) =>
                    handleFormChange("description", e.target.value)
                  }
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  {t("office.projectCommands.commandBody")}
                </label>
                <textarea
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50 resize-y"
                  style={{ minHeight: "200px" }}
                  placeholder={t(
                    "office.projectCommands.bodyPlaceholder",
                  )}
                  value={form.body}
                  onChange={(e) => handleFormChange("body", e.target.value)}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                className="px-4 py-1.5 text-sm rounded-md border border-border hover:bg-accent transition-colors"
                onClick={closeModal}
              >
                <X className="w-4 h-4 inline-block mr-1" />
                {t("office.copyModal.close")}
              </button>
              <button
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSave}
                disabled={!form.name.trim() || !form.body.trim() || saving}
              >
                <Save className="w-4 h-4" />
                {modalMode === "create"
                  ? t("office.projectCommands.create")
                  : t("office.projectHooks.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
