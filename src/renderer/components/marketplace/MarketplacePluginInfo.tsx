import { useState } from "react";
import { Bot, Sparkles, Terminal, Webhook, Server } from "lucide-react";
import { useMarketplaceStore } from "../../stores/marketplaceStore";
import { PageHeader } from "../shared/PageHeader";
import { useTranslation } from "../../i18n/LanguageContext";
import type { MarketplacePluginDetail } from "@shared/types/marketplace";

type InstallStatus = "idle" | "installing" | "success" | "failed";

interface MarketplacePluginInfoProps {
  plugin: MarketplacePluginDetail;
  onBack: () => void;
}

export function MarketplacePluginInfo({
  plugin,
  onBack,
}: MarketplacePluginInfoProps): JSX.Element {
  const { t } = useTranslation();
  const { currentSource, installPlugin, uninstallPlugin, installedPlugins } =
    useMarketplaceStore();
  const [installStatus, setInstallStatus] = useState<InstallStatus>("idle");

  const isInstalled = installedPlugins.some(
    (p) => p.name === plugin.name && p.marketplace === currentSource?.id,
  );

  const getInstalledPluginId = () => {
    const pluginRecord = installedPlugins.find(
      (p) => p.name === plugin.name && p.marketplace === currentSource?.id,
    );
    return pluginRecord?.id;
  };

  const handleUninstall = async () => {
    const pluginId = getInstalledPluginId();
    if (!pluginId) return;
    setInstallStatus("installing");
    try {
      await uninstallPlugin(pluginId);
      setInstallStatus("idle");
    } catch (error) {
      console.error("Uninstall failed:", error);
      setInstallStatus("failed");
      setTimeout(() => {
        setInstallStatus("idle");
      }, 2000);
    }
  };

  const handleInstall = async () => {
    if (!currentSource) return;
    setInstallStatus("installing");
    try {
      await installPlugin(currentSource.id, plugin.name);
      setInstallStatus("success");
      setTimeout(() => {
        setInstallStatus("idle");
      }, 1500);
    } catch (error) {
      console.error("Install failed:", error);
      setInstallStatus("failed");
      setTimeout(() => {
        setInstallStatus("idle");
      }, 2000);
    }
  };

  const pluginContents = [
    {
      label: "Agents",
      count: plugin.agents.length,
      icon: <Bot className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />,
    },
    {
      label: "Skills",
      count: plugin.skills.length,
      icon: <Sparkles className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />,
    },
    {
      label: "Commands",
      count: plugin.commands.length,
      icon: <Terminal className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />,
    },
    {
      label: "Hooks",
      count: plugin.hooks.length,
      icon: <Webhook className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />,
    },
    {
      label: "MCP Configs",
      count: plugin.mcpConfigs.length,
      icon: <Server className="w-6 h-6 text-zinc-500 dark:text-zinc-400" />,
    },
  ];

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={onBack}
          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
        >
          {t("marketplace.backToPlugins")}
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {plugin.name}
              </h2>
              {isInstalled && (
                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                  Installed
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              {plugin.version && (
                <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded">
                  v{plugin.version}
                </span>
              )}
              {plugin.author && <span>by {plugin.author}</span>}
            </div>
          </div>
          {(() => {
            const isInstalling = installStatus === "installing";
            const isSuccess = installStatus === "success";
            const isFailed = installStatus === "failed";

            let buttonClass =
              "px-4 py-2 rounded-lg font-medium transition-colors ";
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
              buttonText = "Installed";
              disabled = true;
            } else if (isFailed) {
              buttonClass += "bg-red-600 text-white hover:bg-red-700";
              buttonText = "Failed - Retry";
              disabled = false;
            } else if (isInstalled) {
              buttonClass += "bg-green-600 text-white hover:bg-red-600";
              buttonText = t("common.installed");
              disabled = false;
              onClick = handleUninstall;
            } else {
              buttonClass +=
                "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90";
              buttonText = t("common.install");
              disabled = false;
            }

            return (
              <button
                onClick={onClick || handleInstall}
                disabled={disabled}
                className={buttonClass}
              >
                {buttonText}
              </button>
            );
          })()}
        </div>

        <p className="mt-4 text-zinc-600 dark:text-zinc-300">
          {plugin.description}
        </p>

        {plugin.repository && (
          <div className="mt-4">
            <a
              href={plugin.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
            >
              View Repository →
            </a>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-700">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-4">
            Plugin Contents
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {pluginContents.map((content) => (
              <div
                key={content.label}
                className="p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg text-center"
              >
                <div className="mb-1 flex justify-center">{content.icon}</div>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {content.count}
                </div>
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {content.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {plugin.agents.length > 0 && (
          <div className="mt-6">
            <h4 className="text-md font-medium text-zinc-900 dark:text-white mb-2">
              Agents
            </h4>
            <div className="flex flex-wrap gap-2">
              {plugin.agents.map((agent) => (
                <span
                  key={agent.path}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded"
                >
                  {agent.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {plugin.skills.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-zinc-900 dark:text-white mb-2">
              Skills
            </h4>
            <div className="flex flex-wrap gap-2">
              {plugin.skills.map((skill) => (
                <span
                  key={skill.path}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {plugin.commands.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-zinc-900 dark:text-white mb-2">
              Commands
            </h4>
            <div className="flex flex-wrap gap-2">
              {plugin.commands.map((command) => (
                <span
                  key={command.path}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded"
                >
                  {command.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {plugin.hooks.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-zinc-900 dark:text-white mb-2">
              Hooks
            </h4>
            <div className="flex flex-wrap gap-2">
              {plugin.hooks.map((hook) => (
                <span
                  key={hook.path}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded"
                >
                  {hook.path}
                </span>
              ))}
            </div>
          </div>
        )}

        {plugin.mcpConfigs.length > 0 && (
          <div className="mt-4">
            <h4 className="text-md font-medium text-zinc-900 dark:text-white mb-2">
              MCP Configs
            </h4>
            <div className="flex flex-wrap gap-2">
              {plugin.mcpConfigs.map((config) => (
                <span
                  key={config.path}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm rounded"
                >
                  {config.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
