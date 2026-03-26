import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Sparkles,
  Puzzle,
  Terminal,
  Webhook,
  Server,
  Store,
  Settings,
  Layout,
  BarChart3,
  FileStack,
  Users,
  Brain,
  PanelLeft,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "../../i18n/LanguageContext";
import { useSettingsStore } from "../../stores/settingsStore";
import logoUrl from "../../assets/logo_HIMA.png?url";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export function Sidebar(): JSX.Element {
  const { t } = useTranslation();
  const { sidebarCollapsed, toggleSidebar } = useSettingsStore();

  const navItems: NavItem[] = [
    { path: "/", label: t("sidebar.nav.dashboard"), icon: LayoutDashboard },
    { path: "/agents", label: t("sidebar.nav.agents"), icon: Bot },
    { path: "/skills", label: t("sidebar.nav.skills"), icon: Sparkles },
    { path: "/plugins", label: t("sidebar.nav.plugins"), icon: Puzzle },
    { path: "/commands", label: t("sidebar.nav.commands"), icon: Terminal },
    { path: "/hooks", label: t("sidebar.nav.hooks"), icon: Webhook },
    { path: "/mcp", label: t("sidebar.nav.mcp"), icon: Server },
    { path: "/marketplace", label: t("sidebar.nav.marketplace"), icon: Store },
    { path: "/office", label: t("sidebar.nav.office"), icon: Layout },
    { path: "/analytics", label: t("sidebar.nav.analytics"), icon: BarChart3 },
    { path: "/plans", label: t("sidebar.nav.plans"), icon: FileStack },
    { path: "/community", label: t("sidebar.nav.community"), icon: Users },
    { path: "/memory", label: t("sidebar.nav.memory"), icon: Brain },
    { path: "/settings", label: t("sidebar.nav.settings"), icon: Settings },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Title / drag region */}
      <div
        className={`drag-region h-20 flex items-center gap-3 pt-8 transition-all duration-300 ${
          sidebarCollapsed ? "justify-center px-2" : "px-5"
        }`}
      >
        <img src={logoUrl} alt="Logo" className="no-drag w-10 h-10 shrink-0" />
        {!sidebarCollapsed && (
          <h1
            className="no-drag text-xl font-bold tracking-tight text-zinc-700 dark:text-zinc-300 truncate"
            style={{
              fontFamily:
                "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {t("sidebar.title")}
          </h1>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center rounded-lg text-sm transition-colors ${
                    sidebarCollapsed
                      ? "justify-center px-2 py-2"
                      : "gap-3 px-3 py-2"
                  } ${
                    isActive
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
                  }`
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Collapse Toggle Button */}
      <div className="px-3 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <button
          onClick={toggleSidebar}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors ${
            sidebarCollapsed ? "justify-center" : ""
          }`}
          title={sidebarCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="w-4 h-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 shrink-0" />
              <span>{t("sidebar.collapse")}</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
