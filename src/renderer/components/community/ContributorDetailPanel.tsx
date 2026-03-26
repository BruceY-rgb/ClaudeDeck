import { Bot, Sparkles, Download, Heart, Star, ArrowLeft, Globe, Calendar } from 'lucide-react'
import type { CommunityContributor, CommunityResource, InstallResult } from '@shared/types/community'
import { ResourceCard } from './ResourceCard'
import { useTranslation } from '../../i18n/LanguageContext'

interface Props {
  contributor: CommunityContributor
  resources: CommunityResource[]
  typeFilter: string
  onTypeFilterChange: (type: string) => void
  onBack: () => void
  onInstall: (id: string) => Promise<InstallResult>
  installingId: string | null
  onViewResourceDetail: (resource: CommunityResource) => void
}

function getInitials(name: string): string {
  return name
    .split(/[\s-_]+/)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-purple-500 to-violet-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-sky-600',
  'from-lime-500 to-green-600',
  'from-fuchsia-500 to-purple-600',
]

function getAvatarColor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function ContributorDetailPanel({
  contributor,
  resources,
  typeFilter,
  onTypeFilterChange,
  onBack,
  onInstall,
  installingId,
  onViewResourceDetail,
}: Props): JSX.Element {
  const { t } = useTranslation()

  const typeFilters = [
    { key: 'all', label: t('common.all') },
    { key: 'agent', label: 'Agents' },
    { key: 'skill', label: 'Skills' },
    { key: 'command', label: 'Commands' },
    { key: 'hook', label: 'Hooks' },
  ]

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('community.backToList')}
      </button>

      {/* Contributor profile card */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 mb-6">
        <div className="flex items-start gap-4">
          {/* Large avatar */}
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(contributor.id)} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
            {getInitials(contributor.displayName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold">{contributor.displayName}</h2>
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-current" />
                <span className="text-sm font-medium">{contributor.reputation}</span>
              </div>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">@{contributor.username}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">{contributor.bio}</p>

            {/* Meta info */}
            <div className="flex items-center gap-4 text-xs text-zinc-400 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {t('community.contributor.joinedAt')} {new Date(contributor.joinedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {t('community.contributor.online')}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <Bot className="w-4 h-4 text-blue-500" />
                <strong>{contributor.stats.agents}</strong> {t('community.contributor.agents')}
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <strong>{contributor.stats.skills}</strong> {t('community.contributor.skills')}
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <Download className="w-4 h-4 text-purple-500" />
                <strong>{contributor.stats.totalDownloads.toLocaleString()}</strong>
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <Heart className="w-4 h-4 text-rose-500" />
                <strong>{contributor.stats.totalLikes}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {contributor.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 mb-5 w-fit">
        {typeFilters.map(f => (
          <button
            key={f.key}
            onClick={() => onTypeFilterChange(f.key)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              typeFilter === f.key
                ? 'bg-white dark:bg-zinc-700 shadow-sm font-medium'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Resources grid */}
      {resources.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          {t('community.noResources')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map(resource => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onInstall={onInstall}
              installing={installingId === resource.id}
              onViewDetail={onViewResourceDetail}
            />
          ))}
        </div>
      )}
    </div>
  )
}
