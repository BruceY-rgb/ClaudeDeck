import { NavLink } from "react-router-dom";
import {
  BarChart3,
  Bot,
  BrainCircuit,
  FileStack,
  LayoutDashboard,
  LayoutTemplate,
  PanelLeft,
  PanelLeftClose,
  Server,
  Settings,
  Sparkles,
  Store,
  Terminal,
  Webhook,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useSettingsStore } from "../../stores/settingsStore";
import { ProviderSwitcher } from "../shared/ProviderSwitcher";
import logoUrl from "../../assets/logo.svg?url";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar(): JSX.Element {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore();

  const navGroups: NavGroup[] = [
    {
      label: "Workspace",
      items: [
        { path: "/", label: t("sidebar.nav.dashboard"), icon: LayoutDashboard },
        { path: "/office", label: t("sidebar.nav.office"), icon: LayoutTemplate },
        { path: "/analytics", label: t("sidebar.nav.analytics"), icon: BarChart3 },
      ],
    },
    {
      label: "Resources",
      items: [
        { path: "/agents", label: t("sidebar.nav.agents"), icon: Bot },
        { path: "/skills", label: t("sidebar.nav.skills"), icon: Sparkles },
        { path: "/plugins", label: t("sidebar.nav.plugins"), icon: BrainCircuit },
        { path: "/commands", label: t("sidebar.nav.commands"), icon: Terminal },
        { path: "/hooks", label: t("sidebar.nav.hooks"), icon: Webhook },
        { path: "/mcp", label: t("sidebar.nav.mcp"), icon: Server },
      ],
    },
    {
      label: "Library",
      items: [
        { path: "/marketplace", label: t("sidebar.nav.marketplace"), icon: Store },
        { path: "/plans", label: t("sidebar.nav.plans"), icon: FileStack },
        { path: "/settings", label: t("sidebar.nav.settings"), icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-20 flex flex-col border-r border-[var(--border-soft)] bg-[var(--panel)]/95 backdrop-blur-xl transition-all duration-300 ${
        sidebarCollapsed ? "w-20" : "w-72"
      }`}
    >
      <div className={`drag-region pt-8 ${sidebarCollapsed ? "px-3" : "px-5"}`}>
        <div className={`flex items-center ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
          <img src={logoUrl} alt="Agent Forge" className="no-drag h-11 w-11 rounded-2xl bg-white/70 p-1 shadow-sm" />
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold tracking-tight text-[var(--text-strong)]">
                Agent Forge
              </h1>
              <p className="text-xs text-[var(--text-muted)]">
                AI CLI workbench
              </p>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <div className="mt-5">
            <ProviderSwitcher />
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-5 pt-6">
        <div className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!sidebarCollapsed && (
                <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      end={item.path === "/"}
                      className={({ isActive }) =>
                        `group flex items-center rounded-2xl text-sm transition-all ${
                          sidebarCollapsed
                            ? "justify-center px-2 py-3"
                            : "gap-3 px-3.5 py-3"
                        } ${
                          isActive
                            ? "bg-[var(--accent-soft)] text-[var(--text-strong)]"
                            : "text-[var(--text-muted)] hover:bg-[var(--panel-muted)] hover:text-[var(--text-strong)]"
                        }`
                      }
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!sidebarCollapsed && <span>{item.label}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      <div className="border-t border-[var(--border-soft)] px-3 py-3">
        <button
          onClick={toggleSidebar}
          className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--text-muted)] transition hover:bg-[var(--panel-muted)] hover:text-[var(--text-strong)] ${
            sidebarCollapsed ? "justify-center" : ""
          }`}
          title={sidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>{t("sidebar.collapse")}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
