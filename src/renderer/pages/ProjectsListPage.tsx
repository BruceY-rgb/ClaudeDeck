import { useEffect, useState } from "react";
import { ProjectCard, type ProjectInfo } from "../components/office/ProjectCard";
import { FolderOpen } from "lucide-react";

export function ProjectsListPage(): JSX.Element {
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
      setError(err instanceof Error ? err.message : "加载项目失败");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectDir: string): Promise<void> => {
    const result = await window.electronAPI.office.deleteProject(projectDir);
    if (result.success) {
      setProjects((prev) => prev.filter((p) => p.projectDir !== projectDir));
      alert(`已删除 ${result.deletedCount || 0} 个会话`);
    } else {
      alert(`删除失败: ${result.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">加载中...</div>
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
          重试
        </button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <FolderOpen className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">暂无项目</h2>
        <p className="text-muted-foreground">
          在 Claude Code 中创建会话后将会显示在这里
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">项目</h1>
        <p className="text-muted-foreground mt-1">
          显示所有 Claude Code 活跃进程所在的文件夹
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
