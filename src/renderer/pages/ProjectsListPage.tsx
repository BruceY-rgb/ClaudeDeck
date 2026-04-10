import { useEffect, useState } from "react";
import { FolderGit2 } from "lucide-react";
import { ProjectCard, type ProjectInfo } from "../components/office/ProjectCard";
import { useTranslation } from "../i18n/LanguageContext";
import { PageHeader } from "../components/shared/PageHeader";
import { EmptyState } from "../components/shared/EmptyState";
import { ProviderBadge } from "../components/shared/ProviderBadge";
import { useSettingsStore } from "../stores/settingsStore";

export function ProjectsListPage(): JSX.Element {
  const { t } = useTranslation();
  const { settings, fetch: fetchSettings } = useSettingsStore();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    void loadProjects();
  }, [settings?.activeProvider]);

  const loadProjects = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await window.electronAPI.office.getProjects(settings?.activeProvider);
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
    } else {
      alert(t("office.deleteFailed", { error: result.error || "unknown" }));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Projects"
        title="Session workspaces"
        badge={settings ? <ProviderBadge providerId={settings.activeProvider} /> : undefined}
        description="Browse recent workspaces discovered from the selected runtime. Session-first providers stay useful even when they do not expose full project configuration."
      />

      {loading ? (
        <div className="py-12 text-center text-[var(--text-muted)]">{t("common.loading")}</div>
      ) : error ? (
        <EmptyState
          icon={FolderGit2}
          title="Could not load projects"
          description={error}
          action={
            <button
              onClick={loadProjects}
              className="rounded-2xl bg-[var(--text-strong)] px-4 py-2 text-sm font-medium text-white"
            >
              Retry
            </button>
          }
        />
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No projects discovered"
          description="Open a repository with the selected provider and start a session. The workspace list will populate from the runtime’s session history."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={`${project.provider}-${project.projectDir}`} project={project} onDelete={handleDeleteProject} />
          ))}
        </div>
      )}
    </div>
  );
}
