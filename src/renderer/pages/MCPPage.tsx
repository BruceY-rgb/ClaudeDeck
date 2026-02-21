import { useState } from 'react'
import { PageHeader } from '../components/shared/PageHeader'
import { MCPServerList } from '../components/mcp/MCPServerList'
import { MCPTemplateList } from '../components/mcp/MCPTemplateList'
import { useTranslation } from '../i18n/LanguageContext'

type Tab = 'servers' | 'templates'

export function MCPPage(): JSX.Element {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('servers')

  return (
    <div>
      <PageHeader
        title={t('mcp.title')}
        description={t('mcp.description')}
      />

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
    </div>
  )
}
