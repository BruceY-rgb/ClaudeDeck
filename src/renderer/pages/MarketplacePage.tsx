import { useEffect, useState } from "react";
import { useMarketplaceStore } from "../stores/marketplaceStore";
import { useTranslation } from "../i18n/LanguageContext";
import { MarketplaceList } from "../components/marketplace/MarketplaceList";
import { MarketplaceDetail } from "../components/marketplace/MarketplaceDetail";
import { MarketplacePluginInfo } from "../components/marketplace/MarketplacePluginInfo";
import { InstallDialog } from "../components/marketplace/InstallDialog";

export function MarketplacePage(): JSX.Element {
  const { t } = useTranslation();
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
    </div>
  );
}
