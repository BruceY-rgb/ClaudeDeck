import { lazy, Suspense } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { SearchCommand } from "./components/shared/SearchCommand";
import { ToastProvider } from "./components/shared/Toast";
import { LanguageProvider } from "./i18n/LanguageContext";
import { useTheme } from "./hooks/useTheme";
import { Loader2 } from "lucide-react";
import { DashboardPage } from "./pages/DashboardPage";
import { AgentsPage } from "./pages/AgentsPage";
import { AgentDetailPage } from "./pages/AgentDetailPage";
import { SkillsPage } from "./pages/SkillsPage";
import { SkillDetailPage } from "./pages/SkillDetailPage";
import { SkillNewPage } from "./pages/SkillNewPage";
import { SkillsTreePage } from "./pages/SkillsTreePage";
import { PluginsPage } from "./pages/PluginsPage";
import { PluginDetailPage } from "./pages/PluginDetailPage";
import { CommandsPage } from "./pages/CommandsPage";
import { CommandDetailPage } from "./pages/CommandDetailPage";
import { HooksPage } from "./pages/HooksPage";
import { MCPPage } from "./pages/MCPPage";
import { MarketplacePage } from "./pages/MarketplacePage";
import { SettingsPage } from "./pages/SettingsPage";
import { ProjectsListPage } from "./pages/ProjectsListPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { PlansPage } from "./pages/PlansPage";
import { SessionDetailPage } from "./pages/SessionDetailPage";
import { CommunityPage } from "./pages/CommunityPage";
import MemoryPage from "./pages/MemoryPage";

const AnalyticsPage = lazy(() =>
  import("./pages/AnalyticsPage").then((m) => ({ default: m.AnalyticsPage }))
);

function ThemedApp(): JSX.Element {
  // Initialize theme
  useTheme();

  return (
    <ToastProvider>
      <HashRouter>
        <SearchCommand />
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/agents" element={<AgentsPage />} />
            <Route path="/agents/:name" element={<AgentDetailPage />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/skills/new" element={<SkillNewPage />} />
            <Route path="/skills/tree" element={<SkillsTreePage />} />
            <Route path="/skills/:source/:name" element={<SkillDetailPage />} />
            <Route path="/plugins" element={<PluginsPage />} />
            <Route path="/plugins/:id" element={<PluginDetailPage />} />
            <Route path="/commands" element={<CommandsPage />} />
            <Route
              path="/commands/:pluginId/:name"
              element={<CommandDetailPage />}
            />
            <Route path="/hooks" element={<HooksPage />} />
            <Route path="/mcp" element={<MCPPage />} />
            <Route path="/marketplace" element={<MarketplacePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/office" element={<ProjectsListPage />} />
            <Route path="/office/project/:projectDir" element={<ProjectDetailPage />} />
            <Route path="/office/project/:projectDir/session/:sessionId" element={<SessionDetailPage />} />
            <Route path="/analytics" element={<Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-5 h-5 animate-spin text-zinc-400" /></div>}><AnalyticsPage /></Suspense>} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/memory" element={<MemoryPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </ToastProvider>
  );
}

export function App(): JSX.Element {
  return (
    <LanguageProvider>
      <ThemedApp />
    </LanguageProvider>
  );
}
