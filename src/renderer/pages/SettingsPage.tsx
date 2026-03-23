import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Sun,
  Moon,
  Monitor,
  Type,
  Terminal,
  Settings2,
  Key,
  Code,
  type LucideIcon,
} from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { useTheme } from "../hooks/useTheme";
import { useAppPreferences } from "../hooks/useAppPreferences";
import { useTranslation, type Locale } from "../i18n/LanguageContext";
import { PageHeader } from "../components/shared/PageHeader";

interface SettingsSection {
  id: string;
  icon: LucideIcon;
  labelKey: string;
}

const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "appearance", icon: Sun, labelKey: "settings.appearance" },
  { id: "editor", icon: Type, labelKey: "settings.editor" },
  { id: "claudeCode", icon: Terminal, labelKey: "settings.claudeCode" },
  { id: "general", icon: Settings2, labelKey: "settings.general" },
  { id: "environment", icon: Key, labelKey: "settings.envVars" },
  { id: "json", icon: Code, labelKey: "settings.jsonMode" },
];

export function SettingsPage(): JSX.Element {
  const { settings, loading, fetch, save, setSettings } = useSettingsStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, setLocale, t } = useTranslation();
  const { editorFontSize, setEditorFontSize } = useAppPreferences();
  const [saving, setSaving] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [jsonContent, setJsonContent] = useState("");
  const [activeSection, setActiveSection] = useState("appearance");

  const isJsonMode = activeSection === "json";

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (settings) {
      setJsonContent(JSON.stringify(settings, null, 2));
    }
  }, [settings]);

  const handleSave = async (): Promise<void> => {
    if (!settings) return;
    setSaving(true);
    try {
      if (isJsonMode) {
        const parsed = JSON.parse(jsonContent);
        await save(parsed);
      } else {
        await save(settings);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert(t("settings.invalidJson"));
    } finally {
      setSaving(false);
    }
  };

  const addEnvVar = (): void => {
    if (!newKey.trim() || !settings) return;
    const newSettings = {
      ...settings,
      env: { ...settings.env, [newKey.trim()]: newValue },
    };
    setJsonContent(JSON.stringify(newSettings, null, 2));
    setSettings(newSettings);
    setNewKey("");
    setNewValue("");
  };

  const removeEnvVar = (key: string): void => {
    if (!settings) return;
    const { [key]: _, ...rest } = settings.env;
    const newSettings = { ...settings, env: rest };
    setJsonContent(JSON.stringify(newSettings, null, 2));
    setSettings(newSettings);
  };

  const maskValue = (key: string, value: string): string => {
    const sensitive = ["TOKEN", "KEY", "SECRET", "PASSWORD", "AUTH"];
    if (sensitive.some((s) => key.toUpperCase().includes(s))) {
      return value.slice(0, 8) + "****";
    }
    return value;
  };

  const monacoTheme = resolvedTheme === "dark" ? "vs-dark" : "vs";

  if (loading || !settings)
    return (
      <div className="text-center py-12 text-zinc-400">
        {t("common.loading")}
      </div>
    );

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
        actions={
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? t("common.saving") : t("settings.saveChanges")}
          </button>
        }
      />

      <div className="flex flex-1 min-h-0">
        {/* Left Navigation */}
        <nav className="w-48 shrink-0 border-r border-zinc-200 dark:border-zinc-800 pr-2">
          <ul className="space-y-0.5">
            {SETTINGS_SECTIONS.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium rounded-lg"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{t(section.labelKey)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === "appearance" && (
            <SectionCard title={t("settings.appearance")}>
              <div className="space-y-4">
                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("settings.theme")}
                  </label>
                  <div className="flex items-center gap-2">
                    {(
                      [
                        { value: "light", icon: Sun, label: t("theme.light") },
                        { value: "dark", icon: Moon, label: t("theme.dark") },
                        {
                          value: "system",
                          icon: Monitor,
                          label: t("theme.system"),
                        },
                      ] as const
                    ).map(({ value, icon: ThemeIcon, label }) => (
                      <button
                        key={value}
                        onClick={() => setTheme(value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                          theme === value
                            ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium"
                            : "border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                      >
                        <ThemeIcon size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Language */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("settings.language")}
                  </label>
                  <select
                    value={locale}
                    onChange={(e) => setLocale(e.target.value as Locale)}
                    className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">{t("settings.languageEn")}</option>
                    <option value="zh-CN">{t("settings.languageZh")}</option>
                  </select>
                </div>
              </div>
            </SectionCard>
          )}

          {activeSection === "editor" && (
            <SectionCard title={t("settings.editor")}>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t("settings.editorFontSize")}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={10}
                      max={24}
                      value={editorFontSize}
                      onChange={(e) =>
                        setEditorFontSize(Number(e.target.value))
                      }
                      className="w-48"
                    />
                    <span className="text-sm font-mono w-8 text-center">
                      {editorFontSize}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-400">
                  {t("settings.editorThemeNote")}
                </p>
              </div>
            </SectionCard>
          )}

          {activeSection === "claudeCode" && (
            <SectionCard title={t("settings.claudeCode")}>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t("settings.configDir")}
                </label>
                <code className="text-sm font-mono bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded">
                  ~/.claude
                </code>
              </div>
            </SectionCard>
          )}

          {activeSection === "general" && (
            <SectionCard title={t("settings.general")}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.alwaysThinkingEnabled ?? false}
                  onChange={(e) => {
                    const newSettings = {
                      ...settings,
                      alwaysThinkingEnabled: e.target.checked,
                    };
                    setSettings(newSettings);
                    setJsonContent(JSON.stringify(newSettings, null, 2));
                  }}
                  className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600"
                />
                <span className="text-sm">
                  {t("settings.alwaysThinking")}
                </span>
              </label>
            </SectionCard>
          )}

          {activeSection === "environment" && (
            <SectionCard title={t("settings.envVars")}>
              <div className="space-y-2 mb-4">
                {Object.entries(settings.env).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <code className="flex-shrink-0 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded w-72 truncate">
                      {key}
                    </code>
                    <code className="flex-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-1.5 rounded truncate text-zinc-500">
                      {maskValue(key, value)}
                    </code>
                    <button
                      onClick={() => removeEnvVar(key)}
                      className="text-xs text-red-500 hover:text-red-700 px-2"
                    >
                      {t("common.remove")}
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={t("settings.envKeyPlaceholder")}
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-48 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder={t("settings.envValuePlaceholder")}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={addEnvVar}
                  disabled={!newKey.trim()}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50"
                >
                  {t("common.add")}
                </button>
              </div>
            </SectionCard>
          )}

          {activeSection === "json" && (
            <div className="h-full rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonContent}
                onChange={(value) => setJsonContent(value || "")}
                theme={monacoTheme}
                options={{
                  minimap: { enabled: false },
                  fontSize: editorFontSize,
                  lineNumbers: "on",
                  padding: { top: 16 },
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}
