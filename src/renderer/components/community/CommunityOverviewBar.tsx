import { Users, Package, Download, TrendingUp } from 'lucide-react'
import type { CommunityOverview } from '@shared/types/community'
import { useTranslation } from '../../i18n/LanguageContext'

interface Props {
  overview: CommunityOverview | null
}

export function CommunityOverviewBar({ overview }: Props): JSX.Element {
  const { t } = useTranslation()

  if (!overview) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const stats = [
    {
      label: t('community.stats.contributors'),
      value: overview.totalContributors,
      icon: Users,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: t('community.stats.resources'),
      value: overview.totalResources,
      icon: Package,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
    {
      label: t('community.stats.downloads'),
      value: overview.totalDownloads.toLocaleString(),
      icon: Download,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: t('community.stats.trending'),
      value: overview.trendingTags.length,
      icon: TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map(stat => (
        <div
          key={stat.label}
          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 flex items-center gap-3"
        >
          <div className={`p-2.5 rounded-lg ${stat.bg}`}>
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">{stat.value}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
