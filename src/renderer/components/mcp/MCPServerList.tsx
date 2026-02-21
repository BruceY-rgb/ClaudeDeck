import { useEffect, useState } from 'react'
import { useMCPStore } from '../../stores/mcpStore'
import { useTranslation } from '../../i18n/LanguageContext'

export function MCPServerList(): JSX.Element {
  const { t } = useTranslation()
  const { servers, loading, error, fetchServers, deactivate } = useMCPStore()

  useEffect(() => {
    fetchServers()
  }, [fetchServers])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-600 dark:text-red-400">
        {error}
      </div>
    )
  }

  if (servers.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">
        <p className="text-lg mb-2">{t('mcp.noServers')}</p>
        <p className="text-sm">{t('mcp.noServersHint')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {servers.map((server) => (
        <MCPServerCard
          key={server.name}
          server={server}
          onDeactivate={() => deactivate(server.name)}
        />
      ))}
    </div>
  )
}

interface MCPServerCardProps {
  server: {
    name: string
    type: 'stdio' | 'http'
    command?: string
    args?: string[]
    url?: string
    env?: Record<string, string>
    active: boolean
    templateSource?: string
  }
  onDeactivate: () => void
}

function MCPServerCard({ server, onDeactivate }: MCPServerCardProps): JSX.Element {
  const { t } = useTranslation()
  const [showDelete, setShowDelete] = useState(false)

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${server.active ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">{server.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 rounded text-xs font-mono ${
                server.type === 'stdio' ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
              }`}>
                {server.type}
              </span>
              {server.templateSource && (
                <span className="text-xs text-zinc-500">via {server.templateSource}</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowDelete(!showDelete)}
          className="text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
          </svg>
        </button>
      </div>

      <div className="mt-3 bg-zinc-50 dark:bg-zinc-950 rounded p-3">
        {server.type === 'stdio' ? (
          <div>
            <div className="text-xs text-zinc-500 mb-1">{t('mcp.command')}</div>
            <code className="text-sm font-mono text-blue-600 dark:text-blue-400">
              {server.command} {server.args?.join(' ')}
            </code>
            {server.env && Object.keys(server.env).length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-zinc-500 mb-1">{t('mcp.envVars')}</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(server.env).map(key => (
                    <span key={key} className="px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 rounded text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      {key}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="text-xs text-zinc-500 mb-1">{t('mcp.url')}</div>
            <code className="text-sm font-mono text-purple-600 dark:text-purple-400">{server.url}</code>
          </div>
        )}
      </div>

      {showDelete && (
        <div className="mt-3 flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded p-3">
          <span className="text-sm text-red-600 dark:text-red-400">{t('mcp.removeServer')}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDelete(false)}
              className="px-3 py-1 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={onDeactivate}
              className="px-3 py-1 text-sm bg-red-500/20 text-red-600 dark:text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              {t('common.remove')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
