import { useState, useEffect, useCallback } from "react";
import { Plus, Webhook, Trash2, Save, X } from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useProjectConfigStore } from "../../stores/projectConfigStore";
import type {
  ProjectHook,
  ProjectHookFormData,
} from "@shared/types/project-config";

const HOOK_EVENT_TYPES = [
  "PreToolUse",
  "PostToolUse",
  "Notification",
  "Stop",
  "SubagentStop",
] as const;

type HookEventType = (typeof HOOK_EVENT_TYPES)[number];

interface LocalHook {
  id: string;
  event: HookEventType;
  matcher: string;
  command: string;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function storeHooksToLocal(hooks: ProjectHook[]): LocalHook[] {
  return hooks.map((h) => ({
    id: generateId(),
    event: (HOOK_EVENT_TYPES.includes(h.event as HookEventType)
      ? h.event
      : "PreToolUse") as HookEventType,
    matcher: h.matcher ?? "",
    command: h.command,
  }));
}

function localHooksToFormData(hooks: LocalHook[]): ProjectHookFormData[] {
  return hooks.map((h) => ({
    event: h.event,
    matcher: h.matcher || undefined,
    command: h.command,
  }));
}

function hooksAreEqual(
  local: LocalHook[],
  store: ProjectHook[],
): boolean {
  if (local.length !== store.length) return false;
  for (let i = 0; i < local.length; i++) {
    const l = local[i];
    const s = store[i];
    if (l.event !== s.event) return false;
    if ((l.matcher || "") !== (s.matcher ?? "")) return false;
    if (l.command !== s.command) return false;
  }
  return true;
}

export function ProjectHooks(): JSX.Element {
  const { t } = useTranslation();
  const hooks = useProjectConfigStore((s) => s.hooks);
  const loading = useProjectConfigStore((s) => s.loading.hooks);
  const writeHooks = useProjectConfigStore((s) => s.writeHooks);

  const [localHooks, setLocalHooks] = useState<LocalHook[]>([]);
  const [saving, setSaving] = useState(false);

  // Sync local state from store on mount and when store changes
  useEffect(() => {
    setLocalHooks(storeHooksToLocal(hooks));
  }, [hooks]);

  const hasUnsavedChanges = !hooksAreEqual(localHooks, hooks);

  const handleAdd = useCallback(() => {
    setLocalHooks((prev) => [
      ...prev,
      {
        id: generateId(),
        event: "PreToolUse",
        matcher: "",
        command: "",
      },
    ]);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setLocalHooks((prev) => prev.filter((h) => h.id !== id));
  }, []);

  const handleChange = useCallback(
    (id: string, field: keyof Omit<LocalHook, "id">, value: string) => {
      setLocalHooks((prev) =>
        prev.map((h) => (h.id === id ? { ...h, [field]: value } : h)),
      );
    },
    [],
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await writeHooks(localHooksToFormData(localHooks));
    } finally {
      setSaving(false);
    }
  }, [localHooks, writeHooks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            {t("office.projectHooks.title")}
          </h2>
          {hasUnsavedChanges && (
            <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
              {t("office.projectHooks.unsavedChanges")}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-card border border-border hover:bg-accent transition-colors"
            onClick={handleAdd}
          >
            <Plus className="w-4 h-4" />
            {t("office.projectHooks.add")}
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || saving}
          >
            <Save className="w-4 h-4" />
            {t("office.projectHooks.save")}
          </button>
        </div>
      </div>

      {/* Empty state */}
      {localHooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Webhook className="w-12 h-12 mb-3 opacity-50" />
          <p className="text-base font-medium">
            {t("office.projectHooks.empty")}
          </p>
          <p className="text-sm mt-1">
            {t("office.projectHooks.emptyHint")}
          </p>
        </div>
      ) : (
        /* Hook rows */
        <div className="space-y-3">
          {localHooks.map((hook) => (
            <div
              key={hook.id}
              className="bg-card border border-border rounded-lg p-4 space-y-3"
            >
              {/* First row: Event, Matcher, Delete */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <label className="block text-xs text-muted-foreground mb-1">
                    {t("office.projectHooks.event")}
                  </label>
                  <select
                    className="bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    value={hook.event}
                    onChange={(e) =>
                      handleChange(hook.id, "event", e.target.value)
                    }
                  >
                    {HOOK_EVENT_TYPES.map((evt) => (
                      <option key={evt} value={evt}>
                        {evt}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs text-muted-foreground mb-1">
                    {t("office.projectHooks.matcher")}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                    placeholder={t("office.projectHooks.matcherPlaceholder")}
                    value={hook.matcher}
                    onChange={(e) =>
                      handleChange(hook.id, "matcher", e.target.value)
                    }
                  />
                </div>
                <div className="flex-shrink-0 self-end">
                  <button
                    className="p-1.5 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500 transition-colors"
                    onClick={() => handleRemove(hook.id)}
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Second row: Command */}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">
                  {t("office.projectHooks.command")}
                </label>
                <input
                  type="text"
                  className="w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                  placeholder={t("office.projectHooks.commandPlaceholder")}
                  value={hook.command}
                  onChange={(e) =>
                    handleChange(hook.id, "command", e.target.value)
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
