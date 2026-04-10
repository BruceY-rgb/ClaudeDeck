import { useState } from 'react'
import { FolderOpen, PlugZap } from 'lucide-react'
import { PageHeader } from '../components/shared/PageHeader'
import { MCPServerList } from '../components/mcp/MCPServerList'
import { MCPTemplateList } from '../components/mcp/MCPTemplateList'
import { useTranslation } from '../i18n/LanguageContext'
import { useSettingsStore } from '../stores/settingsStore'
import { ProviderBadge } from '../components/shared/ProviderBadge'
import { EmptyState } from '../components/shared/EmptyState'

type Tab = 'servers' | 'templates'

export function MCPPage(): JSX.Element {
  const { t } = useTranslation()
  const { settings } = useSettingsStore()
  const [activeTab, setActiveTab] = useState<Tab>('servers')
  const providerId = settings?.activeProvider ?? 'claude'

  const handleRevealConfig = (): void => {
    window.electronAPI.file.revealMCPConfig()
  }

  return (
    <div>
      <PageHeader
        eyebrow="Connectivity"
        title={t('mcp.title')}
        badge={<ProviderBadge providerId={providerId} />}
        description={t('mcp.description')}
        actions={providerId === 'claude' ? (
          <button
            onClick={handleRevealConfig}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={t("common.revealInFinder")}
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        ) : undefined}
      />

      {providerId !== 'claude' ? (
        <EmptyState
          icon={PlugZap}
          title="MCP management is currently Claude-first"
          description="This runtime is already wired into the provider switcher, but server and template management is only fully editable for Claude in this release."
        />
      ) : (
        <>
          <div className="mb-6">
            <div className="flex gap-1 p-1 bg-zinc-900/50 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('servers')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'servers'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('mcp.activeServers')}
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={`px-4 py-2 text-sm rounded-md transition-colors ${
                  activeTab === 'templates'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {t('mcp.templates')}
              </button>
            </div>
          </div>

          {activeTab === 'servers' ? <MCPServerList /> : <MCPTemplateList />}
        </>
      )}
    </div>
  )
}
