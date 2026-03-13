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
    installAgent,
    uninstallPlugin,
    getPluginDetail,
    viewAgentDetail,
    installedPlugins,
    categoryStack,
    browseCategory,
    popCategory,
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

  const handleInstallAgent = async (agentName: string, sourcePath: string) => {
    if (!currentSource) return;
    setPluginInstallStatus((prev) => ({ ...prev, [agentName]: "installing" }));
    try {
      await installAgent(currentSource.id, agentName, sourcePath);
      setPluginInstallStatus((prev) => ({ ...prev, [agentName]: "success" }));
      setTimeout(() => {
        setPluginInstallStatus((prev) => ({ ...prev, [agentName]: "idle" }));
      }, 1500);
    } catch (error) {
      console.error("Install agent failed:", error);
      setPluginInstallStatus((prev) => ({ ...prev, [agentName]: "failed" }));
      setTimeout(() => {
        setPluginInstallStatus((prev) => ({ ...prev, [agentName]: "idle" }));
      }, 2000);
    }
  };

  const handleBrowseCategory = async (
    categoryPath: string,
    categoryName: string,
  ) => {
    if (!currentSource) return;
    await browseCategory(currentSource.id, categoryPath, categoryName);
  };

  const isPluginInstalled = (plugin: { name: string; parentPluginName?: string }) => {
    return installedPlugins.some(
      (p) =>
        (p.name === plugin.name || p.name === plugin.parentPluginName) &&
        p.marketplace === currentSource?.id,
    );
  };

  const getInstalledPluginId = (plugin: { name: string; parentPluginName?: string }) => {
    const installed = installedPlugins.find(
      (p) =>
        (p.name === plugin.name || p.name === plugin.parentPluginName) &&
        p.marketplace === currentSource?.id,
    );
    return installed?.id;
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
        {categoryStack.length > 0 ? (
          <button
            onClick={() => popCategory()}
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            ← {t("common.back")}
          </button>
        ) : (
          <button
            onClick={() =>
              useMarketplaceStore.getState().setCurrentSource(null)
            }
            className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            {t("marketplace.backToMarketplaces")}
          </button>
        )}
      </div>

      {categoryStack.length > 0 && (
        <div className="mb-3 flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 flex-wrap">
          <button
            onClick={async () => {
              if (!currentSource) return;
              await useMarketplaceStore
                .getState()
                .browsePlugins(currentSource.id);
            }}
            className="hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            {currentSource.id}
          </button>
          {categoryStack.map((cat, idx) => (
            <span key={cat.path} className="flex items-center gap-1">
              <span>/</span>
              {idx === categoryStack.length - 1 ? (
                <span className="text-zinc-900 dark:text-white">
                  {cat.name}
                </span>
              ) : (
                <button
                  onClick={async () => {
                    // Navigate to this level by popping back
                    const targetStack = categoryStack.slice(0, idx + 1);
                    const target = targetStack[targetStack.length - 1];
                    const plugins =
                      await window.electronAPI.marketplace.browseCategory(
                        currentSource.id,
                        target.path,
                      );
                    useMarketplaceStore.setState({
                      plugins,
                      categoryStack: targetStack,
                      loading: false,
                    });
                  }}
                  className="hover:text-zinc-900 dark:hover:text-zinc-200"
                >
                  {cat.name}
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <PageHeader
        title={
          categoryStack.length > 0
            ? categoryStack[categoryStack.length - 1].name
            : currentSource.id
        }
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
            className={`p-4 bg-white dark:bg-zinc-800 border rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors ${
              plugin.isCategory
                ? "border-blue-200 dark:border-blue-800"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {plugin.isCategory && (
                    <span className="text-blue-500 text-lg">📁</span>
                  )}
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-white truncate">
                    {plugin.name}
                  </h3>
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                  {plugin.description}
                </p>
              </div>
              {plugin.isCategory && plugin.childCount && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full whitespace-nowrap">
                  {t("marketplace.itemCount", { count: plugin.childCount })}
                </span>
              )}
            </div>

            {!plugin.isCategory && (
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500">
                {plugin.version && (
                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded">
                    v{plugin.version}
                  </span>
                )}
                {plugin.author && <span>by {plugin.author}</span>}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {plugin.isCategory ? (
                <button
                  onClick={() =>
                    handleBrowseCategory(
                      plugin.categoryPath || "",
                      plugin.name,
                    )
                  }
                  className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  {t("marketplace.browseCategory")}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      if (plugin.parentPluginName && plugin.readmePath) {
                        viewAgentDetail(plugin);
                      } else if (currentSource) {
                        getPluginDetail(currentSource.id, plugin.name);
                      }
                    }}
                    className="flex-1 px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-white text-sm rounded-md hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  >
                    {t("common.view")}
                  </button>
                  {(() => {
                    const isIndividualAgent = !!(plugin.readmePath && plugin.parentPluginName);
                    const statusKey = isIndividualAgent ? plugin.name : (plugin.parentPluginName || plugin.name);
                    const status =
                      pluginInstallStatus[statusKey] || "idle";
                    const installed = isPluginInstalled(plugin);
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
                      buttonClass +=
                        "bg-green-600 text-white cursor-not-allowed";
                      buttonText = "Installed ✓";
                      disabled = true;
                    } else if (isFailed) {
                      buttonClass +=
                        "bg-red-600 text-white hover:bg-red-700";
                      buttonText = "Failed";
                      disabled = false;
                    } else if (installed) {
                      buttonClass +=
                        "bg-green-600 text-white hover:bg-red-600";
                      buttonText = t("common.installed");
                      disabled = false;
                      onClick = () => {
                        const pluginId = getInstalledPluginId(plugin);
                        if (pluginId) handleUninstall(pluginId);
                      };
                    } else {
                      buttonClass +=
                        "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90";
                      buttonText = t("common.install");
                      disabled = false;
                    }

                    const defaultOnClick = isIndividualAgent
                      ? () => handleInstallAgent(plugin.name, plugin.readmePath!)
                      : () => handleInstall(statusKey);

                    return (
                      <button
                        onClick={onClick || defaultOnClick}
                        disabled={disabled}
                        className={buttonClass}
                      >
                        {buttonText}
                      </button>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
