import { useNavigate } from "react-router-dom";
import { Trash2, Bot, Sparkles, Server } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import type { ProviderId } from "@shared/types/provider";
import { ProviderBadge } from "../shared/ProviderBadge";

export interface ProjectInfo {
  provider: ProviderId;
  projectDir: string;
  projectName: string;
  agentCount: number;
  activeCount: number;
  lastActivity: string;
  configSummary?: {
    agents: number;
    skills: number;
    mcp: number;
  };
}

interface ProjectCardProps {
  project: ProjectInfo;
  onDelete: (projectDir: string) => void;
  batchMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (projectDir: string) => void;
}

export function ProjectCard({ project, onDelete, batchMode = false, selected = false, onToggleSelect }: ProjectCardProps): JSX.Element {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t("office.justNow");
    if (diffMins < 60) return t("office.minutesAgo", { count: diffMins });
    if (diffHours < 24) return t("office.hoursAgo", { count: diffHours });
    return t("office.daysAgo", { count: diffDays });
  };

  const handleClick = (): void => {
    if (batchMode) {
      onToggleSelect?.(project.projectDir);
      return;
    }
    navigate(`/office/project/${encodeURIComponent(project.projectDir)}`);
  };

  const handleDelete = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if (confirm(t("office.deleteConfirm", { name: project.projectName }))) {
      onDelete(project.projectDir);
    }
  };

  return (
    <div
      className={`rounded-[26px] border bg-[var(--panel)] p-5 shadow-[var(--panel-shadow)] cursor-pointer transition ${
        batchMode && selected
          ? "border-sky-400 ring-2 ring-sky-400/20"
          : "border-[var(--border-soft)] hover:border-[var(--border-strong)]"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {batchMode && (
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect?.(project.projectDir)}
              onClick={(e) => e.stopPropagation()}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
          <div className="mb-2">
            <ProviderBadge providerId={project.provider} compact />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-strong)] truncate">
            {project.projectName}
          </h3>
          <p className="text-sm text-[var(--text-muted)] truncate mt-1">
            {project.projectDir}
          </p>
        </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          {!batchMode && (
            <button
            className="p-1.5 hover:bg-red-500/10 rounded-md text-[var(--text-muted)] hover:text-red-500"
            onClick={handleDelete}
            title={t("office.deleteAllSessions")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
          )}
          {project.activeCount > 0 ? (
            <span className="flex items-center gap-1 text-sm text-green-500">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {project.activeCount}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm text-zinc-400">
              <span className="w-2 h-2 bg-zinc-400/50 rounded-full" />
              {project.activeCount}
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-[var(--text-muted)]">
          {project.agentCount === 1 ? t("office.sessions", { count: project.agentCount }) : t("office.sessionsPlural", { count: project.agentCount })}
        </span>
        <span className="text-[var(--text-muted)]">
          {formatTime(project.lastActivity)}
        </span>
      </div>
      {project.configSummary && (project.configSummary.agents > 0 || project.configSummary.skills > 0 || project.configSummary.mcp > 0) && (
        <div className="mt-3 pt-3 border-t border-[var(--border-soft)] flex items-center gap-3 text-xs text-[var(--text-muted)]">
          {project.configSummary.agents > 0 && (
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3" />
              {project.configSummary.agents}
            </span>
          )}
          {project.configSummary.skills > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {project.configSummary.skills}
            </span>
          )}
          {project.configSummary.mcp > 0 && (
            <span className="flex items-center gap-1">
              <Server className="w-3 h-3" />
              {project.configSummary.mcp}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
