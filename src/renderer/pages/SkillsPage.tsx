import { useEffect, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Folder,
  FileText,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useSkillStore } from "../stores/skillStore";
import { useFileWatcher } from "../hooks/useFileWatcher";
import { PageHeader } from "../components/shared/PageHeader";
import { useTranslation } from "../i18n/LanguageContext";
import type { Skill } from "@shared/types/skill";

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

function SkillCard({
  skill,
  shadowed = false,
}: {
  skill: Skill;
  shadowed?: boolean;
}): JSX.Element {
  const { t } = useTranslation();
  const linkPath = `/skills/${skill.source}/${skill.name}`;

  return (
    <Link
      to={linkPath}
      className={`block bg-white dark:bg-zinc-900 rounded-xl border p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors ${
        shadowed
          ? "border-orange-300 dark:border-orange-700"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {shadowed && (
            <AlertTriangle
              className="w-4 h-4 text-orange-500 shrink-0"
              title="This skill is shadowed by your personal skill"
            />
          )}
          <h3 className="font-semibold text-sm">{skill.name}</h3>
        </div>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            skill.source === "personal"
              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {skill.source === "personal"
            ? t("common.personal")
            : skill.pluginId?.split("@")[0] || t("common.plugin")}
        </span>
      </div>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
        {skill.description}
      </p>
      <div className="flex items-center gap-2">
        {skill.hasReference && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            reference/
          </span>
        )}
        {skill.hasTemplates && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            templates/
          </span>
        )}
      </div>
    </Link>
  );
}

// TreeNode component for directory tree view
function TreeNode({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (node: FileNode) => void;
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren =
    node.isDirectory && node.children && node.children.length > 0;
  const isSelected = selectedPath === node.path;

  const handleClick = () => {
    if (node.isDirectory) {
      setExpanded(!expanded);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded cursor-pointer ${
          isSelected
            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.isDirectory ? (
          <>
            {expanded ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
            <Folder className="w-4 h-4 text-zinc-400" />
          </>
        ) : (
          <>
            <span className="w-4" />
            <FileText className="w-4 h-4 text-zinc-400" />
          </>
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function SkillsPage(): JSX.Element {
  const {
    personal,
    plugin,
    loading,
    fetch,
    getShadowedSkills,
    directoryTree,
    fetchDirectoryTree,
    readFileContent,
  } = useSkillStore();
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"cards" | "tree">("cards");
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);
  useEffect(() => {
    if (viewMode === "tree") {
      fetchDirectoryTree();
    }
  }, [viewMode, fetchDirectoryTree]);
  useFileWatcher(useCallback(() => fetch(), [fetch]));

  const filterSkills = (skills: Skill[]): Skill[] =>
    skills.filter((s) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q)
      );
    });

  const shadowedNames = new Set(getShadowedSkills().map((s) => s.name));

  const handleFileSelect = useCallback(
    async (node: FileNode) => {
      setSelectedFile(node);
      if (!node.isDirectory) {
        setLoadingContent(true);
        try {
          const content = await readFileContent(node.path);
          setFileContent(content);
        } catch {
          setFileContent(null);
        } finally {
          setLoadingContent(false);
        }
      }
    },
    [readFileContent],
  );

  const isMarkdown = selectedFile?.name.endsWith(".md");

  return (
    <div>
      <PageHeader
        title={t("skills.title")}
        description={t("skills.description", {
          personal: String(personal.length),
          plugin: String(plugin.length),
        })}
        actions={
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === "cards"
                    ? "bg-white dark:bg-zinc-700 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {t("skills.cards")}
              </button>
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === "tree"
                    ? "bg-white dark:bg-zinc-700 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {t("skills.tree")}
              </button>
            </div>
            <Link
              to="/skills/new"
              className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90"
            >
              {t("skills.newSkill")}
            </Link>
          </div>
        }
      />

      {/* Search */}
      {viewMode === "cards" && (
        <div className="relative w-full max-w-sm mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={t("skills.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-zinc-400">
          {t("common.loading")}
        </div>
      ) : viewMode === "cards" ? (
        <>
          {/* Cards View */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">
              {t("skills.personalSkills")}
            </h2>
            {filterSkills(personal).length === 0 ? (
              <p className="text-sm text-zinc-400">
                {t("skills.noPersonalSkills")}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSkills(personal).map((skill) => (
                  <SkillCard key={skill.name} skill={skill} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              {t("skills.pluginSkills")}
            </h2>
            {filterSkills(plugin).length === 0 ? (
              <p className="text-sm text-zinc-400">
                {t("skills.noPluginSkills")}
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filterSkills(plugin).map((skill) => (
                  <SkillCard
                    key={`${skill.pluginId}-${skill.name}`}
                    skill={skill}
                    shadowed={shadowedNames.has(skill.name)}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* Tree View */}
          <div className="grid grid-cols-2 gap-4">
            {/* Directory Tree Panel */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 overflow-auto max-h-[calc(100vh-250px)]">
              <h2 className="text-sm font-semibold mb-3">
                {t("skills.personalSkills")}
              </h2>
              {directoryTree.personal.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  {t("skills.noPersonalSkills")}
                </p>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
                  {directoryTree.personal.map((node) => (
                    <TreeNode
                      key={node.path}
                      node={node}
                      depth={0}
                      selectedPath={selectedFile?.path || null}
                      onSelect={handleFileSelect}
                    />
                  ))}
                </div>
              )}

              {directoryTree.plugin.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold mb-3 mt-6">
                    {t("skills.pluginSkills")}
                  </h2>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-2">
                    {directoryTree.plugin.map((node) => (
                      <TreeNode
                        key={node.path}
                        node={node}
                        depth={0}
                        selectedPath={selectedFile?.path || null}
                        onSelect={handleFileSelect}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* File Preview Panel */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 overflow-auto max-h-[calc(100vh-250px)]">
              {!selectedFile ? (
                <div className="h-full flex items-center justify-center text-zinc-400">
                  <p>{t("skills.selectFile")}</p>
                </div>
              ) : loadingContent ? (
                <div className="h-full flex items-center justify-center text-zinc-400">
                  <p>{t("common.loading")}</p>
                </div>
              ) : !fileContent ? (
                <div className="h-full flex items-center justify-center text-zinc-400">
                  <p>{t("skills.unableToLoad")}</p>
                </div>
              ) : isMarkdown ? (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {fileContent}
                  </ReactMarkdown>
                </div>
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm">
                  {fileContent}
                </pre>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
