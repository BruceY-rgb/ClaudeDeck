import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { Code, KeyRound, MonitorCog, SlidersHorizontal } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { useTheme } from "../hooks/useTheme";
import { useAppPreferences } from "../hooks/useAppPreferences";
import { useTranslation, type Locale } from "../i18n/LanguageContext";
import { PageHeader } from "../components/shared/PageHeader";
import { SectionPanel } from "../components/shared/SectionPanel";
import { ProviderBadge } from "../components/shared/ProviderBadge";
import { EmptyState } from "../components/shared/EmptyState";

export function SettingsPage(): JSX.Element {
  const { settings, providers, loading, fetch, save, setSettings } = useSettingsStore();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { locale, setLocale } = useTranslation();
  const { editorFontSize, setEditorFontSize } = useAppPreferences();
  const [jsonContent, setJsonContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (settings) {
      setJsonContent(JSON.stringify(settings, null, 2));
    }
  }, [settings]);

  if (loading || !settings) {
    return <div className="py-12 text-center text-[var(--text-muted)]">Loading settings…</div>;
  }

  const activeProvider = providers.find((provider) => provider.id === settings.activeProvider);

  const handleSave = async (): Promise<void> => {
    setSaving(true);
    try {
      await save(JSON.parse(jsonContent));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Preferences"
        title="Runtime settings"
        badge={<ProviderBadge providerId={settings.activeProvider} />}
        description="Tune the app shell and inspect the currently selected runtime. Provider-specific constraints stay visible here so the UI never feels misleading."
        actions={
          <button
            onClick={handleSave}
            className="rounded-2xl bg-[var(--text-strong)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.15fr,1fr]">
        <SectionPanel title="Application controls" description="Global preferences that shape the shell rather than one specific runtime.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
              <div className="mb-4 flex items-center gap-3">
                <MonitorCog className="h-4 w-4 text-[var(--text-muted)]" />
                <p className="font-semibold text-[var(--text-strong)]">Appearance</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["light", "dark", "system"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTheme(mode)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      theme === mode
                        ? "bg-[var(--accent-soft)] text-[var(--text-strong)]"
                        : "bg-white/70 text-[var(--text-muted)] dark:bg-white/5"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
              <div className="mb-4 flex items-center gap-3">
                <SlidersHorizontal className="h-4 w-4 text-[var(--text-muted)]" />
                <p className="font-semibold text-[var(--text-strong)]">Editor comfort</p>
              </div>
              <input
                type="range"
                min={10}
                max={24}
                value={editorFontSize}
                onChange={(event) => setEditorFontSize(Number(event.target.value))}
                className="w-full"
              />
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Font size: <span className="font-medium text-[var(--text-strong)]">{editorFontSize}px</span>
              </p>
            </div>

            <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
              <div className="mb-4 flex items-center gap-3">
                <KeyRound className="h-4 w-4 text-[var(--text-muted)]" />
                <p className="font-semibold text-[var(--text-strong)]">Language</p>
              </div>
              <select
                value={locale}
                onChange={(event) => setLocale(event.target.value as Locale)}
                className="w-full rounded-2xl border border-[var(--border-soft)] bg-white/80 px-3 py-2 text-sm dark:bg-white/5"
              >
                <option value="en">English</option>
                <option value="zh-CN">简体中文</option>
              </select>
            </div>

            <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
              <div className="mb-4 flex items-center gap-3">
                <Code className="h-4 w-4 text-[var(--text-muted)]" />
                <p className="font-semibold text-[var(--text-strong)]">Runtime flags</p>
              </div>
              <label className="flex items-center justify-between rounded-2xl bg-white/70 px-3 py-2 text-sm dark:bg-white/5">
                <span className="text-[var(--text-muted)]">Always thinking</span>
                <input
                  type="checkbox"
                  checked={settings.alwaysThinkingEnabled ?? false}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      alwaysThinkingEnabled: event.target.checked,
                    })
                  }
                />
              </label>
            </div>
          </div>
        </SectionPanel>

        <SectionPanel title="Current runtime" description="The selected provider and what the app can reliably manage for it today.">
          {activeProvider ? (
            <div className="space-y-4">
              <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-subtle)]">Selected provider</p>
                    <p className="mt-2 text-lg font-semibold text-[var(--text-strong)]">{activeProvider.label}</p>
                  </div>
                  <ProviderBadge providerId={activeProvider.id} />
                </div>
                <div className="mt-4 space-y-2 text-sm text-[var(--text-muted)]">
                  <p>Home: {activeProvider.homeDir}</p>
                  <p>Config: {activeProvider.configPath || "Not exposed"}</p>
                  <p>Status: {activeProvider.available ? "CLI detected" : "CLI not detected"}</p>
                </div>
              </div>

              <div className="rounded-[22px] border border-[var(--border-soft)] bg-[var(--panel-muted)] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-subtle)]">Capabilities</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeProvider.capabilities.map((capability) => (
                    <span
                      key={capability}
                      className="rounded-full border border-[var(--border-soft)] bg-white/70 px-3 py-1 text-xs text-[var(--text-strong)] dark:bg-white/5"
                    >
                      {capability}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={MonitorCog}
              title="No provider metadata loaded"
              description="The runtime registry did not return any providers. Refresh the app settings after the main process finishes booting."
            />
          )}
        </SectionPanel>
      </section>

      <SectionPanel title="Settings JSON" description="Raw config is still available for power users and debugging.">
        <Editor
          height="420px"
          value={jsonContent}
          onChange={(value) => setJsonContent(value || "")}
          language="json"
          theme={resolvedTheme === "dark" ? "vs-dark" : "vs"}
          options={{ fontSize: editorFontSize, minimap: { enabled: false } }}
        />
      </SectionPanel>
    </div>
  );
}
