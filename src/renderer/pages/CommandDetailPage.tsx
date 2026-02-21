import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useCommandStore } from '../stores/commandStore'
import { PageHeader } from '../components/shared/PageHeader'
import { useTranslation } from '../i18n/LanguageContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check } from 'lucide-react'
import type { Command } from '@shared/types/command'

export function CommandDetailPage(): JSX.Element {
  const { t } = useTranslation()
  const { pluginId, name } = useParams<{ pluginId: string; name: string }>()
  const { read } = useCommandStore()

  const [command, setCommand] = useState<Command | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function loadCommand() {
      if (!pluginId || !name) return
      setLoading(true)
      try {
        const cmd = await read(decodeURIComponent(pluginId), decodeURIComponent(name))
        setCommand(cmd)
      } finally {
        setLoading(false)
      }
    }
    loadCommand()
  }, [pluginId, name, read])

  const handleCopy = useCallback(() => {
    if (command?.body) {
      navigator.clipboard.writeText(command.body)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [command?.body])

  if (loading) {
    return (
      <div>
        <PageHeader
          title={t('common.loading')}
          backTo={{ label: t('commands.backToCommands'), path: '/commands' }}
        />
        <div className="text-center py-12 text-zinc-400">{t('common.loading')}</div>
      </div>
    )
  }

  if (!command) {
    return (
      <div>
        <PageHeader
          title={t('commands.notFound')}
          backTo={{ label: t('commands.backToCommands'), path: '/commands' }}
        />
        <div className="text-center py-12 text-zinc-400">{t('commands.notFound')}</div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`/${command.name}`}
        description={command.description}
        backTo={{ label: t('commands.backToCommands'), path: '/commands' }}
      />

      <div className="mb-4 flex items-center gap-3">
        <span className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
          {command.pluginName}
        </span>
        {command.disableModelInvocation && (
          <span className="text-xs px-2 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            disable-model-invocation
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-sm font-medium">{t('commands.commandContent')}</h3>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('common.copied') : t('common.copy')}
          </button>
        </div>
        <div className="p-4 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {command.body || t('commands.noContent')}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
