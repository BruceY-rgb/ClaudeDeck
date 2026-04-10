import { Workflow } from 'lucide-react'
import { PageHeader } from '../components/shared/PageHeader'
import { HookList } from '../components/hooks/HookList'
import { useTranslation } from '../i18n/LanguageContext'
import { EmptyState } from '../components/shared/EmptyState'
import { ProviderBadge } from '../components/shared/ProviderBadge'
import { useSettingsStore } from '../stores/settingsStore'

export function HooksPage(): JSX.Element {
  const { t } = useTranslation()
  const { settings } = useSettingsStore()
  const providerId = settings?.activeProvider ?? 'claude'

  return (
    <div>
      <PageHeader
        eyebrow="Automation"
        title={t('hooks.title')}
        badge={<ProviderBadge providerId={providerId} />}
        description={t('hooks.description')}
      />
      {providerId === 'claude' ? (
        <HookList />
      ) : (
        <EmptyState
          icon={Workflow}
          title="Hooks are not exposed for this provider yet"
          description="The workspace is ready for provider switching, but hook inspection and editing remain Claude-specific in this release."
        />
      )}
    </div>
  )
}
