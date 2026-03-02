import { useCallback } from "react";
import { Plus, TerminalSquare, Edit2, Trash2 } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import { ProjectCommandDrawer } from "./ProjectCommandDrawer";
import type { ProjectCommand } from "@shared/types/project-config";

export function ProjectCommands(): JSX.Element {
  const { t } = useTranslation();
  const commands = useProjectConfigStore((s) => s.commands);
  const loading = useProjectConfigStore((s) => s.loading.commands);
  const createCommand = useProjectConfigStore((s) => s.createCommand);
  const updateCommand = useProjectConfigStore((s) => s.updateCommand);
  const deleteCommand = useProjectConfigStore((s) => s.deleteCommand);
  const drawerOpen = useProjectConfigStore((s) => s.drawerOpen);
  const drawerType = useProjectConfigStore((s) => s.drawerType);
  const openDrawer = useProjectConfigStore((s) => s.openDrawer);

  const openCreateModal = useCallback(() => {
    openDrawer("command", "create");
  }, [openDrawer]);

  const openEditModal = useCallback((cmd: ProjectCommand) => {
    openDrawer("command", "edit", cmd);
  }, [openDrawer]);

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
        <div className="text-zinc-400">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {t("office.projectCommands.title")}
        </h2>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90 transition-colors"
          onClick={openCreateModal}
        >
          <Plus className="w-4 h-4" />
          {t("office.projectCommands.create")}
        </button>
      </div>

      {/* Empty state */}
      {commands.length === 0 && !drawerOpen ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
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
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-lg hover:shadow-zinc-200/50 dark:hover:shadow-zinc-900/50 hover:-translate-y-0.5 cursor-pointer active:translate-y-0 active:shadow-md transition-all duration-200"
            >
              {/* Command name800 rounded-lg p */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                  <span className="text-blue-500">/ </span>
                  {cmd.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                  <button
                    className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    onClick={() => openEditModal(cmd)}
                    title={t("office.projectCommands.editCommand")}
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    className="p-1 hover:bg-red-500/10 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
                    onClick={() => handleDelete(cmd.name)}
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Description */}
              {cmd.description && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2 line-clamp-2">
                  {cmd.description}
                </p>
              )}

              {/* Body preview */}
              <div className="mt-auto pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <pre className="text-xs text-zinc-500 dark:text-zinc-400 font-mono line-clamp-2 whitespace-pre-wrap break-all">
                  {cmd.body}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && drawerType === "command" && <ProjectCommandDrawer />}
    </div>
  );
}
