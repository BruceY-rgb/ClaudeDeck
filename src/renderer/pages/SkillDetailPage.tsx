import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Editor from "@monaco-editor/react";
import { Edit3, Copy, Trash2, Terminal, ArrowLeft } from "lucide-react";
import { useSkillStore, type SkillFormData } from "../stores/skillStore";
import { PageHeader } from "../components/shared/PageHeader";
import { SkillEditor } from "../components/skills/SkillEditor";
import { SkillFileTree } from "../components/skills/SkillFileTree";
import { TerminalPanel } from "../components/shared/TerminalPanel";
import { useTheme } from "../hooks/useTheme";
import { useAppPreferences } from "../hooks/useAppPreferences";
import { useTranslation } from "../i18n/LanguageContext";
import type { Skill } from "@shared/types/skill";

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
}

export function SkillDetailPage(): JSX.Element {
  const { source, name } = useParams<{ source: string; name: string }>();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const { editorFontSize } = useAppPreferences();
  const { t } = useTranslation();
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs";
  const {
    fetch,
    updateSkill,
    deleteSkill,
    fetchDirectoryTree,
    directoryTree,
    readFileContent,
    writeFileContent,
  } = useSkillStore();

  const [skill, setSkill] = useState<Skill | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [referenceFiles, setReferenceFiles] = useState<FileNode[]>([]);
  const [templateFiles, setTemplateFiles] = useState<FileNode[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string | null>(
    null,
  );
  const [editingFile, setEditingFile] = useState(false);
  const [editingFileContent, setEditingFileContent] = useState("");

  const loadSkill = useCallback(async () => {
    if (!source || !name) return;
    setLoading(true);
    const data = await window.electronAPI.skills.read(source, name);
    setSkill(data);
    setLoading(false);
  }, [source, name]);

  useEffect(() => {
    fetch().then(loadSkill);
    fetchDirectoryTree();
  }, [fetch, loadSkill, fetchDirectoryTree]);

  // Extract reference/template files from directory tree when it changes
  useEffect(() => {
    if (!name || !source) return;
    const trees =
      source === "personal" ? directoryTree.personal : directoryTree.plugin;
    // Find the skill's directory node
    const findSkillNode = (nodes: FileNode[]): FileNode | undefined => {
      for (const node of nodes) {
        if (node.name === name && node.isDirectory) return node;
        if (node.children) {
          const found = findSkillNode(node.children);
          if (found) return found;
        }
      }
    };
    const skillNode = findSkillNode(trees);
    if (skillNode?.children) {
      const refNode = skillNode.children.find((c) => c.name === "reference");
      const tplNode = skillNode.children.find((c) => c.name === "templates");
      setReferenceFiles(refNode?.children || []);
      setTemplateFiles(tplNode?.children || []);
    } else {
      setReferenceFiles([]);
      setTemplateFiles([]);
    }
  }, [directoryTree, name, source]);

  const handleFileSelect = async (path: string) => {
    setEditingFile(false);
    setSelectedFilePath(path);
    const content = await readFileContent(path);
    setSelectedFileContent(content);
  };

  const handleBackToSkill = () => {
    setSelectedFilePath(null);
    setSelectedFileContent(null);
    setEditingFile(false);
  };

  const handleStartEditFile = () => {
    setEditingFileContent(selectedFileContent || "");
    setEditingFile(true);
  };

  const handleSaveFile = async () => {
    if (!selectedFilePath) return;
    setSaving(true);
    try {
      await writeFileContent(selectedFilePath, editingFileContent);
      setSelectedFileContent(editingFileContent);
      setEditingFile(false);
    } catch (error) {
      console.error("Failed to save file:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (data: SkillFormData) => {
    if (!name) return;
    setSaving(true);
    try {
      // Use the original name from URL to update the skill
      // Note: If user changes the name in editor, we keep the original file name
      const skillDirName = name;
      await updateSkill(skillDirName, data);
      setEditing(false);
      await loadSkill();
    } catch (error) {
      console.error("Failed to save skill:", error);
      alert("Failed to save skill");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!name) return;
    await deleteSkill(name);
    navigate("/skills");
  };

  const handleFork = async () => {
    if (!skill) return;
    // Fork plugin skill to personal - would need IPC handler
    alert("Fork functionality not yet implemented");
  };

  const handleTestSkill = async (prompt: string): Promise<void> => {
    if (!name) return;
    setIsRunning(true);
    try {
      await window.electronAPI.cli.testSkill(name, prompt);
    } catch (err) {
      console.error("Failed to test skill:", err);
    }
  };

  const handleKillTest = async (): Promise<void> => {
    await window.electronAPI.cli.kill();
    setIsRunning(false);
  };

  // Listen for CLI close event
  useEffect(() => {
    const unsubscribe = window.electronAPI.cli.onOutput((data) => {
      if (data.type === "close") {
        setIsRunning(false);
      }
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="text-center py-12 text-zinc-400">
        {t("common.loading")}
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400 mb-4">{t("skills.notFound")}</p>
        <button
          onClick={() => navigate("/skills")}
          className="text-blue-500 hover:underline"
        >
          {t("skills.backToSkills")}
        </button>
      </div>
    );
  }

  const isPersonal = skill.source === "personal";

  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title={skill.name}
        backTo={{ label: t("skills.backToSkills"), path: "/skills" }}
        description={
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isPersonal
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {isPersonal
                ? t("common.personal")
                : skill.pluginId?.split("@")[0] || t("common.plugin")}
            </span>
            {skill.description}
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {isPersonal && !editing && (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <Edit3 className="w-4 h-4" />
                  {t("common.edit")}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("common.delete")}
                </button>
              </>
            )}
            {!isPersonal && (
              <button
                onClick={handleFork}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90"
              >
                <Copy className="w-4 h-4" />
                {t("skills.forkToPersonal")}
              </button>
            )}
            {isPersonal && (
              <button
                onClick={() => setShowTerminal(!showTerminal)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  showTerminal
                    ? "bg-purple-600 text-white"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                <Terminal className="w-4 h-4" />
                {t("common.test")}
              </button>
            )}
          </div>
        }
      />

      {/* Metadata */}
      <div className="flex items-center gap-4 mb-4 text-sm">
        {skill.userInvocable !== undefined && (
          <span
            className={`px-2 py-0.5 rounded ${skill.userInvocable ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}
          >
            {skill.userInvocable
              ? t("skills.userInvocable")
              : t("skills.notUserInvocable")}
          </span>
        )}
        {skill.disableModelInvocation && (
          <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
            {t("skills.modelInvocationDisabled")}
          </span>
        )}
        {skill.hasReference && (
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            has reference/
          </span>
        )}
        {skill.hasTemplates && (
          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
            has templates/
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {editing ? (
          <div className="h-full">
            <SkillEditor
              key={skill.name}
              initialData={{
                name: skill.name,
                description: skill.description,
                userInvocable: skill.userInvocable,
                disableModelInvocation: skill.disableModelInvocation,
                body: skill.body,
              }}
              onSave={handleSave}
              onCancel={() => setEditing(false)}
              saving={saving}
            />
          </div>
        ) : (
          <div className="flex gap-4 h-full">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {selectedFilePath ? (
                <>
                  <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleBackToSkill}
                        className="text-zinc-400 hover:text-zinc-600"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-medium truncate">
                        {selectedFilePath.split("/").pop()}
                      </span>
                    </div>
                    {isPersonal && !editingFile && (
                      <button
                        onClick={handleStartEditFile}
                        className="flex items-center gap-1 px-3 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        <Edit3 className="w-3 h-3" /> {t("common.edit")}
                      </button>
                    )}
                    {editingFile && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingFile(false)}
                          className="px-3 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700"
                        >
                          {t("common.cancel")}
                        </button>
                        <button
                          onClick={handleSaveFile}
                          disabled={saving}
                          className="px-3 py-1 text-xs rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-50"
                        >
                          {saving ? t("common.saving") : t("common.save")}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-h-0 overflow-hidden">
                    {editingFile ? (
                      <Editor
                        height="100%"
                        defaultLanguage={
                          selectedFilePath.endsWith(".md")
                            ? "markdown"
                            : "plaintext"
                        }
                        value={editingFileContent}
                        onChange={(v) => setEditingFileContent(v || "")}
                        theme={monacoTheme}
                        options={{
                          minimap: { enabled: false },
                          fontSize: editorFontSize,
                          wordWrap: "on",
                          padding: { top: 16 },
                        }}
                      />
                    ) : (
                      <div className="h-full p-6 overflow-auto">
                        {selectedFilePath.endsWith(".md") ? (
                          <div className="prose dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {selectedFileContent || ""}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <pre className="text-sm whitespace-pre-wrap">
                            {selectedFileContent}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="h-full p-6 overflow-auto">
                  <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {skill.body}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar: File Tree */}
            <div className="w-64 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 overflow-auto">
              <SkillFileTree
                referenceFiles={referenceFiles}
                templateFiles={templateFiles}
                onFileSelect={handleFileSelect}
              />
              {referenceFiles.length === 0 && templateFiles.length === 0 && (
                <p className="text-xs text-zinc-400">
                  {t("skills.noRefOrTemplate")}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">
              {t("skills.deleteSkill")}
            </h3>
            <p className="text-zinc-500 mb-4">
              {t("skills.deleteConfirm", { name: skill.name })}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminal Panel for testing */}
      {showTerminal && isPersonal && (
        <div className="mt-4 h-[400px]">
          <TerminalPanel
            onRun={handleTestSkill}
            onKill={handleKillTest}
            isRunning={isRunning}
          />
        </div>
      )}
    </div>
  );
}
