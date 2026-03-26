import { useState } from 'react'
import { X, Download, Heart, Check, Loader2, Bot, Sparkles, Terminal, Webhook, Copy } from 'lucide-react'
import type { CommunityResource, InstallResult } from '@shared/types/community'
import { useTranslation } from '../../i18n/LanguageContext'

interface Props {
  resource: CommunityResource
  onClose: () => void
  onInstall: (id: string) => Promise<InstallResult>
  installing: boolean
}

const TYPE_CONFIG = {
  agent: { icon: Bot, label: 'Agent', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  skill: { icon: Sparkles, label: 'Skill', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  command: { icon: Terminal, label: 'Command', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  hook: { icon: Webhook, label: 'Hook', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
}

export function ResourceDetailModal({ resource, onClose, onInstall, installing }: Props): JSX.Element {
  const { t } = useTranslation()
  const [installed, setInstalled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const config = TYPE_CONFIG[resource.type]
  const Icon = config.icon

  const handleInstall = async (): Promise<void> => {
    setError(null)
    const result = await onInstall(resource.id)
    if (result.success) {
      setInstalled(true)
    } else {
      setError(result.message)
    }
  }

  const handleCopy = async (): Promise<void> => {
    await navigator.clipboard.writeText(resource.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            <div>
              <h2 className="text-lg font-bold">{resource.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}>{config.label}</span>
                <span className="text-xs text-zinc-400">v{resource.version}</span>
                <span className="text-xs text-zinc-400">{new Date(resource.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Description */}
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">{resource.description}</p>

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
              <Download className="w-4 h-4" />
              {resource.downloads.toLocaleString()} {t('community.resource.downloads')}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-zinc-500">
              <Heart className="w-4 h-4" />
              {resource.likes} {t('community.resource.likes')}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {resource.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                {tag}
              </span>
            ))}
          </div>

          {/* Content preview */}
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">{t('community.resource.content')}</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? t('community.resource.copied') : t('community.resource.copy')}
              </button>
            </div>
            <pre className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 text-xs overflow-x-auto max-h-64 whitespace-pre-wrap font-mono">
              {resource.content}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-zinc-200 dark:border-zinc-800">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex-1" />
          {(resource.type === 'agent' || resource.type === 'skill') && (
            <button
              onClick={handleInstall}
              disabled={installing || installed}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                installed
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : installing
                    ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-wait'
                    : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90'
              }`}
            >
              {installed ? (
                <>
                  <Check className="w-4 h-4" />
                  {t('community.resource.installed')}
                </>
              ) : installing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('community.resource.installing')}
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  {t('community.resource.installToLocal')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
