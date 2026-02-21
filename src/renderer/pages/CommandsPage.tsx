import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCommandStore } from '../stores/commandStore'
import { PageHeader } from '../components/shared/PageHeader'
import { Command, Search, ChevronRight } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import type { Command as Cmd } from '@shared/types/command'

export function CommandsPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { items, loading, fetch } = useCommandStore()
  const [search, setSearch] = useState('')

  useEffect(() => { fetch() }, [fetch])

  const filteredCommands = useMemo(() => {
    if (!search) return items
    const lower = search.toLowerCase()
    return items.filter(cmd =>
      cmd.name.toLowerCase().includes(lower) ||
      cmd.description.toLowerCase().includes(lower) ||
      cmd.pluginName.toLowerCase().includes(lower)
    )
  }, [items, search])

  const groupedCommands = useMemo(() => {
    const groups: Record<string, Cmd[]> = {}
    for (const cmd of filteredCommands) {
      const key = cmd.pluginName || cmd.pluginId
      if (!groups[key]) groups[key] = []
      groups[key].push(cmd)
    }
    return groups
  }, [filteredCommands])

  const handleCommandClick = useCallback((pluginId: string, name: string) => {
    navigate(`/commands/${encodeURIComponent(pluginId)}/${encodeURIComponent(name)}`)
  }, [navigate])

  return (
    <div>
      <PageHeader
        title={t('commands.title')}
        description={t('commands.description', { count: String(items.length) })}
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          placeholder={t('commands.searchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">{t('common.loading')}</div>
      ) : filteredCommands.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          {search ? t('commands.noMatch') : t('commands.noCommands')}
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCommands).map(([pluginName, commands]) => (
            <div key={pluginName}>
              <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
                {pluginName}
              </h2>
              <div className="space-y-2">
                {commands.map(cmd => (
                  <div
                    key={`${cmd.pluginId}-${cmd.name}`}
                    onClick={() => handleCommandClick(cmd.pluginId, cmd.name)}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center justify-between cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Command className="w-4 h-4 text-zinc-400" />
                      <div>
                        <h3 className="font-medium text-sm">/{cmd.name}</h3>
                        <p className="text-xs text-zinc-500">{cmd.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
