import { Bot, Sparkles, Download, Heart, Star } from 'lucide-react'
import type { CommunityContributor } from '@shared/types/community'
import { useTranslation } from '../../i18n/LanguageContext'

interface Props {
  contributor: CommunityContributor
  onClick: (id: string) => void
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

function getReputationBadge(reputation: number): { label: string; className: string } {
  if (reputation >= 90) return { label: 'Elite', className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' }
  if (reputation >= 70) return { label: 'Expert', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' }
  if (reputation >= 50) return { label: 'Active', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' }
  return { label: 'Member', className: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' }
}

export function ContributorCard({ contributor, onClick }: Props): JSX.Element {
  const { t } = useTranslation()
  const badge = getReputationBadge(contributor.reputation)

  return (
    <button
      onClick={() => onClick(contributor.id)}
      className="w-full text-left bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-sm"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarColor(contributor.id)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
          {getInitials(contributor.displayName)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{contributor.displayName}</h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${badge.className}`}>
              {badge.label}
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">@{contributor.username}</p>
        </div>
        {/* Reputation star */}
        <div className="flex items-center gap-1 text-amber-500">
          <Star className="w-3.5 h-3.5 fill-current" />
          <span className="text-xs font-medium">{contributor.reputation}</span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-3">
        {contributor.bio}
      </p>

      {/* Contribution stats */}
      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 mb-3">
        <span className="flex items-center gap-1">
          <Bot className="w-3 h-3" />
          {contributor.stats.agents} {t('community.contributor.agents')}
        </span>
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          {contributor.stats.skills} {t('community.contributor.skills')}
        </span>
        <span className="flex items-center gap-1">
          <Download className="w-3 h-3" />
          {contributor.stats.totalDownloads.toLocaleString()}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="w-3 h-3" />
          {contributor.stats.totalLikes}
        </span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {contributor.tags.slice(0, 5).map(tag => (
          <span
            key={tag}
            className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-500"
          >
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}
