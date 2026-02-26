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
  FileStack,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "../shared/ThemeToggle";
import { useTranslation } from "../../i18n/LanguageContext";
import logoUrl from "../../assets/logo.svg?url";

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

export function Sidebar(): JSX.Element {
  const { t } = useTranslation();

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
    { path: "/plans", label: t("sidebar.nav.plans"), icon: FileStack },
    { path: "/settings", label: t("sidebar.nav.settings"), icon: Settings },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-100 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      {/* Title / drag region */}
      <div className="drag-region h-20 flex items-center gap-3 px-5 pt-8">
        <img src={logoUrl} alt="Logo" className="no-drag w-10 h-10 shrink-0" />
        <h1
          className="no-drag text-xl font-bold tracking-tight text-zinc-700 dark:text-zinc-300"
          style={{
            fontFamily:
              "SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif",
          }}
        >
          {t("sidebar.title")}
        </h1>
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
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60"
                  }`
                }
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 dark:border-zinc-800">
        <p className="text-xs text-zinc-400 dark:text-zinc-600">v1.0.0</p>
        <ThemeToggle />
      </div>
    </aside>
  );
}
