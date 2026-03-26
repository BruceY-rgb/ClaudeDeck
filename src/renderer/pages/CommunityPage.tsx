import { useEffect, useState, useCallback } from 'react'
import { Search } from 'lucide-react'
import { useCommunityStore } from '../stores/communityStore'
import { PageHeader } from '../components/shared/PageHeader'
import { CommunityOverviewBar } from '../components/community/CommunityOverviewBar'
import { ContributorCard } from '../components/community/ContributorCard'
import { ContributorDetailPanel } from '../components/community/ContributorDetailPanel'
import { ResourceCard } from '../components/community/ResourceCard'
import { ResourceDetailModal } from '../components/community/ResourceDetailModal'
import { useTranslation } from '../i18n/LanguageContext'
import type { CommunityResource } from '@shared/types/community'

type ViewMode = 'contributors' | 'resources'

export function CommunityPage(): JSX.Element {
  const { t } = useTranslation()
  const {
    overview,
    contributors,
    resources,
    selectedContributor,
    searchQuery,
    typeFilter,
    loading,
    installing,
    fetchOverview,
    fetchContributors,
    fetchResources,
    selectContributor,
    clearSelectedContributor,
    installResource,
    search,
    setTypeFilter,
    setSearchQuery,
  } = useCommunityStore()

  const [viewMode, setViewMode] = useState<ViewMode>('contributors')
  const [detailResource, setDetailResource] = useState<CommunityResource | null>(null)

  useEffect(() => {
    fetchOverview()
    fetchContributors()
  }, [fetchOverview, fetchContributors])

  const handleSearch = useCallback((value: string) => {
    setSearchQuery(value)
    if (viewMode === 'contributors') {
      fetchContributors(value)
    } else {
      search(value)
    }
  }, [viewMode, fetchContributors, search, setSearchQuery])

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    clearSelectedContributor()
    if (mode === 'resources') {
      fetchResources(undefined, typeFilter)
    } else {
      fetchContributors(searchQuery)
    }
  }, [fetchContributors, fetchResources, clearSelectedContributor, searchQuery, typeFilter])

  const handleContributorClick = useCallback((id: string) => {
    selectContributor(id)
  }, [selectContributor])

  const handleTypeFilterChange = useCallback((type: string) => {
    setTypeFilter(type)
    if (selectedContributor) {
      fetchResources(selectedContributor.id, type)
    } else {
      fetchResources(undefined, type)
    }
  }, [selectedContributor, setTypeFilter, fetchResources])

  const handleBack = useCallback(() => {
    clearSelectedContributor()
  }, [clearSelectedContributor])

  // If a contributor is selected, show detail panel
  if (selectedContributor) {
    return (
      <div>
        <PageHeader
          title={t('community.title')}
          description={t('community.description')}
        />
        <ContributorDetailPanel
          contributor={selectedContributor}
          resources={resources}
          typeFilter={typeFilter}
          onTypeFilterChange={handleTypeFilterChange}
          onBack={handleBack}
          onInstall={installResource}
          installingId={installing}
          onViewResourceDetail={setDetailResource}
        />
        {detailResource && (
          <ResourceDetailModal
            resource={detailResource}
            onClose={() => setDetailResource(null)}
            onInstall={installResource}
            installing={installing === detailResource.id}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('community.title')}
        description={t('community.description')}
      />

      {/* Overview stats */}
      <CommunityOverviewBar overview={overview} />

      {/* Trending tags */}
      {overview && overview.trendingTags.length > 0 && (
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{t('community.trendingTags')}:</span>
          {overview.trendingTags.map(tag => (
            <button
              key={tag}
              onClick={() => {
                handleViewModeChange('resources')
                handleSearch(tag)
              }}
              className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Search and view mode toggle */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder={viewMode === 'contributors' ? t('community.searchContributors') : t('community.searchResources')}
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
          <button
            onClick={() => handleViewModeChange('contributors')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              viewMode === 'contributors'
                ? 'bg-white dark:bg-zinc-700 shadow-sm font-medium'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {t('community.viewContributors')}
          </button>
          <button
            onClick={() => handleViewModeChange('resources')}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              viewMode === 'resources'
                ? 'bg-white dark:bg-zinc-700 shadow-sm font-medium'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            {t('community.viewResources')}
          </button>
        </div>

        {/* Type filter (only in resources view) */}
        {viewMode === 'resources' && (
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5">
            {['all', 'agent', 'skill'].map(f => (
              <button
                key={f}
                onClick={() => handleTypeFilterChange(f)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  typeFilter === f
                    ? 'bg-white dark:bg-zinc-700 shadow-sm font-medium'
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {f === 'all' ? t('common.all') : f === 'agent' ? 'Agents' : 'Skills'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">{t('common.loading')}</div>
      ) : viewMode === 'contributors' ? (
        contributors.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">{t('community.noContributors')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contributors.map(c => (
              <ContributorCard key={c.id} contributor={c} onClick={handleContributorClick} />
            ))}
          </div>
        )
      ) : (
        resources.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">{t('community.noResources')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map(r => (
              <ResourceCard
                key={r.id}
                resource={r}
                onInstall={installResource}
                installing={installing === r.id}
                onViewDetail={setDetailResource}
              />
            ))}
          </div>
        )
      )}

      {/* Resource detail modal */}
      {detailResource && (
        <ResourceDetailModal
          resource={detailResource}
          onClose={() => setDetailResource(null)}
          onInstall={installResource}
          installing={installing === detailResource.id}
        />
      )}
    </div>
  )
}
