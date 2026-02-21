import { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Folder, FileText, ChevronRight, ChevronDown } from "lucide-react";
import { useSkillStore } from "../stores/skillStore";
import { PageHeader } from "../components/shared/PageHeader";
import { useTranslation } from "../i18n/LanguageContext";

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (node: FileNode) => void;
}

function TreeNode({ node, depth, selectedPath, onSelect }: TreeNodeProps) {
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

export function SkillsTreePage(): JSX.Element {
  const { t } = useTranslation();
  const { directoryTree, fetchDirectoryTree, readFileContent } =
    useSkillStore();
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);

  useEffect(() => {
    fetchDirectoryTree();
  }, [fetchDirectoryTree]);

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
    <div className="h-full flex flex-col">
      <PageHeader
        title={`${t("skills.title")} - ${t("skills.tree")}`}
        description={t("skills.description", { personal: "", plugin: "" })}
        backTo={{ label: t("skills.backToSkills"), path: "/skills" }}
      />

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
        {/* Directory Tree Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 overflow-auto">
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
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 overflow-auto">
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
    </div>
  );
}
