import { useState } from 'react'
import { Bot, Sparkles, Terminal, Webhook, Download, Heart, Check, Loader2 } from 'lucide-react'
import type { CommunityResource, InstallResult } from '@shared/types/community'
import { useTranslation } from '../../i18n/LanguageContext'

interface Props {
  resource: CommunityResource
  onInstall: (id: string) => Promise<InstallResult>
  installing: boolean
  onViewDetail?: (resource: CommunityResource) => void
}

const TYPE_CONFIG = {
  agent: {
    icon: Bot,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    label: 'Agent',
  },
  skill: {
    icon: Sparkles,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    label: 'Skill',
  },
  command: {
    icon: Terminal,
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    label: 'Command',
  },
  hook: {
    icon: Webhook,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    label: 'Hook',
  },
}

export function ResourceCard({ resource, onInstall, installing, onViewDetail }: Props): JSX.Element {
  const { t } = useTranslation()
  const [installed, setInstalled] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const config = TYPE_CONFIG[resource.type]
  const Icon = config.icon

  const handleInstall = async (e: React.MouseEvent): Promise<void> => {
    e.stopPropagation()
    setError(null)
    const result = await onInstall(resource.id)
    if (result.success) {
      setInstalled(true)
    } else {
      setError(result.message)
    }
  }

  return (
    <div
      className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-sm cursor-pointer"
      onClick={() => onViewDetail?.(resource)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${config.bg}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{resource.name}</h3>
            <span className="text-[10px] text-zinc-400">v{resource.version}</span>
          </div>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${config.bg} ${config.color}`}>
          {config.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
        {resource.description}
      </p>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-zinc-400 mb-3">
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          {resource.downloads.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          {resource.likes}
        </span>
        <span className="text-zinc-300 dark:text-zinc-600">|</span>
        <span>{new Date(resource.updatedAt).toLocaleDateString()}</span>
      </div>

      {/* Tags */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {resource.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Install button */}
        {(resource.type === 'agent' || resource.type === 'skill') && (
          <button
            onClick={handleInstall}
            disabled={installing || installed}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              installed
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                : installing
                  ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-wait'
                  : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:opacity-90'
            }`}
          >
            {installed ? (
              <>
                <Check className="w-3 h-3" />
                {t('community.resource.installed')}
              </>
            ) : installing ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('community.resource.installing')}
              </>
            ) : (
              <>
                <Download className="w-3 h-3" />
                {t('community.resource.install')}
              </>
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
