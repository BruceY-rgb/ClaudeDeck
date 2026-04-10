import { CheckCircle2, ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useSettingsStore } from "../../stores/settingsStore";
import { ProviderGlyph, getProviderLabel } from "../../utils/branding";

export function ProviderSwitcher(): JSX.Element {
  const { settings, providers, setActiveProvider } = useSettingsStore();
  const [open, setOpen] = useState(false);

  const activeProvider = useMemo(
    () => providers.find((provider) => provider.id === settings?.activeProvider),
    [providers, settings?.activeProvider],
  );

  if (!settings || !activeProvider) {
    return <div className="h-0 overflow-hidden" aria-hidden="true" />;
  }

  return (
    <div className="relative no-drag">
      <button
        onClick={() => setOpen((value) => !value)}
        className="no-drag flex items-center gap-3 rounded-2xl border border-[var(--border-soft)] bg-[var(--panel)] px-4 py-2.5 shadow-[var(--panel-shadow)] transition hover:border-[var(--border-strong)]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--panel-muted)] p-1">
          <ProviderGlyph providerId={activeProvider.id} className="h-full w-full" />
        </span>
        <span className="min-w-0 text-left">
          <span className="block text-[11px] uppercase tracking-[0.18em] text-[var(--text-subtle)]">
            Active runtime
          </span>
          <span className="block truncate text-sm font-semibold text-[var(--text-strong)]">
            {activeProvider.label}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 text-[var(--text-muted)] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="no-drag absolute left-0 top-[calc(100%+12px)] z-30 min-w-full overflow-hidden rounded-3xl border border-[var(--border-soft)] bg-[var(--panel)] p-2 shadow-2xl">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={async () => {
                setOpen(false);
                await setActiveProvider(provider.id);
              }}
              className="no-drag flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-[var(--panel-muted)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--panel-muted)] p-1">
                <ProviderGlyph providerId={provider.id} className="h-full w-full" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-[var(--text-strong)]">
                  {provider.label}
                </span>
                <span className="block text-xs text-[var(--text-muted)]">
                  {provider.available ? "CLI detected on this machine" : "CLI not detected"}
                </span>
              </span>
              {settings.activeProvider === provider.id ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
