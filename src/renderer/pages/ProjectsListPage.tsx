import { useEffect, useState } from "react";
import { ProjectCard, type ProjectInfo } from "../components/office/ProjectCard";
import { FolderOpen, Trash2 } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export function ProjectsListPage(): JSX.Element {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.electronAPI.office.getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("office.loadProjectsFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectDir: string): Promise<void> => {
    const result = await window.electronAPI.office.deleteProject(projectDir);
    if (result.success) {
      setProjects((prev) => prev.filter((p) => p.projectDir !== projectDir));
      alert(t("office.deleted", { count: result.deletedCount || 0 }));
    } else {
      alert(t("office.deleteFailed", { error: result.error }));
    }
  };

  const toggleSelect = (projectDir: string): void => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(projectDir)) next.delete(projectDir);
      else next.add(projectDir);
      return next;
    });
  };

  const toggleSelectAll = (): void => {
    if (selected.size === projects.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(projects.map((p) => p.projectDir)));
    }
  };

  const handleBatchDelete = async (): Promise<void> => {
    if (selected.size === 0) return;
    const confirmed = confirm(
      t("office.batchDeleteProjectsConfirm", { count: String(selected.size) }),
    );
    if (!confirmed) return;
    let totalDeleted = 0;
    const errors: string[] = [];
    for (const projectDir of selected) {
      const result = await window.electronAPI.office.deleteProject(projectDir);
      if (result.success) {
        totalDeleted += result.deletedCount || 0;
      } else {
        errors.push(result.error || projectDir);
      }
    }
    setProjects((prev) => prev.filter((p) => !selected.has(p.projectDir)));
    setSelected(new Set());
    setBatchMode(false);
    if (errors.length > 0) {
      alert(t("office.deleteFailed", { error: errors.join(", ") }));
    } else {
      alert(t("office.deleted", { count: totalDeleted }));
    }
  };

  const exitBatchMode = (): void => {
    setBatchMode(false);
    setSelected(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-red-500">{error}</div>
        <button
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          onClick={loadProjects}
        >
          {t("office.retry")}
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <FolderOpen className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">{t("office.noProjects")}</h2>
        <p className="text-muted-foreground">
          {t("office.noProjectsHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("office.projects")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("office.projectsDescription")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {batchMode ? (
            <>
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {t("plans.selectAll")}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("office.deleteSelected", { count: String(selected.size) })}
                </button>
              )}
              <button
                onClick={exitBatchMode}
                className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                {t("common.cancel")}
              </button>
            </>
          ) : (
            <button
              onClick={() => setBatchMode(true)}
              className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              {t("plans.batchDelete")}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.projectDir}
            project={project}
            onDelete={handleDeleteProject}
            batchMode={batchMode}
            selected={selected.has(project.projectDir)}
            onToggleSelect={toggleSelect}
          />
        ))}
      </div>
    </div>
  );
}
