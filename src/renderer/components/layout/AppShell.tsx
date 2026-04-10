import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { useSettingsStore } from "../../stores/settingsStore";
import { ProviderBadge } from "../shared/ProviderBadge";

function getPageHint(pathname: string): string {
  if (pathname.startsWith("/office")) return "Project sessions, runtime artifacts, and local overrides."
  if (pathname.startsWith("/skills")) return "Skills and reusable workflows available to the current runtime."
  if (pathname.startsWith("/plugins")) return "Installed integrations, plugin state, and runtime add-ons."
  if (pathname.startsWith("/settings")) return "Application preferences and runtime-specific configuration."
  return "One place to inspect and manage your AI coding runtimes."
}

export function AppShell(): JSX.Element {
  const { sidebarCollapsed, settings, fetch } = useSettingsStore();
  const location = useLocation();

  useEffect(() => {
    if (!settings) void fetch();
  }, [fetch, settings]);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main
        className={`flex flex-1 flex-col overflow-hidden transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-72"
        }`}
      >
        <div className="border-b border-[var(--border-soft)] bg-[var(--panel)]/72 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                Active workspace
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {getPageHint(location.pathname)}
              </p>
            </div>
            {settings && <ProviderBadge providerId={settings.activeProvider} />}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
