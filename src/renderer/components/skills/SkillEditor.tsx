import { useState } from "react";
import Editor from "@monaco-editor/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../../hooks/useTheme";
import { useAppPreferences } from "../../hooks/useAppPreferences";
import { useTranslation } from "../../i18n/LanguageContext";
import type { SkillFormData } from "../stores/skillStore";

interface SkillEditorProps {
  initialData?: SkillFormData;
  onSave: (data: SkillFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function SkillEditor({
  initialData,
  onSave,
  onCancel,
  saving,
}: SkillEditorProps) {
  const { resolvedTheme } = useTheme();
  const { editorFontSize } = useAppPreferences();
  const { t } = useTranslation();
  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs";
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(
    initialData?.description || "",
  );
  const [userInvocable, setUserInvocable] = useState(
    initialData?.userInvocable ?? true,
  );
  const [disableModelInvocation, setDisableModelInvocation] = useState(
    initialData?.disableModelInvocation ?? false,
  );
  const [body, setBody] = useState(initialData?.body || "");
  const [showPreview, setShowPreview] = useState(false);

  const handleSave = async () => {
    await onSave({
      name,
      description,
      userInvocable,
      disableModelInvocation,
      body,
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Metadata Form */}
      <div className="flex-shrink-0 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              {t("agents.fields.name")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="my-skill"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              {t("agents.fields.description")}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Use when..."
            />
          </div>
        </div>

        <div className="flex items-center gap-6 mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={userInvocable}
              onChange={(e) => setUserInvocable(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
            />
            <span className="text-sm">{t("skills.userInvocable")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={disableModelInvocation}
              onChange={(e) => setDisableModelInvocation(e.target.checked)}
              className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
            />
            <span className="text-sm">
              {t("skills.disableModelInvocation")}
            </span>
          </label>
        </div>
      </div>

      {/* Editor / Preview Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(false)}
            className={`px-3 py-1 text-sm rounded-lg ${
              !showPreview
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t("common.edit")}
          </button>
          <button
            onClick={() => setShowPreview(true)}
            className={`px-3 py-1 text-sm rounded-lg ${
              showPreview
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            {t("common.preview")}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>

      {/* Editor / Preview Content */}
      <div className="flex-1 min-h-[300px] rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {showPreview ? (
          <div className="h-full p-6 overflow-auto bg-white dark:bg-zinc-900 prose dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
          </div>
        ) : (
          <Editor
            height="100%"
            defaultLanguage="markdown"
            value={body}
            onChange={(value) => setBody(value || "")}
            theme={monacoTheme}
            options={{
              minimap: { enabled: false },
              fontSize: editorFontSize,
              lineNumbers: "off",
              wordWrap: "on",
              padding: { top: 16 },
            }}
          />
        )}
      </div>
    </div>
  );
}
