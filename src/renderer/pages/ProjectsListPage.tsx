import { useEffect, useState } from "react";
import { ProjectCard, type ProjectInfo } from "../components/office/ProjectCard";
import { FolderOpen } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

export function ProjectsListPage(): JSX.Element {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t("office.projects")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("office.projectsDescription")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.projectDir} project={project} onDelete={handleDeleteProject} />
        ))}
      </div>
    </div>
  );
}
