import { useState } from "react";
import { useMarketplaceStore } from "../../stores/marketplaceStore";
import { PageHeader } from "../shared/PageHeader";
import { useTranslation } from "../../i18n/LanguageContext";

type InstallStatus = "idle" | "installing" | "success" | "failed";

export function MarketplaceDetail(): JSX.Element {
  const { t } = useTranslation();
  const {
    currentSource,
    plugins,
    loading,
    installPlugin,
    uninstallPlugin,
    getPluginDetail,
    installedPlugins,
  } = useMarketplaceStore();
  const [pluginInstallStatus, setPluginInstallStatus] = useState<
    Record<string, InstallStatus>
  >({});

  const handleInstall = async (pluginName: string) => {
    if (!currentSource) return;
    setPluginInstallStatus((prev) => ({ ...prev, [pluginName]: "installing" }));
    try {
      await installPlugin(currentSource.id, pluginName);
      setPluginInstallStatus((prev) => ({ ...prev, [pluginName]: "success" }));
      setTimeout(() => {
        setPluginInstallStatus((prev) => ({ ...prev, [pluginName]: "idle" }));
      }, 1500);
    } catch (error) {
      console.error("Install failed:", error);
      setPluginInstallStatus((prev) => ({ ...prev, [pluginName]: "failed" }));
      setTimeout(() => {
        setPluginInstallStatus((prev) => ({ ...prev, [pluginName]: "idle" }));
      }, 2000);
    }
  };

  const handleViewDetail = async (pluginName: string) => {
    if (!currentSource) return;
    await getPluginDetail(currentSource.id, pluginName);
  };

  const isPluginInstalled = (pluginName: string) => {
    return installedPlugins.some(
      (p) => p.name === pluginName && p.marketplace === currentSource?.id,
    );
  };

  const getInstalledPluginId = (pluginName: string) => {
    const plugin = installedPlugins.find(
      (p) => p.name === pluginName && p.marketplace === currentSource?.id,
    );
    return plugin?.id;
  };

  const handleUninstall = async (pluginId: string) => {
    setPluginInstallStatus((prev) => ({ ...prev, [pluginId]: "installing" }));
    try {
      await uninstallPlugin(pluginId);
      setPluginInstallStatus((prev) => ({ ...prev, [pluginId]: "idle" }));
    } catch (error) {
      console.error("Uninstall failed:", error);
      setPluginInstallStatus((prev) => ({ ...prev, [pluginId]: "idle" }));
    }
  };

  if (!currentSource) {
    return (
      <div className="text-center py-8 text-zinc-400">
        {t("marketplace.selectMarketplace")}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => useMarketplaceStore.getState().setCurrentSource(null)}
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {t("marketplace.backToMarketplaces")}
        </button>
      </div>

      <PageHeader
        title={currentSource.id}
        description={t("marketplace.availablePlugins")}
      />

      {loading && (
        <div className="text-center py-8 text-zinc-400">
          {t("marketplace.loadingPlugins")}
        </div>
      )}

      {!loading && plugins.length === 0 && (
        <div className="text-center py-8 text-zinc-400">
          {t("marketplace.noPlugins")}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plugins.map((plugin) => (
          <div
            key={plugin.id}
            className="p-4 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white truncate">
                  {plugin.name}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {plugin.description}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
              {plugin.version && (
                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded">
                  v{plugin.version}
                </span>
              )}
              {plugin.author && <span>by {plugin.author}</span>}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleViewDetail(plugin.name)}
                className="flex-1 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-white text-sm rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600"
              >
                {t("common.view")}
              </button>
              {(() => {
                const status = pluginInstallStatus[plugin.name] || "idle";
                const installed = isPluginInstalled(plugin.name);
                const isInstalling = status === "installing";
                const isSuccess = status === "success";
                const isFailed = status === "failed";

                let buttonClass =
                  "flex-1 px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ";
                let buttonText = t("common.install");
                let disabled = false;
                let onClick: (() => void) | undefined = undefined;

                if (isInstalling) {
                  buttonClass +=
                    "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 opacity-50 cursor-not-allowed";
                  buttonText = t("common.installing");
                  disabled = true;
                } else if (isSuccess) {
                  buttonClass += "bg-green-600 text-white cursor-not-allowed";
                  buttonText = "Installed ✓";
                  disabled = true;
                } else if (isFailed) {
                  buttonClass += "bg-red-600 text-white hover:bg-red-700";
                  buttonText = "Failed";
                  disabled = false;
                } else if (installed) {
                  buttonClass += "bg-green-600 text-white hover:bg-red-600";
                  buttonText = t("common.installed");
                  disabled = false;
                  onClick = () => {
                    const pluginId = getInstalledPluginId(plugin.name);
                    if (pluginId) handleUninstall(pluginId);
                  };
                } else {
                  buttonClass +=
                    "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90";
                  buttonText = t("common.install");
                  disabled = false;
                }

                return (
                  <button
                    onClick={onClick || (() => handleInstall(plugin.name))}
                    disabled={disabled}
                    className={buttonClass}
                  >
                    {buttonText}
                  </button>
                );
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
