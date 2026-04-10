import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { useMarketplaceStore } from "../stores/marketplaceStore";
import { useTranslation } from "../i18n/LanguageContext";
import { MarketplaceList } from "../components/marketplace/MarketplaceList";
import { MarketplaceDetail } from "../components/marketplace/MarketplaceDetail";
import { MarketplacePluginInfo } from "../components/marketplace/MarketplacePluginInfo";
import { InstallDialog } from "../components/marketplace/InstallDialog";
import { PageHeader } from "../components/shared/PageHeader";
import { useSettingsStore } from "../stores/settingsStore";
import { ProviderBadge } from "../components/shared/ProviderBadge";
import { EmptyState } from "../components/shared/EmptyState";

export function MarketplacePage(): JSX.Element {
  const { t } = useTranslation();
  const { settings } = useSettingsStore();
  const {
    currentSource,
    sources,
    fetchSources,
    loading,
    installPlugin,
    currentPlugin,
    setCurrentPlugin,
    fetchInstalledPlugins,
  } = useMarketplaceStore();
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [pendingInstall, setPendingInstall] = useState<string | null>(null);
  const providerId = settings?.activeProvider ?? "claude";

  useEffect(() => {
    fetchSources();
    fetchInstalledPlugins();
  }, [fetchSources, fetchInstalledPlugins]);

  const handleInstallClick = (pluginName: string) => {
    setPendingInstall(pluginName);
    setInstallDialogOpen(true);
  };

  const handleConfirmInstall = async () => {
    if (!pendingInstall || !currentSource) return;
    await installPlugin(currentSource.id, pendingInstall);
    setInstallDialogOpen(false);
    setPendingInstall(null);
  };

  const handleBackToList = () => {
    setCurrentPlugin(null);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Plugin sources"
        badge={<ProviderBadge providerId={providerId} />}
        description="Browse installable extensions and provider-backed plugin sources. Claude keeps the richest marketplace workflow in this release."
      />

      {providerId !== "claude" ? (
        <EmptyState
          icon={Store}
          title="Marketplace installs are coming next for this provider"
          description="You can already inspect provider-aware plugins in the Plugins page. Marketplace browsing and installation remain Claude-first for now."
        />
      ) : (
        <>
          {loading && sources.length === 0 && !currentSource ? (
            <div className="text-center py-8 text-zinc-400">
              {t("common.loading")}
            </div>
          ) : currentPlugin ? (
            <MarketplacePluginInfo
              plugin={currentPlugin}
              onBack={handleBackToList}
            />
          ) : currentSource ? (
            <MarketplaceDetail />
          ) : (
            <MarketplaceList />
          )}

          <InstallDialog
            open={installDialogOpen}
            pluginName={pendingInstall || ""}
            onClose={() => {
              setInstallDialogOpen(false);
              setPendingInstall(null);
            }}
            onConfirm={handleConfirmInstall}
            installing={useMarketplaceStore.getState().installing}
          />
        </>
      )}
    </div>
  );
}
