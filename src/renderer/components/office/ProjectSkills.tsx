import { useState, useMemo } from "react";
import {
  Plus,
  Copy,
  Sparkles,
  Edit2,
  Trash2,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import { ProjectSkillDrawer } from "./ProjectSkillDrawer";
import type { ProjectSkill } from "@shared/types/project-config";

function SkillCard({
  skill,
  onEdit,
  onDelete,
}: {
  skill: ProjectSkill;
  onEdit: (skill: ProjectSkill) => void;
  onDelete: (name: string) => void;
}): JSX.Element {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm truncate">{skill.name}</h3>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
            onClick={() => onEdit(skill)}
            title={t("common.edit")}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md text-zinc-400 hover:text-red-500 transition-colors"
            onClick={() => onDelete(skill.name)}
            title={t("common.delete")}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3 min-h-[2rem]">
        {skill.description || "\u00A0"}
      </p>

      {/* Badges */}
      <div className="flex flex-wrap items-center gap-1.5">
        {skill.userInvocable ? (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <Eye className="w-3 h-3" />
            User Invocable
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500">
            <EyeOff className="w-3 h-3" />
            Not Invocable
          </span>
        )}
        {skill.hasReference && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            Has Reference
          </span>
        )}
        {skill.hasTemplates && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            Has Templates
          </span>
        )}
      </div>
    </div>
  );
}

export function ProjectSkills(): JSX.Element {
  const { t } = useTranslation();
  const skills = useProjectConfigStore((s) => s.skills);
  const loading = useProjectConfigStore((s) => s.loading.skills);
  const drawerOpen = useProjectConfigStore((s) => s.drawerOpen);
  const drawerType = useProjectConfigStore((s) => s.drawerType);
  const openDrawer = useProjectConfigStore((s) => s.openDrawer);
  const openCopyModal = useProjectConfigStore((s) => s.openCopyModal);
  const deleteSkill = useProjectConfigStore((s) => s.deleteSkill);

  const [search, setSearch] = useState("");

  const filteredSkills = useMemo(() => {
    if (!search) return skills;
    const q = search.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q),
    );
  }, [skills, search]);

  const handleEdit = (skill: ProjectSkill): void => {
    openDrawer("skill", "edit", skill);
  };

  const handleDelete = (name: string): void => {
    if (confirm(t("office.projectSkills.deleteConfirm", { name }))) {
      deleteSkill(name);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-zinc-300 dark:border-zinc-600 border-t-zinc-600 dark:border-t-zinc-300 rounded-full animate-spin" />
          <span>{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header: Title + Actions */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold">
          {t("office.projectSkills.title")}
        </h2>
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => openCopyModal("skill")}
          >
            <Copy className="w-4 h-4" />
            {t("office.projectSkills.copyFromGlobal")}
          </button>
          <button
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 transition-opacity"
            onClick={() => openDrawer("skill", "create")}
          >
            <Plus className="w-4 h-4" />
            {t("office.projectSkills.create")}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-sm mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder={t("office.projectSkills.searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Content */}
      {filteredSkills.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-4" />
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            {t("office.projectSkills.empty")}
          </p>
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {t("office.projectSkills.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <SkillCard
              key={skill.name}
              skill={skill}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Drawer */}
      {drawerOpen && drawerType === "skill" && <ProjectSkillDrawer />}
    </div>
  );
}
